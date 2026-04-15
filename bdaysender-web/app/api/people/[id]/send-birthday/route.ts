import { NextResponse } from "next/server";

import { APP_TIMEZONE, calculateAge, getTimezoneDateParts } from "../../../../../lib/date";
import { query } from "../../../../../lib/db";
import { sendBirthdayEmail } from "../../../../../lib/mailer";
import { DEFAULT_TEMPLATE, parseTemplates, pickRandomTemplate, renderTemplate } from "../../../../../lib/template";

type PersonRow = {
  id: number;
  name: string;
  nickname: string;
  email: string;
  birthdate: string;
  customTemplate: string | null;
};

function parseId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id");
  }
  return id;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    const now = new Date();
    const { isoDate } = getTimezoneDateParts(now, APP_TIMEZONE);

    const personResult = await query<PersonRow>(
      `SELECT id, name, nickname, email, birthdate::text,
              custom_template AS "customTemplate"
       FROM people
       WHERE id = $1`,
      [id],
    );
    const person = personResult.rows[0];
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const templateResult = await query<{ body: string }>(`SELECT body FROM message_template WHERE id = 1`);
    const templateBody = templateResult.rows[0]?.body ?? DEFAULT_TEMPLATE;
    const templates = parseTemplates(templateBody);
    const chosenTemplate = person.customTemplate?.trim() || pickRandomTemplate(templates);
    const body = renderTemplate(chosenTemplate, {
      firstName: person.nickname?.trim() || person.name.trim().split(/\s+/)[0] || "Friend",
      age: calculateAge(person.birthdate, now),
    });

    await sendBirthdayEmail(person.email, "Happy Birthday", body);
    await query(
      `INSERT INTO send_logs (person_id, sent_local_date, status)
       VALUES ($1, $2, 'success')
       ON CONFLICT (person_id, sent_local_date) WHERE status = 'success'
       DO UPDATE
       SET sent_at = NOW(),
           error = NULL`,
      [person.id, isoDate],
    );

    return NextResponse.json({
      ok: true,
      personId: person.id,
      personName: person.name,
      timezone: APP_TIMEZONE,
      date: isoDate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid id") {
      return NextResponse.json({ error: "Invalid person id" }, { status: 400 });
    }

    const maybeParams = await params.catch(() => null);
    const personId = maybeParams ? Number(maybeParams.id) : null;
    const { isoDate } = getTimezoneDateParts(new Date(), APP_TIMEZONE);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (personId && Number.isInteger(personId) && personId > 0) {
      try {
        await query(
          `INSERT INTO send_logs (person_id, sent_local_date, status, error)
           VALUES ($1, $2, 'failed', $3)`,
          [personId, isoDate, errorMessage],
        );
      } catch (logError) {
        console.error("POST /api/people/:id/send-birthday failed logging error:", logError);
      }
    }

    console.error("POST /api/people/:id/send-birthday failed:", error);
    return NextResponse.json({ error: "Failed to send birthday message" }, { status: 500 });
  }
}
