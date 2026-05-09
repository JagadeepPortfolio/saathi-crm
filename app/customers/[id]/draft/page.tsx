"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";

import StatusTicker from "@/components/StatusTicker";
import ToolCallLog, { type ToolCallEntry } from "@/components/ToolCallLog";
import type { Customer, Language, Visit } from "@/lib/types";

type Step = "loading" | "options" | "drafting" | "review" | "sending" | "done";
type Occasion = "lapsed" | "thankyou" | "reminder" | "none";

type DraftResponse = {
  text: string;
  language: Language;
  occasion: Occasion | null;
  meta: {
    model: string;
    ms: number;
    input_tokens: number;
    output_tokens: number;
  };
};

type SendResponse = {
  message: { id: string; status: string };
  provider: string;
  provider_message_id: string;
};

const DRAFT_STEPS = ["Reading visit history", "Drafting", "Ready"];
const SEND_STEPS = ["Sending to WhatsApp", "Sent"];

const LANGS: { id: Language; label: string }[] = [
  { id: "te", label: "TE" },
  { id: "hi", label: "HI" },
  { id: "en", label: "EN" },
];

const OCCASIONS: { id: Occasion; label: string }[] = [
  { id: "lapsed", label: "Lapsed" },
  { id: "thankyou", label: "Thank you" },
  { id: "reminder", label: "Reminder" },
  { id: "none", label: "Just check in" },
];

