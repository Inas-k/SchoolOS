// End-to-end workflow tests through the real UI (production build on :4173).
//   node scripts/workflows.mjs [baseUrl]
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
let fails = 0;
const ok = (c, m) => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); };
const toast = async (re, label) => { try { await page.getByRole('status').getByText(re).first().waitFor({ timeout: 4000 }); ok(true, label); } catch { ok(false, `${label} (toast not seen; got: ${(await page.getByRole('status').innerText().catch(() => '')).slice(0, 120)})`); } };

async function as(card) {
  await page.goto(BASE + '/demo', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: new RegExp(card) }).click();
  await page.waitForURL(/\/app\//);
  await page.waitForLoadState('networkidle');
}
const go = async (path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); };
const stat = async (label) => (await page.locator('.card-soft', { has: page.getByText(label, { exact: true }) }).first().innerText()).split('\n').map((x) => x.trim()).filter(Boolean);
const see = async (loc, ms = 6000) => { try { await loc.first().waitFor({ state: 'visible', timeout: ms }); return true; } catch { console.log('      (debug) url=' + page.url() + ' main=' + JSON.stringify((await page.locator('main').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160))); return false; } };
const bell = async () => Number((await page.getByRole('button', { name: /^Notifications/ }).getAttribute('aria-label')).match(/(\d+) unread/)[1]);

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());

// ───── 1. Attendance travels across roles ─────
console.log('\n— Workflow 1: teacher marks absent → admin → parent → student');
await as('Principal / Administrator');
await go('/app/admin');
const before = Number((await stat("Absent students")).find((x) => /^\d+$/.test(x)));
await as('Parent');
const parentBellBefore = await bell();
await as('Teacher');
await go('/app/teacher/attendance');
await page.getByLabel('Class and section').selectOption('10-B');
const grp = page.getByRole('radiogroup', { name: 'Attendance for Aarav Sharma' });
await grp.getByRole('radio', { name: 'Absent' }).click();
await page.getByRole('button', { name: /^(Save|Update) attendance$/ }).click();
await toast(/Attendance saved/, 'teacher saved attendance (toast)');
await page.reload({ waitUntil: 'networkidle' });
await page.getByLabel('Class and section').selectOption('10-B');
ok(await page.getByRole('radiogroup', { name: 'Attendance for Aarav Sharma' }).getByRole('radio', { name: 'Absent' }).getAttribute('aria-checked') === 'true', 'attendance persisted after page refresh');
await as('Principal / Administrator');
await go('/app/admin');
const after = Number((await stat("Absent students")).find((x) => /^\d+$/.test(x)));
ok(after > before, `admin dashboard absent count rose ${before} → ${after}`);
await as('Parent');
ok((await bell()) > parentBellBefore, `parent got a notification (bell ${parentBellBefore} → ${await bell()})`);
await go('/app/parent/attendance');
ok(await see(page.getByText('Absent', { exact: true })), 'parent attendance page lists the absence');
await as('Student');
ok(await see(page.getByText(/Today: Absent/)), 'student dashboard shows “Today: Absent”');

