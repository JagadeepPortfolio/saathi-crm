"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { Customer, Language } from "@/lib/types";

const LANGS: { id: Language; label: string }[] = [
  { id: "te", label: "TE" },
  { id: "hi", label: "HI" },
  { id: "en", label: "EN" },
];

export default function EditCustomer() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [original, setOriginal] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<Language>("te");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/customers/${customerId}`);
        if (!r.ok) {
          if (!cancelled) setServerErr(`Could not load customer (HTTP ${r.status})`);
          if (!cancelled) setLoading(false);
          return;
        }
        const json = (await r.json()) as { customer: Customer };
        if (cancelled) return;
        setOriginal(json.customer);
        setName(json.customer.name);
        setPhone(json.customer.phone ?? "");
        setLanguage(json.customer.preferred_language);
        setNotes(json.customer.notes ?? "");
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setServerErr(e instanceof Error ? e.message : "load failed");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function dirty(): boolean {
    if (!original) return false;
    return (
      name.trim() !== original.name ||
      phone.trim() !== (original.phone ?? "") ||
      language !== original.preferred_language ||
      notes.trim() !== (original.notes ?? "")
    );
  }

  async function onSave() {
    if (!original) return;
    if (!dirty()) {
      router.push(`/customers/${original.id}`);
      return;
    }
    setSaving(true);
    setServerErr(null);

    const patch: Record<string, unknown> = {};
    if (name.trim() !== original.name) patch.name = name.trim();
    const phoneVal = phone.trim();
    if (phoneVal !== (original.phone ?? "")) patch.phone = phoneVal || null;
    if (language !== original.preferred_language) patch.preferred_language = language;
    if (notes.trim() !== (original.notes ?? ""))
      patch.notes = notes.trim() || null;

    try {
      const r = await fetch(`/api/customers/${original.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { error?: string };
        setServerErr(err.error || `HTTP ${r.status}`);
        setSaving(false);
        return;
      }
      router.push(`/customers/${original.id}`);
      router.refresh();
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : "save failed");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-button text-text"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-semibold text-text">Edit customer</h1>
      </header>

      <section className="flex-1 px-5 py-5">
        {loading ? (
          <p className="text-base text-text-muted">Loading…</p>
        ) : !original ? (
          <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
            {serverErr ?? "Customer not found."}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 w-full border-b border-border-dark bg-transparent text-base text-text outline-none focus:border-primary"
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91…"
                className="h-12 w-full border-b border-border-dark bg-transparent text-base text-text outline-none focus:border-primary"
              />
              <span className="text-base text-text-muted">
                Use international format with country code, e.g. +919876543210
              </span>
            </Field>

            <Field label="Preferred language">
              <div className="flex gap-2">
                {LANGS.map((l) => {
                  const active = language === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLanguage(l.id)}
                      className={`h-10 min-w-12 rounded-full px-4 text-base ${
                        active
                          ? "bg-primary text-white"
                          : "border border-border bg-surface text-text"
                      }`}
                      aria-pressed={active}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-card border border-border-dark bg-surface px-3 py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            {serverErr && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                {serverErr}
              </p>
            )}
          </div>
        )}
      </section>

      {original && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-14 w-full rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base text-text-muted">{label}</span>
      {children}
    </label>
  );
}
