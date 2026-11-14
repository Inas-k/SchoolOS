import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://getskooly.com';
const ROOT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly';
const E = ROOT + '/02-extraction';
fs.mkdirSync(E + '/fragments', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);

// ---- CSSOM dump (same-origin sheet) ----
const cssom = await page.evaluate(() => {
  const out = { sheets: [], keyframes: {}, media: [], fontFaces: [], vars: {} };
  const walk = (rules, ctx) => {
    for (const r of rules) {
      if (r.type === CSSRule.STYLE_RULE) {
        out.sheets[out.sheets.length - 1].rules.push({ s: r.selectorText, c: r.style.cssText, ctx });
        if (/^(:root|html|\.dark|\[data-theme)/.test(r.selectorText)) {
          for (const p of r.style) if (p.startsWith('--')) out.vars[p] = r.style.getPropertyValue(p).trim();
        }
      } else if (r.type === CSSRule.MEDIA_RULE) { out.media.push(r.conditionText); walk(r.cssRules, (ctx ? ctx + ' && ' : '') + '@media ' + r.conditionText); }
      else if (r.type === CSSRule.SUPPORTS_RULE) walk(r.cssRules, (ctx ? ctx + ' && ' : '') + '@supports ' + r.conditionText);
      else if (r.type === CSSRule.KEYFRAMES_RULE) out.keyframes[r.name] = [...r.cssRules].map((k) => k.keyText + '{' + k.style.cssText + '}');
      else if (r.type === CSSRule.FONT_FACE_RULE) out.fontFaces.push({ family: r.style.getPropertyValue('font-family'), weight: r.style.getPropertyValue('font-weight'), style: r.style.getPropertyValue('font-style'), range: r.style.getPropertyValue('unicode-range').slice(0, 80), src: r.style.getPropertyValue('src').slice(0, 120) });
      else if (r.cssRules) walk(r.cssRules, (ctx ? ctx + ' && ' : '') + (r.cssText.split('{')[0].trim()));
    }
  };
  for (const sh of document.styleSheets) {
    out.sheets.push({ href: sh.href, rules: [] });
    try { walk(sh.cssRules, ''); } catch (e) { out.sheets[out.sheets.length - 1].error = e.message; }
  }
  return out;
});
fs.writeFileSync(E + '/all-styles.json', JSON.stringify(cssom, null, 1));
fs.writeFileSync(E + '/css-variables.json', JSON.stringify({ themes: { light: cssom.vars } }, null, 2));
fs.writeFileSync(E + '/fonts.json', JSON.stringify({ fontFaces: cssom.fontFaces, loaded: await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => ({ family: f.family, weight: f.weight, style: f.style }))) }, null, 2));
console.log('rules', cssom.sheets.map((s) => s.rules.length), 'keyframes', Object.keys(cssom.keyframes).length, 'vars', Object.keys(cssom.vars).length, 'media', [...new Set(cssom.media)].length);
console.log('MEDIA', [...new Set(cssom.media)].join(' | '));
console.log('FONTS', JSON.stringify(cssom.fontFaces.map((f) => f.family + ' ' + f.weight)));

// ---- scroll to trigger reveals, then snapshot DOM ----
await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 250) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600)); });

const dom = await page.evaluate(() => {
  const c = document.body.cloneNode(true);
  c.querySelectorAll('script,noscript,iframe').forEach((n) => n.remove());
  return c.outerHTML;
});
fs.writeFileSync(E + '/fragments/home.dom.html', dom);
console.log('dom bytes', dom.length);

