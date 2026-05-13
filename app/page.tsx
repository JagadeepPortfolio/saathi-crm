import Link from "next/link";
import { Mic } from "lucide-react";

import BottomBar from "@/components/BottomBar";
import Landing from "@/components/Landing";
import { customerStatus } from "@/lib/types";
import {
  lapsedCount,
  recentCustomers,
  todayAddedCount,
} from "@/lib/db/customers";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Vercel production serves the landing page; local dev shows the Today screen.
  if (process.env.LANDING_MODE === "1") {
    return <Landing />;
  }
  return <Today />;
}

async function Today() {
  const [recent, todayCount, lapsed] = await Promise.all([
    recentCustomers(5),
    todayAddedCount(),
    lapsedCount(60),
  ]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Saathi</h1>
          <p className="text-base text-text-muted">Dust Defender Lab</p>
        </div>
        <button
          type="button"
          className="rounded-button border border-border bg-surface px-3 py-2 text-base text-text"
          aria-label="Switch language"
        >
          🇮🇳 EN
        </button>
      </header>

      <section className="px-5 py-5">
        <p className="text-base text-text-muted">{today}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 px-5">
        <Link
          href="/customers?filter=today"
          className="rounded-card border border-border bg-surface p-4 active:bg-surface-2"
        >
          <p className="text-base text-text-muted">Today</p>
          <p className="text-2xl font-semibold text-text">{todayCount} added</p>
        </Link>
        <Link
          href="/customers?filter=lapsed"
          className="rounded-card border border-border bg-surface p-4 active:bg-surface-2"
        >
          <p className="text-base text-text-muted">Lapsed</p>
          <p className="text-2xl font-semibold text-text">{lapsed}</p>
        </Link>
      </section>

      <section className="flex-1 px-5 py-6">
        <h2 className="mb-3 text-2xl font-semibold text-text">Recent</h2>
        {recent.length === 0 ? (
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <p className="text-base text-text-muted">Add your first customer.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-px overflow-hidden rounded-card border border-border bg-surface">
            {recent.map((c) => {
              const status = customerStatus(c);
              const dotColor =
                status === "lapsed"
                  ? "bg-accent"
                  : status === "amber"
                    ? "bg-primary"
                    : "bg-success";
              return (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 active:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-text">
                        {c.name}
                      </p>
                      <p className="truncate text-base text-text-muted">
                        {new Date(c.last_visit_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="sticky bottom-14 border-t border-border bg-bg px-5 py-4">
        <Link
          href="/record"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-button bg-primary text-base font-semibold text-white active:bg-primary-700"
        >
          <Mic size={20} />
          Record
        </Link>
      </div>

      <BottomBar />
    </main>
  );
}
