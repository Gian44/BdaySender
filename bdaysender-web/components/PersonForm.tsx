"use client";

import { useEffect, useState } from "react";

type PersonFormValues = {
  name: string;
  nickname: string;
  email: string;
  birthdate: string;
  customTemplate?: string;
};

type PersonFormProps = {
  selectedDate: Date;
  initialValues?: PersonFormValues;
  submitLabel: string;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  onCancel?: () => void;
};

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PersonForm({
  selectedDate,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: PersonFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [nickname, setNickname] = useState(initialValues?.nickname ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [birthdate, setBirthdate] = useState(
    initialValues?.birthdate ?? toDateInputValue(selectedDate),
  );
  const [customTemplate, setCustomTemplate] = useState(initialValues?.customTemplate ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialValues) {
      setBirthdate(toDateInputValue(selectedDate));
    }
    setCustomTemplate(initialValues?.customTemplate ?? "");
  }, [selectedDate, initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, nickname, email, birthdate, customTemplate });
      if (!initialValues) {
        setName("");
        setNickname("");
        setEmail("");
        setCustomTemplate("");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-3 rounded-2xl p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{submitLabel}</h3>
      <div className="space-y-1">
        <label htmlFor="person-name" className="text-xs font-semibold text-slate-600">
          Name
        </label>
        <input
          id="person-name"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="person-nickname" className="text-xs font-semibold text-slate-600">
          Nickname
        </label>
        <input
          id="person-nickname"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="person-email" className="text-xs font-semibold text-slate-600">
          Email
        </label>
        <input
          id="person-email"
          type="email"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="person-birthdate" className="text-xs font-semibold text-slate-600">
          Birthdate
        </label>
        <input
          id="person-birthdate"
          type="date"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          value={birthdate}
          onChange={(event) => setBirthdate(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="person-custom-template" className="text-xs font-semibold text-slate-600">
          Custom Message (optional)
        </label>
        <textarea
          id="person-custom-template"
          className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
          value={customTemplate}
          onChange={(event) => setCustomTemplate(event.target.value)}
          placeholder="Example: Happy Birthday {firstName}! You are now {age}."
        />
        <p className="text-xs text-slate-500">
          If set, this overrides the global template for this person.
        </p>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          disabled={saving}
          type="submit"
          className="btn-primary rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary rounded-full px-4 py-2 text-sm"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
