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

const INTAKE_SYSTEM = `You are the intake parser for Saathi, a CRM tool for Indian small businesses.

OUTPUT FORMAT — non-negotiable:
- Invoke exactly one of the provided tools (customer.create or customer.update) using the function-calling mechanism.
- There is NO search tool. The caller has already searched and passed the result in knownCustomers. Do not request a search.
- DO NOT write function-call syntax as text in your message content. Use the structured tool call API only.
- DO NOT add prose or explanation around the tool call.
- The model harness will reject any response that puts the call in content text rather than emitting a tool_calls entry.

CORE RULES

1. name = the human customer's first name ONLY, with honorifics ('sir', 'garu', 'ji', 'anna', 'akka', 'bhai') stripped. NEVER include car make/model, color, or any non-name token. If the transcript merges name with a car word (e.g. "RameshSwift" or "AnithaCity"), keep only the human first name.

2. car.make / car.model: Indian-market mapping when the model is mentioned alone:
     Swift, Baleno, Brezza, Dzire, WagonR, Alto, Celerio  → Maruti
     City, Amaze, Jazz, WR-V, Elevate                     → Honda
     Creta, Verna, Venue, i20, i10, Aura                  → Hyundai
     Nexon, Punch, Altroz, Harrier, Safari                → Tata
     Seltos, Sonet, Carens, Carnival                      → Kia
     XUV300, XUV700, Scorpio, Bolero, Thar                → Mahindra
   If only the model is given, set make accordingly. If neither, omit both.

3. car.license_plate: extract from transcript using Indian plate patterns
   (TS09EX1234, KA01AB9999, MH12CD3456 etc — two letters, two digits, one or two letters, four digits).
   Also extract from the photo if visible. Never invent. Omit if absent.

4. visit.services: ONLY actual service names. Examples:
     "full ceramic detailing", "graphene coating", "ppf", "paint correction",
     "interior deep cleaning", "maintenance wash", "sun film", "polish".
   NEVER put status words ("paid", "advance", "due"), complaint words ("complaint",
   "compliant", "smell", "stain"), or honorific filler in services.

5. visit.notes: customer feedback, complaints, observations, special instructions.
   This is where "wax smell complaint", "oil stain remove karne bola",
   "prefers Sunday slots" go — NOT in services.

6. visit.amount_inr: number, not string. If transcript has multiple numbers,
   take the one in payment context ("X paid", "X mein", "X rupees", "₹X").

7. visit.next_visit_hint: timeframe phrase like "2 months", "next week", "after Diwali".
   Parse from "X baad", "X later", "in X", "after X" patterns.

8. preferred_language: defaults to the language hint provided. Override only if the
   transcript script is overwhelmingly different (Telugu glyphs → te, Devanagari → hi).

9. phone: extract Indian phone format (10 digits or +91 prefix). Omit if absent.
   NEVER write "N/A", null, or empty string — just leave the field out.

10. customer.update only when knownCustomers contains a clear match by phone, plate, or near-identical name. Otherwise customer.create.

REFERENCE — for a transcript like "Ramesh sir blue Swift TS09EX1234 full ceramic detailing 2500 paid, wax smell complaint, 2 months baad come back" with empty knownCustomers, the right call is to the customer.create tool with arguments:
- name: "Ramesh" (no "sir")
- preferred_language: "te"
- car: license_plate "TS09EX1234", make "Maruti", model "Swift", color "blue"
- visit: services ["full ceramic detailing"], amount_inr 2500, notes "wax smell complaint", next_visit_hint "2 months"

Notice: name is the human only. "complaint" is in notes, never services. "paid" never in services. Plate extracted by regex. Make inferred from model.`;

export const gemmaAdapter: AIAdapter = {
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
        `Gemma 4 returned no tool_call. content=${JSON.stringify(
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
        `Gemma 4 ${name} missing required visit field. args=${JSON.stringify(
          args
        ).slice(0, 400)}`
      );
    }

    const toolCall: IntakeToolCall =
      name === "customer.create"
        ? { name: "customer.create", arguments: args as unknown as CustomerCreateArgs }
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
      throw new Error("Gemma 4 returned empty content for draftFollowup");
    }
    return { text, meta: metaFrom(r) };
  },
};
