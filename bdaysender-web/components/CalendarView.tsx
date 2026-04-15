"use client";

import { useMemo } from "react";

import type { Person } from "@/lib/types";

type CalendarViewProps = {
  people: Person[];
  monthDate: Date;
  selectedDay: number | null;
  onMonthChange: (nextMonthOffset: number) => void;
  onSelectDay: (day: number) => void;
};

type SprinklePalette = {
  box: string;
  lid: string;
  ribbon: string;
  bow: string;
  bowInner: string;
  topBand: string;
  text: string;
};

const SPRINKLE_PALETTES: SprinklePalette[] = [
  {
    box: "#ff8fab",
    lid: "#ff5d8f",
    ribbon: "#ffe066",
    bow: "#ffe066",
    bowInner: "#ffc43d",
    topBand: "#f768a1",
    text: "#1e2757",
  },
  {
    box: "#8dd3ff",
    lid: "#56c2ff",
    ribbon: "#ffde59",
    bow: "#ffde59",
    bowInner: "#ffbc42",
    topBand: "#73c8f6",
    text: "#1e2757",
  },
  {
    box: "#95e1a3",
    lid: "#71c68d",
    ribbon: "#ffd166",
    bow: "#ffd166",
    bowInner: "#f7b14f",
    topBand: "#77be8f",
    text: "#1e2757",
  },
  {
    box: "#cdb4ff",
    lid: "#b28dff",
    ribbon: "#ffd166",
    bow: "#ffd166",
    bowInner: "#ff9f1c",
    topBand: "#b49ae6",
    text: "#1e2757",
  },
  {
    box: "#ffd6a5",
    lid: "#ffc37b",
    ribbon: "#caffbf",
    bow: "#caffbf",
    bowInner: "#9be58d",
    topBand: "#e8b979",
    text: "#1e2757",
  },
  {
    box: "#ffb3c6",
    lid: "#ff8fab",
    ribbon: "#9bf6ff",
    bow: "#9bf6ff",
    bowInner: "#72e4f2",
    topBand: "#f493b2",
    text: "#1e2757",
  },
];

type DoodleOption = {
  glyph: string;
  className: string;
  color: string;
};

const DOODLE_OPTIONS: DoodleOption[] = [
  { glyph: "✦", className: "-left-3 -top-2 rotate-[-18deg] text-sm", color: "#f472b6" },
  { glyph: "❤", className: "-right-3 -top-2 rotate-[16deg] text-sm", color: "#f59e0b" },
  { glyph: "❋", className: "-right-2 -bottom-2 rotate-[12deg] text-xs", color: "#22d3ee" },
  { glyph: "〰", className: "-left-2 -bottom-2 text-xs", color: "#fb923c" },
  { glyph: "✿", className: "-left-4 top-1 rotate-[8deg] text-xs", color: "#a78bfa" },
  { glyph: "★", className: "-right-4 top-1 rotate-[-10deg] text-xs", color: "#f43f5e" },
  { glyph: "✧", className: "left-1/2 -top-3 -translate-x-1/2 text-xs", color: "#34d399" },
  { glyph: "❥", className: "left-1/2 -bottom-3 -translate-x-1/2 text-xs", color: "#fb7185" },
  { glyph: "❀", className: "-left-3 bottom-0 rotate-[-6deg] text-xs", color: "#facc15" },
  { glyph: "✺", className: "-right-3 bottom-0 rotate-[10deg] text-xs", color: "#60a5fa" },
];

function getBirthdaysCount(people: Person[], month: number, day: number): number {
  return people.filter((person) => {
    const birthdate = new Date(person.birthdate);
    return birthdate.getMonth() + 1 === month && birthdate.getDate() === day;
  }).length;
}

