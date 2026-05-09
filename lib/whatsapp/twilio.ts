// Twilio WhatsApp Sandbox adapter.
// Sandbox restrictions: only sends to recipients who have joined the sandbox
// (sent the "join <phrase>" message from their iPhone). Production swap to
// Meta Cloud or Twilio production removes that restriction.
//
// Env required:
//   TWILIO_ACCOUNT_SID            (starts with AC…)
//   TWILIO_AUTH_TOKEN             (hidden in Twilio console)
//   TWILIO_WHATSAPP_FROM          e.g. whatsapp:+14155238886
//
// Optional dev-only:
//   WHATSAPP_TEST_RECIPIENT       overrides recipient on every send
//   (for sandbox testing where seeded customer phones aren't joined)

import type { WhatsAppAdapter, WhatsAppSendInput, WhatsAppSendResult } from "./adapter";

function whatsappTo(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
}

function effectiveRecipient(phone: string): string {
  const override = process.env.WHATSAPP_TEST_RECIPIENT;
  return whatsappTo(override || phone);
}

export const twilioAdapter: WhatsAppAdapter = {
  async send(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!sid || !token || !from) {
      throw new Error(
        "Twilio not configured. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM in .env.local."
      );
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({
      From: whatsappTo(from),
      To: effectiveRecipient(input.to),
      Body: input.text,
    });

    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) {
      const code = json.code ?? r.status;
      const msg = (json.message as string) ?? `HTTP ${r.status}`;
      return {
        messageId: "",
        status: "failed",
        provider: "twilio",
        raw: { code, message: msg, http: r.status },
      };
    }

    const messageSid = String(json.sid ?? "");
    const status = mapStatus(String(json.status ?? "queued"));
    return {
      messageId: messageSid,
      status,
      provider: "twilio",
      raw: json,
    };
  },
};

function mapStatus(s: string): "queued" | "sent" | "failed" {
  if (s === "failed" || s === "undelivered") return "failed";
  if (s === "sent" || s === "delivered" || s === "read") return "sent";
  return "queued";
}
