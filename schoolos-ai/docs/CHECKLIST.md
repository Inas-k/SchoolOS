# Development checklist

[x] done and tested   [~] done, limited by the demo architecture   [ ] not done

## Phase 1 Audit
- [x] Inventory and classification (docs/AUDIT.md)

## Phase 2 Brand and navigation
- [x] All Skooly names, logo, links, copy, testimonials and sales widget removed (grep clean)
- [x] React Router, guarded portals, no dead links (crawl of 70+ links across all roles)

## Phase 3 Data and auth
- [x] 504 students, 32 teachers, 14 sections, 1,042 accounts, internally consistent
- [x] Persistence in localStorage, reset, storage-full warning
- [x] Role permissions enforced in the action layer (43 direct checks) and route guards
- [~] Authentication is demo-only (shared password, no server)

## Phase 4 School management
- [x] Students, teachers, classes/sections, subjects, timetable, attendance, exams, marks, report cards, assignments, fees, announcements, communication, resources, growth, reports, settings, users

## Phase 5 Portals
- [x] Admin (20), Teacher (13), Student (13), Parent (11)

## Phase 6 AI
- [x] Teacher Copilot, AI Tutor, School Insights, performance intelligence, planner, passport, Board/JEE/NEET
- [~] AI runs in labelled demo mode (no external model)

## Phase 7 Quality
- [x] 78 smoke checks, 39 workflow checks, 43 permission checks, 128 responsive loads, 56 chart-containment checks
- [x] Zero console errors across all runs
- [ ] Not tested: browsers other than Chromium, screen readers beyond labels/roles, load with thousands of students
