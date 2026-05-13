// Render each subtitle line as a PNG, sized for an 1920x1080 video.
// Output: video/assets/sub_NN.png  (transparent background outside the box).
// The accompanying timing data is in this file too — keeps a single source of truth.

import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const SUBS = [
  { id: "01", start: 0.5, end: 7.8,  text: "A small detailing studio in Hyderabad. The owner serves about fifteen customers a week, and forgets most of them within a month." },
  { id: "02", start: 8.0, end: 14.8, text: "Saathi is a CRM that lives on his phone. No app store, no SaaS subscription, no English forms." },
  { id: "03", start: 15.2, end: 29.4, text: "Owner's voice (Telugu code-mix): “Ramesh sir, blue Swift TS09EX1234, full ceramic detailing, two thousand five hundred paid, complained about wax smell, come back in two months.”" },
  { id: "04", start: 30.0, end: 37.8, text: "That voice goes to whisper.cpp for Telugu transcription. The transcript and the car photo go to Gemma 4." },
  { id: "05", start: 38.0, end: 41.8, text: "A real Gemma 4 function call." },
  { id: "06", start: 42.0, end: 54.8, text: "Two days later, one tap drafts a Telugu follow-up. Gemma 4 reads the visit history and writes in the owner's voice, not in marketing voice." },
  { id: "07", start: 55.0, end: 64.8, text: "He approves, and sends. Through the WhatsApp Business API. To a real customer." },
  { id: "08", start: 65.5, end: 79.5, text: "Ramesh, the shop owner. He runs his business in Telugu, on his phone. With Saathi, his CRM does the same." },
  { id: "09", start: 80.5, end: 89.5, text: "Saathi. Built on Gemma 4. For the 63 million Indian small businesses still locked out of CRM." },
];

const W = 1800;
const PADX = 36;
const PADY = 18;

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const s of SUBS) {
    const ctx = await browser.newContext({
      viewport: { width: W, height: 240 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const html = `<!doctype html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:Helvetica,Arial,sans-serif}
      html,body{background:transparent}
      .wrap{display:flex;justify-content:center;align-items:center;min-height:240px;padding:0 ${PADX}px}
      .bubble{background:rgba(0,0,0,0.78);color:#fff;font-size:32px;line-height:1.32;font-weight:500;padding:${PADY}px ${PADX}px;border-radius:8px;text-align:center;max-width:${W - 2 * PADX}px}
    </style></head><body>
      <div class="wrap"><div class="bubble">${s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></div>
    </body></html>`;
    await page.setContent(html);
    await page.waitForTimeout(80);
    const bubble = await page.locator(".bubble").first().boundingBox();
    if (!bubble) throw new Error("could not measure bubble");
    // Screenshot only the bubble area so the PNG height matches the actual text height
    await page.screenshot({
      path: `video/assets/sub_${s.id}.png`,
      omitBackground: true,
      clip: {
        x: Math.floor(bubble.x),
        y: Math.floor(bubble.y),
        width: Math.ceil(bubble.width),
        height: Math.ceil(bubble.height),
      },
    });
    await ctx.close();
    console.log(`sub_${s.id}.png  (${Math.round(bubble.width)}x${Math.round(bubble.height)})  t=${s.start}-${s.end}s`);
  }
  await browser.close();

  // Emit the timing list as JSON for the build script
  await writeFile(
    "video/assets/subs_timing.json",
    JSON.stringify(SUBS, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
