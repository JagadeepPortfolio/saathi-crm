import type { WhatsAppAdapter, WhatsAppSendInput, WhatsAppSendResult } from "./adapter";

export const mockWhatsAppAdapter: WhatsAppAdapter = {
  async send(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
    return {
      messageId: `mock_${Math.random().toString(36).slice(2, 12)}`,
      status: "sent",
      provider: "mock",
      raw: { to: input.to, length: input.text.length, language: input.language },
    };
  },
};
