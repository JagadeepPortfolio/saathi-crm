import { Mic } from "lucide-react";

export default function Today() {
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
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-base text-text-muted">Today</p>
          <p className="text-2xl font-semibold text-text">0 added</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="text-base text-text-muted">Lapsed</p>
          <p className="text-2xl font-semibold text-text">0</p>
        </div>
      </section>

      <section className="flex-1 px-5 py-6">
        <h2 className="mb-3 text-2xl font-semibold text-text">Recent</h2>
        <div className="rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-base text-text-muted">Add your first customer.</p>
        </div>
      </section>

      <div className="sticky bottom-0 border-t border-border bg-bg px-5 py-4">
        <button
          type="button"
          disabled
          className="flex h-14 w-full items-center justify-center gap-2 rounded-button bg-primary text-base font-semibold text-white opacity-60"
          aria-label="Record customer note"
        >
          <Mic size={20} />
          Record
        </button>
      </div>
    </main>
  );
}
