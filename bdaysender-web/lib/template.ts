type TemplateParams = {
  firstName: string;
  age: number;
};

export const DEFAULT_TEMPLATES = [
  "Happy Birthday, {firstName}! You make life brighter just by being you. I hope {age} brings you so much love, laughter, and little moments that make your heart full.",
  "Celebrating you today, {firstName}! You deserve every sweet thing this day can bring. Welcome to {age} and a year filled with happy surprises.",
  "Happy Birthday, {firstName}! I am so grateful for your kind heart and your warm smile. May {age} be gentle with you and full of beautiful memories.",
  "Sending the biggest birthday hug to you, {firstName}! Thank you for being such a special person. I hope {age} brings you peace, confidence, and lots of joy.",
  "It is your day, {firstName}, and I hope you feel deeply loved from morning to night. Cheers to {age} and another year of growing, shining, and thriving.",
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
