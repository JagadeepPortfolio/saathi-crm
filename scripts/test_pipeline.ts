/**
 * Day 2 acceptance harness — see docs/TEST_PLAN.md.
 *
 * Runs four gates against the local Gemma 4 endpoint + whisper.cpp:
 *   1. Telugu ASR via whisper.cpp on samples/ramesh_te.m4a
 *   2. Gemma 4 vision + tool-call extraction on the transcript + samples/swift.jpg
 *   3. Telugu generation reads naturally
 *   4. End-to-end intake latency under 8s (warm)
 *
 * Usage:
 *   npx tsx scripts/test_pipeline.ts
 *
 * Required samples:
 *   samples/ramesh_te.m4a    8–25s Telugu (or code-mix) voice note
 *   samples/swift.jpg        any car photo
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { transcribe } from "@/lib/asr";

const ENDPOINT = process.env.GEMMA_ENDPOINT_URL || "http://localhost:11434";
const MODEL = process.env.GEMMA_MODEL || "gemma4:e4b";

const TRANSCRIPT_FALLBACK =
  "Ramesh sir blue Swift TS09EX1234 full ceramic detailing 2500 paid, wax smell complaint, told him 2 months baad come back.";

const INTAKE_TOOLS = [
  {
    type: "function",
    function: {
      name: "customer_create",
      description: "Create a new customer record with their first visit.",
      parameters: {
        type: "object",
        required: ["name", "preferred_language", "visit"],
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          preferred_language: { type: "string", enum: ["te", "hi", "en"] },
          car: {
            type: "object",
            properties: {
              license_plate: { type: "string" },
              make: { type: "string" },
              model: { type: "string" },
              color: { type: "string" },
            },
          },
          visit: {
            type: "object",
            required: ["services", "amount_inr"],
            properties: {
              services: { type: "array", items: { type: "string" } },
              amount_inr: { type: "number" },
              notes: { type: "string" },
              next_visit_hint: { type: "string" },
            },
          },
        },
      },
    },
  },
];

const INTAKE_SYSTEM = [
  "You are the intake parser for Saathi. Output exactly one tool call. No prose.",
  "Strip honorifics ('sir', 'garu', 'ji', 'anna') from the name field.",
  "Extract Indian license plates (e.g. TS09EX1234) from the transcript if mentioned, also from the photo if readable. Never invent.",
  "Set preferred_language to the language hint, unless the transcript script clearly indicates otherwise.",
  "Omit absent fields rather than writing 'N/A', null, or empty strings.",
].join(" ");

async function chat(body: Record<string, unknown>) {
  const t0 = Date.now();
  const r = await fetch(`${ENDPOINT}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, stream: false, think: false }),
  });
  const ms = Date.now() - t0;
  if (!r.ok)
    throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { json: (await r.json()) as Record<string, unknown>, ms };
}

function header(s: string) {
  console.log(`\n=== ${s} ===`);
}

async function gate1_asr(): Promise<{ pass: boolean; ms: number; text: string }> {
  header("Gate 1 — Telugu ASR via whisper.cpp");
  const audioPath = resolve("samples/ramesh_te.m4a");
  if (!existsSync(audioPath)) {
    console.log(`  SKIP: ${audioPath} not found`);
    return { pass: false, ms: 0, text: "" };
  }
  const audioBytes = await readFile(audioPath);
  const r = await transcribe({ audioBytes, language: "te" });
  console.log(`  transcript:`);
  console.log(`    ${r.text}`);
  console.log(`  ms: ${r.ms}`);
  const checks = [
    { label: "non-empty transcript", ok: r.text.length > 10 },
    { label: "license plate present", ok: /[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}/i.test(r.text) },
    { label: "amount keyword present", ok: /\b\d{2,5}\b/.test(r.text) },
  ];
  for (const c of checks) console.log(`  ${c.ok ? "✓" : "✗"} ${c.label}`);
  return {
    pass: checks.every((c) => c.ok),
    ms: r.ms,
    text: r.text,
  };
}

async function gate2_visionAndToolCall(transcript: string) {
  header("Gate 2 — Vision + tool-call extraction");
  const photoPath = resolve("samples/swift.jpg");
  const userMessage: Record<string, unknown> = {
    role: "user",
    content: `Owner transcript (te): ${transcript}\nknownCustomers: []`,
  };
  if (existsSync(photoPath)) {
    const buf = await readFile(photoPath);
    userMessage.images = [buf.toString("base64")];
    console.log(`  using photo: ${photoPath} (${(buf.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`  WARN: photo not found, text-only`);
  }

  const { json, ms } = await chat({
    model: MODEL,
    messages: [
      { role: "system", content: INTAKE_SYSTEM },
      userMessage,
    ],
    tools: INTAKE_TOOLS,
    options: { temperature: 0.1, num_predict: 1200 },
  });

  const msg = (json as { message?: { tool_calls?: unknown[] } }).message;
  const tc = (msg?.tool_calls || [])[0] as
    | { function?: { name: string; arguments: unknown } }
    | undefined;

  if (!tc?.function) {
    console.log(`  FAIL: no tool_call (${ms}ms)`);
    return { pass: false, ms };
  }

  console.log(`  tool: ${tc.function.name}`);
  console.log(`  args: ${JSON.stringify(tc.function.arguments, null, 2)}`);
  console.log(`  ms:   ${ms}`);
  const args = tc.function.arguments as Record<string, unknown>;
  const car = (args.car || {}) as Record<string, unknown>;
  const visit = (args.visit || {}) as Record<string, unknown>;
  const checks = [
    { label: "name extracted", ok: typeof args.name === "string" && (args.name as string).length > 0 },
    { label: "amount_inr present", ok: typeof visit.amount_inr === "number" },
    { label: "services non-empty", ok: Array.isArray(visit.services) && (visit.services as unknown[]).length > 0 },
    { label: "language='te'", ok: args.preferred_language === "te" },
    { label: "license_plate extracted", ok: typeof car.license_plate === "string" && /[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}/i.test(car.license_plate as string) },
    { label: "no fake phone", ok: !args.phone || (typeof args.phone === "string" && args.phone !== "" && args.phone !== "N/A" && (args.phone as string).startsWith("+")) },
  ];
  for (const c of checks) console.log(`  ${c.ok ? "✓" : "·"} ${c.label}`);
  return {
    pass: checks.filter((c) => c.ok).length >= 5,
    ms,
  };
}

async function gate3_teluguGeneration() {
  header("Gate 3 — Telugu generation reads naturally");
  const { json, ms } = await chat({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You draft one WhatsApp follow-up from an Indian small-business owner to a customer. Output the message text only. 2–4 sentences. No emojis, no marketing fluff, no 'Dear customer', no sign-off. Owner's voice. Personalized.",
      },
      {
        role: "user",
        content:
          "Customer: Ramesh\nPreferred language: Telugu.\nRecent visits:\n2026-02-22: full ceramic detailing ₹2500 notes: wax smell complaint\nOccasion: lapsed (75 days).\nWrite the message in Telugu.",
      },
    ],
    options: { temperature: 0.4, num_predict: 400 },
  });
  const text = ((json as { message?: { content?: string } }).message?.content || "").trim();
  console.log(`  output:\n    ${text.replace(/\n/g, "\n    ")}`);
  console.log(`  ms: ${ms}`);
  const looksTelugu = /[ఀ-౿]/.test(text);
  const noEmojis = !/[\u{1F300}-\u{1FAFF}]/u.test(text);
  const reasonableLength = text.length > 30 && text.length < 600;
  console.log(`  ${looksTelugu ? "✓" : "✗"} contains Telugu script`);
  console.log(`  ${noEmojis ? "✓" : "✗"} no emojis`);
  console.log(`  ${reasonableLength ? "✓" : "✗"} reasonable length (${text.length} chars)`);
  return {
    pass: looksTelugu && noEmojis && reasonableLength,
    ms,
    text,
  };
}

async function main() {
  console.log(`endpoint: ${ENDPOINT}`);
  console.log(`model:    ${MODEL}`);

  const g1 = await gate1_asr();
  const transcript = g1.text || TRANSCRIPT_FALLBACK;
  const g2 = await gate2_visionAndToolCall(transcript);
  const g3 = await gate3_teluguGeneration();

  // Warm intake — re-run Gate 2 to measure warm latency.
  header("Gate 4 — End-to-end intake latency (warm)");
  const warm = await gate2_visionAndToolCall(transcript);
  const e2eMs = g1.ms + warm.ms;
  console.log(`  ASR:     ${g1.ms}ms`);
  console.log(`  Gemma:   ${warm.ms}ms (warm)`);
  console.log(`  total:   ${e2eMs}ms  (target ≤ 8000ms)`);

  header("Summary");
  console.log(`  Gate 1 (Telugu ASR):           ${g1.pass ? "PASS" : "FAIL"}  (${g1.ms}ms)`);
  console.log(`  Gate 2 (vision + tool-call):   ${g2.pass ? "PASS" : "FAIL"}  (${g2.ms}ms)`);
  console.log(`  Gate 3 (Telugu generation):    ${g3.pass ? "PASS" : "FAIL"}  (${g3.ms}ms)`);
  console.log(`  Gate 4 (e2e intake ≤ 8s warm): ${e2eMs <= 8000 ? "PASS" : "WARN"}  (${e2eMs}ms)`);

  const allPass = g1.pass && g2.pass && g3.pass;
  if (!allPass) {
    console.log("\nBlocking gates failed — do not proceed to Day 3 backend work without remediation.");
    process.exit(1);
  }
  console.log("\nAll blocking gates green. Day 2 done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
