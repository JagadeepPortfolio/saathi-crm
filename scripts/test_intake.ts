/**
 * Integration test for Flow 1 (intake) — calls the orchestrator directly,
 * verifies Storage upload + DB rows. Skips the HTTP layer.
 *
 *   npx tsx scripts/test_intake.ts
 *
 * Side effect: this WRITES rows to the live Supabase pilot project.
 */

import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

config({ path: ".env.local" });

import { runIntake } from "@/lib/intake";
import { db } from "@/lib/db/client";

async function main() {
  console.log("Loading samples...");
  const audio = await readFile(resolve("samples/ramesh_te.m4a"));
  const photo = await readFile(resolve("samples/swift.jpg"));
  console.log(`  audio: ${(audio.length / 1024).toFixed(1)} KB`);
  console.log(`  photo: ${(photo.length / 1024).toFixed(1)} KB`);

  console.log("\nRunning runIntake()...");
  const t0 = Date.now();
  const result = await runIntake({
    audioBytes: audio,
    audioContentType: "audio/m4a",
    photoBytes: photo,
    photoContentType: "image/png",
    language: "te",
  });
  const totalMs = Date.now() - t0;

  console.log(`\nDone in ${totalMs}ms`);
  console.log(`  asr_ms:  ${result.asrMs}`);
  console.log(`  gemma_ms: ${result.parseMeta.ms}`);
  console.log(`  tool:    ${result.parseToolCall.name}`);
  console.log("\nTranscript:");
  console.log(`  ${result.transcript}`);
  console.log("\nCustomer record:");
  console.log(`  id:     ${result.customer.id}`);
  console.log(`  name:   ${result.customer.name}`);
  console.log(`  phone:  ${result.customer.phone ?? "(none)"}`);
  console.log(`  lang:   ${result.customer.preferred_language}`);
  console.log(`  visits: ${result.customer.visit_count}`);
  if (result.car) {
    console.log("\nCar:");
    console.log(`  id:     ${result.car.id}`);
    console.log(`  plate:  ${result.car.license_plate ?? "(none)"}`);
    console.log(`  make:   ${result.car.make ?? "?"}  model: ${result.car.model ?? "?"}  color: ${result.car.color ?? "?"}`);
  }
  console.log("\nVisit:");
  console.log(`  id:        ${result.visit.id}`);
  console.log(`  services:  ${JSON.stringify(result.visit.services)}`);
  console.log(`  amount:    ₹${result.visit.amount_inr}`);
  console.log(`  notes:     ${result.visit.notes ?? "(none)"}`);
  console.log(`  next_hint: ${result.visit.next_visit_hint ?? "(none)"}`);

  // Quality assertions — fail loudly if regressions return.
  console.log("\n--- assertions ---");
  const checks = [
    { label: "name non-empty", ok: result.customer.name.length > 0 },
    {
      label: "name has no car-make tokens",
      ok: !/\b(swift|baleno|city|creta|honda|maruti|hyundai|tata|kia|mahindra|brezza|dzire)\b/i.test(
        result.customer.name
      ),
    },
    {
      label: "name has no honorifics",
      ok: !/\b(sir|garu|ji|anna|bhai|akka)\b/i.test(result.customer.name),
    },
    {
      label: "services has no status words",
      ok: !result.visit.services.some((s) =>
        /\b(paid|complaint|compliant|smell|stain|advance|due|wax)\b/i.test(s)
      ),
    },
    {
      label: "license plate matches Indian regex (if present)",
      ok:
        !result.car?.license_plate ||
        /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(result.car.license_plate),
    },
    { label: "phone is null or starts with +91", ok: !result.customer.phone || result.customer.phone.startsWith("+91") },
    { label: "amount > 0", ok: result.visit.amount_inr > 0 },
    { label: "preferred_language = te", ok: result.customer.preferred_language === "te" },
  ];
  let failed = 0;
  for (const c of checks) {
    console.log(`  ${c.ok ? "✓" : "✗"} ${c.label}`);
    if (!c.ok) failed++;
  }

  console.log("\n--- DB sanity ---");
  const { count: customerCount } = await db()
    .from("customers")
    .select("*", { count: "exact", head: true });
  console.log(`  customers in DB: ${customerCount}`);

  const { count: visitCount } = await db()
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", result.customer.id);
  console.log(`  visits for ${result.customer.name}: ${visitCount}`);

  if (failed > 0) {
    console.log(`\n${failed} assertion(s) failed. Iterate the prompt or schema.`);
    process.exit(1);
  }
  console.log("\nAll Day 3 assertions green.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
