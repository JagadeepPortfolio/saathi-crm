import type { Visit } from "@/lib/types";
import { db } from "./client";

export type CreateVisitArgs = {
  customer_id: string;
  car_id?: string | null;
  services: string[];
  amount_inr: number;
  notes?: string | null;
  next_visit_hint?: string | null;
  intake_audio_url?: string | null;
  intake_photo_url?: string | null;
  raw_transcript?: string | null;
  ai_tool_call_meta?: Record<string, unknown>;
};

export async function createVisit(args: CreateVisitArgs): Promise<Visit> {
  const { data, error } = await db()
    .from("visits")
    .insert({
      customer_id: args.customer_id,
      car_id: args.car_id ?? null,
      services: args.services,
      amount_inr: args.amount_inr,
      notes: args.notes ?? null,
      next_visit_hint: args.next_visit_hint ?? null,
      intake_audio_url: args.intake_audio_url ?? null,
      intake_photo_url: args.intake_photo_url ?? null,
      raw_transcript: args.raw_transcript ?? null,
      ai_tool_call_meta: args.ai_tool_call_meta ?? {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`createVisit failed: ${error?.message}`);
  return data as Visit;
}
