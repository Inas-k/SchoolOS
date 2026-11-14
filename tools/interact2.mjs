import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://getskooly.com';
const ROOT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly';
const R = ROOT + '/01-recon', E = ROOT + '/02-extraction';
const strip = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>');
const out = {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// ---- hero switch: click the exposed top-right sliver of the back card (y offset -40px => visible above front card)
const rects = await page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy],button[aria-label=Preschool]')].map((b) => ({ l: b.getAttribute('aria-label'), r: b.getBoundingClientRect().toJSON() })));
out.heroRects = rects;
const back = rects.find((x) => x.l === 'Preschool').r;
const state = () => page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy],button[aria-label=Preschool]')].map((b) => ({ l: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed'), cls: b.className.replace(/transition-all duration-500 ease-\[cubic-bezier\(0.22,1,0.36,1\)\]/, '').trim(), tr: getComputedStyle(b).transform, z: getComputedStyle(b).zIndex })));
out.heroBefore = await state();
await page.mouse.move(back.x + back.width / 2, back.y + 8); await page.waitForTimeout(300);
out.heroHoverBackHeader = await page.evaluate(() => { const s = document.querySelector('button[aria-label=Preschool] > span > span:first-child'); return { cls: s.className, bg: getComputedStyle(s).backgroundColor }; });
await page.mouse.click(back.x + back.width / 2, back.y + 8);
await page.waitForTimeout(150);
out.heroMid = await state(); // mid-transition transform
await page.waitForTimeout(800);
out.heroAfter = await state();
await page.screenshot({ path: R + '/screenshots/interaction-states/home--hero-switch-preschool.png' });
// auto-rotate check
await page.waitForTimeout(8000);
out.heroAfter8s = (await state()).map((s) => s.pressed);
// click back to Academy
const rects2 = await page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy]')].map((b) => b.getBoundingClientRect().toJSON()));
await page.mouse.click(rects2[0].x + rects2[0].width / 2, rects2[0].y + 8); await page.waitForTimeout(900);
out.heroBackToAcademy = (await state()).map((s) => s.pressed);

// ---- chat widget
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
await page.locator('button[aria-label="Questions? Chat with us"]').click(); await page.waitForTimeout(700);
await page.screenshot({ path: R + '/screenshots/interaction-states/home--chat-open.png' });
out.chatOpen = await page.evaluate(() => {
  const d = document.querySelector('[role=dialog]'); if (!d) return null;
  const wrap = d.closest('.fixed') || d.parentElement; const cs = getComputedStyle(d);
  return { wrapCls: wrap.className, wrapStyle: wrap.getAttribute('style'), html: wrap.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>'), rect: d.getBoundingClientRect().toJSON(), style: { bg: cs.backgroundColor, radius: cs.borderRadius, shadow: cs.boxShadow, anim: cs.animation, border: cs.border } };
});
// is the button still there while open?
out.chatBtnWhileOpen = await page.evaluate(() => !!document.querySelector('button[aria-label="Questions? Chat with us"]'));
// close
const closeBtn = page.locator('[role=dialog] button[aria-label*="lose" i]').first();
out.closeBtnCount = await closeBtn.count();
if (out.closeBtnCount) { await closeBtn.click(); await page.waitForTimeout(400); }
out.chatClosedDialog = await page.evaluate(() => !!document.querySelector('[role=dialog]'));
// Chat open at first full-page load earlier => check auto-open timing
const p2 = await ctx.newPage();
await p2.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
const seen = [];
for (let i = 0; i < 20; i++) { await p2.waitForTimeout(500); seen.push([(i + 1) * 0.5, await p2.evaluate(() => !!document.querySelector('[role=dialog]'))]); }
out.chatAutoOpenTimeline = seen.filter((s, i, a) => i === 0 || s[1] !== a[i - 1][1]);

// ---- hero dashboard images dims for mock generation (not downloading)
out.heroImg = await page.evaluate(() => [...document.querySelectorAll('main img')].slice(0, 2).map((i) => ({ nw: i.naturalWidth, nh: i.naturalHeight, w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height })));
// orbs / hero gradient rect
out.heroPanel = await page.evaluate(() => { const g = document.querySelector('.rotate-1'); const cs = getComputedStyle(g); return { bgImg: cs.backgroundImage, rect: g.getBoundingClientRect().toJSON(), transform: cs.transform, radius: cs.borderRadius }; });
// "AI copilot" underline
out.aiUnderline = await page.evaluate(() => { const u = document.querySelector('h1 .bg-primary\\/10'); const cs = getComputedStyle(u); return { bg: cs.backgroundColor, h: cs.height, transform: cs.transform, bottom: cs.bottom }; });

fs.writeFileSync(E + '/fragments/home.interactions2.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, chatOpen: out.chatOpen && { ...out.chatOpen, html: undefined } }, null, 1));
await browser.close();
