import { DEFAULT_TEMPLATES, DEFAULT_TEMPLATE, normalizeTemplates, serializeTemplates } from "@/lib/template";
import { seedNicknameByEmail } from "@/lib/seed-nickname-map";
import { seedPeople } from "@/lib/seed-people";
import type { MessageTemplate, Person } from "@/lib/types";

const nowIso = () => new Date().toISOString();

function getNickname(email: string): string {
  const exact = seedNicknameByEmail[email];
  if (exact) return exact;
  const lowered = email.toLowerCase();
  return seedNicknameByEmail[lowered] ?? "";
}

let peopleStore: Person[] = seedPeople.map((person) => ({
  ...person,
  nickname: getNickname(person.email),
  customTemplate: null,
  created_at: person.created_at || nowIso(),
  updated_at: person.updated_at || nowIso(),
}));

let templateStore: MessageTemplate = {
  id: 1,
  body: serializeTemplates([...DEFAULT_TEMPLATES]),
  templates: [...DEFAULT_TEMPLATES],
  updated_at: nowIso(),
};

let nextId = peopleStore.reduce((max, person) => Math.max(max, person.id), 0) + 1;

export function getFallbackPeople(): Person[] {
  return [...peopleStore];
}

export function createFallbackPerson(payload: {
  name: string;
  nickname: string;
  email: string;
  birthdate: string;
  customTemplate?: string;
}): Person {
  const person: Person = {
    id: nextId++,
    name: payload.name,
    nickname: payload.nickname,
    email: payload.email,
    birthdate: payload.birthdate,
    customTemplate: payload.customTemplate?.trim() || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  peopleStore = [...peopleStore, person];
  return person;
}

export function updateFallbackPerson(
  id: number,
  payload: Partial<{
    name: string;
    nickname: string;
    email: string;
    birthdate: string;
    customTemplate: string;
  }>,
): Person | null {
  const existing = peopleStore.find((person) => person.id === id);
  if (!existing) return null;

  const updated: Person = {
    ...existing,
    ...payload,
    customTemplate:
      payload.customTemplate !== undefined
        ? payload.customTemplate.trim() || null
        : existing.customTemplate ?? null,
    updated_at: nowIso(),
  };

  peopleStore = peopleStore.map((person) => (person.id === id ? updated : person));
  return updated;
}

export function deleteFallbackPerson(id: number): boolean {
  const before = peopleStore.length;
  peopleStore = peopleStore.filter((person) => person.id !== id);
  return peopleStore.length < before;
}

export function getFallbackTemplate(): MessageTemplate {
  return templateStore;
}

export function setFallbackTemplate(payload: { body?: string; templates?: string[] }): MessageTemplate {
  const templates = normalizeTemplates(payload.templates ?? [payload.body ?? DEFAULT_TEMPLATE]);
  templateStore = {
    id: 1,
    body: serializeTemplates(templates),
    templates,
    updated_at: nowIso(),
  };
  return templateStore;
}
