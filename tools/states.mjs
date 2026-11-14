// Interactive-state parity: drives the SAME actions on the original and the clone, snapshots full
// computed styles of every element after each, and diffs them strictly.
//   node states.mjs [cloneUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';

const ORIG = 'https://getskooly.com/';
const CLONE = process.argv[2] || 'http://127.0.0.1:4173/';
const OUT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly/06-qa/states';
fs.mkdirSync(OUT, { recursive: true });

const PROPS = ['color','backgroundColor','backgroundImage','opacity','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderTopColor','borderTopLeftRadius','boxShadow','display','position','zIndex','transitionDuration','transitionTimingFunction','cursor','width','height','top','left','transform','translate','scale','rotate','textDecorationLine','outlineStyle','visibility','borderTopColor','borderBottomColor','textDecorationColor'];

async function capture(page, { includeDialog = false } = {}) {
  return page.evaluate(({ PROPS, includeDialog }) => {
    const kids = (p) => [...p.children].filter((c) => c.id !== 'root');
    const siblings = (n) => {
      const p = n.parentElement;
      const pool = p.id === 'root' ? kids(p.parentElement).concat([...p.children]) : [...p.children];
      return pool.filter((x) => x.tagName === n.tagName);
    };
    const path = (el) => {
      const parts = [];
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        if (n.id === 'root') continue;
        // original: chat wrapper follows Next's hidden <div hidden>, so it is body's 2nd div.
        const isChatWrap = n.parentElement && (n.parentElement === document.body || n.parentElement.id === 'root') && String(n.className).includes('fixed end-5');
        parts.unshift(isChatWrap ? 'div:nth-of-type(2)' : n.tagName.toLowerCase() + ':nth-of-type(' + (siblings(n).indexOf(n) + 1) + ')');
      }
      return 'body > ' + parts.join(' > ');
    };
    document.querySelectorAll('.grecaptcha-badge').forEach((b) => b.parentElement?.remove());
    const out = {};
    [document.body, ...document.querySelectorAll('body *')].forEach((el) => {
      if (el.id === 'root') return;
      if (el.tagName.toLowerCase() === 'svg' || el.closest('svg') || el.closest('.ambient-orb')) return;
      if (!includeDialog && el.closest('[class*="fixed end-5"]')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const cs = getComputedStyle(el); const o = {};
      for (const p of PROPS) o[p] = cs[p];
      o.__w = Math.round(r.width * 10) / 10; o.__h = Math.round(r.height * 10) / 10;
      o.__x = Math.round(r.x * 10) / 10; o.__y = Math.round((r.y + scrollY) * 10) / 10;
      out[el === document.body ? 'body' : path(el)] = o;
    });
    return out;
  }, { PROPS, includeDialog });
}

const cap = async (page, ms = 700) => { await page.waitForTimeout(ms); return capture(page); };
const scrollAll = async (page) => page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 70)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1500)); });

