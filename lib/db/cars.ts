import type { Car } from "@/lib/types";
import { db } from "./client";

export type UpsertCarArgs = {
  customer_id: string;
  license_plate?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  photo_url?: string | null;
};

/**
 * Upsert a car for a customer. If the plate already exists for any customer
 * we do not steal it — we return the existing car. If no plate is provided,
 * we always create a new car row (no dedup possible).
 */
export async function upsertCar(args: UpsertCarArgs): Promise<Car> {
  if (args.license_plate) {
    const { data: existing, error: e1 } = await db()
      .from("cars")
      .select("*")
      .eq("license_plate", args.license_plate)
      .maybeSingle();
    if (e1) throw new Error(`upsertCar lookup failed: ${e1.message}`);
    if (existing) {
      const updates: Record<string, unknown> = {};
      if (args.make && !existing.make) updates.make = args.make;
      if (args.model && !existing.model) updates.model = args.model;
      if (args.color && !existing.color) updates.color = args.color;
      if (args.photo_url) updates.photo_url = args.photo_url;
      if (Object.keys(updates).length > 0) {
        const { data: updated, error: e2 } = await db()
          .from("cars")
          .update(updates)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (e2 || !updated) throw new Error(`upsertCar update failed: ${e2?.message}`);
        return updated as Car;
      }
      return existing as Car;
    }
  }

  const { data, error } = await db()
    .from("cars")
    .insert({
      customer_id: args.customer_id,
      license_plate: args.license_plate ?? null,
      make: args.make ?? null,
      model: args.model ?? null,
      color: args.color ?? null,
      photo_url: args.photo_url ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`upsertCar insert failed: ${error?.message}`);
  return data as Car;
}
