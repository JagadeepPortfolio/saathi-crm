// Customer reads + writes against Supabase.
// Single-tenant pilot: every query is implicitly scoped by PILOT_SHOP_ID.

import type { Customer, CustomerSummary, Language } from "@/lib/types";
import { db, PILOT_SHOP_ID } from "./client";

const KNOWN_WINDOW_DAYS = 90;
const KNOWN_LIMIT = 200;

export async function recentCustomerSummaries(): Promise<CustomerSummary[]> {
  const since = new Date(Date.now() - KNOWN_WINDOW_DAYS * 86_400_000).toISOString();
  const { data: customers, error: e1 } = await db()
    .from("customers")
    .select("id, name, phone")
    .eq("shop_id", PILOT_SHOP_ID)
    .gte("last_visit_at", since)
    .order("last_visit_at", { ascending: false })
    .limit(KNOWN_LIMIT);
  if (e1) throw new Error(`recentCustomerSummaries failed: ${e1.message}`);
  if (!customers || customers.length === 0) return [];

  const ids = customers.map((c) => c.id as string);
  const { data: cars, error: e2 } = await db()
    .from("cars")
    .select("customer_id, license_plate")
    .in("customer_id", ids)
    .not("license_plate", "is", null);
  if (e2) throw new Error(`recentCustomerSummaries cars lookup failed: ${e2.message}`);

  const plateByCustomer = new Map<string, string>();
  for (const c of cars ?? []) {
    const cid = c.customer_id as string;
    const plate = c.license_plate as string | null;
    if (plate && !plateByCustomer.has(cid)) plateByCustomer.set(cid, plate);
  }

  return customers.map((c) => ({
    id: c.id as string,
    name: c.name as string,
    phone: (c.phone as string | null) ?? null,
    license_plate: plateByCustomer.get(c.id as string) ?? null,
  }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await db()
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("shop_id", PILOT_SHOP_ID)
    .maybeSingle();
  if (error) throw new Error(`getCustomer failed: ${error.message}`);
  return (data as Customer) ?? null;
}

export type CreateCustomerArgs = {
  name: string;
  phone?: string | null;
  preferred_language: Language;
  notes?: string | null;
};

export async function createCustomer(args: CreateCustomerArgs): Promise<Customer> {
  const { data, error } = await db()
    .from("customers")
    .insert({
      shop_id: PILOT_SHOP_ID,
      name: args.name,
      phone: args.phone ?? null,
      preferred_language: args.preferred_language,
      notes: args.notes ?? null,
      visit_count: 0,
      first_visit_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`createCustomer failed: ${error?.message}`);
  return data as Customer;
}

export async function bumpCustomerOnVisit(
  customerId: string,
  primaryCarId: string | null
): Promise<void> {
  const { error: rpcError } = await db().rpc("increment_visit_count", {
    customer_uuid: customerId,
  });
  if (rpcError) {
    // Fall back to fetch-then-write if the RPC isn't installed yet.
    const { data: current, error: e1 } = await db()
      .from("customers")
      .select("visit_count")
      .eq("id", customerId)
      .single();
    if (e1 || !current) throw new Error(`bumpCustomerOnVisit read failed: ${e1?.message}`);
    const updates: Record<string, unknown> = {
      visit_count: (current.visit_count as number) + 1,
      last_visit_at: new Date().toISOString(),
    };
    if (primaryCarId) updates.primary_car_id = primaryCarId;
    const { error: e2 } = await db()
      .from("customers")
      .update(updates)
      .eq("id", customerId);
    if (e2) throw new Error(`bumpCustomerOnVisit write failed: ${e2.message}`);
    return;
  }
  if (primaryCarId) {
    await db()
      .from("customers")
      .update({ primary_car_id: primaryCarId })
      .eq("id", customerId)
      .is("primary_car_id", null);
  }
}
