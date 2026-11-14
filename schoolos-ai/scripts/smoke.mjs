// Smoke test: every role, every nav page. Fails on console errors, page errors, error boundaries,
// "no access" screens, 404s and dead internal links.   node scripts/smoke.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const ROLES = { admin: 'admin', principal: 'principal', schoolAdmin: 'schoolAdmin', teacher: 'teacher', student: 'student', parent: 'parent' };
const PAGES = {
  admin: ['', 'insights', 'students', 'students/S0001', 'teachers', 'users', 'classes', 'subjects', 'timetable', 'attendance', 'exams', 'marks', 'report-cards', 'assignments', 'announcements', 'communication', 'resources', 'fees', 'growth', 'reports', 'settings'],
  teacher: ['', 'classes', 'students', 'attendance', 'assignments', 'marks', 'exams', 'resources', 'timetable', 'performance', 'copilot', 'messages', 'announcements', 'profile'],
  student: ['', 'timetable', 'attendance', 'academics', 'assignments', 'announcements', 'resources', 'tutor', 'planner', 'practice', 'prep', 'performance', 'passport', 'profile'],
  parent: ['', 'children', 'attendance', 'academics', 'assignments', 'feedback', 'announcements', 'communication', 'meetings', 'fees', 'profile'],
};
const portalOf = { admin: 'admin', principal: 'admin', schoolAdmin: 'admin', teacher: 'teacher', student: 'student', parent: 'parent' };

const browser = await chromium.launch();
let failures = 0;
const log = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); };
const BAD = /This page does not exist|You don.t have access|Something went wrong|Unexpected Application Error/;

async function session(role) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await page.goto(BASE + '/demo');
  const card = { admin: 'Principal / Administrator', teacher: 'Teacher', student: 'Student', parent: 'Parent' }[role];
  if (card) await page.getByRole('button', { name: new RegExp(card) }).click();
  else {
    await page.goto(BASE + '/login');
    const email = { principal: 'demo.principal', schoolAdmin: 'demo.schooladmin' }[role];
    await page.getByLabel('Email').fill(`${email}@evergreen.demo`);
    await page.getByLabel('Password').fill('demo123');
    await page.getByRole('button', { name: 'Sign in' }).first().click();
  }
  await page.waitForURL(/\/app\//);
  return { ctx, page, errs };
}

for (const role of Object.keys(ROLES)) {
  const portal = portalOf[role];
  const { ctx, page, errs } = await session(role);
  const pages = PAGES[portal];
  const links = new Set();
  for (const p of pages) {
    const url = `${BASE}/app/${portal}${p ? '/' + p : ''}`;
    errs.length = 0;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const text = await page.locator('main').innerText().catch(() => '');
    const denied = BAD.test(text);
    const h1 = await page.locator('main h1').first().innerText().catch(() => '');
    // pages that are intentionally restricted for this role
    const expectDenied = (role === 'principal' && p === 'users') || (role === 'schoolAdmin' && (p === 'users' || p === 'insights' && false));
    const okPage = expectDenied ? denied : !denied && text.length > 40;
    log(okPage && errs.length === 0, `${role.padEnd(11)} /app/${portal}/${p}  ${expectDenied ? '(access correctly denied)' : `“${h1.slice(0, 40)}”`}${errs.length ? '  ERR: ' + errs[0].slice(0, 160) : ''}`);
    (await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).forEach((h) => links.add(h));
  }
  // dead-link check: every internal link found must open a real page for this role
  const checked = [];
  for (const href of links) {
    if (/^\/app\//.test(href) && !href.startsWith(`/app/${portal}`)) continue;
    await page.goto(BASE + href, { waitUntil: 'networkidle' });
    const text = await page.locator('main').innerText().catch(() => '');
    const dead = /This page does not exist/.test(text) || (!text && !/\//.test(href));
    checked.push([href, dead]);
  }
  const dead = checked.filter(([, d]) => d).map(([h]) => h);
  log(dead.length === 0, `${role.padEnd(11)} internal links checked: ${checked.length}, dead: ${dead.length}${dead.length ? ' ' + dead.join(', ') : ''}`);
  await ctx.close();
}

// permission boundary: a student must not open the admin portal or another portal
{
  const { ctx, page } = await session('student');
  await page.goto(BASE + '/app/admin/students', { waitUntil: 'networkidle' });
  log(/\/app\/student/.test(page.url()), 'student opening /app/admin/students is redirected to the student portal');
  await ctx.close();
  const c2 = await browser.newContext();
  const p2 = await c2.newPage();
  await p2.goto(BASE + '/app/teacher/marks', { waitUntil: 'networkidle' });
  log(/\/login/.test(p2.url()), 'signed-out visit to a portal page redirects to /login');
  await c2.close();
}
await browser.close();
console.log(failures ? `\nSMOKE: ${failures} FAILURE(S)` : '\nSMOKE: ALL PASS');
fs.writeFileSync('scripts/.last-smoke', failures ? 'fail' : 'pass');
process.exit(failures ? 1 : 0);
