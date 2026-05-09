// WhatsApp provider selector. Set WHATSAPP_PROVIDER in env.

import type { WhatsAppAdapter } from "./adapter";
import { mockWhatsAppAdapter } from "./mock";
import { twilioAdapter } from "./twilio";

export function whatsapp(): WhatsAppAdapter {
  const provider = process.env.WHATSAPP_PROVIDER ?? "twilio";
  switch (provider) {
    case "twilio":
      return twilioAdapter;
    case "mock":
      return mockWhatsAppAdapter;
    case "meta":
      throw new Error("WHATSAPP_PROVIDER=meta not implemented in MVP. Use twilio.");
    default:
      throw new Error(`Unknown WHATSAPP_PROVIDER: ${provider}`);
  }
}

export type { WhatsAppAdapter, WhatsAppSendInput, WhatsAppSendResult } from "./adapter";
