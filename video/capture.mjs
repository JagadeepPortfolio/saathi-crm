// Headless screen capture for the Saathi demo video.
// Produces stills at 390x844 (iPhone 15 Pro logical) with 2x DPR for retina sharpness.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "video/assets";
const BASE = "http://localhost:3000";

const VIEWPORT = { width: 390, height: 844 };
const DSF = 2;

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DSF,
    permissions: ["microphone", "camera"],
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  });

  const page = await ctx.newPage();

  // shot 2 — Today
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/shot2_today.png`, fullPage: false });
  console.log("captured shot2_today");

  // shot 3a — Record (idle)
  await page.goto(`${BASE}/record`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/shot3_record_idle.png`, fullPage: false });
  console.log("captured shot3_record_idle");

  // shot 6a — Customers list
  await page.goto(`${BASE}/customers`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/shot6a_customers.png`, fullPage: false });
  console.log("captured shot6a_customers");

  // Try clicking the "Lapsed" filter chip if it exists
  try {
    const lapsedBtn = page.getByRole("button", { name: /lapsed/i }).first();
    if (await lapsedBtn.isVisible({ timeout: 1500 })) {
      await lapsedBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/shot6b_lapsed.png`, fullPage: false });
      console.log("captured shot6b_lapsed");
    }
  } catch {
    // ignore — filter chip may not exist or have a different label
  }

  // Find any customer link and grab the first one
  const ids = await page.$$eval('a[href^="/customers/"]', (els) =>
    Array.from(new Set(els.map((e) => e.getAttribute("href")).filter((h) => h && h.length > 12)))
  );
  if (ids.length === 0) {
    console.error("No customer links found on /customers — check seeded data");
    await browser.close();
    process.exit(1);
  }
  const path0 = ids[0];
  console.log(`using customer ${path0}`);

  // shot 6c — Customer Detail
  await page.goto(`${BASE}${path0}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/shot4_customer.png`, fullPage: false });
  await page.screenshot({ path: `${OUT}/shot6c_customer_detail.png`, fullPage: false });
  console.log("captured shot4_customer + shot6c_customer_detail");

  // shot 5 — same screen with ?demo=1 (tool-call trace visible)
  await page.goto(`${BASE}${path0}?demo=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/shot5_demo_trace.png`, fullPage: false });
  console.log("captured shot5_demo_trace");

  // shot 6d — Draft Review modal (tap the Draft button)
  await page.goto(`${BASE}${path0}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  try {
    const draftBtn = page.getByRole("button", { name: /draft/i }).first();
    if (await draftBtn.isVisible({ timeout: 2000 })) {
      await draftBtn.click();
      // Wait for the modal to open and the draft to generate (Gemma ~6-8s)
      await page.waitForTimeout(8000);
      await page.screenshot({ path: `${OUT}/shot6d_draft_review.png`, fullPage: false });
      console.log("captured shot6d_draft_review");
    } else {
      console.warn("Draft button not visible; skipping shot6d");
    }
  } catch (e) {
    console.warn(`shot6d draft modal capture failed: ${e.message}`);
  }

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
