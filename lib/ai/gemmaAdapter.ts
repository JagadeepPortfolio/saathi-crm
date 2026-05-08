// Gemma 4 adapter — talks to a local Ollama HTTP server (default localhost:11434).
// In production, GEMMA_ENDPOINT_URL points at a Cloudflare Tunnel pointing
// back at the dev Mac running ollama serve.
//
// CRITICAL: every request includes `think: false`. Without it, Gemma 4 emits a
// long reasoning trace into a `thinking` field and burns the num_predict budget
// before producing tool_calls. See docs/GEMMA_INTEGRATION.md.

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

const DEFAULT_ENDPOINT = "http://localhost:11434";
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

function endpoint() {
  return process.env.GEMMA_ENDPOINT_URL || DEFAULT_ENDPOINT;
}
function model() {
  return process.env.GEMMA_MODEL || DEFAULT_MODEL;
}

async function chat(body: Record<string, unknown>): Promise<OllamaResponse> {
  const url = `${endpoint()}/api/chat`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: false, think: false }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Gemma endpoint ${r.status}: ${text.slice(0, 300)}`);
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

const INTAKE_SYSTEM = [
  "You are the intake parser for Saathi, a CRM tool for Indian small businesses.",
  "Output exactly one tool call. No prose. No explanation.",
  "Owner languages may be Telugu, Hindi, English, or code-mixed. Preserve the customer's name and notes in the original language used.",
  "Strip honorifics like 'sir', 'garu', 'ji', 'anna' from the name field; address style belongs in tone, not the record.",
  "Extract the license plate from the transcript if mentioned (Indian plates look like TS09EX1234, KA01AB9999, etc.). Also extract from the photo if visible. If neither has a plate, omit the field. Never invent.",
  "Set preferred_language to the language hint passed by the caller, unless the transcript text is overwhelmingly in a different script (Telugu script => te, Devanagari => hi, otherwise Latin => en).",
  "Use customer.update only when knownCustomers contains a clear match by phone, plate, or near-identical name. Otherwise customer.create.",
  "Never invent phone numbers, prices, or dates not present in the input. Omit absent fields rather than writing 'N/A', null, or empty strings.",
].join(" ");

export const gemmaAdapter: AIAdapter = {
  async parseIntake(input: ParseIntakeInput): Promise<ParseIntakeResult> {
    const userText = [
      `Owner transcript (${input.language}): ${input.transcript}`,
      `knownCustomers: ${JSON.stringify(input.knownCustomers)}`,
    ].join("\n");

    const userContent: unknown =
      input.photoBase64
        ? [
            { type: "text", text: userText },
          ]
        : userText;

    const messageBody: Record<string, unknown> = {
      role: "user",
      content: userContent,
    };
    if (input.photoBase64) {
      // Ollama accepts images as a sibling array on the message.
      (messageBody as Record<string, unknown>).images = [input.photoBase64];
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
        `Gemma 4 returned no tool_call. content=${JSON.stringify(
          r.message?.content || ""
        ).slice(0, 200)}`
      );
    }

    const name = tc.function.name.replace(/_/g, ".");
    if (name !== "customer.create" && name !== "customer.update") {
      throw new Error(`Unexpected tool: ${tc.function.name}`);
    }

    const args = tc.function.arguments as
      | CustomerCreateArgs
      | (CustomerCreateArgs & { customer_id: string });

    const toolCall: IntakeToolCall =
      name === "customer.create"
        ? { name: "customer.create", arguments: args as CustomerCreateArgs }
        : {
            name: "customer.update",
            arguments: {
              customer_id: (args as { customer_id: string }).customer_id,
              visit: (args as CustomerCreateArgs).visit,
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
      throw new Error("Gemma 4 returned empty content for draftFollowup");
    }
    return { text, meta: metaFrom(r) };
  },
};
