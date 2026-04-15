import { query } from "@/lib/db";
import { seedNicknameByEmail } from "@/lib/seed-nickname-map";
import { seedPeople } from "@/lib/seed-people";
import type { Person } from "@/lib/types";

let hasSeeded = false;

function resolveNickname(email: string): string {
  return seedNicknameByEmail[email] ?? seedNicknameByEmail[email.toLowerCase()] ?? "";
}

export async function seedPeopleIfEmpty(): Promise<void> {
  if (hasSeeded) return;

  const countResult = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM people");
  const count = Number(countResult.rows[0]?.count ?? "0");
  if (count > 0) {
    hasSeeded = true;
    return;
  }

  for (const person of seedPeople) {
    const nickname = resolveNickname(person.email);
    await query(
      `INSERT INTO people (name, nickname, email, birthdate, custom_template)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM people WHERE email = $3 AND birthdate = $4
       )`,
      [person.name, nickname, person.email, person.birthdate, null],
    );
  }

  hasSeeded = true;
}

export function hydratePersonFromSeed(person: Person): Person {
  return {
    ...person,
    nickname: resolveNickname(person.email),
    customTemplate: person.customTemplate ?? null,
  };
}
