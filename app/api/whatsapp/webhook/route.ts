// POST /api/whatsapp/webhook
// Twilio Status Callback handler.
// Twilio posts form-encoded body with MessageSid, MessageStatus, etc.
// We update messages.status by whatsapp_message_id.
//
// Configure in Twilio Console → Messaging → Settings → "Webhook URL when
// a message status changes" → https://<your-tunnel>/api/whatsapp/webhook
//
// GET handler responds with a verify token check (for providers that want
// it; harmless for Twilio since Twilio doesn't use challenge-response).

import { NextResponse } from "next/server";
import { updateMessageStatusByProviderId } from "@/lib/db/messages";
import type { Message } from "@/lib/types";

export const runtime = "nodejs";

const VALID_STATUSES: Message["status"][] = [
  "drafted",
  "sent",
  "delivered",
  "read",
  "failed",
];

function mapTwilioStatus(s: string): Message["status"] | null {
  switch (s) {
    case "queued":
    case "sending":
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
    case "undelivered":
      return "failed";
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    let messageSid: string | null = null;
    let messageStatus: string | null = null;

    if (ct.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      messageSid = form.get("MessageSid") as string | null;
      messageStatus = form.get("MessageStatus") as string | null;
    } else if (ct.includes("application/json")) {
      const json = (await req.json()) as Record<string, unknown>;
      messageSid = (json.MessageSid as string) ?? null;
      messageStatus = (json.MessageStatus as string) ?? null;
    }

    if (!messageSid || !messageStatus) {
      return NextResponse.json(
        { error: "missing MessageSid or MessageStatus" },
        { status: 400 }
      );
    }

    const mapped = mapTwilioStatus(messageStatus);
    if (!mapped || !VALID_STATUSES.includes(mapped)) {
      return NextResponse.json({ ok: true, ignored: messageStatus }, { status: 200 });
    }

    await updateMessageStatusByProviderId(messageSid, mapped);
    return NextResponse.json({ ok: true, status: mapped }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[whatsapp webhook] failed:", msg);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Webhook verification handshake — used by Meta but not Twilio.
  // Returns the challenge if verify_token matches WHATSAPP_VERIFY_TOKEN.
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");
  if (
    mode === "subscribe" &&
    token &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
