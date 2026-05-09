import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BottomBar from "@/components/BottomBar";
import CustomersList from "@/components/CustomersList";
import { db, PILOT_SHOP_ID } from "@/lib/db/client";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { data, error } = await db()
    .from("customers")
    .select("*")
    .eq("shop_id", PILOT_SHOP_ID)
    .order("last_visit_at", { ascending: false });
  if (error) throw new Error(error.message);
  const customers = (data ?? []) as Customer[];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Link
          href="/"
          aria-label="Back to Today"
          className="flex h-10 w-10 items-center justify-center rounded-button text-text"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-semibold text-text">Customers</h1>
      </header>

      <CustomersList customers={customers} initialFilter={filter ?? "all"} />

      <BottomBar />
    </main>
  );
}
