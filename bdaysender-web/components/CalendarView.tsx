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

  return (
    <section className="surface-card rounded-2xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="btn-secondary rounded-full px-3 py-1 text-sm font-medium"
          onClick={() => onMonthChange(-1)}
        >
          Prev
        </button>
        <h2 className="rounded-full bg-pink-50 px-4 py-1 text-lg font-bold text-slate-800">
          {monthLabel}
        </h2>
        <button
          type="button"
          className="btn-secondary rounded-full px-3 py-1 text-sm font-medium"
          onClick={() => onMonthChange(1)}
        >
          Next
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
            <div key={`empty-${index}`} className="h-20 rounded-xl border border-transparent bg-slate-50" />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`h-20 rounded-xl border p-2 text-left transition ${
                selectedDay === day
                  ? "border-pink-300 bg-pink-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-bold text-slate-800">{day}</div>
              <div className="mt-1 text-xs text-slate-500">
                {getBirthdaysCount(people, month, day)} birthday
                {getBirthdaysCount(people, month, day) === 1 ? "" : "s"}
              </div>
            </button>
          ),
        )}
      </div>
    </section>
  );
}