// ───── 2. Assignment lifecycle ─────
console.log('\n— Workflow 2: publish → submit → evaluate → feedback visible');
const title = 'ZZ Test Quadratics Drill';
await as('Teacher');
await go('/app/teacher/assignments');
await page.getByRole('button', { name: 'New assignment' }).click();
const dlg = page.getByRole('dialog');
await dlg.getByLabel('Title *').fill(title);
await dlg.getByLabel('Class and subject *').selectOption('10-B|MAT');
await dlg.getByLabel('Deadline *').fill('2030-01-15');
await dlg.getByRole('button', { name: 'Publish' }).click();
await toast(/Assignment published/, 'teacher published assignment');
await as('Student');
await go('/app/student/assignments');
ok(await see(page.getByText(title)), 'student sees the new assignment');
await page.getByText(title).first().click();
await page.getByLabel('Your answer').fill('x = 2 and x = 3');
await page.getByRole('button', { name: 'Submit assignment' }).click();
await toast(/Assignment submitted/, 'student submitted');
await as('Teacher');
await go('/app/teacher/assignments');
await page.getByText(title).first().click();
await page.waitForURL(/assignments\/A/);
ok(await see(page.getByRole('row', { name: /Aarav Sharma/ })), 'teacher sees Aarav’s submission');
await page.getByRole('row', { name: /Aarav Sharma/ }).getByRole('button', { name: 'Evaluate' }).click();
await page.getByRole('dialog').getByLabel(/^Marks/).fill('8');
await page.getByRole('dialog').getByLabel('Feedback for the student').fill('Great working, check the last step.');
await page.getByRole('button', { name: 'Save evaluation' }).click();
await toast(/Evaluation saved/, 'teacher evaluated');
await as('Student');
await go('/app/student/assignments');
const card = await page.locator('li', { hasText: title }).first().innerText();
ok(/Evaluated/.test(card) && /8\/10/.test(card) && /Great working/.test(card), 'student sees marks 8/10 and teacher feedback');
await as('Parent');
await go('/app/parent/assignments');
ok(/Great working/.test(await page.locator('li', { hasText: title }).first().innerText()), 'parent sees the evaluated assignment and feedback');

// ───── 3. Marks entry → results everywhere ─────
console.log('\n— Workflow 3: teacher enters marks → student/parent see result → principal approves');
await as('Teacher');
await go('/app/teacher/marks');
await page.getByLabel('Examination').selectOption('E2');
await page.getByLabel('Class and subject').selectOption('10-B|MAT');
const inputs = page.locator('input[aria-label^="Marks for"]');
const n = await inputs.count();
for (let i = 0; i < n; i++) await inputs.nth(i).fill(String(60 + (i % 35)));
await inputs.nth(0).fill('150');
await page.getByRole('button', { name: 'Submit marks' }).click();
await toast(/must be between 0 and 100/, 'out-of-range marks are rejected with a clear message');
await inputs.nth(0).fill('92');
await page.getByRole('button', { name: 'Submit marks' }).click();
await toast(/Marks submitted/, 'teacher submitted marks');
await as('Student');
await go('/app/student/academics');
await page.getByRole('tab', { name: /Mid-Term/ }).click();
ok(await see(page.getByRole('cell', { name: 'Mathematics' })), 'student sees Mathematics in the Mid-Term results');
await as('Parent');
await go('/app/parent/academics');
await page.getByRole('tab', { name: /Mid-Term/ }).click();
ok(await see(page.getByRole('cell', { name: 'Mathematics' })), 'parent sees the Mathematics result');
await as('Principal / Administrator');
await go('/app/admin/marks');
await page.getByLabel('Examination').selectOption('E2');
await page.getByPlaceholder(/^Search/).fill('10-B Mathematics');
await page.getByPlaceholder(/^Search/).fill('10-B Mathematics');
await page.getByRole('row', { name: /10-B.*Mathematics/ }).getByRole('button', { name: 'Approve' }).click();
await toast(/Marks approved/, 'principal approved the marks');

// ───── 4. Admin CRUD ─────
console.log('\n— Workflow 4: student CRUD, search, filter, export');
await as('Principal / Administrator');
await go('/app/admin/students');
await page.getByRole('button', { name: 'Add student' }).first().click();
const d2 = page.getByRole('dialog');
await d2.getByRole('button', { name: 'Add student' }).click();
await toast(/Student name is required/, 'validation: empty student form is rejected');
await d2.getByLabel('Full name *').fill('Zed Zztestson');
await d2.getByLabel('Date of birth *').fill('2012-05-04');
await d2.getByLabel('Parent / guardian name *').fill('Mr. Zzparent');
await d2.getByRole('button', { name: 'Add student' }).click();
await toast(/Student added/, 'student created');
await page.getByPlaceholder(/^Search/).fill('Zztestson');
ok(await see(page.getByText('Zed Zztestson')), 'search finds the new student');
await page.getByLabel('Edit Zed Zztestson').click();
await page.getByRole('dialog').getByLabel('Full name *').fill('Zed Zzrenamed');
await page.getByRole('button', { name: 'Save changes' }).click();
await toast(/Student updated/, 'student edited');
await page.getByPlaceholder(/^Search/).fill('Zzrenamed');
const dl = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const file = await dl;
ok(/students\.csv/.test(file.suggestedFilename()), `CSV export downloaded (${file.suggestedFilename()})`);
await page.getByLabel('Delete Zed Zzrenamed').click();
await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
await toast(/Student deleted/, 'student deleted after confirmation');
ok(await page.getByText('Zed Zzrenamed').count() === 0, 'deleted student is gone from the table');
await page.getByPlaceholder(/^Search/).fill('');
await page.getByLabel('All classes').selectOption('10');
ok(/Showing 1–12 of 72|72 record/.test(await page.locator('main').innerText()), 'class filter works (72 students in Class 10)');