const STATES = [
  { name: 'features-menu-hover', vp: [1920, 1080], run: async (p) => { await p.locator('header nav button', { hasText: 'Features' }).hover(); return cap(p, 500); } },
  { name: 'pricing-menu-hover', vp: [1920, 1080], run: async (p) => { await p.locator('header nav button', { hasText: 'Pricing' }).hover(); return cap(p, 500); } },
  { name: 'features-menu-click', vp: [1920, 1080], run: async (p) => { await p.locator('header nav button', { hasText: 'Features' }).click(); return cap(p, 400); } },
  { name: 'features-menu-open-then-leave', vp: [1920, 1080], run: async (p) => { await p.locator('header nav button', { hasText: 'Features' }).hover(); await p.waitForTimeout(300); await p.mouse.move(1000, 900); return cap(p, 700); } },
  { name: 'header-scrolled', vp: [1920, 1080], run: async (p) => { await p.evaluate(() => scrollTo(0, 500)); return cap(p, 900); } },
  { name: 'hero-switch-preschool', vp: [1920, 1080], run: async (p) => { const r = await p.evaluate(() => document.querySelector('button[aria-label=Preschool]').getBoundingClientRect().toJSON()); await p.mouse.click(r.x + r.width / 2, r.y + 8); return cap(p, 900); } },
  { name: 'hero-back-header-hover', vp: [1920, 1080], run: async (p) => { const r = await p.evaluate(() => document.querySelector('button[aria-label=Preschool]').getBoundingClientRect().toJSON()); await p.mouse.move(r.x + r.width / 2, r.y + 8); return cap(p, 600); } },
  { name: 'hover-hero-primary-cta', vp: [1920, 1080], run: async (p) => { await p.locator('main a[href*="register"]').first().hover(); return cap(p, 500); } },
  { name: 'hover-hero-secondary-cta', vp: [1920, 1080], run: async (p) => { await p.locator('main a[href="/demo/"]').first().hover(); return cap(p, 500); } },
  { name: 'hover-nav-academy', vp: [1920, 1080], run: async (p) => { await p.locator('header nav a[href="/academy/"]').hover(); return cap(p, 400); } },
  { name: 'hover-header-cta', vp: [1920, 1080], run: async (p) => { await p.locator('header a[href*="register"]').first().hover(); return cap(p, 400); } },
  { name: 'hover-language-pill', vp: [1920, 1080], run: async (p) => { await p.locator('header span.rounded-full').first().hover(); return cap(p, 400); } },
  { name: 'hover-door-academy', vp: [1920, 1080], run: async (p) => { const a = p.locator('main a[href="/academy/"]').first(); await a.scrollIntoViewIfNeeded(); await a.hover(); return cap(p, 600); } },
  { name: 'hover-spine-learn-more', vp: [1920, 1080], run: async (p) => { const a = p.locator('main a', { hasText: 'Learn more' }).first(); await a.scrollIntoViewIfNeeded(); await a.hover(); return cap(p, 500); } },
  { name: 'hover-footer-link', vp: [1920, 1080], run: async (p) => { const a = p.locator('footer a[href*="student-management"]').first(); await a.scrollIntoViewIfNeeded(); await a.hover(); return cap(p, 400); } },
  { name: 'hover-store-badge', vp: [1920, 1080], run: async (p) => { const a = p.locator('footer a[href*="apps.apple"]').first(); await a.scrollIntoViewIfNeeded(); await a.hover(); return cap(p, 400); } },
  { name: 'chat-open', vp: [1920, 1080], dialog: true, run: async (p) => { await p.locator('button[aria-label="Questions? Chat with us"]').click(); await p.waitForTimeout(700); return capture(p, { includeDialog: true }); } },
  { name: 'chat-field-focus', vp: [1920, 1080], dialog: true, run: async (p) => { await p.locator('button[aria-label="Questions? Chat with us"]').click(); await p.waitForTimeout(500); await p.locator('[role=dialog] input[name=email]').focus(); await p.waitForTimeout(300); return capture(p, { includeDialog: true }); } },
  { name: 'mobile-menu-open-375', vp: [375, 667], run: async (p) => { await p.locator('button[aria-label="Toggle menu"]').click(); return cap(p, 500); } },
  { name: 'tablet-menu-open-768', vp: [768, 1024], run: async (p) => { await p.locator('button[aria-label="Toggle menu"]').click(); return cap(p, 500); } },
  { name: 'tablet-1023-no-desktop-nav', vp: [1023, 800], run: async (p) => cap(p, 300) },
  { name: 'desktop-1024', vp: [1024, 800], run: async (p) => cap(p, 300) },
  { name: 'desktop-1280', vp: [1280, 800], run: async (p) => cap(p, 300) },
  { name: 'desktop-1536', vp: [1536, 900], run: async (p) => cap(p, 300) },
  { name: 'viewport-640-sm', vp: [640, 900], run: async (p) => cap(p, 300) },
];

const browser = await chromium.launch();
async function run(url, st) {
  const ctx = await browser.newContext({ viewport: { width: st.vp[0], height: st.vp[1] } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await scrollAll(page);
  // same relayout nudge as snapshot.mjs (normalises Chromium's stale auto-margin reading)
  await page.setViewportSize({ width: st.vp[0] + 1, height: st.vp[1] });
  await page.waitForTimeout(150);
  await page.setViewportSize({ width: st.vp[0], height: st.vp[1] });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[role=dialog] button[aria-label=Close]')?.click());
  await page.waitForTimeout(500);
  const res = await st.run(page);
  await ctx.close();
  return res;
}

const only = process.env.ONLY?.split(',');
let bad = 0;
for (const st of STATES) {
  if (only && !only.includes(st.name)) continue;
  const o = await run(ORIG, st), c = await run(CLONE, st);
  const diffs = [];
  for (const sel of new Set([...Object.keys(o), ...Object.keys(c)])) {
    if (!(sel in o)) { diffs.push({ sel, note: 'extra in clone' }); continue; }
    if (!(sel in c)) { diffs.push({ sel, note: 'missing in clone' }); continue; }
    for (const p of Object.keys(o[sel])) {
      const e = o[sel][p], a = c[sel][p];
      const num = /^-?\d+(\.\d+)?(px)?$/.test(String(e)) && /^-?\d+(\.\d+)?(px)?$/.test(String(a));
      if (e === a || (num && Math.abs(parseFloat(e) - parseFloat(a)) <= 1)) continue;
      // Used auto-margins are fully determined by x/width, which are compared above. Chromium
      // sometimes reports a stale 0px on the original, so only flag margins if geometry differs.
      if ((p === 'marginLeft' || p === 'marginRight') && Math.abs(o[sel].__x - c[sel].__x) <= 1 && Math.abs(o[sel].__w - c[sel].__w) <= 1) continue;
      diffs.push({ sel, p, exp: e, act: a });
    }
  }
  bad += diffs.length;
  fs.writeFileSync(`${OUT}/${st.name}.diff.json`, JSON.stringify(diffs, null, 1));
  console.log(`${diffs.length === 0 ? 'PASS' : 'FAIL'}  ${st.name}  (${Object.keys(o).length} els, ${diffs.length} diffs)`);
}
await browser.close();
console.log(bad === 0 ? 'STATES: PASS' : `STATES: FAIL (${bad})`);
process.exit(bad === 0 ? 0 : 1);
