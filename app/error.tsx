"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center bg-bg px-5">
      <h1 className="text-2xl font-semibold text-text">Something broke.</h1>
      <p className="mt-2 text-base text-text-muted">
        Saathi hit an error. Try again, or go back.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-sm text-text-muted">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-12 rounded-button bg-primary px-5 text-base font-semibold text-white active:bg-primary-700"
        >
          Try again
        </button>
        <a
          href="/"
          className="flex h-12 items-center rounded-button border border-border bg-surface px-4 text-base text-text active:bg-surface-2"
        >
          Back to Today
        </a>
      </div>
    </main>
  );
}
