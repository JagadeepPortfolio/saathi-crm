import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-start justify-center bg-bg px-5">
      <h1 className="text-2xl font-semibold text-text">Not found.</h1>
      <p className="mt-2 text-base text-text-muted">
        That customer or page does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 flex h-12 items-center rounded-button border border-border bg-surface px-4 text-base text-text active:bg-surface-2"
      >
        Back to Today
      </Link>
    </main>
  );
}
