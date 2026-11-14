// Deterministic IntersectionObserver threshold test for .scroll-reveal.
// For each element (document order): jump so 2% of it is in view, check; then 9% in view, check.
// Expected on both sites (threshold .05): hidden at 2%, visible at 9%.
import { chromium } from 'playwright';
const SITES = { orig: 'https://getskooly.com/', clone: process.argv[2] || 'http://127.0.0.1:4173/' };
const browser = await chromium.launch();
const R = {};
for (const [name, url] of Object.entries(SITES)) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  R[name] = await p.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const els = [...document.querySelectorAll('.scroll-reveal')];
    const vh = innerHeight; const out = [];
    for (const [i, e] of els.entries()) {
      if (e.classList.contains('is-visible')) { out.push({ i, pre: 'already', post: true }); continue; }
      const docTop = e.getBoundingClientRect().top + scrollY, h = e.getBoundingClientRect().height;
      scrollTo(0, Math.max(0, docTop + 0.02 * h - vh)); await wait(160);
      const pre = e.classList.contains('is-visible');
      scrollTo(0, Math.max(0, docTop + 0.09 * h - vh)); await wait(160);
      out.push({ i, pre, post: e.classList.contains('is-visible') });
    }
    return out;
  });
  await ctx.close();
}
await browser.close();
const a = R.orig, b = R.clone; let bad = 0;
a.forEach((o, i) => { const c = b[i]; if (!c || o.pre !== c.pre || o.post !== c.post) { bad++; console.log('DIFF', i, JSON.stringify(o), JSON.stringify(c)); } });
console.log('elements', a.length, b.length, '| hidden@2% & visible@9% on orig:', a.filter((x) => x.pre === false && x.post).length, '| clone:', b.filter((x) => x.pre === false && x.post).length);
console.log(bad === 0 && a.length === b.length ? 'THRESHOLD: PASS' : `THRESHOLD: FAIL (${bad})`);
