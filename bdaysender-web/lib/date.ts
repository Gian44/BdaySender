const DEFAULT_TZ = "Asia/Manila";

type TimezoneDateParts = {
  year: number;
  month: number;
  day: number;
  isoDate: string;
};

type DateOnlyParts = {
  year: number;
  month: number;
  day: number;
};

export function getTimezoneDateParts(date: Date, timeZone = DEFAULT_TZ): TimezoneDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month, day, isoDate };
}

export function getDateOnlyParts(value: string | Date): DateOnlyParts {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value");
  }
  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

export function dateOnlyToLocalDate(value: string): Date {
  const { year, month, day } = getDateOnlyParts(value);
  return new Date(year, month - 1, day);
}

export function formatDateTimeInTimezone(
  value: string | Date,
  timeZone = DEFAULT_TZ,
  locale = "en-US",
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function calculateAge(birthdate: string | Date, now = new Date(), timeZone = DEFAULT_TZ): number {
  const birth = getDateOnlyParts(birthdate);
  const today = getTimezoneDateParts(now, timeZone);

  let age = today.year - birth.year;
  const hasBirthdayPassed =
    today.month > birth.month ||
    (today.month === birth.month && today.day >= birth.day);
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

export const APP_TIMEZONE = DEFAULT_TZ;
