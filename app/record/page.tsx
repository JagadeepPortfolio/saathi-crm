"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import MicCapture from "@/components/MicCapture";
import PhotoCapture from "@/components/PhotoCapture";
import StatusTicker from "@/components/StatusTicker";
import type { Customer, Visit, Car, Language } from "@/lib/types";

type Step = "capture" | "review-audio" | "saving" | "confirm";

type IntakeResponse = {
  customer: Customer;
  visit: Visit;
  car: Car | null;
  transcript: string;
  meta: {
    tool: string;
    asr_ms: number;
    gemma_ms: number;
    model: string;
    input_tokens: number;
    output_tokens: number;
  };
};

const SAVE_STEPS = ["Saving audio", "Transcribing", "Reading car photo", "Saving customer"];

export default function RecordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("capture");
  const [audio, setAudio] = useState<{ blob: Blob; durationSec: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [language] = useState<Language>("te");
  const [savingStep, setSavingStep] = useState<number>(-1);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [result, setResult] = useState<IntakeResponse | null>(null);

  // Editable confirmation fields
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [editServices, setEditServices] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  function onRecorded(blob: Blob, durationSec: number) {
    setAudio({ blob, durationSec });
    setStep("review-audio");
  }

  async function onSave() {
    if (!audio) return;
    setServerErr(null);
    setStep("saving");

    const fd = new FormData();
    fd.append(
      "audio",
      new File([audio.blob], "intake.audio", { type: audio.blob.type || "audio/mp4" })
    );
    if (photo) fd.append("photo", photo);
    fd.append("language", language);

    setSavingStep(0); // saving audio
    try {
      // The single /api/intake call walks through all steps; we estimate
      // progress by elapsed time so the ticker doesn't lie if it's fast.
      const tickInt = setInterval(() => {
        setSavingStep((s) => (s < SAVE_STEPS.length - 1 ? s + 1 : s));
      }, 2200);

      const res = await fetch("/api/intake", { method: "POST", body: fd });
      clearInterval(tickInt);
      setSavingStep(SAVE_STEPS.length - 1);

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setServerErr(err.message || `HTTP ${res.status}`);
        setStep("review-audio");
        return;
      }
      const json = (await res.json()) as IntakeResponse;
      setResult(json);
      setEditName(json.customer.name);
      setEditPhone(json.customer.phone ?? "");
      setEditServices(json.visit.services.join(", "));
      setEditAmount(String(json.visit.amount_inr));
      setEditNotes(json.visit.notes ?? "");
      setStep("confirm");
    } catch (e) {
      setServerErr(e instanceof Error ? e.message : "Network error");
      setStep("review-audio");
    }
  }

  async function onConfirm() {
    if (!result) return;
    const c = result.customer;
    const v = result.visit;

    const customerPatch: Record<string, unknown> = {};
    if (editName !== c.name) customerPatch.name = editName.trim();
    const phoneTrim = editPhone.trim();
    if (phoneTrim !== (c.phone ?? "")) customerPatch.phone = phoneTrim || null;

    const visitPatch: Record<string, unknown> = {};
    const newServices = editServices
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (JSON.stringify(newServices) !== JSON.stringify(v.services))
      visitPatch.services = newServices;
    const newAmount = Number(editAmount);
    if (Number.isFinite(newAmount) && newAmount !== Number(v.amount_inr))
      visitPatch.amount_inr = newAmount;
    if ((editNotes.trim() || null) !== (v.notes ?? null))
      visitPatch.notes = editNotes.trim() || null;

    const tasks: Promise<Response>[] = [];
    if (Object.keys(customerPatch).length > 0) {
      tasks.push(
        fetch(`/api/customers/${c.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customerPatch),
        })
      );
    }
    if (Object.keys(visitPatch).length > 0) {
      tasks.push(
        fetch(`/api/visits/${v.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visitPatch),
        })
      );
    }
    if (tasks.length > 0) {
      const responses = await Promise.all(tasks);
      const failed = responses.find((r) => !r.ok);
      if (failed) {
        setServerErr(`Edit save failed: HTTP ${failed.status}`);
        return;
      }
    }
    router.push("/");
    router.refresh();
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
          {step === "confirm" ? "Confirm customer" : "Record customer note"}
        </h1>
      </header>

      <section className="flex-1 px-5 py-6">
        {step === "capture" && <MicCapture onRecorded={onRecorded} maxSeconds={30} />}

        {step === "review-audio" && audio && (
          <div className="flex flex-col gap-5">
            <div className="rounded-card border border-border bg-surface p-4">
              <p className="text-base text-text-muted">Audio captured</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-text">
                {audio.durationSec.toFixed(1)}s
              </p>
            </div>

            <div>
              <p className="mb-2 text-base text-text-muted">Optional</p>
              <PhotoCapture onPicked={setPhoto} />
            </div>

            {serverErr && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                {serverErr}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setAudio(null);
                setPhoto(null);
                setStep("capture");
              }}
              className="text-base text-secondary"
            >
              Re-record
            </button>
          </div>
        )}

        {step === "saving" && (
          <div className="flex flex-col gap-6 pt-6">
            <p className="text-base text-text-muted">Saathi is working</p>
            <StatusTicker steps={SAVE_STEPS} current={savingStep} />
          </div>
        )}

        {step === "confirm" && result && (
          <div className="flex flex-col gap-4">
            <p className="text-base text-text-muted">
              Saathi parsed this. Edit anything that looks wrong.
            </p>

            <Field label="Name">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border-b border-border-dark bg-transparent py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91…"
                className="w-full border-b border-border-dark bg-transparent py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            <Field label="Services (comma-separated)">
              <input
                value={editServices}
                onChange={(e) => setEditServices(e.target.value)}
                className="w-full border-b border-border-dark bg-transparent py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            <Field label="Amount (₹)">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full border-b border-border-dark bg-transparent py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full rounded-card border border-border-dark bg-surface px-3 py-2 text-base text-text outline-none focus:border-primary"
              />
            </Field>

            {result.car && (
              <Field label="Car">
                <p className="py-2 text-base text-text">
                  {[result.car.color, result.car.make, result.car.model]
                    .filter(Boolean)
                    .join(" ") || "(unknown)"}
                  {result.car.license_plate ? ` · ${result.car.license_plate}` : ""}
                </p>
              </Field>
            )}

            {serverErr && (
              <p className="rounded-card border border-accent/40 bg-surface-2 px-4 py-3 text-base text-accent">
                {serverErr}
              </p>
            )}

            <details className="text-sm text-text-muted">
              <summary className="cursor-pointer">What Saathi heard</summary>
              <p className="mt-2 leading-relaxed">{result.transcript}</p>
            </details>
          </div>
        )}
      </section>

      {step === "review-audio" && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
          <button
            type="button"
            onClick={onSave}
            className="h-14 w-full rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700"
          >
            Save
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
          <button
            type="button"
            onClick={onConfirm}
            className="h-14 w-full rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700"
          >
            Confirm
          </button>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-base text-text-muted">{label}</span>
      {children}
    </label>
  );
}
