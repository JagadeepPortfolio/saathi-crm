// Captures the Draft Review screen (options state and review state with tool-call trace).
// Runs a real Gemma 4 draftFollowup call, so takes 10–15s end-to-end.

import { chromium } from "playwright";

const OUT = "video/assets";
const BASE = "http://localhost:3000";
const VIEWPORT = { width: 390, height: 844 };
const DSF = 2;

async function findCustomerWithPhone(page) {
  await page.goto(`${BASE}/customers`, { waitUntil: "networkidle" });
  const paths = await page.$$eval('a[href^="/customers/"]', (els) =>
    Array.from(
      new Set(els.map((e) => e.getAttribute("href")).filter((h) => h && h.length > 12))
    )
  );

  for (const p of paths) {
    const id = p.split("/").pop();
    try {
      const r = await page.request.get(`${BASE}/api/customers/${id}`);
      if (!r.ok()) continue;
      const json = await r.json();
      if (json.customer?.phone) {
        console.log(`found customer with phone: ${json.customer.name} (${id})`);
        return { id, customer: json.customer };
      }
    } catch {}
  }
  return null;
}

async function main() {
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
  page.on("console", (m) => {
    if (m.type() === "error") console.log("page error:", m.text());
  });

  const found = await findCustomerWithPhone(page);
  if (!found) {
    console.error("No customer has a phone number — cannot capture draft flow.");
    console.error("Fix: open a customer in the UI and add a phone, then rerun.");
    await browser.close();
    process.exit(2);
  }

  // 1. Options state on draft page (demo mode)
  await page.goto(`${BASE}/customers/${found.id}/draft?demo=1`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/shot6c_draft_options.png` });
  console.log("captured shot6c_draft_options");

  // 2. Click Draft (button is just labelled "Draft" in the sticky footer)
  const draftBtn = page.getByRole("button", { name: /^draft$/i }).first();
  if (!(await draftBtn.isVisible({ timeout: 3000 }))) {
    console.error("Draft button not visible on /draft page");
    await browser.close();
    process.exit(3);
  }
  await draftBtn.click();
  console.log("clicked Draft — waiting for Gemma...");

  // Wait for the review state to render. The draft step has 3 ticks then lands on review.
  // Gemma typically returns in 6–10s. Generous timeout.
  await page.waitForFunction(
    () => {
      const html = document.body.innerText.toLowerCase();
      return html.includes("send") && !html.includes("drafting");
    },
    { timeout: 60_000 }
  );
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${OUT}/shot6d_draft_review.png` });
  console.log("captured shot6d_draft_review");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
