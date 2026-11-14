# SchoolOS AI: The Intelligent School Operating System

One platform to manage school operations, empower teachers and accelerate every student's growth.
Four connected portals (management, teacher, student, parent) over one shared data model, with AI assistance.

**Everything runs in the browser against a fictional demo school ("Evergreen Heights School").** There is no server, so the data lives in `localStorage` and can be reset at any time. See "Honest limits" before treating this as production software.

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:4173
npm run build      # production build -> dist/
npm run preview    # serve the build
```

Open `/demo` and pick a role, or sign in at `/login` (every demo account uses password `demo123`):

| Role | Email |
|---|---|
| Correspondent / Super Admin | demo.admin@evergreen.demo |
| Principal | demo.principal@evergreen.demo |
| School Admin (limited) | demo.schooladmin@evergreen.demo |
| Teacher (Ms. Anita Verma) | demo.teacher@evergreen.demo |
| Student (Aarav Sharma, 10-B) | demo.student@evergreen.demo |
| Parent (Mr. Vikram Sharma, 2 children) | demo.parent@evergreen.demo |

A role switcher in the top bar (marked "Demo role switcher") lets you change role without signing in again. "Reset demo data" restores the original school.

## The 3-minute demo journey
1. **Teacher**: Attendance, Class 10-B (it opens there, because it is pending), mark a student absent, save.
2. **Switch to Principal**: the dashboard's absent count rises, and the activity feed and AI insights reflect it.
3. **Switch to Parent**: the bell shows a notification and the attendance page lists the absence.
4. **Switch to Student**: the dashboard says "Today: Absent"; try the AI Tutor and the Growth Passport.

Other connected flows: publish an assignment → student submits → teacher evaluates → student and parent see marks and feedback; teacher enters marks → student and parent see results → principal approves; parent pays a fee → administration sees the payment.

## What is built
**Management (20 areas):** executive dashboard, AI School Insights, students (add/edit/delete/search/filter/export, profile with attendance, results, fees, passport), teachers, classes and sections with subject-teacher assignment, subjects, timetable (conflict-checked), attendance, examinations, marks approval, report cards (print/PDF, CSV), assignment monitoring, fees with reminders and payments, announcements, parent communication, learning resources, student growth analytics, reports with CSV export, school settings (grading, notifications, preparation tracks), users and roles.

**Teacher (13):** dashboard, classes, students with feedback and passport, attendance (by class, date, period, with history and summaries), assignments with submissions and evaluation, marks entry (drafts, submit, automatic grades), examinations, resources, timetable, performance, **AI Teacher Copilot**, messages and meeting responses, profile.

**Student (13):** dashboard, timetable, attendance, academics and report cards, assignments with submission, Learning Hub (save, download), **AI Tutor**, study planner, practice quizzes, Board/JEE/NEET preparation (syllabus, tests, weak-topic analysis, revision calendar, error notebook, daily goals), performance intelligence, **Student Growth Passport**, profile.

**Parent (11):** dashboard, children (passport, performance), attendance, results and report cards, assignments, teacher feedback, announcements, messaging, meeting requests, fees with payment flow, profile.

## Roles and permissions
Six roles: Super Admin, School Admin, Principal, Teacher, Student, Parent. Every write goes through `src/lib/actions.js`, which checks the signed-in role **and ownership** (a teacher only touches their own classes and subjects, a parent only their own children, a student only their own work). Route guards add a second layer. Verified by `scripts/permissions.mjs` (43 checks that call the actions directly, bypassing the UI).

## The AI features are demo mode
No AI model is connected and none is claimed. The Copilot, Tutor and School Insights are deterministic:
- **Copilot / Tutor** draw on a hand-written question bank (`src/data/curriculum.js`, 17 chapters across Mathematics, Science, Physics, Chemistry, Biology, English, Computer Science). Chapters without approved content fall back to clearly marked templates, and the Tutor says it has no approved material instead of inventing an answer.
- **School Insights** are rules computed from real records (attendance drops, pending marks, weak subjects, overdue work). They show evidence, a suggested intervention and a priority.
- Every AI screen is labelled "Demo AI". A real provider belongs on a server so keys stay out of the browser.

## Testing (all run against the real UI)
```bash
npm run build && npm run preview     # in one terminal
node scripts/smoke.mjs               # 78 role/page checks + dead-link crawl
node scripts/workflows.mjs           # 39 cross-role workflow checks
node scripts/responsive.mjs          # 128 phone/tablet page loads, no horizontal overflow
npx vite --port 5199 &  node scripts/permissions.mjs   # 43 permission checks
```
Playwright is needed (`npm i -D playwright && npx playwright install chromium`).

Testing found and fixed real bugs, including a crash in the AI Tutor on current Chromium (an effect returned a Promise), duplicate form submissions, impossible future-dated records in the seed, and charts clipped inside cards.

## Honest limits
- **No backend.** Data is per-browser and unprotected by real security. The permission layer protects the demo's workflows, not the stored data (anyone can open DevTools). A production version needs a server, real authentication and a database. The action layer in `src/lib/actions.js` is the natural API surface to move there.
- **Passwords** are a shared demo password. There is no email, SMS or WhatsApp delivery. "Notifications" are in-app.
- **Fee payments** are recorded only; no payment gateway. **File uploads** over 300 KB keep only the file name.
- **Seed data is fictional**, including achievements (marked "Sample"). Marks, attendance and assignments are generated deterministically.
- The Tutor and Copilot cover 17 chapters in depth; other chapters use templates.
- The public site's hero mock-up is a drawn illustration, not a screenshot. Video resources open a YouTube search, which is the one external link.
- Tested in Chromium only. Stored data limit is about 5 MB; the demo uses about 1 MB.

## Project layout
```
src/data/     seed.js (deterministic school), curriculum.js (chapters, question bank, syllabi)
src/lib/      store.js (persistence), actions.js (all writes + permissions), selectors.js (derived data + insights), ai.js (demo AI), perms.js
src/portals/  admin/, teacher/, student/, parent/, shared.jsx, attendance.jsx, marks.jsx
src/ui/       kit.jsx (tables, modals, forms, charts, toasts)
src/pages/    public site (home, features, demo, login)
scripts/      smoke, workflows, permissions, responsive tests
docs/         AUDIT.md, CHECKLIST.md, screens/
```
