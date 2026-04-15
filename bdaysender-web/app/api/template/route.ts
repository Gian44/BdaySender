import { NextResponse } from "next/server";
import { z } from "zod";

import { query } from "@/lib/db";
import {
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATES,
  normalizeTemplates,
  parseTemplates,
  serializeTemplates,
} from "@/lib/template";
import type { MessageTemplate } from "@/lib/types";

const templateSchema = z.object({
  body: z.string().trim().optional(),
  templates: z.array(z.string().trim().min(1)).optional(),
});

function validateTemplates(templates: string[]): string[] {
  const normalized = normalizeTemplates(templates);
  for (const [idx, template] of normalized.entries()) {
    if (!template.includes("{firstName}")) {
      throw new Error(`Template ${idx + 1} must include {firstName}`);
    }
    if (!template.includes("{age}")) {
      throw new Error(`Template ${idx + 1} must include {age}`);
    }
  }
  return normalized;
}

async function ensureTemplateRow() {
  await query(
    `INSERT INTO message_template (id, body)
     VALUES (1, $1)
     ON CONFLICT (id) DO NOTHING`,
    [serializeTemplates([...DEFAULT_TEMPLATES])],
  );
}

export async function GET() {
  try {
    await ensureTemplateRow();
    const result = await query<MessageTemplate>(
      `SELECT id, body, updated_at::text
       FROM message_template
       WHERE id = 1`,
    );
    const row = result.rows[0];
    const templates = normalizeTemplates(parseTemplates(row?.body ?? DEFAULT_TEMPLATE));
    return NextResponse.json({
      template: {
        ...row,
        body: serializeTemplates(templates),
        templates,
      },
    });
  } catch (error) {
    console.error("GET /api/template failed:", error);
    return NextResponse.json({ error: "Failed to load template" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureTemplateRow();
    const payload = templateSchema.parse(await request.json());
    const templates = validateTemplates(
      payload.templates ?? normalizeTemplates([payload.body ?? DEFAULT_TEMPLATE]),
    );
    const serialized = serializeTemplates(templates);
    const result = await query<MessageTemplate>(
      `UPDATE message_template
       SET body = $1, updated_at = NOW()
       WHERE id = 1
       RETURNING id, body, updated_at::text`,
      [serialized],
    );
    return NextResponse.json({
      template: {
        ...result.rows[0],
        templates,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid template payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("PATCH /api/template failed:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}
