// POST /api/send
// body: {customerId, text, language?}
// Owner approved a drafted message; fire it via Twilio (sandbox) and log
// the outbound row.

import { NextResponse } from "next/server";
import { whatsapp } from "@/lib/whatsapp";
import { getCustomer } from "@/lib/db/customers";
import { createMessage } from "@/lib/db/messages";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 20;

const ALLOWED_LANGUAGES: Language[] = ["te", "hi", "en"];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const customerId = body.customerId as string | undefined;
    const text = (body.text as string | undefined)?.trim();
    const language = (body.language as string | undefined) as Language | undefined;

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }
    if (!text || text.length < 3) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (text.length > 1000) {
      return NextResponse.json({ error: "text exceeds 1000 chars" }, { status: 400 });
    }

    const customer = await getCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: "customer not found" }, { status: 404 });
    }
    if (!customer.phone) {
      return NextResponse.json(
        { error: "customer has no phone — add phone before sending" },
        { status: 400 }
      );
    }

    const targetLanguage = (
      language && ALLOWED_LANGUAGES.includes(language)
        ? language
        : customer.preferred_language
    ) as Language;

    const sendResult = await whatsapp().send({
      to: customer.phone,
      text,
      language: targetLanguage,
    });

    const message = await createMessage({
      customer_id: customer.id,
      direction: "outbound",
      language: targetLanguage,
      text,
      status: sendResult.status === "sent" ? "sent" : sendResult.status === "queued" ? "sent" : "failed",
      whatsapp_message_id: sendResult.messageId || null,
      ai_tool_call_meta: {
        provider: sendResult.provider,
        twilio_status: (sendResult.raw as { status?: string } | undefined)?.status,
      },
    });

    if (sendResult.status === "failed") {
      return NextResponse.json(
        {
          message,
          error: "whatsapp_send_failed",
          provider_error: sendResult.raw,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message,
        provider: sendResult.provider,
        provider_message_id: sendResult.messageId,
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[send] failed:", msg);
    return NextResponse.json(
      { error: "send_failed", message: msg.slice(0, 300) },
      { status: 500 }
    );
  }
}
