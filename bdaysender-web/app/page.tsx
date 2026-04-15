"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import CalendarView from "../components/CalendarView";
import PersonForm from "../components/PersonForm";
import TemplateEditor from "../components/TemplateEditor";
import { calculateAge } from "../lib/date";
import { DEFAULT_TEMPLATES, parseTemplates } from "../lib/template";
import type { MessageTemplate, Person } from "../lib/types";

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [status, setStatus] = useState("Loading...");

  const selectedDate = useMemo(() => {
    const day = selectedDay ?? 1;
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
  }, [monthDate, selectedDay]);

  async function loadData() {
    const [peopleResult, templateResult] = await Promise.allSettled([
      fetch("/api/people"),
      fetch("/api/template"),
    ]);

    let peopleData: Person[] = [];
    let templateData: MessageTemplate | null = null;
    const failedParts: string[] = [];

    if (peopleResult.status === "fulfilled" && peopleResult.value.ok) {
      const payload = (await peopleResult.value.json()) as { people: Person[] };
      peopleData = payload.people;
    } else {
      failedParts.push("people");
    }

    if (templateResult.status === "fulfilled" && templateResult.value.ok) {
      const payload = (await templateResult.value.json()) as { template: MessageTemplate };
      templateData = payload.template;
    } else {
      failedParts.push("template");
    }

    return {
      people: peopleData,
      template: templateData,
      hasFailure: failedParts.length > 0,
      failedParts,
    };
  }

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const data = await loadData();
        if (!isMounted) return;
        setPeople(data.people);
        setTemplate(data.template);
        setStatus(
          data.hasFailure
            ? `Unable to load ${data.failedParts.join(" + ")} data. Check API/database config.`
            : "Ready",
        );
      } catch (error) {
        if (!isMounted) return;
        console.warn("Unexpected app bootstrap error:", error);
        setStatus("Failed to load data. Check API/database config.");
      }
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const birthdaysOnSelectedDate = useMemo(() => {
    return people.filter((person) => {
      const birthdate = new Date(person.birthdate);
      return (
        birthdate.getMonth() === selectedDate.getMonth() && birthdate.getDate() === selectedDate.getDate()
      );
    });
  }, [people, selectedDate]);

  const previewPerson = birthdaysOnSelectedDate[0];
  const previewContext = {
    firstName: previewPerson?.nickname?.trim() || previewPerson?.name.split(" ")[0] || "Friend",
    age: previewPerson ? calculateAge(previewPerson.birthdate, new Date()) : 20,
  };

  const createPerson = async (values: {
    name: string;
    nickname: string;
    email: string;
    birthdate: string;
    customTemplate?: string;
  }) => {
    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Unable to create person");
    }
    const data = (await response.json()) as { person: Person };
    setPeople((current) => [...current, data.person]);
    setStatus(`Added ${data.person.name}`);
    setShowPersonForm(false);
  };

  const updatePerson = async (values: {
    name: string;
    nickname: string;
    email: string;
    birthdate: string;
    customTemplate?: string;
  }) => {
    if (!editingPerson) return;
    const response = await fetch(`/api/people/${editingPerson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Unable to update person");
    }
    const data = (await response.json()) as { person: Person };
    setPeople((current) => current.map((person) => (person.id === data.person.id ? data.person : person)));
    setEditingPerson(null);
    setStatus(`Updated ${data.person.name}`);
    setShowPersonForm(false);
  };

  const deletePerson = async (id: number) => {
    const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("Delete failed.");
      return;
    }
    setPeople((current) => current.filter((person) => person.id !== id));
    if (editingPerson?.id === id) setEditingPerson(null);
    setStatus("Person deleted.");
  };

  const saveTemplate = async (templates: string[]) => {
    const response = await fetch("/api/template", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templates }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error || "Unable to update template");
    }
    const data = (await response.json()) as { template: MessageTemplate };
    setTemplate(data.template);
    setStatus("Template saved.");
  };

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4">
        <header className="surface-card hero-gradient rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Birthday Sender</h1>
              <p className="mt-1 text-sm text-slate-600">
                A simple birthday workspace to track people, personalize messages, and automate greetings.
              </p>
            </div>
            <button
              type="button"
              aria-label={isHeaderMenuOpen ? "Hide header actions" : "Show header actions"}
              aria-expanded={isHeaderMenuOpen}
              onClick={() => setIsHeaderMenuOpen((current) => !current)}
              className="rounded-full p-2 text-lg leading-none text-slate-500 transition hover:bg-white/60 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
            >
              {isHeaderMenuOpen ? "▴" : "▾"}
            </button>
          </div>
          <div className={`mt-3 flex flex-wrap gap-3 text-sm ${isHeaderMenuOpen ? "block" : "hidden"}`}>
            <span className="status-chip rounded-full px-3 py-1 font-medium">{status}</span>
            <Link href="/logs" className="btn-secondary rounded-full px-3 py-1 font-medium">
              View send logs
            </Link>
          </div>
        </header>

        <section>
          <CalendarView
            people={people}
            monthDate={monthDate}
            selectedDay={selectedDay}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setEditingPerson(null);
              setShowPersonForm(false);
              setIsDayModalOpen(true);
            }}
            onMonthChange={(offset) =>
              setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
            }
          />
        </section>

        <TemplateEditor
          initialTemplates={template?.templates ?? parseTemplates(template?.body) ?? [...DEFAULT_TEMPLATES]}
          previewContext={previewContext}
          onSave={saveTemplate}
        />
      </div>

      {isDayModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-8">
          <div className="surface-card max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  People with birthdays on {formatDateDisplay(selectedDate)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Manage people for this date. Open the form only when needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDayModalOpen(false);
                  setEditingPerson(null);
                  setShowPersonForm(false);
                }}
                className="btn-secondary rounded-full px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            {birthdaysOnSelectedDate.length === 0 ? (
              <p className="text-sm text-slate-600">No birthdays on this date yet.</p>
            ) : (
              <ul className="space-y-2">
                {birthdaysOnSelectedDate.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{person.name}</p>
                      <p className="text-slate-600">Nickname: {person.nickname}</p>
                      <p className="text-slate-600">{person.email}</p>
                      {person.customTemplate?.trim() ? (
                        <p className="text-xs font-medium text-pink-700">Uses custom message template</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary rounded-full px-3 py-1"
                        onClick={() => {
                          setEditingPerson(person);
                          setShowPersonForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-rose-300 bg-white px-3 py-1 text-rose-700 hover:bg-rose-50"
                        onClick={() => deletePerson(person.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="my-4 border-t border-slate-200" />

            {!showPersonForm ? (
              <button
                type="button"
                onClick={() => {
                  setEditingPerson(null);
                  setShowPersonForm(true);
                }}
                className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
              >
                Add Person
              </button>
            ) : (
              <>
                {editingPerson ? (
                  <PersonForm
                    selectedDate={new Date(editingPerson.birthdate)}
                    initialValues={{
                      name: editingPerson.name,
                      nickname: editingPerson.nickname ?? "",
                      email: editingPerson.email,
                      birthdate: editingPerson.birthdate.slice(0, 10),
                      customTemplate: editingPerson.customTemplate ?? "",
                    }}
                    submitLabel="Update Person"
                    onSubmit={updatePerson}
                    onCancel={() => {
                      setEditingPerson(null);
                      setShowPersonForm(false);
                    }}
                  />
                ) : (
                  <PersonForm
                    selectedDate={selectedDate}
                    submitLabel="Add Person"
                    onSubmit={createPerson}
                    onCancel={() => setShowPersonForm(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
