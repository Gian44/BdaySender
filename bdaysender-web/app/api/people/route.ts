import { NextResponse } from "next/server";
import { z } from "zod";

import { createFallbackPerson, getFallbackPeople } from "@/lib/fallback-store";
import { query } from "@/lib/db";
import { seedPeopleIfEmpty } from "@/lib/seed-db";
import type { Person } from "@/lib/types";

const personCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  nickname: z.string().trim().min(1, "Nickname is required"),
  email: z.string().trim().email("Valid email is required"),
  birthdate: z.string().date("Birthdate must be YYYY-MM-DD"),
  customTemplate: z.string().trim().optional(),
});

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ people: getFallbackPeople() });
  }

  try {
    await seedPeopleIfEmpty();
    const result = await query<Person>(
      `SELECT id, name, nickname, email, birthdate::text,
              custom_template AS "customTemplate",
              created_at::text, updated_at::text
       FROM people
       ORDER BY birthdate ASC, name ASC`,
    );
    return NextResponse.json({ people: result.rows });
  } catch (error) {
    console.error("GET /api/people failed:", error);
    return NextResponse.json({ error: "Failed to load people" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    try {
      const payload = personCreateSchema.parse(await request.json());
      const person = createFallbackPerson(payload);
      return NextResponse.json({ person }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid person payload", details: error.flatten() },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
    }
  }

  try {
    const payload = personCreateSchema.parse(await request.json());
    const result = await query<Person>(
      `INSERT INTO people (name, nickname, email, birthdate, custom_template)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, nickname, email, birthdate::text,
                 custom_template AS "customTemplate",
                 created_at::text, updated_at::text`,
      [
        payload.name,
        payload.nickname,
        payload.email,
        payload.birthdate,
        payload.customTemplate?.trim() || null,
      ],
    );
    return NextResponse.json({ person: result.rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid person payload", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("POST /api/people failed:", error);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
