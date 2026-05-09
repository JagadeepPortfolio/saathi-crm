// WhatsApp send adapter — provider-agnostic interface.
// Pilot uses Twilio Sandbox; the spec swaps to Meta Cloud API for V2 by
// changing WHATSAPP_PROVIDER and the corresponding credentials.

import type { Language } from "@/lib/types";

export type WhatsAppSendInput = {
  /** E.164 phone number, e.g. "+91987..." */
  to: string;
  text: string;
  language: Language;
};

export type WhatsAppSendResult = {
  /** Provider-specific message ID (e.g. Twilio MessageSid) */
  messageId: string;
  /** Provider-reported status at send time. */
  status: "queued" | "sent" | "failed";
  provider: "twilio" | "meta" | "mock";
  raw?: Record<string, unknown>;
};

export interface WhatsAppAdapter {
  send(input: WhatsAppSendInput): Promise<WhatsAppSendResult>;
}