// ───── 5. Settings take effect ─────
console.log('\n— Workflow 5: grading rules change grades everywhere');
await go('/app/admin/settings');
await page.getByRole('tab', { name: 'Grading rules' }).click();
await page.locator('input[type=number]').first().fill('95');
await page.getByRole('button', { name: 'Save grading' }).click();
await toast(/Grading rules saved/, 'grading rules saved');
await page.getByRole('tab', { name: 'Grading rules' }).click();
ok((await page.locator('input[type=number]').first().inputValue()) === '95', 'new minimum for A1 persisted (95)');

// ───── 6. AI features ─────
console.log('\n— Workflow 6: AI Copilot and Tutor (demo mode)');
await as('Teacher');
await go('/app/teacher/copilot');
await page.getByRole('button', { name: 'Generate' }).click();
await toast(/Generated/, 'copilot generated a worksheet');
ok(/Demo AI/.test(await page.locator('main').innerText()), 'output is labelled “Demo AI”');
await page.getByRole('button', { name: 'Save to library' }).click();
await toast(/Saved to your library/, 'draft saved to library');
await as('Student');
await go('/app/student/tutor');
await page.getByLabel('Subject (optional)').selectOption('MAT');
await page.getByLabel('Chapter (optional)').selectOption('Algebra: Quadratic Equations');
await page.getByLabel('Ask the AI Tutor').fill('give me practice questions');
await page.getByRole('button', { name: 'Send' }).click();
await page.getByRole('button', { name: /^\(a\) / }).first().waitFor();
ok(true, 'tutor returned interactive practice questions');
await page.getByLabel('Ask the AI Tutor').fill('explain photosynthesis in detail');
await page.getByLabel('Subject (optional)').selectOption('');
await page.getByRole('button', { name: 'Send' }).click();
ok(await see(page.getByText(/improvise|could not find approved/i)), 'tutor admits when it has no approved content instead of inventing');

// ───── 7. Persistence and reset ─────
console.log('\n— Workflow 7: persistence and reset');
await go('/app/student/planner');
await page.getByRole('button', { name: 'Add goal or topic' }).click();
await page.getByRole('dialog').getByLabel('What do you want to achieve?').fill('ZZ persistent goal');
await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
await toast(/Added to your planner/, 'goal added');
await page.reload({ waitUntil: 'networkidle' });
ok(await see(page.getByText('ZZ persistent goal')), 'goal survived a full page reload');
await page.getByRole('button', { name: /Aarav Sharma/ }).click();
await page.getByRole('menuitem', { name: /Reset demo data/ }).click();
await page.getByRole('button', { name: 'Reset everything' }).click();
await page.waitForTimeout(600);
await go('/app/student/planner');
ok(await page.getByText('ZZ persistent goal').count() === 0, 'reset restored the original data');

ok(errs.length === 0, `no console errors during all workflows${errs.length ? ': ' + errs.slice(0, 3).join(' | ').slice(0, 300) : ''}`);
await browser.close();
console.log(fails ? `\nWORKFLOWS: ${fails} FAILURE(S)` : '\nWORKFLOWS: ALL PASS');
process.exit(fails ? 1 : 0);

