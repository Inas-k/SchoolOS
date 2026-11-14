// usage: node snapshot.mjs <url> <outfile> [viewports=desktop,tablet,mobile]
// Reads computed styles for every element via full-path selectors. Ground truth for the gate.
import { chromium } from 'playwright';
import fs from 'node:fs';

const [url, outFile, vps = 'desktop,tablet,mobile'] = process.argv.slice(2);
const VP = { desktop: [1920, 1080], tablet: [768, 1024], mobile: [375, 667] };

export const PROPS = ['color','backgroundColor','backgroundImage','opacity','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderTopColor','borderBottomWidth','borderBottomColor','borderTopLeftRadius','borderTopRightRadius','boxShadow','display','flexDirection','justifyContent','alignItems','columnGap','rowGap','gridTemplateColumns','position','zIndex','transitionDuration','transitionTimingFunction','animationName','animationDuration','animationDelay','cursor','width','height','top','bottom','transform'];

const browser = await chromium.launch();
const result = {};
for (const vp of vps.split(',')) {
  const [w, h] = VP[vp];
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  // scroll pass to fire every reveal, then wait for all animations to settle
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 1800));
  });
  // Force a full relayout (1px viewport nudge and back) so used-value margins are recomputed
  // from scratch. Chromium can report a stale 0px for auto margins on boxes whose layout was
  // cached around a late-loading image; this normalises both sites the same way.
  await page.setViewportSize({ width: w + 1, height: h });
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400);
  // close chat panel if it auto-opened on scroll, so the DOM is comparable
  await page.evaluate(() => document.querySelector('[role=dialog] button[aria-label=Close]')?.click());
  await page.waitForTimeout(600);
  result[vp] = await page.evaluate((PROPS) => {
    const out = {};
    // The clone mounts into <div id="root" style="display:contents">; treat it as transparent
    // so paths match the original (where header/main/footer are direct children of body).
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
        const same = siblings(n);
        parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + (same.indexOf(n) + 1) + ')');
      }
      return 'body > ' + parts.join(' > ');
    };
    // Google reCAPTCHA badge is injected by the original's chat widget: third-party UI, not site content.
    document.querySelectorAll('.grecaptcha-badge').forEach((b) => b.parentElement?.remove());
    const skipAnc = '[role=dialog], svg, .ambient-orb';
    const nodes = [document.documentElement, document.body, ...document.querySelectorAll('body *')];
    nodes.forEach((el) => {
      if (el.id === 'root') return;
      if (el.closest(skipAnc) || el.tagName.toLowerCase() === 'svg') return;
      if (el.closest('[class*="fixed end-5"]')) return;           // chat widget wrapper
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const cs = getComputedStyle(el); const o = {};
      for (const p of PROPS) o[p] = cs[p];
      o.__w = Math.round(r.width * 10) / 10; o.__h = Math.round(r.height * 10) / 10;
      o.__text = (el.children.length === 0 ? el.textContent.trim().slice(0, 40) : '');
      out[el === document.documentElement ? 'html' : el === document.body ? 'body' : path(el)] = o;
    });
    return out;
  }, PROPS);
  console.log(vp, Object.keys(result[vp]).length, 'elements');
  await ctx.close();
}
fs.writeFileSync(outFile, JSON.stringify(result));
await browser.close();
