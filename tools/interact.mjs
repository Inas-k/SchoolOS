import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://getskooly.com';
const ROOT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly';
const R = ROOT + '/01-recon', E = ROOT + '/02-extraction';
fs.mkdirSync(R + '/screenshots/interaction-states', { recursive: true });
const strip = (h) => h.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>');
const map = { route: '/', interactions: [], unreached: [] };
const out = {};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const shot = async (slug) => { const p = `${R}/screenshots/interaction-states/home--${slug}.png`; await page.screenshot({ path: p }); return p; };
const rec = (slug, trigger, kind, reveals, captured = true) => map.interactions.push({ action_slug: slug, trigger, kind, reveals, screenshot: `01-recon/screenshots/interaction-states/home--${slug}.png`, captured });

// --- chat widget (DOM present at load)
out.chat = strip(await page.evaluate(() => document.querySelector('[role=dialog]')?.parentElement?.outerHTML ?? null) ?? '');
out.chatBtn = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /chat with us/i.test(x.innerText)); return b ? { cls: b.className, html: b.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>'), rect: b.getBoundingClientRect().toJSON() } : null; });
await shot('chat-initial');

// --- header dropdowns
for (const label of ['Features', 'Pricing']) {
  const btn = page.locator('header nav button', { hasText: label }).first();
  await btn.click(); await page.waitForTimeout(450);
  const dd = await page.evaluate((label) => {
    const b = [...document.querySelectorAll('header nav button')].find((x) => x.innerText.trim() === label);
    const wrap = b.parentElement; const panel = [...wrap.children].find((c) => c !== b);
    if (!panel) return null;
    const cs = getComputedStyle(panel); const r = panel.getBoundingClientRect();
    return { html: panel.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>'), cls: panel.className, rect: r.toJSON(), style: { bg: cs.backgroundColor, radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.border, anim: cs.animation, opacity: cs.opacity, transform: cs.transform, transition: cs.transition }, chev: wrap.querySelector('svg')?.getAttribute('class') };
  }, label);
  out['dropdown_' + label] = dd;
  const p = await shot('open-' + label.toLowerCase() + '-menu');
  rec('open-' + label.toLowerCase() + '-menu', `header nav button:${label}`, 'click', dd ? ['dropdown panel'] : [], !!dd);
  await page.keyboard.press('Escape'); await page.mouse.click(5, 600); await page.waitForTimeout(300);
}

// --- header scrolled state
await page.evaluate(() => scrollTo(0, 400)); await page.waitForTimeout(500);
out.headerScrolled = await page.evaluate(() => { const h = document.querySelector('header'); const cs = getComputedStyle(h); return { cls: h.className, borderColor: cs.borderBottomColor, shadow: cs.boxShadow, bg: cs.backgroundColor }; });
await shot('header-scrolled'); rec('header-scrolled', 'header', 'scroll', ['border-color + shadow appear']);
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);

// --- hero switcher: click Preschool
const preBtn = page.locator('button[aria-label="Preschool"]').first();
const before = await page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy],button[aria-label=Preschool]')].map((b) => ({ l: b.getAttribute('aria-label'), cls: b.className, pressed: b.getAttribute('aria-pressed') })));
await preBtn.scrollIntoViewIfNeeded(); await preBtn.click({ force: true }); await page.waitForTimeout(800);
const after = await page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy],button[aria-label=Preschool]')].map((b) => ({ l: b.getAttribute('aria-label'), cls: b.className, pressed: b.getAttribute('aria-pressed') })));
out.heroSwitch = { before, after };
await shot('hero-switch-preschool'); rec('hero-switch-preschool', 'button[aria-label=Preschool]', 'click', ['dashboard cards swap stack order']);
// auto-rotate?
await page.waitForTimeout(7000);
out.heroAutoAfter7s = await page.evaluate(() => [...document.querySelectorAll('button[aria-label=Academy],button[aria-label=Preschool]')].map((b) => b.getAttribute('aria-pressed')));

