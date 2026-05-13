// Render a Kaggle Writeup cover image at 1920x1080.
// Saathi Saffron tokens, hero treatment: wordmark + subtitle + tagline + accent.

import { chromium } from "playwright";

const OUT = "docs/screenshots/cover.png";

async function main() {
  const browser = await chromium.launch({ headless: true });
  // Render at 2x for sharpness, output is 560x280 effective.
  const W = 560;
  const H = 280;
  const SCALE = 3;
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
  });
  const page = await ctx.newPage();
  const html = `<!doctype html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
    body{
      width:${W}px;height:${H}px;background:#FFF8EE;color:#1B1B1F;
      display:flex;align-items:center;
      position:relative;overflow:hidden;padding:0 38px;
    }
    .glow{
      position:absolute;width:380px;height:380px;border-radius:50%;
      background:radial-gradient(circle, rgba(246,166,35,0.22) 0%, rgba(246,166,35,0) 70%);
      top:-120px;right:-120px;
    }
    .wrap{position:relative;z-index:1}
    .mark{
      font-size:72px;font-weight:800;letter-spacing:-2.5px;line-height:1;margin-bottom:10px;
    }
    .accent{
      width:60px;height:4px;background:#F6A623;border-radius:2px;margin-bottom:14px;
    }
    .sub{
      font-size:21px;font-weight:600;color:#1B1B1F;line-height:1.25;margin-bottom:9px;
    }
    .tag{
      font-size:14px;color:#6B6B72;font-weight:400;line-height:1.45;max-width:430px;
    }
    .badge{
      position:absolute;top:18px;right:24px;z-index:2;
      padding:4px 10px;background:rgba(246,166,35,0.20);
      color:#8A5A00;font-size:10px;font-weight:700;letter-spacing:0.06em;
      border-radius:999px;text-transform:uppercase;
    }
  </style></head><body>
    <div class="glow"></div>
    <div class="badge">Gemma 4 · Digital Equity</div>
    <div class="wrap">
      <div class="mark">Saathi</div>
      <div class="accent"></div>
      <div class="sub">Voice-first CRM for Indian MSMEs, built on Gemma 4</div>
      <div class="tag">A 10-second Telugu voice note becomes a tracked customer and an AI-drafted WhatsApp follow-up. Apache 2.0. $0 per shop, per month.</div>
    </div>
  </body></html>`;
  await page.setContent(html);
  await page.waitForTimeout(150);
  // Screenshot at full DPR, then resize down to 560x280 with ffmpeg for crispness
  await page.screenshot({ path: OUT + ".hi.png", type: "png" });
  await browser.close();
  // Downscale to exactly 560x280 using ffmpeg lanczos
  const { execSync } = await import("node:child_process");
  execSync(`ffmpeg -y -loglevel error -i "${OUT}.hi.png" -vf "scale=${W}:${H}:flags=lanczos" "${OUT}"`);
  execSync(`rm -f "${OUT}.hi.png"`);
  console.log(`rendered ${OUT} at ${W}x${H} (from ${W * SCALE}x${H * SCALE} render)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