export default function DraftPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [step, setStep] = useState<Step>("loading");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recentVisit, setRecentVisit] = useState<Visit | null>(null);
  const [language, setLanguage] = useState<Language>("te");
  const [occasion, setOccasion] = useState<Occasion>("lapsed");
  const [draft, setDraft] = useState<string>("");
  const [draftMeta, setDraftMeta] = useState<DraftResponse["meta"] | null>(null);
  const [draftStep, setDraftStep] = useState<number>(-1);
  const [sendStep, setSendStep] = useState<number>(-1);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [trace, setTrace] = useState<ToolCallEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/customers/${customerId}`);
        if (!r.ok) {
          if (!cancelled) setServerErr(`Could not load customer (HTTP ${r.status})`);
          return;
        }
        const json = (await r.json()) as {
          customer: Customer;
          recentVisit: Visit | null;
        };
        if (cancelled) return;
        setCustomer(json.customer);
        setRecentVisit(json.recentVisit);
        setLanguage(json.customer.preferred_language);
        setStep("options");
      } catch (e) {
        if (!cancelled)
          setServerErr(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  async function onDraft() {
    if (!customer) return;
    if (!customer.phone) {
      setServerErr("Add a phone number on the customer detail screen first.");
      return;
    }
    setServerErr(null);
    setStep("drafting");
    setDraftStep(0);
    setTrace([
      { step: "POST /api/draft", status: "pending" },
    ]);

    const tickInt = setInterval(() => {
      setDraftStep((s) => (s < DRAFT_STEPS.length - 1 ? s + 1 : s));
    }, 2200);

    const t0 = Date.now();
    try {
      const r = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          language,
          occasion: occasion === "none" ? undefined : occasion,
        }),
      });
      clearInterval(tickInt);
      setDraftStep(DRAFT_STEPS.length - 1);
      const totalMs = Date.now() - t0;

      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as { message?: string };
        setServerErr(err.message || `HTTP ${r.status}`);
        setTrace((t) =>
          t.map((e) => (e.status === "pending" ? { ...e, status: "fail", ms: totalMs } : e))
        );
        setStep("options");
        return;
      }

      const json = (await r.json()) as DraftResponse;
      setDraft(json.text);
      setDraftMeta(json.meta);
      setTrace([
        {
          step: `gemma4 draftFollowup (${json.meta.model})`,
          ms: json.meta.ms,
          status: "done",
        },
      ]);
      setStep("review");
    } catch (e) {
      clearInterval(tickInt);
      setServerErr(e instanceof Error ? e.message : "Network error");
      setStep("options");
    }
  }

  async function onSend() {
    if (!customer || !draft.trim()) return;
    setServerErr(null);
    setStep("sending");
    setSendStep(0);
    setTrace((t) => [
      ...t,
      { step: "POST /api/send → twilio", status: "pending" },
    ]);

    const tickInt = setInterval(() => {
      setSendStep((s) => (s < SEND_STEPS.length - 1 ? s + 1 : s));
    }, 1200);

    const t0 = Date.now();
    try {
      const r = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          text: draft.trim(),
          language,
        }),
      });
      clearInterval(tickInt);
      setSendStep(SEND_STEPS.length - 1);
      const totalMs = Date.now() - t0;

      if (!r.ok) {
        const err = (await r.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        setServerErr(err.message || err.error || `HTTP ${r.status}`);
        setTrace((t) =>
          t.map((e) => (e.status === "pending" ? { ...e, status: "fail", ms: totalMs } : e))
        );
        setStep("review");
        return;
      }

      const json = (await r.json()) as SendResponse;
      setTrace((t) =>
        t.map((e) =>
          e.status === "pending"
            ? {
                ...e,
                step: `twilio.send → ${json.provider_message_id.slice(0, 18)}…`,
                ms: totalMs,
                status: "done",
              }
            : e
        )
      );
      setStep("done");
      setTimeout(() => {
        router.push(`/customers/${customer.id}`);
        router.refresh();
      }, 1200);
    } catch (e) {
      clearInterval(tickInt);
      setServerErr(e instanceof Error ? e.message : "Network error");
      setStep("review");
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
        <h1 className="text-xl font-semibold text-text">
          {step === "review" ? "Review and send" : "Draft follow-up"}
        </h1>
      </header>

      <ToolCallLog entries={trace} />

      <section className="flex-1 px-5 py-5">
        {step === "loading" && (
          <p className="text-base text-text-muted">Loading…</p>
        )}

        {step !== "loading" && customer && (
          <div className="mb-5 rounded-card border border-border bg-surface p-4">
            <p className="text-2xl font-semibold text-text">{customer.name}</p>
            <p className="text-base text-text-muted">
              {customer.phone ?? "no phone"}
            </p>
            {recentVisit && (
              <p className="mt-2 text-base text-text-muted">
                Last visit:{" "}
                {new Date(recentVisit.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {recentVisit.services.join(", ") || "(no services)"}
              </p>
            )}
          </div>
        )}

        {step === "options" && customer && (
          <div className="flex flex-col gap-5">
            <Field label="Language">
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

            <Field label="Occasion">
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const active = occasion === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOccasion(o.id)}
                      className={`h-10 rounded-full px-4 text-base ${
                        active
                          ? "bg-primary text-white"
                          : "border border-border bg-surface text-text"
                      }`}
                      aria-pressed={active}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {!customer.phone && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                Add a phone number on the customer detail screen first.
              </p>
            )}

            {serverErr && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                {serverErr}
              </p>
            )}
          </div>
        )}

        {step === "drafting" && (
          <div className="flex flex-col gap-6 pt-6">
            <p className="text-base text-text-muted">Saathi is working</p>
            <StatusTicker steps={DRAFT_STEPS} current={draftStep} />
          </div>
        )}

        {step === "review" && customer && (
          <div className="flex flex-col gap-4">
            <p className="text-base text-text-muted">
              Saathi drafted this in{" "}
              {language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English"}.
              Edit anything that does not sound right.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              className="w-full rounded-card border border-border-dark bg-surface px-3 py-3 text-base text-text outline-none focus:border-primary"
            />
            {draftMeta && (
              <p className="text-base text-text-muted">
                {draft.length} chars · {draftMeta.output_tokens} tokens · {draftMeta.ms}ms
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setStep("options");
                setDraft("");
                setTrace([]);
              }}
              className="self-start text-base text-secondary"
            >
              Re-draft
            </button>
            {serverErr && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                {serverErr}
              </p>
            )}
          </div>
        )}

        {step === "sending" && (
          <div className="flex flex-col gap-6 pt-6">
            <p className="text-base text-text-muted">Saathi is sending</p>
            <StatusTicker steps={SEND_STEPS} current={sendStep} />
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col gap-3 pt-8">
            <p className="text-2xl font-semibold text-text">Sent.</p>
            <p className="text-base text-text-muted">
              Returning to {customer?.name ?? "customer"}…
            </p>
          </div>
        )}
      </section>

      {step === "options" && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
          <button
            type="button"
            onClick={onDraft}
            disabled={!customer?.phone}
            className="h-14 w-full rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700 disabled:opacity-60"
          >
            Draft
          </button>
        </div>
      )}

      {step === "review" && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim()}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700 disabled:opacity-60"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base text-text-muted">{label}</span>
      {children}
    </label>
  );
}
