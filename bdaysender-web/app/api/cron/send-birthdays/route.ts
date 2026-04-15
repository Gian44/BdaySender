import { NextResponse } from "next/server";

import { getTimezoneDateParts, APP_TIMEZONE, calculateAge } from "../../../../lib/date";
import { query } from "../../../../lib/db";
import { sendBirthdayEmail } from "../../../../lib/mailer";
import { DEFAULT_TEMPLATE, parseTemplates, pickRandomTemplate, renderTemplate } from "../../../../lib/template";

type PersonRow = {
  id: number;
  name: string;
  nickname: string;
  email: string;
  birthdate: string;
  customTemplate: string | null;
};

function assertAuthorized(request: Request): string | null {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return "CRON_SECRET is not configured";
  }

  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";
  const tokenFromQuery = new URL(request.url).searchParams.get("secret")?.trim() ?? "";

  if (tokenFromHeader !== cronSecret && tokenFromQuery !== cronSecret) {
    return "Unauthorized";
  }

  return null;
}

export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) {
    return NextResponse.json({ error: authError }, { status: authError === "Unauthorized" ? 401 : 500 });
  }

  try {
    const now = new Date();
    const { month, day, isoDate } = getTimezoneDateParts(now, APP_TIMEZONE);

    const templateResult = await query<{ body: string }>(
      `SELECT body FROM message_template WHERE id = 1`,
    );
    const templateBody = templateResult.rows[0]?.body ?? DEFAULT_TEMPLATE;
    const templates = parseTemplates(templateBody);

    const peopleResult = await query<PersonRow>(
      `SELECT id, name, nickname, email, birthdate::text,
              custom_template AS "customTemplate"
       FROM people
       WHERE EXTRACT(MONTH FROM birthdate) = $1
       AND EXTRACT(DAY FROM birthdate) = $2`,
      [month, day],
    );

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const person of peopleResult.rows) {
      const existingSuccess = await query<{ id: number }>(
        `SELECT id
         FROM send_logs
         WHERE person_id = $1
         AND sent_local_date = $2
         AND status = 'success'
         LIMIT 1`,
        [person.id, isoDate],
      );

      if (existingSuccess.rows.length > 0) {
        skipped += 1;
        continue;
      }

      const age = calculateAge(person.birthdate, now);
      const chosenTemplate = person.customTemplate?.trim() || pickRandomTemplate(templates);
      const body = renderTemplate(chosenTemplate, {
        firstName: person.nickname?.trim() || person.name.trim().split(/\s+/)[0] || "Friend",
        age,
      });

      try {
        await sendBirthdayEmail(person.email, "Happy Birthday", body);
        await query(
          `INSERT INTO send_logs (person_id, sent_local_date, status)
           VALUES ($1, $2, 'success')`,
          [person.id, isoDate],
        );
        sent += 1;
      } catch (error) {
        await query(
          `INSERT INTO send_logs (person_id, sent_local_date, status, error)
           VALUES ($1, $2, 'failed', $3)`,
          [person.id, isoDate, error instanceof Error ? error.message : "Unknown error"],
        );
        failed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      timezone: APP_TIMEZONE,
      date: isoDate,
      totalMatches: peopleResult.rows.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Cron send failed:", error);
    return NextResponse.json({ error: "Failed to run birthday sender" }, { status: 500 });
  }
}
