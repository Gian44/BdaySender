const DEFAULT_TZ = "Asia/Manila";

type TimezoneDateParts = {
  year: number;
  month: number;
  day: number;
  isoDate: string;
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

export function calculateAge(birthdate: string | Date, now = new Date()): number {
  const birth = new Date(birthdate);
  let age = now.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

export const APP_TIMEZONE = DEFAULT_TZ;