// --- hover states (computed delta)
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
const hov = {};
for (const [name, sel] of [['primaryBtn', 'main a[href*="register"]'], ['secondaryBtn', 'main a[href="/demo/"]'], ['navAcademy', 'header nav a[href="/academy/"]'], ['headerCta', 'header a[href*="register"]'], ['langPill', 'header span.rounded-full']]) {
  const el = page.locator(sel).first();
  const read = () => el.evaluate((e) => { const c = getComputedStyle(e); return { color: c.color, bg: c.backgroundColor, border: c.borderTopColor, shadow: c.boxShadow, transform: c.transform, transition: c.transition }; });
  const a = await read(); await el.hover(); await page.waitForTimeout(400); const b = await read();
  hov[name] = { rest: a, hover: b };
  await page.mouse.move(5, 5);
}
out.hover = hov;

// --- scroll reveal thresholds + counters
await page.evaluate(() => scrollTo(0, 0)); await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(500);
out.statsAtLoad = await page.evaluate(() => [...document.querySelectorAll('.stat-line > div:first-child')].map((e) => e.innerText));
await page.evaluate(() => { const el = document.querySelector('.stat-line'); el.scrollIntoView({ block: 'center' }); });
const samples = [];
for (let i = 0; i < 12; i++) { await page.waitForTimeout(150); samples.push(await page.evaluate(() => [...document.querySelectorAll('.stat-line > div:first-child')].map((e) => e.innerText).join(' | '))); }
out.statCountUp = samples;
// IntersectionObserver params: find first reveal off-screen and see when it flips
out.revealTiming = await page.evaluate(async () => {
  scrollTo(0, 0); await new Promise((r) => setTimeout(r, 300));
  const els = [...document.querySelectorAll('.scroll-reveal')];
  const target = els.find((e) => e.getBoundingClientRect().top > innerHeight + 200 && !e.classList.contains('is-visible')) || els[10];
  const res = [];
  for (let y = 0; y < document.documentElement.scrollHeight; y += 40) {
    scrollTo(0, y); await new Promise((r) => setTimeout(r, 30));
    if (target.classList.contains('is-visible')) { res.push({ scrollY: y, rectTop: Math.round(target.getBoundingClientRect().top), vh: innerHeight, h: Math.round(target.getBoundingClientRect().height) }); break; }
  }
  return res;
});

// --- language select
out.langOptions = await page.evaluate(() => [...document.querySelectorAll('header select option')].map((o) => [o.value, o.textContent]));

// --- mobile menu
const m = await browser.newContext({ viewport: { width: 375, height: 667 } });
const mp = await m.newPage();
await mp.goto(BASE + '/', { waitUntil: 'networkidle' }); await mp.waitForTimeout(1000);
await mp.locator('button[aria-label="Toggle menu"]').click(); await mp.waitForTimeout(600);
await mp.screenshot({ path: `${R}/screenshots/interaction-states/home--mobile-menu-open.png` });
out.mobileMenu = await mp.evaluate(() => { const h = document.querySelector('header'); const panel = [...h.children].find((c) => c.tagName === 'DIV' && !c.className.includes('max-w-7xl')) ?? h.lastElementChild; return { html: h.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 9000) }; });
rec('mobile-menu-open', 'button[aria-label="Toggle menu"]', 'click', ['mobile nav panel']);
await mp.screenshot({ path: `${R}/screenshots/interaction-states/home--mobile-menu-open.png` });
await m.close();

fs.writeFileSync(R + '/interaction-map.json', JSON.stringify(map, null, 2));
fs.writeFileSync(E + '/fragments/home.interactions.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ heroSwitch: out.heroSwitch, auto: out.heroAutoAfter7s, statsAtLoad: out.statsAtLoad, statCountUp: out.statCountUp, revealTiming: out.revealTiming, headerScrolled: out.headerScrolled, hover: out.hover }, null, 1));
await browser.close();