export default function CalendarView({
  people,
  monthDate,
  selectedDay,
  onMonthChange,
  onSelectDay,
}: CalendarViewProps) {
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const month = monthDate.getMonth() + 1;
  const year = monthDate.getFullYear();

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const values: Array<number | null> = [];
    for (let i = 0; i < firstDay; i += 1) values.push(null);
    for (let day = 1; day <= totalDays; day += 1) values.push(day);
    return values;
  }, [month, year]);

  const monthDoodles = useMemo(() => {
    const seed = month * 37 + year * 17;
    const picks: DoodleOption[] = [];
    for (let i = 0; i < 4; i += 1) {
      picks.push(DOODLE_OPTIONS[(seed + i * 3) % DOODLE_OPTIONS.length]);
    }
    return picks;
  }, [month, year]);

  return (
    <section className="surface-card relative overflow-hidden rounded-2xl p-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(25deg, #fb7185 0 100%),
            linear-gradient(-28deg, #22d3ee 0 100%),
            linear-gradient(67deg, #f59e0b 0 100%),
            linear-gradient(-42deg, #34d399 0 100%),
            linear-gradient(14deg, #a78bfa 0 100%),
            linear-gradient(-62deg, #60a5fa 0 100%),
            linear-gradient(49deg, #f97316 0 100%),
            linear-gradient(-18deg, #f43f5e 0 100%),
            linear-gradient(73deg, #14b8a6 0 100%),
            linear-gradient(-35deg, #facc15 0 100%),
            linear-gradient(40deg, #ec4899 0 100%),
            linear-gradient(-55deg, #38bdf8 0 100%),
            radial-gradient(circle, #f59e0b 0 2px, transparent 2px),
            radial-gradient(circle, #22d3ee 0 2px, transparent 2px),
            radial-gradient(circle, #f43f5e 0 2px, transparent 2px),
            radial-gradient(circle, #34d399 0 2px, transparent 2px)
          `,
          backgroundSize:
            "10px 3px, 9px 3px, 8px 3px, 10px 3px, 9px 3px, 8px 3px, 10px 3px, 9px 3px, 8px 3px, 10px 3px, 9px 3px, 8px 3px, 5px 5px, 5px 5px, 5px 5px, 5px 5px",
          backgroundPosition:
            "7% 16%, 15% 62%, 26% 26%, 39% 73%, 52% 21%, 66% 67%, 79% 28%, 92% 56%, 73% 14%, 44% 49%, 87% 79%, 21% 84%, 12% 36%, 58% 44%, 82% 18%, 33% 58%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(72deg, transparent 0 42%, #fb7185 43% 57%, transparent 58%),
            linear-gradient(-70deg, transparent 0 42%, #22d3ee 43% 57%, transparent 58%),
            linear-gradient(58deg, transparent 0 42%, #f59e0b 43% 57%, transparent 58%),
            linear-gradient(-52deg, transparent 0 42%, #a78bfa 43% 57%, transparent 58%),
            linear-gradient(66deg, transparent 0 42%, #34d399 43% 57%, transparent 58%),
            linear-gradient(-64deg, transparent 0 42%, #f97316 43% 57%, transparent 58%)
          `,
          backgroundSize: "28px 16px, 28px 16px, 28px 16px, 28px 16px, 28px 16px, 28px 16px",
          backgroundPosition: "10% 26%, 27% 69%, 46% 34%, 63% 66%, 81% 31%, 92% 74%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-7 top-6 h-32 w-52 rotate-[-8deg] opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(20deg, #22d3ee 0 100%), linear-gradient(-34deg, #fb7185 0 100%), linear-gradient(58deg, #f59e0b 0 100%), linear-gradient(-66deg, #a78bfa 0 100%), radial-gradient(circle, #34d399 0 2px, transparent 2px), radial-gradient(circle, #f43f5e 0 2px, transparent 2px)",
          backgroundSize: "12px 3px, 10px 3px, 9px 3px, 11px 3px, 5px 5px, 5px 5px",
          backgroundPosition: "12% 20%, 30% 36%, 53% 18%, 76% 40%, 20% 60%, 64% 62%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 bottom-8 h-32 w-52 rotate-[10deg] opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(26deg, #f59e0b 0 100%), linear-gradient(-40deg, #a78bfa 0 100%), linear-gradient(61deg, #22d3ee 0 100%), linear-gradient(-72deg, #fb7185 0 100%), radial-gradient(circle, #60a5fa 0 2px, transparent 2px), radial-gradient(circle, #facc15 0 2px, transparent 2px)",
          backgroundSize: "12px 3px, 10px 3px, 9px 3px, 11px 3px, 5px 5px, 5px 5px",
          backgroundPosition: "16% 28%, 34% 20%, 56% 44%, 78% 26%, 24% 62%, 68% 58%",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-10">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className="rounded-full p-2 text-2xl font-black leading-none text-slate-500 transition hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          onClick={() => onMonthChange(-1)}
        >
          ‹
        </button>
        <div className="relative">
          {monthDoodles.map((doodle, index) => (
            <span
              key={`${doodle.glyph}-${index}`}
              className={`pointer-events-none absolute ${doodle.className}`}
              style={{ color: doodle.color }}
            >
              {doodle.glyph}
            </span>
          ))}
          <h2
            className="rounded-full bg-[#fff1f5] px-5 py-1.5 text-xl font-black text-[#1e2757] shadow-sm"
            style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", cursive' }}
          >
            {monthLabel}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="rounded-full p-2 text-2xl font-black leading-none text-slate-500 transition hover:text-pink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
          onClick={() => onMonthChange(1)}
        >
          ›
        </button>
      </header>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
          <div key={weekday}>{weekday}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((day, index) =>
          day === null ? (
            <div key={`empty-${index}`} className="h-24 rounded-xl bg-slate-50" />
          ) : (
            (() => {
              const birthdaysCount = getBirthdaysCount(people, month, day);
              const palette = SPRINKLE_PALETTES[(day * 11 + month * 17 + year) % SPRINKLE_PALETTES.length];
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className={`group h-24 rounded-xl p-1.5 text-left transition ${
                    selectedDay === day
                      ? "bg-[#fdf2f8] ring-2 ring-pink-300"
                      : "bg-white"
                  }`}
                >
                  <div className="relative h-full rounded-lg">
                    <div className="absolute inset-x-1 bottom-1 top-4">
                      <div
                        className="absolute inset-x-0 bottom-0 top-5 rounded-b-[10px] border-[3px]"
                        style={{ borderColor: "#1e2757", backgroundColor: palette.box }}
                      />
                      <div
                        className="absolute inset-x-[-2px] top-0 h-6 rounded-[6px] border-[3px]"
                        style={{ borderColor: "#1e2757", backgroundColor: palette.lid }}
                      />

                      <div
                        className="absolute inset-y-0 left-1/2 w-3 -translate-x-1/2"
                        style={{ backgroundColor: palette.ribbon }}
                      />
                      <div className="absolute inset-x-[-2px] top-[7px] h-[7px]" style={{ backgroundColor: palette.topBand }} />
                      <div
                        className="absolute inset-x-[-2px] top-[5px] h-[4px]"
                        style={{ backgroundColor: palette.ribbon }}
                      />

                      <div
                        className="absolute left-1/2 top-0 h-[10px] w-[10px] -translate-x-1/2 -translate-y-[8px] rounded-full border-[3px]"
                        style={{ borderColor: "#1e2757", backgroundColor: palette.bow }}
                      />
                      <div
                        className="absolute left-1/2 top-0 h-[14px] w-[28px] -translate-x-[102%] -translate-y-[19px] rotate-[34deg] rounded-[999px] border-[3px]"
                        style={{ borderColor: "#1e2757", backgroundColor: palette.bow }}
                      />
                      <div
                        className="absolute left-1/2 top-0 h-[8px] w-[24px] -translate-x-[100%] -translate-y-[12px] rotate-[34deg] rounded-[999px]"
                        style={{ backgroundColor: palette.bowInner }}
                      />
                      <div
                        className="absolute left-1/2 top-0 h-[14px] w-[28px] translate-x-[2%] -translate-y-[19px] rotate-[-34deg] rounded-[999px] border-[3px]"
                        style={{ borderColor: "#1e2757", backgroundColor: palette.bow }}
                      />
                      <div
                        className="absolute left-1/2 top-0 h-[8px] w-[24px] translate-x-[1%] -translate-y-[12px] rotate-[-34deg] rounded-[999px]"
                        style={{ backgroundColor: palette.bowInner }}
                      />
                    </div>

                    <div className="absolute left-2 top-[19px] text-sm font-black leading-none" style={{ color: palette.text }}>
                      {day}
                    </div>

                    <div className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[#1e2757]">
                      {birthdaysCount} birthday{birthdaysCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </button>
              );
            })()
          ),
        )}
      </div>
      </div>
    </section>
  );
}
