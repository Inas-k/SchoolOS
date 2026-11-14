// Calls the action layer directly (bypassing the UI) as each role and checks scope enforcement.
// Needs the Vite dev server so the real modules can be imported:  npx vite --port 5199  then
//   node scripts/permissions.mjs http://127.0.0.1:5199
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:5199';
const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
const pageErrors = [];
p.on('pageerror', (e) => pageErrors.push(e.message));
await p.goto(BASE + '/');
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'networkidle' });

const out = await p.evaluate(async () => {
  const A = await import('/src/lib/actions.js');
  const S = await import('/src/lib/selectors.js');
  const store = await import('/src/lib/store.js');
  const res = [];
  const s0 = () => store.getState();
  const ids = s0().demo.userIds;
  const expectDenied = async (label, fn) => {
    const before = JSON.stringify(s0()).length;
    let msg = null, name = null;
    try { fn(); } catch (e) { msg = e.message; name = e.name; }
    const same = JSON.stringify(s0()).length === before;
    res.push({ label, ok: !!msg && same, detail: msg ? `${name}: ${msg}` : 'NOT BLOCKED', unchanged: same });
  };
  const expectAllowed = async (label, fn) => {
    let msg = null;
    try { fn(); } catch (e) { msg = e.message; }
    res.push({ label, ok: !msg, detail: msg || 'allowed' });
  };
  const st = s0();
  const demoStudent = st.demo.students;
  const otherStudent = st.students.find((x) => x.sectionId === '7-B');
  const otherParent = st.parents.find((x) => x.id === otherStudent.parentId);
  const otherFee = st.feeRecords.find((f) => f.studentId === otherStudent.id);
  const as = (k) => A.loginAs(ids[k]);

  A.logout();
  await expectDenied('signed-out user cannot save attendance', () => A.saveAttendance({ date: S.today(), sectionId: '10-B', period: 1, marks: {} }));

  as('student');
  await expectDenied('student cannot enter marks', () => A.saveMarks({ examId: 'E2', sectionId: '10-B', subjectId: 'MAT', values: {}, submit: false }));
  await expectDenied('student cannot approve marks', () => A.approveMarks('E2|10-B|MAT', true));
  await expectDenied('student cannot add a student', () => A.addStudent({ name: 'X', sectionId: '10-B', dob: '2012-01-01', parentName: 'Y' }));
  await expectDenied('student cannot mark attendance', () => A.saveAttendance({ date: S.today(), sectionId: '10-B', period: 1, marks: {} }));
  await expectDenied('student cannot post an announcement', () => A.postAnnouncement({ title: 'x', body: 'y', audience: ['all'] }));
  await expectDenied('student cannot change grading rules', () => A.updateGrading([{ grade: 'A', min: 0 }]));
  await expectDenied('student cannot pay or edit another child’s fee', () => A.payFee(otherFee.id, 100));
  const otherSecAssign = st.assignments.find((a) => a.sectionId === '7-B');
  await expectDenied('student cannot submit an assignment of another class', () => A.submitAssignment(otherSecAssign.id, { text: 'hi' }));
  await expectAllowed('student CAN add a planner goal', () => A.addGoal({ title: 'perm test', deadline: '2030-01-01' }));

  as('parent');
  await expectDenied('parent cannot pay another family’s fee', () => A.payFee(otherFee.id, 100));
  await expectDenied('parent cannot request a meeting about someone else’s child', () => A.requestMeeting({ studentId: otherStudent.id, teacherId: 'T01', date: '2030-01-01', reason: 'x' }));
  await expectDenied('parent cannot message a non-teacher (the principal)', () => A.sendMessage({ toId: ids.principal, studentId: demoStudent, body: 'hi' }));
  const teacherOfOther = st.teachers.find((t) => t.assignments.every((a) => a.sectionId !== '10-B') && !st.sections.some((x) => x.classTeacherId === t.id && x.id === '10-B'));
  await expectDenied('parent cannot message a teacher who does not teach their child', () => A.sendMessage({ toId: 'u_' + teacherOfOther.id, studentId: demoStudent, body: 'hi' }));
  await expectDenied('parent cannot enter attendance', () => A.saveAttendance({ date: S.today(), sectionId: '10-B', period: 1, marks: {} }));
  await expectDenied('parent cannot submit student homework', () => A.submitAssignment(st.assignments.find((a) => a.sectionId === '10-B').id, { text: 'hi' }));
  const fee10 = st.feeRecords.find((f) => f.studentId === demoStudent && f.paid < f.amount);
  await expectDenied('parent cannot overpay an invoice', () => A.payFee(fee10.id, fee10.amount * 2));
  await expectAllowed('parent CAN pay own child’s fee', () => A.payFee(fee10.id, 100));

  as('teacher');
  const tid = s0().demo.teacher;
  const notMine = st.sections.find((x) => S.teacherSectionIds(st, tid).every((id) => id !== x.id)).id;
  await expectDenied('teacher cannot mark attendance for a class they do not teach', () => A.saveAttendance({ date: S.today(), sectionId: notMine, period: 1, marks: {} }));
  await expectDenied('teacher cannot back-date attendance beyond 2 days', () => A.saveAttendance({ date: '2026-01-05', sectionId: '10-B', period: 1, marks: {} }));
  await expectDenied('teacher cannot mark attendance for a future date', () => A.saveAttendance({ date: '2999-01-01', sectionId: '10-B', period: 1, marks: {} }));
  await expectDenied('teacher cannot enter marks for a subject they do not teach', () => A.saveMarks({ examId: 'E2', sectionId: '10-B', subjectId: 'ENG', values: {}, submit: false }));
  await expectDenied('teacher cannot enter marks above the maximum', () => A.saveMarks({ examId: 'E2', sectionId: '10-B', subjectId: 'MAT', values: { [s0().students.find((x) => x.sectionId === '10-B').id]: 500 }, submit: false }));
  await expectDenied('teacher cannot approve marks', () => A.approveMarks('E1|10-B|MAT', true));
  await expectDenied('teacher cannot edit approved marks', () => A.saveMarks({ examId: 'E1', sectionId: '10-B', subjectId: 'MAT', values: {}, submit: false }));
  await expectDenied('teacher cannot create an assignment for another class', () => A.saveAssignment(null, { title: 't', sectionId: notMine, subjectId: 'MAT', due: '2030-01-01', maxMarks: 10 }));
  const foreign = st.assignments.find((a) => a.teacherId !== tid);
  await expectDenied('teacher cannot delete another teacher’s assignment', () => A.deleteAssignment(foreign.id));
  const foreignSub = st.submissions.find((x) => st.assignments.find((a) => a.id === x.assignmentId).teacherId !== tid);
  await expectDenied('teacher cannot grade another teacher’s submissions', () => A.reviewSubmission(foreignSub.id, { marks: 5, feedback: '' }));
  await expectDenied('teacher cannot add students', () => A.addStudent({ name: 'X', sectionId: '10-B', dob: '2012-01-01', parentName: 'Y' }));
  await expectDenied('teacher cannot message the parent of a student they do not teach', () => A.sendMessage({ toId: 'u_' + otherParent.id, studentId: otherStudent.id, body: 'hi' }));
  await expectDenied('teacher cannot change settings', () => A.updateSchool({ name: 'Hacked' }));
  await expectAllowed('teacher CAN mark attendance for 10-B today', () => A.saveAttendance({ date: S.today(), sectionId: '10-B', period: 1, marks: {} }));

  as('schoolAdmin');
  await expectDenied('school admin cannot approve marks', () => A.approveMarks('E1|10-B|MAT', true));
  await expectDenied('school admin cannot manage users', () => A.createStaffUser({ name: 'X', email: 'x@y.zz', role: 'principal' }));
  await expectAllowed('school admin CAN add a class', () => A.addClass(5));
  as('principal');
  await expectDenied('principal cannot manage users', () => A.setUserRole(ids.schoolAdmin, 'principal'));
  await expectAllowed('principal CAN approve marks', () => { A.saveMarks; A.approveMarks('E1|10-B|MAT', true); });
  as('admin');
  await expectDenied('super admin cannot deactivate own account', () => A.setUserActive(ids.admin, false));
  await expectDenied('super admin cannot delete a teacher who still teaches classes', () => A.deleteTeacher(tid));
  await expectDenied('invalid grading rules are rejected', () => A.updateGrading([{ grade: 'A', min: 50 }]));
  await expectDenied('duplicate section is rejected', () => A.addSection('10', 'A'));
  await expectDenied('student form validation: bad parent email', () => A.addStudent({ name: 'X', sectionId: '10-B', dob: '2012-01-01', parentName: 'Y', parentEmail: 'not-an-email' }));
  await expectAllowed('super admin CAN change a role', () => A.setUserRole(ids.schoolAdmin, 'school_admin'));
  A.loginAs(ids.admin);
  const size = JSON.stringify(s0()).length;
  const counts = { students: s0().students.length, teachers: s0().teachers.length, sections: s0().sections.length, users: s0().users.length };
  return { res, size, counts };
});

let fails = 0;
for (const r of out.res) { if (!r.ok) fails++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}${r.ok ? '' : '  -> ' + r.detail}`); }
console.log(`\nDataset: ${JSON.stringify(out.counts)}; persisted state ${(out.size / 1024).toFixed(0)} KB (browser limit is about 5,000 KB)`);
if (pageErrors.length) { fails++; console.log('PAGE ERRORS', pageErrors.slice(0, 3)); }
await b.close();
console.log(fails ? `\nPERMISSIONS: ${fails} FAILURE(S)` : '\nPERMISSIONS: ALL PASS');
process.exit(fails ? 1 : 0);
