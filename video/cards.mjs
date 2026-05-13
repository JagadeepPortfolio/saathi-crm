// Render the title and outro cards to PNG at 1920x1080.
// Uses Saathi Saffron tokens: bg #FFF8EE, primary #F6A623, text #1B1B1F.

import { chromium } from "playwright";

const cards = [
  {
    file: "video/assets/shot1_title.png",
    html: `<!doctype html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,Helvetica,Arial,sans-serif}
      body{width:1920px;height:1080px;background:#FFF8EE;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1B1B1F}
      .mark{font-size:180px;font-weight:800;letter-spacing:-4px;line-height:1}
      .sub{margin-top:36px;font-size:48px;color:#6B6B72;font-weight:400}
      .accent{display:inline-block;width:160px;height:8px;background:#F6A623;margin-top:60px;border-radius:4px}
    </style></head><body>
      <div class="mark">Saathi</div>
      <div class="sub">A small detailing studio in Hyderabad</div>
      <div class="accent"></div>
    </body></html>`,
  },
  {
    file: "video/assets/shot9_outro.png",
    html: `<!doctype html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,Helvetica,Arial,sans-serif}
      body{width:1920px;height:1080px;background:#FFF8EE;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1B1B1F}
      .mark{font-size:200px;font-weight:800;letter-spacing:-4px;line-height:1}
      .accent{display:inline-block;width:200px;height:10px;background:#F6A623;margin-top:48px;border-radius:5px}
      .line{margin-top:64px;font-size:42px;color:#1B1B1F;text-align:center;font-weight:500;max-width:1400px;line-height:1.35}
      .small{margin-top:36px;font-size:28px;color:#6B6B72}
    </style></head><body>
      <div class="mark">Saathi</div>
      <div class="accent"></div>
      <div class="line">Built on Gemma 4. For the 63 million Indian small businesses still locked out of CRM.</div>
      <div class="small">github.com/JagadeepPortfolio/saathi-crm</div>
    </body></html>`,
  },
  {
    file: "video/assets/shot8_owner_caption.png",
    html: `<!doctype html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,Helvetica,Arial,sans-serif}
      body{width:1920px;height:200px;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;color:white;padding:0 80px}
      .line{font-size:46px;font-weight:500;text-align:center;line-height:1.3}
    </style></head><body>
      <div class="line">Ramesh, the shop owner. He runs his business in Telugu, on his phone.</div>
    </body></html>`,
  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const c of cards) {
    const ctx = await browser.newContext({
      viewport: c.file.includes("owner_caption")
        ? { width: 1920, height: 200 }
        : { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.setContent(c.html);
    await page.waitForTimeout(120);
    await page.screenshot({
      path: c.file,
      type: "png",
      omitBackground: c.file.includes("owner_caption"),
    });
    await ctx.close();
    console.log(`rendered ${c.file}`);
  }
  await browser.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
