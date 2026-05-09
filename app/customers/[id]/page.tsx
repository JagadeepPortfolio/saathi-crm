import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import BottomBar from "@/components/BottomBar";
import { getCustomer } from "@/lib/db/customers";
import { listVisitsForCustomer } from "@/lib/db/visits";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const visits = await listVisitsForCustomer(customer.id);

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

      <div className="flex-1" />

      <BottomBar />
    </main>
  );
}
