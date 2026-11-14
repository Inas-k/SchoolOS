// Motion parity: compares animation timelines on the original and the clone.
import { chromium } from 'playwright';
import fs from 'node:fs';

const SITES = { orig: 'https://getskooly.com/', clone: process.argv[2] || 'http://127.0.0.1:4173/' };
const browser = await chromium.launch();
const R = {};

for (const [name, url] of Object.entries(SITES)) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForTimeout(150);
  const out = {};

  // 1) animations running right after load: name, duration, delay, easing, fill, iterations, keyframes
  out.load = await page.evaluate(() => document.getAnimations().map((a) => {
    const t = a.effect.getTiming(); const k = a.effect.getKeyframes().map((f) => ({ o: f.offset, op: f.opacity, tr: f.transform }));
    const tgt = a.effect.target;
    return { name: a.animationName || a.transitionProperty, dur: t.duration, delay: t.delay, easing: t.easing, fill: t.fill, iter: String(t.iterations), dir: t.direction, kf: k, el: tgt.tagName + (tgt.className ? '.' + String(tgt.className).split(' ').slice(0, 2).join('.') : '') };
  }).sort((a, b) => (a.el + a.delay).localeCompare(b.el + b.delay)));

  // 2) hero opacity timeline (sampled at fixed offsets from a fresh load)
  await page.reload({ waitUntil: 'domcontentloaded' });
  const t0 = Date.now(); const samples = [];
  while (Date.now() - t0 < 1400) {
    samples.push(await page.evaluate(() => [...document.querySelectorAll('.hero-stagger > *')].map((e) => +(+getComputedStyle(e).opacity).toFixed(2))));
    await page.waitForTimeout(100);
  }
  out.heroFinal = samples[samples.length - 1];

  // 3) scroll reveal: at what scrollY does each .scroll-reveal flip, and which animation + delay it gets
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  out.reveals = await page.evaluate(async () => {
    const els = [...document.querySelectorAll('.scroll-reveal')];
    const flipped = new Map();
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 20) {
      scrollTo(0, y); await new Promise((r) => setTimeout(r, 12));
      els.forEach((e, i) => { if (!flipped.has(i) && e.classList.contains('is-visible')) flipped.set(i, { y, topAtFlip: Math.round(e.getBoundingClientRect().top), delay: e.style.animationDelay, anim: [...e.classList].filter((c) => c.startsWith('animate-')).join() }); });
    }
    return els.map((e, i) => flipped.get(i) || null);
  });
  out.revealCount = out.reveals.length;

  // 4) counters
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(500);
  out.counterStart = await page.evaluate(() => [...document.querySelectorAll('.stat-line > div:first-child')].map((e) => e.innerText));
  await page.evaluate(() => document.querySelector('.stat-line').scrollIntoView({ block: 'center' }));
  const ts = []; const c0 = Date.now();
  while (Date.now() - c0 < 2600) { ts.push([Date.now() - c0, await page.evaluate(() => document.querySelector('.stat-line > div:first-child').innerText)]); await page.waitForTimeout(150); }
  out.counterEnd = await page.evaluate(() => [...document.querySelectorAll('.stat-line > div:first-child')].map((e) => e.innerText));
  out.counterSeries = ts.map((s) => s[1]).filter((v, i, a) => i === 0 || v !== a[i - 1]);

  // 5) orbs: computed animation props over time
  out.orbs = await page.evaluate(() => [...document.querySelectorAll('.ambient-orb')].map((e) => { const c = getComputedStyle(e); return { name: c.animationName, dur: c.animationDuration, delay: c.animationDelay, ease: c.animationTimingFunction, iter: c.animationIterationCount, filter: c.filter, op: c.opacity, w: c.width, h: c.height }; }));

  // 6) transitions on interactive elements
  out.transitions = await page.evaluate(() => {
    const pick = (sel) => { const e = document.querySelector(sel); if (!e) return null; const c = getComputedStyle(e); return { p: c.transitionProperty.slice(0, 60), d: c.transitionDuration, f: c.transitionTimingFunction, dl: c.transitionDelay }; };
    return { header: pick('header'), cta: pick('main a[href*=register]'), secondary: pick('main a[href="/demo/"]'), navlink: pick('header nav a'), card: pick('.card-soft'), door: pick('main a[href="/academy/"]'), heroBtn: pick('button[aria-label=Preschool]'), heroBar: pick('button[aria-label=Preschool] > span > span'), chevron: pick('header nav button svg'), arrow: pick('main a[href="/academy/"] svg'), footerLink: pick('footer a') };
  });
  R[name] = out;
  await ctx.close();
}
await browser.close();

const diffs = [];
const cmp = (label, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push({ label, orig: a, clone: b }); };
for (const k of ['load', 'heroFinal', 'revealCount', 'counterStart', 'counterEnd', 'orbs', 'transitions']) cmp(k, R.orig[k], R.clone[k]);
// reveals: compare flip scrollY within one 20px step, same animation class + delay
R.orig.reveals.forEach((o, i) => {
  const c = R.clone.reveals[i];
  if (!o || !c) return cmp('reveal#' + i, o, c);
  if (Math.abs(o.y - c.y) > 20 || o.delay !== c.delay || o.anim !== c.anim) diffs.push({ label: 'reveal#' + i, orig: o, clone: c });
});
cmp('counterSeriesLength>=10', R.orig.counterSeries.length >= 10, R.clone.counterSeries.length >= 10);
fs.writeFileSync('c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly/06-qa/motion.json', JSON.stringify({ R, diffs }, null, 1));
console.log('load animations   orig/clone:', R.orig.load.length, R.clone.load.length);
console.log('reveal elements   orig/clone:', R.orig.revealCount, R.clone.revealCount);
console.log('counter series    orig:', R.orig.counterSeries.join(' > '));
console.log('counter series   clone:', R.clone.counterSeries.join(' > '));
console.log('orbs             clone:', JSON.stringify(R.clone.orbs[0]));
console.log(diffs.length ? `MOTION: ${diffs.length} diffs` : 'MOTION: PASS');
diffs.slice(0, 12).forEach((d) => console.log(d.label, '\n  orig ', JSON.stringify(d.orig).slice(0, 260), '\n  clone', JSON.stringify(d.clone).slice(0, 260)));
