// POST /api/intake
// Multipart form: audio (required), photo (optional), language (required).
// See docs/WORKFLOWS.md Flow 1 and docs/SPEC.md FR1–FR6.

import { NextResponse } from "next/server";
import { runIntake } from "@/lib/intake";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACCEPTED_LANGUAGES: Language[] = ["te", "hi", "en"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const photo = form.get("photo");
    const language = (form.get("language") as string | null) ?? "te";

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "audio (multipart Blob) is required" }, { status: 400 });
    }
    if (audio.size < 4_000) {
      return NextResponse.json(
        { error: "too_short", message: "Try again, speak for at least 3 seconds." },
        { status: 400 }
      );
    }
    if (!ACCEPTED_LANGUAGES.includes(language as Language)) {
      return NextResponse.json(
        { error: `language must be one of ${ACCEPTED_LANGUAGES.join(", ")}` },
        { status: 400 }
      );
    }

    const audioBytes = Buffer.from(await audio.arrayBuffer());
    const photoBytes =
      photo instanceof Blob && photo.size > 0
        ? Buffer.from(await photo.arrayBuffer())
        : undefined;

    const result = await runIntake({
      audioBytes,
      audioContentType: audio.type || "audio/m4a",
      photoBytes,
      photoContentType: photo instanceof Blob ? photo.type || "image/jpeg" : undefined,
      language: language as Language,
    });

    return NextResponse.json(
      {
        customer: result.customer,
        visit: result.visit,
        car: result.car,
        transcript: result.transcript,
        meta: {
          tool: result.parseToolCall.name,
          asr_ms: result.asrMs,
          gemma_ms: result.parseMeta.ms,
          model: result.parseMeta.model,
          input_tokens: result.parseMeta.input_tokens,
          output_tokens: result.parseMeta.output_tokens,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[intake] failed:", msg);
    return NextResponse.json({ error: "intake_failed", message: msg.slice(0, 300) }, { status: 500 });
  }
}
