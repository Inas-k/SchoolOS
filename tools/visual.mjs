import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly/06-qa/visual';
fs.mkdirSync(OUT, { recursive: true });
const SITES = { orig: 'https://getskooly.com/', clone: 'http://127.0.0.1:4173/' };
const VPS = { desktop: [1920, 1080], tablet: [768, 1024], mobile: [375, 667] };
const browser = await chromium.launch();
for (const [vp, [w, h]] of Object.entries(VPS)) {
  const heights = {};
  for (const [name, url] of Object.entries(SITES)) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1500)); });
    await p.evaluate(() => document.querySelector('[role=dialog] button[aria-label=Close]')?.click());
    await p.waitForTimeout(500);
    heights[name] = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.screenshot({ path: `${OUT}/${name}-${vp}-fold.png` });
    await p.screenshot({ path: `${OUT}/${name}-${vp}-full.png`, fullPage: true });
    await ctx.close();
  }
  console.log(vp, 'page height orig/clone:', heights.orig, heights.clone, heights.orig === heights.clone ? 'EQUAL' : 'DIFF');
}
await browser.close();
