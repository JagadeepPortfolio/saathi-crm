// POST /api/draft
// body: {customerId, language?, occasion?}
// Generates a follow-up message draft via Gemma 4. Does NOT write to DB —
// the owner approves first; /api/send is what actually persists.

import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { getCustomer } from "@/lib/db/customers";
import { listVisitsForCustomer } from "@/lib/db/visits";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_LANGUAGES: Language[] = ["te", "hi", "en"];
const ALLOWED_OCCASIONS = ["lapsed", "thankyou", "reminder"] as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const customerId = body.customerId as string | undefined;
    const language = (body.language as string | undefined) as Language | undefined;
    const occasion = body.occasion as (typeof ALLOWED_OCCASIONS)[number] | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }
    const customer = await getCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: "customer not found" }, { status: 404 });
    }

    const targetLanguage = (language && ALLOWED_LANGUAGES.includes(language)
      ? language
      : customer.preferred_language) as Language;
    const targetOccasion =
      occasion && ALLOWED_OCCASIONS.includes(occasion) ? occasion : undefined;

    const visits = await listVisitsForCustomer(customer.id);

    const draft = await ai().draftFollowup({
      customer,
      visits,
      targetLanguage,
      occasion: targetOccasion,
    });

    return NextResponse.json(
      {
        text: draft.text,
        language: targetLanguage,
        occasion: targetOccasion ?? null,
        meta: {
          model: draft.meta.model,
          ms: draft.meta.ms,
          input_tokens: draft.meta.input_tokens,
          output_tokens: draft.meta.output_tokens,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[draft] failed:", msg);
    return NextResponse.json(
      { error: "draft_failed", message: msg.slice(0, 300) },
      { status: 500 }
    );
  }
}
