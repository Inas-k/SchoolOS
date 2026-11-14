import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://getskooly.com';
const ROOT = 'c:/Users/inash/Downloads/Projects/Sckooly/clone-workspace/skooly';
const R = ROOT + '/01-recon';
const E = ROOT + '/02-extraction';
for (const d of [R + '/screenshots', E + '/fragments']) fs.mkdirSync(d, { recursive: true });

const VIEWPORTS = { desktop: [1920, 1080], tablet: [768, 1024], mobile: [375, 667] };
const ROUTES = ['/', '/academy/', '/preschool/', '/therapy-early-intervention/', '/demo/', '/support/'];
const slug = (p) => (p === '/' ? 'home' : p.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += 250) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, h());
    await new Promise((r) => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
}

const browser = await chromium.launch();
const recon = { themes: ['light'], routes: {}, framework: {}, breakpoints: [], scroll: {}, animation: {}, canvas: {} };
const allRoutes = new Set(ROUTES);

for (const [vp, [w, h]] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const s = slug(route);
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => null);
    if (!resp) { console.log('FAIL', vp, route); continue; }
    await page.waitForTimeout(1500);
    await scrollThrough(page);
    await page.screenshot({ path: `${R}/screenshots/${s}--${vp}.png`, fullPage: true });

    const info = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a[href]')].map((a) => { try { const u = new URL(a.href); return u.origin === location.origin ? u.pathname : null; } catch { return null; } }).filter(Boolean);
      const sections = [...document.querySelectorAll('body section, body header, body footer, body nav, main > *')].map((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return { tag: el.tagName.toLowerCase(), id: el.id, cls: String(el.className).slice(0, 120), y: Math.round(r.y + scrollY), h: Math.round(r.height), w: Math.round(r.width), bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 120), pos: cs.position };
      });
      const anims = document.getAnimations().map((a) => ({ name: a.animationName || a.transitionProperty || null, type: a.constructor.name }));
      return {
        title: document.title, height: document.documentElement.scrollHeight, links: [...new Set(links)],
        sections, anims: anims.length,
        canvas: document.querySelectorAll('canvas').length, svg: document.querySelectorAll('svg').length, video: document.querySelectorAll('video').length,
        scrollLib: { lenis: !!window.lenis || !!document.querySelector('.lenis'), locomotive: !!document.querySelector('[data-scroll-container]'), gsap: !!window.gsap, framer: !!document.querySelector('[style*="will-change"]') },
        next: !!window.__next_f || !!window.next, htmlLang: document.documentElement.lang, htmlDir: document.documentElement.dir,
        bodyClass: document.body.className,
      };
    });
    (info.links || []).forEach((l) => allRoutes.add(l));
    recon.routes[`${s}--${vp}`] = { title: info.title, height: info.height, sections: info.sections.length, canvas: info.canvas, video: info.video, anims: info.anims };
    if (vp === 'desktop') {
      fs.writeFileSync(`${E}/fragments/${s}.sections.json`, JSON.stringify(info.sections, null, 2));
      fs.writeFileSync(`${R}/${s}.routes.json`, JSON.stringify(info.links, null, 2));
      recon.scroll[s] = info.scrollLib; recon.framework[s] = { next: info.next, lang: info.htmlLang, dir: info.htmlDir };
    }
    console.log(vp, route, info.height, 'sections', info.sections.length, 'canvas', info.canvas, 'video', info.video, 'anims', info.anims);
  }
  await ctx.close();
}
fs.writeFileSync(R + '/recon.json', JSON.stringify(recon, null, 2));
fs.writeFileSync(R + '/discovered-routes.json', JSON.stringify([...allRoutes].sort(), null, 2));
await browser.close();
