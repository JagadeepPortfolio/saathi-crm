// Mock adapter for unit tests only.
// NEVER used in the demo — see docs/CLAUDE.md "AI Integration".

import type {
  AIAdapter,
  DraftFollowupInput,
  DraftFollowupResult,
  ParseIntakeInput,
  ParseIntakeResult,
} from "./adapter";

const META = (ms: number) => ({
  model: "mock-adapter",
  input_tokens: 0,
  output_tokens: 0,
  ms,
});

export const mockAdapter: AIAdapter = {
  async parseIntake(input: ParseIntakeInput): Promise<ParseIntakeResult> {
    return {
      toolCall: {
        name: "customer.create",
        arguments: {
          name: "Test Customer",
          preferred_language: input.language,
          visit: {
            services: ["maintenance wash"],
            amount_inr: 800,
            notes: input.transcript.slice(0, 120),
          },
        },
      },
      meta: META(50),
    };
  },

  async draftFollowup(input: DraftFollowupInput): Promise<DraftFollowupResult> {
    const lang = input.targetLanguage;
    const text =
      lang === "te"
        ? `Namaste ${input.customer.name} garu, mee car ki maintenance wash time vachindi.`
        : lang === "hi"
        ? `Namaste ${input.customer.name} ji, aapki gaadi ki maintenance ka time aa gaya hai.`
        : `Hi ${input.customer.name}, your car is due for a maintenance wash.`;
    return { text, meta: META(50) };
  },
};
