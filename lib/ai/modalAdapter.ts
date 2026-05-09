// Modal serverless adapter — mirrors gemmaAdapter but POSTs to a Modal
// endpoint URL configured via MODAL_GEMMA_URL. The Modal container runs
// Ollama internally with the same gemma4:e4b model, so the request/response
// shape is identical to the local path.
//
// Deploy: see modal/saathi_inference.py.
//
// CRITICAL: like gemmaAdapter, every request sets `think: false`.
// See docs/GEMMA_INTEGRATION.md.

import type {
  AIAdapter,
  CustomerCreateArgs,
  DraftFollowupInput,
  DraftFollowupResult,
  IntakeToolCall,
  ParseIntakeInput,
  ParseIntakeResult,
  ToolCallMeta,
} from "./adapter";
import { INTAKE_TOOLS } from "./tools";

const DEFAULT_MODEL = "gemma4:e4b";

type OllamaToolCall = {
  id?: string;
  function: { name: string; arguments: Record<string, unknown> };
};

type OllamaResponse = {
  model: string;
  message?: {
    role: string;
    content?: string;
    thinking?: string;
    tool_calls?: OllamaToolCall[];
  };
  prompt_eval_count?: number;
  eval_count?: number;
  total_duration?: number;
};

function endpoint(): string {
  const url = process.env.MODAL_GEMMA_URL;
  if (!url) {
    throw new Error(
      "MODAL_GEMMA_URL is not set. Deploy modal/saathi_inference.py and copy the URL into .env.local."
    );
  }
  return url;
}

function model(): string {
  return process.env.GEMMA_MODEL || DEFAULT_MODEL;
}

async function chat(body: Record<string, unknown>): Promise<OllamaResponse> {
  const url = endpoint();
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: false, think: false }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Modal endpoint ${r.status}: ${text.slice(0, 300)}`);
  }
  return (await r.json()) as OllamaResponse;
}

function metaFrom(r: OllamaResponse): ToolCallMeta {
  return {
    model: r.model || model(),
    input_tokens: r.prompt_eval_count ?? 0,
    output_tokens: r.eval_count ?? 0,
    ms: Math.round((r.total_duration ?? 0) / 1e6),
  };
}

const INTAKE_SYSTEM = `You are the intake parser for Saathi, a CRM tool for Indian small businesses.

OUTPUT FORMAT — non-negotiable:
- Invoke exactly one of the provided tools (customer.create or customer.update) using the function-calling mechanism.
- DO NOT write function-call syntax as text in your message content. Use the structured tool call API only.
- DO NOT add prose or explanation around the tool call.

CORE RULES (same as the local gemma path; see lib/ai/gemmaAdapter.ts).`;

export const modalAdapter: AIAdapter = {
  async parseIntake(input: ParseIntakeInput): Promise<ParseIntakeResult> {
    const userText = [
      `language hint: "${input.language}"`,
      `transcript: ${input.transcript}`,
      `knownCustomers: ${JSON.stringify(input.knownCustomers)}`,
    ].join("\n");

    const messageBody: Record<string, unknown> = {
      role: "user",
      content: userText,
    };
    if (input.photoBase64) {
      messageBody.images = [input.photoBase64];
    }

    const r = await chat({
      model: model(),
      messages: [
        { role: "system", content: INTAKE_SYSTEM },
        messageBody,
      ],
      tools: INTAKE_TOOLS.map((t) => ({ type: "function", function: t })),
      options: { temperature: 0.1, num_predict: 1200 },
    });

    const tc = r.message?.tool_calls?.[0];
    if (!tc) {
      throw new Error(
        `Modal Gemma 4 returned no tool_call. content=${JSON.stringify(
          r.message?.content || ""
        ).slice(0, 200)}`
      );
    }

    const name = tc.function.name.replace(/_/g, ".");
    if (name !== "customer.create" && name !== "customer.update") {
      throw new Error(`Unexpected tool: ${tc.function.name}`);
    }

    const args = tc.function.arguments as Record<string, unknown>;
    if (!args.visit || typeof args.visit !== "object") {
      throw new Error(
        `Modal Gemma 4 ${name} missing required visit field. args=${JSON.stringify(
          args
        ).slice(0, 400)}`
      );
    }

    const toolCall: IntakeToolCall =
      name === "customer.create"
        ? {
            name: "customer.create",
            arguments: args as unknown as CustomerCreateArgs,
          }
        : {
            name: "customer.update",
            arguments: {
              customer_id: args.customer_id as string,
              visit: (args as unknown as CustomerCreateArgs).visit,
            },
          };

    return { toolCall, meta: metaFrom(r) };
  },

  async draftFollowup(input: DraftFollowupInput): Promise<DraftFollowupResult> {
    const visitsSummary = input.visits
      .slice(0, 3)
      .map((v) => {
        const date = v.created_at?.slice(0, 10) ?? "";
        const services = (v.services || []).join(", ");
        const notes = v.notes ? ` notes: ${v.notes}` : "";
        return `${date}: ${services} ₹${v.amount_inr}${notes}`;
      })
      .join("\n");

    const occasionLine = input.occasion
      ? `Occasion: ${input.occasion}.`
      : "Occasion: thoughtful follow-up.";

    const langLabel = { te: "Telugu", hi: "Hindi", en: "English" }[
      input.targetLanguage
    ];

    const system = [
      "You draft a single WhatsApp follow-up from an Indian small-business owner to one of their customers.",
      "Output the message text only. No prose around it. No 'Here is the message:' framing.",
      "2 to 4 sentences. Personalized using one specific detail from the visit history.",
      "No emojis. No marketing fluff. No 'Dear customer'. No sign-off line.",
      "Owner's voice, not yours.",
    ].join(" ");

    const user = [
      `Customer: ${input.customer.name}`,
      `Preferred language: ${langLabel}.`,
      `Recent visits:\n${visitsSummary}`,
      occasionLine,
      `Write the message in ${langLabel}.`,
    ].join("\n");

    const r = await chat({
      model: model(),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      options: { temperature: 0.4, num_predict: 400 },
    });

    const text = (r.message?.content || "").trim();
    if (!text) {
      throw new Error("Modal Gemma 4 returned empty content for draftFollowup");
    }
    return { text, meta: metaFrom(r) };
  },
};
