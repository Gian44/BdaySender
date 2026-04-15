"use client";

import { useEffect, useMemo, useState } from "react";

import { DEFAULT_TEMPLATES, normalizeTemplates, renderTemplate } from "@/lib/template";

type TemplateEditorProps = {
  initialTemplates: string[];
  previewContext: {
    firstName: string;
    age: number;
  };
  onSave: (nextTemplates: string[]) => Promise<void>;
};

export default function TemplateEditor({
  initialTemplates,
  previewContext,
  onSave,
}: TemplateEditorProps) {
  const [templates, setTemplates] = useState<string[]>(normalizeTemplates(initialTemplates));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(normalizeTemplates(initialTemplates));
  }, [initialTemplates]);

  const previewList = useMemo(() => templates.map((item) => renderTemplate(item, previewContext)), [
    templates,
    previewContext,
  ]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const normalized = normalizeTemplates(templates);
      await onSave(normalized);
      setSuccess("Templates updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const updateTemplateAt = (idx: number, value: string) => {
    setTemplates((current) => {
      const next = [...current];
      next[idx] = value;
      return next;
    });
  };

  return (
    <section className="surface-card rounded-2xl p-4">
      <h2 className="text-lg font-bold text-slate-800">Birthday Message Templates</h2>
      <p className="mt-1 text-sm text-slate-600">
        Save 5 message variations. Each send randomly picks one unless a person has a custom message.
      </p>
      <div className="mt-3 space-y-3">
        {templates.map((template, idx) => (
          <div key={`template-${idx}`} className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Template {idx + 1}</label>
            <textarea
              className="min-h-22 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              value={template}
              onChange={(event) => updateTemplateAt(idx, event.target.value)}
              placeholder={DEFAULT_TEMPLATES[idx]}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
        <ul className="mt-2 space-y-2">
          {previewList.map((item, idx) => (
            <li key={`preview-${idx}`} className="text-sm text-slate-800">
              <span className="mr-2 font-semibold text-slate-500">{idx + 1}.</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {success ? <p className="mt-2 text-xs text-green-700">{success}</p> : null}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="btn-primary mt-3 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70"
      >
        {saving ? "Saving..." : "Save Template"}
      </button>
    </section>
  );
}
