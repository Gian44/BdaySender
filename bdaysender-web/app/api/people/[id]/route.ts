import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import type { Person } from "@/lib/types";

const personUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    nickname: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    birthdate: z.string().date().optional(),
    customTemplate: z.string().trim().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one field must be provided",
  });

function parseId(params: { id: string }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id");
  }
  return id;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    const payload = personUpdateSchema.parse(await request.json());

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (payload.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(payload.name);
    }
    if (payload.nickname !== undefined) {
      updates.push(`nickname = $${idx++}`);
      values.push(payload.nickname);
    }
    if (payload.email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(payload.email);
    }
    if (payload.birthdate !== undefined) {
      updates.push(`birthdate = $${idx++}`);
      values.push(payload.birthdate);
    }
    if (payload.customTemplate !== undefined) {
      updates.push(`custom_template = $${idx++}`);
      values.push(payload.customTemplate.trim() || null);
    }
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query<Person>(
      `UPDATE people
       SET ${updates.join(", ")}
       WHERE id = $${idx}
       RETURNING id, name, nickname, email, birthdate::text,
                 custom_template AS "customTemplate",
                 created_at::text, updated_at::text`,
      values,
    );

    if (!result.rows[0]) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ person: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid person payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Invalid id") {
      return NextResponse.json({ error: "Invalid person id" }, { status: 400 });
    }
    console.error("PATCH /api/people/:id failed:", error);
    return NextResponse.json({ error: "Failed to update person" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = parseId({ id: rawId });
    const result = await query<{ id: number }>("DELETE FROM people WHERE id = $1 RETURNING id", [id]);
    if (!result.rows[0]) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid id") {
      return NextResponse.json({ error: "Invalid person id" }, { status: 400 });
    }
    console.error("DELETE /api/people/:id failed:", error);
    return NextResponse.json({ error: "Failed to delete person" }, { status: 500 });
  }
}
