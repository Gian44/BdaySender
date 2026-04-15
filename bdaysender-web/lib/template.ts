type TemplateParams = {
  firstName: string;
  age: number;
};

export const DEFAULT_TEMPLATES = [
  "Happy Birthday, {firstName}! Wishing you joy, good health, and meaningful moments this year. You are now {age}!",
  "Cheers to you, {firstName}! May this birthday open a year full of growth and happiness as you turn {age}.",
  "Warm birthday wishes, {firstName}! Hope your day is filled with love, laughter, and everything you enjoy at {age}.",
  "Happy Birthday, {firstName}! Thank you for being wonderful. Wishing you confidence and success at {age}.",
  "Have an amazing birthday, {firstName}! May this new chapter at {age} bring peace, purpose, and great memories.",
] as const;

export const DEFAULT_TEMPLATE = DEFAULT_TEMPLATES[0];

const MIN_TEMPLATES = 5;

export function normalizeTemplates(templates: string[]): string[] {
  const cleaned = templates.map((item) => item.trim()).filter(Boolean);
  const withDefaults = [...cleaned];
  let i = 0;
  while (withDefaults.length < MIN_TEMPLATES) {
    withDefaults.push(DEFAULT_TEMPLATES[i % DEFAULT_TEMPLATES.length]);
    i += 1;
  }
  return withDefaults.slice(0, MIN_TEMPLATES);
}

export function serializeTemplates(templates: string[]): string {
  return JSON.stringify({ templates: normalizeTemplates(templates) });
}

export function parseTemplates(rawBody?: string | null): string[] {
  if (!rawBody?.trim()) {
    return [...DEFAULT_TEMPLATES];
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "templates" in parsed &&
      Array.isArray((parsed as { templates?: unknown[] }).templates)
    ) {
      const items = (parsed as { templates: unknown[] }).templates
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim());
      return normalizeTemplates(items);
    }
  } catch {
    // Backward compatibility with older single-template text values.
  }

  return normalizeTemplates([rawBody]);
}

export function pickRandomTemplate(templates: string[]): string {
  const normalized = normalizeTemplates(templates);
  const idx = Math.floor(Math.random() * normalized.length);
  return normalized[idx];
}

export function renderTemplate(template: string, params: TemplateParams): string {
  return template
    .replaceAll("{firstName}", params.firstName)
    .replaceAll("{age}", String(params.age));
}
