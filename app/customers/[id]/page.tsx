import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Send } from "lucide-react";

import BottomBar from "@/components/BottomBar";
import { getCustomer } from "@/lib/db/customers";
import { listVisitsForCustomer } from "@/lib/db/visits";
import { listMessagesForCustomer } from "@/lib/db/messages";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_DOT: Record<Message["status"], string> = {
  drafted: "bg-text-muted",
  sent: "bg-secondary",
  delivered: "bg-success",
  read: "bg-success",
  failed: "bg-accent",
};

const LANG_LABEL: Record<string, string> = {
  te: "TE",
  hi: "HI",
  en: "EN",
};

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const [visits, messages] = await Promise.all([
    listVisitsForCustomer(customer.id),
    listMessagesForCustomer(customer.id),
  ]);
  const draftDisabled = !customer.phone;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Link
          href="/customers"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-button text-text"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-semibold text-text">{customer.name}</h1>
      </header>

      <section className="px-5 py-5">
        <p className="text-2xl font-semibold text-text">{customer.name}</p>
        <p className="text-base text-text-muted">{customer.phone ?? "no phone"}</p>
        <p className="text-base text-text-muted">
          Last visit:{" "}
          {new Date(customer.last_visit_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {" · "}
          {customer.visit_count} {customer.visit_count === 1 ? "visit" : "visits"}
        </p>
      </section>

      <section className="px-5 pb-6">
        <h2 className="mb-3 text-2xl font-semibold text-text">Visits</h2>
        {visits.length === 0 ? (
          <p className="rounded-card border border-border bg-surface px-4 py-6 text-center text-base text-text-muted">
            No visits recorded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visits.map((v) => (
              <li
                key={v.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <p className="text-base text-text-muted">
                  {new Date(v.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-base text-text">
                  {v.services.join(", ") || "(no services)"}
                </p>
                <p className="text-base text-text">₹{v.amount_inr}</p>
                {v.notes && (
                  <p className="mt-1 text-base text-text-muted">{v.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="px-5 pb-24">
        <h2 className="mb-3 text-2xl font-semibold text-text">Messages</h2>
        {messages.length === 0 ? (
          <p className="rounded-card border border-border bg-surface px-4 py-6 text-center text-base text-text-muted">
            No follow-ups sent yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[m.status]}`} />
                  <p className="text-base text-text-muted">
                    {m.direction === "outbound" ? "Sent" : "Received"} ·{" "}
                    {new Date(m.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" · "}
                    {LANG_LABEL[m.language] ?? m.language.toUpperCase()}
                    {" · "}
                    {m.status}
                  </p>
                </div>
                <p className="text-base text-text">{m.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-14 border-t border-border bg-bg">
        <div className="flex items-center gap-3 px-5 py-4">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="flex h-12 items-center gap-2 rounded-button border border-border bg-surface px-4 text-base text-text active:bg-surface-2"
          >
            <Pencil size={16} />
            Edit
          </Link>
          {draftDisabled ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-button bg-primary text-base font-semibold text-white opacity-50"
              title="Add phone first"
            >
              <Send size={18} />
              Draft follow-up
            </button>
          ) : (
            <Link
              href={`/customers/${customer.id}/draft`}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700"
            >
              <Send size={18} />
              Draft follow-up
            </Link>
          )}
        </div>
        {draftDisabled && (
          <p className="px-5 pb-3 text-base text-text-muted">
            Add a phone number first to draft a follow-up.
          </p>
        )}
      </div>

      <BottomBar />
    </main>
  );
}