// ---- computed styles: deduped archetypes ----
const PROPS = ['color','backgroundColor','backgroundImage','backgroundSize','backgroundPosition','opacity','mixBlendMode','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textDecorationLine','textAlign','whiteSpace','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderTopStyle','borderTopColor','borderRightWidth','borderBottomWidth','borderBottomColor','borderLeftWidth','borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius','boxShadow','textShadow','filter','backdropFilter','display','flexDirection','flexWrap','justifyContent','alignItems','gap','gridTemplateColumns','position','top','right','bottom','left','zIndex','transform','transformOrigin','transitionProperty','transitionDuration','transitionTimingFunction','transitionDelay','animationName','animationDuration','animationTimingFunction','animationDelay','animationIterationCount','cursor','overflowX','overflowY','width','height','maxWidth','minHeight'];
const computed = await page.evaluate((PROPS) => {
  const INIT = new Set(['none','normal','auto','0px','static','visible','rgba(0, 0, 0, 0)','0s','all','start','row','nowrap','1','repeat','baseline','stretch','0% 0%','ease','block','inline']);
  const sel = (el) => {
    if (el.id) return '#' + el.id;
    const parts = []; let n = el;
    while (n && n !== document.body && parts.length < 5) {
      let p = n.tagName.toLowerCase();
      const i = [...n.parentElement.children].filter((x) => x.tagName === n.tagName).indexOf(n) + 1;
      p += `:nth-of-type(${i})`; parts.unshift(p); n = n.parentElement;
    }
    return 'body > ' + parts.join(' > ');
  };
  const sig = new Map();
  document.querySelectorAll('body *').forEach((el) => {
    if (['SCRIPT','STYLE','PATH','CIRCLE','RECT','LINE','POLYLINE','G','DEFS','LINEARGRADIENT','STOP'].includes(el.tagName.toUpperCase())) return;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return;
    const cs = getComputedStyle(el); const o = {};
    for (const p of PROPS) { const v = cs[p]; if (v !== undefined && !INIT.has(v)) o[p] = v; }
    const key = el.tagName + JSON.stringify(o);
    const txt = (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim().slice(0, 50) : '';
    if (!sig.has(key)) sig.set(key, { tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className).slice(0, 160), selector: sel(el), text: txt, rect: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 }, count: 1, style: o });
    else sig.get(key).count++;
  });
  return [...sig.values()];
}, PROPS);
fs.writeFileSync(E + '/fragments/home.computed.json', JSON.stringify(computed, null, 1));
console.log('archetypes', computed.length);

// ---- Web animations / scroll reveal timings ----
await page.evaluate(() => scrollTo(0, 0));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const anim0 = await page.evaluate(() => document.getAnimations().map((a) => { const t = a.effect?.getTiming?.(); const k = a.effect?.getKeyframes?.(); return { target: a.effect?.target ? (a.effect.target.tagName + '.' + String(a.effect.target.className).slice(0, 60)) : null, name: a.animationName ?? a.transitionProperty, type: a.constructor.name, duration: t?.duration, delay: t?.delay, easing: t?.easing, iterations: t?.iterations, fill: t?.fill, keyframes: k }; }));
fs.writeFileSync(E + '/fragments/home.animations-load.json', JSON.stringify(anim0, null, 1));
console.log('load animations', anim0.length);

// IntersectionObserver-style reveals: record style of reveal elements before/after scroll
const reveal = await page.evaluate(async () => {
  const els = [...document.querySelectorAll('[style*="opacity"], [class*="reveal"], [class*="fade"], [class*="animate"], [data-reveal]')];
  const snap = () => els.map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 80), style: e.getAttribute('style'), op: getComputedStyle(e).opacity, tr: getComputedStyle(e).transform, trans: getComputedStyle(e).transition }));
  const before = snap();
  for (let y = 0; y < document.documentElement.scrollHeight; y += 200) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
  await new Promise((r) => setTimeout(r, 1200));
  return { n: els.length, before: before.slice(0, 60), after: snap().slice(0, 60) };
});
fs.writeFileSync(E + '/fragments/home.reveal.json', JSON.stringify(reveal, null, 1));
console.log('reveal els', reveal.n);

// ---- Interactions ----
const inter = [];
await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
const hdr = await page.evaluate(() => { const h = document.querySelector('header,nav'); const r = h?.getBoundingClientRect(); return { tag: h?.tagName, cls: h?.className, pos: getComputedStyle(h).position, rect: r && { y: r.y, h: r.height }, bg: getComputedStyle(h).backgroundColor, bf: getComputedStyle(h).backdropFilter }; });
console.log('HEADER', JSON.stringify(hdr));
fs.writeFileSync(E + '/fragments/home.interactions.json', JSON.stringify({ header: hdr }, null, 1));
await browser.close();
