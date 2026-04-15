#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

const sourceBaseUrl = process.env.SOURCE_BASE_URL?.trim() || "http://localhost:3000";
const targetDatabaseUrl = process.env.TARGET_DATABASE_URL?.trim();

if (!targetDatabaseUrl) {
  console.error("Missing TARGET_DATABASE_URL env var.");
  process.exit(1);
}

async function fetchJson(path) {
  const response = await fetch(`${sourceBaseUrl}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed ${path}: ${response.status} ${text}`);
  }
  return response.json();
}

function normalizeTemplateBody(template) {
  if (typeof template?.body === "string" && template.body.trim()) {
    return template.body;
  }
  if (Array.isArray(template?.templates)) {
    return JSON.stringify({ templates: template.templates });
  }
  throw new Error("Template payload has no usable body.");
}

async function main() {
  console.log(`Reading source data from ${sourceBaseUrl}...`);
  const peoplePayload = await fetchJson("/api/people");
  const templatePayload = await fetchJson("/api/template");

  const people = Array.isArray(peoplePayload.people) ? peoplePayload.people : [];
  const templateBody = normalizeTemplateBody(templatePayload.template);

  const schemaPath = resolve(process.cwd(), "db", "schema.sql");
  const schemaSql = readFileSync(schemaPath, "utf8");

  const client = new Client({
    connectionString: targetDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(schemaSql);

    for (const person of people) {
      await client.query(
        `INSERT INTO people (id, name, nickname, email, birthdate, custom_template, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5::date, $6, $7::timestamptz, $8::timestamptz)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             nickname = EXCLUDED.nickname,
             email = EXCLUDED.email,
             birthdate = EXCLUDED.birthdate,
             custom_template = EXCLUDED.custom_template,
             updated_at = EXCLUDED.updated_at`,
        [
          person.id,
          person.name,
          person.nickname ?? "",
          person.email,
          person.birthdate,
          person.customTemplate ?? null,
          person.created_at || new Date().toISOString(),
          person.updated_at || new Date().toISOString(),
        ],
      );
    }

    await client.query(
      `SELECT setval(
        pg_get_serial_sequence('people', 'id'),
        GREATEST((SELECT COALESCE(MAX(id), 1) FROM people), 1),
        true
      )`,
    );

    await client.query(
      `INSERT INTO message_template (id, body, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE
       SET body = EXCLUDED.body,
           updated_at = NOW()`,
      [templateBody],
    );

    await client.query("COMMIT");
    console.log(`Migration complete: ${people.length} people + template upserted.`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
