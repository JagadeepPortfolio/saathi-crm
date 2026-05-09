// Intake orchestrator for Flow 1 (voice-photo customer intake).
// audio + (optional) photo + language → parsed customer record persisted.
//
// See docs/WORKFLOWS.md "Flow 1" for the canonical step list.

import { transcribe } from "@/lib/asr";
import { ai } from "@/lib/ai";
import { signedUrl, uploadAudio, uploadPhoto } from "@/lib/db/storage";
import { recentCustomerSummaries, createCustomer, bumpCustomerOnVisit, getCustomer } from "@/lib/db/customers";
import { upsertCar } from "@/lib/db/cars";
import { createVisit } from "@/lib/db/visits";
import type { Car, Customer, Language, Visit } from "@/lib/types";
import type { ToolCallMeta } from "@/lib/ai/adapter";

export type IntakeInput = {
  audioBytes: Buffer;
  audioContentType: string;
  photoBytes?: Buffer;
  photoContentType?: string;
  language: Language;
};

export type IntakeResult = {
  customer: Customer;
  visit: Visit;
  car: Car | null;
  transcript: string;
  asrMs: number;
  parseToolCall: { name: string; arguments: unknown };
  parseMeta: ToolCallMeta;
};

export async function runIntake(input: IntakeInput): Promise<IntakeResult> {
  // 1. Persist audio + photo first; if anything downstream fails, we still
  //    have the source artifacts to retry from.
  const [audioObj, photoObj] = await Promise.all([
    uploadAudio(input.audioBytes, input.audioContentType),
    input.photoBytes
      ? uploadPhoto(input.photoBytes, input.photoContentType ?? "image/jpeg")
      : Promise.resolve(null),
  ]);

  // 2. ASR — runs in parallel with the known-customer fetch.
  const [asrResult, knownCustomers] = await Promise.all([
    transcribe({ audioBytes: input.audioBytes, language: input.language }),
    recentCustomerSummaries(),
  ]);

  // 3. Gemma 4 parses transcript + photo into a tool call.
  const photoBase64 = input.photoBytes ? input.photoBytes.toString("base64") : undefined;
  const parsed = await ai().parseIntake({
    transcript: asrResult.text,
    photoBase64,
    language: input.language,
    knownCustomers,
  });

  const audioUrl = await signedUrl(audioObj, 7 * 24 * 3600);
  const photoUrl = photoObj ? await signedUrl(photoObj, 30 * 24 * 3600) : null;

  const meta: Record<string, unknown> = {
    ...parsed.meta,
    asr_ms: asrResult.ms,
    asr_language: asrResult.language,
    tool: parsed.toolCall.name,
  };

  if (parsed.toolCall.name === "customer.create") {
    const args = parsed.toolCall.arguments;
    const customer = await createCustomer({
      name: args.name,
      phone: args.phone ?? null,
      preferred_language: args.preferred_language,
    });

    const car =
      args.car && (args.car.license_plate || args.car.make || photoUrl)
        ? await upsertCar({
            customer_id: customer.id,
            license_plate: args.car.license_plate ?? null,
            make: args.car.make ?? null,
            model: args.car.model ?? null,
            color: args.car.color ?? null,
            photo_url: photoUrl,
          })
        : null;

    const visit = await createVisit({
      customer_id: customer.id,
      car_id: car?.id ?? null,
      services: args.visit.services,
      amount_inr: args.visit.amount_inr,
      notes: args.visit.notes ?? null,
      next_visit_hint: args.visit.next_visit_hint ?? null,
      intake_audio_url: audioUrl,
      intake_photo_url: photoUrl,
      raw_transcript: asrResult.text,
      ai_tool_call_meta: meta,
    });

    await bumpCustomerOnVisit(customer.id, car?.id ?? null);
    const refreshed = (await getCustomer(customer.id)) ?? customer;

    return {
      customer: refreshed,
      visit,
      car,
      transcript: asrResult.text,
      asrMs: asrResult.ms,
      parseToolCall: parsed.toolCall,
      parseMeta: parsed.meta,
    };
  }

  // customer.update path
  const args = parsed.toolCall.arguments;
  const existing = await getCustomer(args.customer_id);
  if (!existing) {
    throw new Error(
      `Gemma 4 chose customer.update for unknown id ${args.customer_id} — falling back to manual review`
    );
  }
  const visit = await createVisit({
    customer_id: existing.id,
    services: args.visit.services,
    amount_inr: args.visit.amount_inr,
    notes: args.visit.notes ?? null,
    next_visit_hint: args.visit.next_visit_hint ?? null,
    intake_audio_url: audioUrl,
    intake_photo_url: photoUrl,
    raw_transcript: asrResult.text,
    ai_tool_call_meta: meta,
  });

  await bumpCustomerOnVisit(existing.id, null);
  const refreshed = (await getCustomer(existing.id)) ?? existing;

  return {
    customer: refreshed,
    visit,
    car: null,
    transcript: asrResult.text,
    asrMs: asrResult.ms,
    parseToolCall: parsed.toolCall,
    parseMeta: parsed.meta,
  };
}
