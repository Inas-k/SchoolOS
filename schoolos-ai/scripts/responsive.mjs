// Loads every page at phone/tablet/desktop width and reports horizontal page overflow.
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const PAGES = {
  public: ['/', '/features', '/demo', '/login'],
  admin: ['', 'insights', 'students', 'students/S0001', 'teachers', 'users', 'classes', 'subjects', 'timetable', 'attendance', 'exams', 'marks', 'report-cards', 'assignments', 'announcements', 'communication', 'resources', 'fees', 'growth', 'reports', 'settings'],
  teacher: ['', 'classes', 'students', 'attendance', 'assignments', 'marks', 'exams', 'resources', 'timetable', 'performance', 'copilot', 'messages', 'announcements', 'profile'],
  student: ['', 'timetable', 'attendance', 'academics', 'assignments', 'announcements', 'resources', 'tutor', 'planner', 'practice', 'prep', 'performance', 'passport', 'profile'],
  parent: ['', 'children', 'attendance', 'academics', 'assignments', 'feedback', 'announcements', 'communication', 'meetings', 'fees', 'profile'],
};
const CARD = { admin: 'Principal / Administrator', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
const SIZES = { phone: [375, 740], tablet: [768, 1024] };
const b = await chromium.launch();
let bad = 0, n = 0;
fs.mkdirSync('docs/screens', { recursive: true });
for (const [sz, [w, h]] of Object.entries(SIZES)) {
  for (const portal of Object.keys(PAGES)) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    if (portal !== 'public') { await p.goto(BASE + '/demo'); await p.getByRole('button', { name: new RegExp(CARD[portal]) }).click(); await p.waitForURL(/app/); }
    for (const pg of PAGES[portal]) {
      const url = portal === 'public' ? BASE + pg : `${BASE}/app/${portal}${pg ? '/' + pg : ''}`;
      await p.goto(url, { waitUntil: 'networkidle' });
      await p.waitForTimeout(120);
      const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, worst: [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > document.documentElement.clientWidth + 1 && r.width > 0 && !e.closest('.overflow-x-auto,.overflow-auto,.overflow-y-auto,[class*="overflow-clip"],svg,table,nav[aria-label=Main]'); }).slice(0, 2).map((e) => e.tagName + '.' + String(e.className).slice(0, 60)) }));
      n++;
      const over = m.sw > m.cw + 1;
      if (over || errs.length) { bad++; console.log(`FAIL ${sz} ${portal}/${pg}: scrollWidth ${m.sw} > ${m.cw} ${m.worst.join(' | ')} ${errs[0] || ''}`); }
      if (sz === 'phone' && ['', 'attendance', 'marks'].includes(pg) && ['admin', 'teacher', 'student', 'parent'].includes(portal)) await p.screenshot({ path: `docs/screens/${portal}-${pg || 'dashboard'}-phone.png` });
    }
    await ctx.close();
  }
}
await b.close();
console.log(bad ? `\nRESPONSIVE: ${bad} problem(s) in ${n} page loads` : `\nRESPONSIVE: ALL ${n} page loads fit without horizontal scrolling`);
process.exit(bad ? 1 : 0);
