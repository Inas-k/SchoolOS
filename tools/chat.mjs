import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = 'https://getskooly.com';
const E = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly/02-extraction';
const out = {};
const browser = await chromium.launch();

// A: no interaction, wait 40s
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const t0 = Date.now(); let openedAt = null;
  while (Date.now() - t0 < 45000) { await p.waitForTimeout(500); if (await p.evaluate(() => !!document.querySelector('[role=dialog]'))) { openedAt = Date.now() - t0; break; } }
  out.idleOpenMs = openedAt;
  await ctx.close();
}
// B: scroll to various depths
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1000);
  const trace = [];
  for (let y = 0; y < 8000; y += 200) {
    await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(120);
    const open = await p.evaluate(() => !!document.querySelector('[role=dialog]'));
    trace.push([y, open]); if (open) break;
  }
  out.scrollOpenAt = trace[trace.length - 1];
  out.docH = await p.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();
}
// C: panel markup
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.locator('button[aria-label="Questions? Chat with us"]').click(); await p.waitForTimeout(700);
  out.chatHtml = await p.evaluate(() => document.querySelector('[role=dialog]').closest('.fixed').outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>'));
  out.chatInputs = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] input,[role=dialog] select,[role=dialog] textarea,[role=dialog] button')].map((e) => { const c = getComputedStyle(e); return { tag: e.tagName, type: e.type, name: e.name, ph: e.placeholder, label: e.getAttribute('aria-label'), cls: e.className, fs: c.fontSize, bg: c.backgroundColor, border: c.border, radius: c.borderRadius, h: e.getBoundingClientRect().height, color: c.color }; }));
  out.chatTransition = await p.evaluate(() => { const d = document.querySelector('[role=dialog]'); const c = getComputedStyle(d); return { cls: d.className, anim: c.animationName, dur: c.animationDuration, tr: c.transition }; });
  await ctx.close();
}
fs.writeFileSync(E + '/fragments/home.chat.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ idleOpenMs: out.idleOpenMs, scrollOpenAt: out.scrollOpenAt, docH: out.docH, chatTransition: out.chatTransition }, null, 1));
console.log(out.chatHtml);
await browser.close();
