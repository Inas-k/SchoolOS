// All writes go through here. Each action checks the signed-in user's permission and ownership,
// then applies the change atomically and fires cross-role notifications.
import { getState, mutate, resetDemo } from './store';
import { can, PermissionError } from './perms';
import { addDays, uid } from './util';
import { DEMO_PASSWORD } from '../data/seed';
import { childrenOf, currentUser, idx, marksKey, sectionLabel, subjectName, teacherOf, teacherSectionIds, teachesPair, teachesSection, today, studentName } from './selectors';

const fail = (msg) => {
  throw new Error(msg);
};
const deny = (msg) => {
  throw new PermissionError(msg);
};
function actor(perm) {
  const s = getState();
  const u = currentUser(s);
  if (!u || !u.active) deny('Please sign in to continue.');
  if (perm && !can(u.role, perm)) deny();
  return { s, u };
}
const isAdminRole = (r) => ['super_admin', 'school_admin', 'principal'].includes(r);
const adminIds = (d) => d.users.filter((u) => isAdminRole(u.role) && u.active).map((u) => u.id);

function notify(d, category, userIds, text, link) {
  if (category && d.school.notify[category] === false) return;
  const at = new Date().toISOString();
  [...new Set(userIds)].forEach((userId) => d.notifications.unshift({ id: uid('N'), userId, text, at, read: false, link }));
  if (d.notifications.length > 400) d.notifications.length = 400;
}
const parentUserOf = (s, studentId) => {
  const st = idx(s).students[studentId];
  return st ? `u_${st.parentId}` : null;
};

// ───────── auth (demo) ─────────
export function login(email, password) {
  const s = getState();
  const u = s.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!u || password !== DEMO_PASSWORD) fail('Incorrect email or password.');
  if (!u.active) fail('This account has been deactivated.');
  mutate((d) => void (d.session.userId = u.id));
  return u;
}
export function loginAs(userId) {
  const s = getState();
  const u = idx(s).users[userId];
  if (!u || !u.active) fail('Account not available.');
  mutate((d) => void (d.session.userId = userId));
  return u;
}
export const logout = () => mutate((d) => void (d.session.userId = null));
export const resetDemoData = () => {
  const { u } = actor();
  resetDemo(u.id);
};

// ───────── students, parents ─────────
function checkStudentFields(f) {
  if (!f.name?.trim()) fail('Student name is required.');
  if (!f.sectionId) fail('Please choose a class and section.');
  if (!f.dob) fail('Date of birth is required.');
  if (f.dob > today()) fail('Date of birth cannot be in the future.');
}
export function addStudent(f) {
  const { s } = actor('students.manage');
  checkStudentFields(f);
  if (!f.parentName?.trim()) fail("Parent / guardian name is required.");
  if (f.parentEmail && !/^\S+@\S+\.\S+$/.test(f.parentEmail)) fail('Parent email is not valid.');
  if (f.parentEmail && s.users.some((u) => u.email.toLowerCase() === f.parentEmail.toLowerCase())) fail('That email is already in use.');
  const sec = idx(s).sections[f.sectionId];
  const n = Math.max(...s.students.map((x) => Number(x.id.slice(1)))) + 1;
  const id = `S${String(n).padStart(4, '0')}`;
  const pid = `P${String(n).padStart(4, '0')}`;
  mutate((d) => {
    const roll = d.students.filter((x) => x.sectionId === f.sectionId).length + 1;
    d.students.push({ id, admNo: f.admNo?.trim() || `EH26${String(n).padStart(3, '0')}`, name: f.name.trim(), gender: f.gender || 'M', dob: f.dob, classId: sec.classId, sectionId: f.sectionId, parentId: pid, rollNo: roll, bloodGroup: f.bloodGroup || '', address: f.address || '', status: 'active', joined: today() });
    d.parents.push({ id: pid, name: f.parentName.trim(), email: f.parentEmail?.trim() || `parent.${String(n).padStart(4, '0')}@evergreen.demo`, phone: f.parentPhone || '', childIds: [id] });
    d.users.push({ id: `u_${id}`, role: 'student', name: f.name.trim(), email: `student.${String(n).padStart(4, '0')}@evergreen.demo`, linkedId: id, active: true });
    d.users.push({ id: `u_${pid}`, role: 'parent', name: f.parentName.trim(), email: f.parentEmail?.trim() || `parent.${String(n).padStart(4, '0')}@evergreen.demo`, linkedId: pid, active: true });
    ['Term 1', 'Term 2', 'Term 3'].forEach((term, i) => d.feeRecords.push({ id: uid('F'), studentId: id, term, amount: 15000 + 1000 * Number(sec.classId), due: addDays(today(), (i - 1) * 60), paid: 0, pay: [] }));
    d.skills[id] = { communication: 3, leadership: 3, creativity: 3, teamwork: 3, criticalThinking: 3 };
  });
  return id;
}
export function updateStudent(id, f) {
  const { s } = actor('students.manage');
  checkStudentFields(f);
  const st = idx(s).students[id];
  if (!st) fail('Student not found.');
  mutate((d) => {
    const x = d.students.find((y) => y.id === id);
    const sec = d.sections.find((y) => y.id === f.sectionId);
    Object.assign(x, { name: f.name.trim(), gender: f.gender, dob: f.dob, sectionId: f.sectionId, classId: sec.classId, bloodGroup: f.bloodGroup, address: f.address, admNo: f.admNo || x.admNo, status: f.status || x.status });
    const u = d.users.find((y) => y.id === `u_${id}`);
    if (u) u.name = x.name;
    const p = d.parents.find((y) => y.id === x.parentId);
    if (p && f.parentName) Object.assign(p, { name: f.parentName, phone: f.parentPhone ?? p.phone });
  });
}
export function deleteStudent(id) {
  const { s } = actor('students.manage');
  const st = idx(s).students[id];
  if (!st) fail('Student not found.');
  mutate((d) => {
    d.students = d.students.filter((x) => x.id !== id);
    d.submissions = d.submissions.filter((x) => x.studentId !== id);
    d.feeRecords = d.feeRecords.filter((x) => x.studentId !== id);
    d.feedback = d.feedback.filter((x) => x.studentId !== id);
    d.achievements = d.achievements.filter((x) => x.studentId !== id);
    d.quizAttempts = d.quizAttempts.filter((x) => x.studentId !== id);
    d.meetings = d.meetings.filter((x) => x.studentId !== id);
    d.messages = d.messages.filter((x) => x.studentId !== id);
    delete d.skills[id]; delete d.goals[id]; delete d.prep[id]; delete d.savedResources[id];
    d.users = d.users.filter((u) => u.id !== `u_${id}`);
    const p = d.parents.find((x) => x.id === st.parentId);
    if (p) {
      p.childIds = p.childIds.filter((c) => c !== id);
      if (!p.childIds.length) {
        d.parents = d.parents.filter((x) => x.id !== p.id);
        d.users = d.users.filter((u) => u.id !== `u_${p.id}`);
      }
    }
  });
}

// ───────── teachers ─────────
export function saveTeacher(id, f) {
  const { s } = actor('teachers.manage');
  if (!f.name?.trim()) fail('Teacher name is required.');
  if (!/^\S+@\S+\.\S+$/.test(f.email || '')) fail('A valid email is required.');
  if (!f.subjectIds?.length) fail('Choose at least one subject.');
  if (s.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.linkedId !== id)) fail('That email is already in use.');
  mutate((d) => {
    if (id) {
      const t = d.teachers.find((x) => x.id === id);
      Object.assign(t, { name: f.name.trim(), email: f.email.trim(), phone: f.phone, qualification: f.qualification, subjectIds: f.subjectIds, active: f.active !== false });
      const u = d.users.find((x) => x.linkedId === id && x.role === 'teacher');
      if (u) Object.assign(u, { name: t.name, email: t.email, active: t.active });
    } else {
      const n = Math.max(...d.teachers.map((x) => Number(x.id.slice(1)))) + 1;
      const tid = `T${String(n).padStart(2, '0')}`;
      d.teachers.push({ id: tid, name: f.name.trim(), email: f.email.trim(), phone: f.phone || '', qualification: f.qualification || '', subjectIds: f.subjectIds, assignments: [], joined: today(), active: true });
      d.users.push({ id: `u_${tid}`, role: 'teacher', name: f.name.trim(), email: f.email.trim(), linkedId: tid, active: true });
    }
  });
}
export function deleteTeacher(id) {
  const { s } = actor('teachers.manage');
  const t = idx(s).teachers[id];
  if (!t) fail('Teacher not found.');
  if (t.assignments.length) fail(`${t.name} still teaches ${t.assignments.length} class-subject combinations. Reassign them first.`);
  if (s.sections.some((x) => x.classTeacherId === id)) fail('This teacher is a class teacher. Assign another class teacher first.');
  mutate((d) => {
    d.teachers = d.teachers.filter((x) => x.id !== id);
    d.users = d.users.filter((u) => u.linkedId !== id || u.role !== 'teacher');
  });
}
export function assignTeacher(sectionId, subjectId, teacherId) {
  const { s } = actor('classes.manage');
  const t = idx(s).teachers[teacherId];
  if (!t) fail('Choose a teacher.');
  if (!t.subjectIds.includes(subjectId)) fail(`${t.name} is not listed as a ${subjectName(s, subjectId)} teacher.`);
  mutate((d) => {
    d.teachers.forEach((x) => (x.assignments = x.assignments.filter((a) => !(a.sectionId === sectionId && a.subjectId === subjectId))));
    d.teachers.find((x) => x.id === teacherId).assignments.push({ sectionId, subjectId });
    Object.values(d.timetable[sectionId] || {}).forEach((day) => day.forEach((slot) => { if (slot.s === subjectId) slot.t = teacherId; }));
  });
}

// ───────── classes, subjects, timetable ─────────
export function addSection(classId, name) {
  const { s } = actor('classes.manage');
  const n = name?.trim().toUpperCase();
  if (!n) fail('Section name is required.');
  const cls = idx(s).classes[classId];
  const id = `${cls.no}-${n}`;
  if (idx(s).sections[id]) fail(`Section ${id} already exists.`);
  mutate((d) => {
    d.sections.push({ id, classId, name: n, classTeacherId: null, room: '' });
    d.timetable[id] = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };
    Object.values(d.timetable[id]).forEach((arr) => { for (let i = 0; i < 7; i++) arr.push({ s: null, t: null }); });
  });
}
export function addClass(no) {
  const { s } = actor('classes.manage');
  const n = Number(no);
  if (!Number.isInteger(n) || n < 1 || n > 12) fail('Enter a class number between 1 and 12.');
  if (s.classes.some((c) => c.no === n)) fail(`Class ${n} already exists.`);
  mutate((d) => {
    d.classes.push({ id: String(n), name: `Class ${n}`, no: n });
    d.classes.sort((a, b) => a.no - b.no);
  });
}
export function updateSection(id, f) {
  actor('classes.manage');
  mutate((d) => Object.assign(d.sections.find((x) => x.id === id), { classTeacherId: f.classTeacherId || null, room: f.room || '' }));
}
export function deleteSection(id) {
  const { s } = actor('classes.manage');
  if ((idx(s).studentsBySection[id] || []).length) fail('This section still has students. Move them first.');
  mutate((d) => {
    d.sections = d.sections.filter((x) => x.id !== id);
    delete d.timetable[id];
    d.teachers.forEach((t) => (t.assignments = t.assignments.filter((a) => a.sectionId !== id)));
  });
}
export function saveSubject(id, f) {
  const { s } = actor('subjects.manage');
  const code = (f.code || '').trim().toUpperCase();
  if (!f.name?.trim()) fail('Subject name is required.');
  if (!/^[A-Z]{2,4}$/.test(code)) fail('Subject code must be 2 to 4 letters.');
  if (!f.classIds?.length) fail('Choose at least one class.');
  if (!id && s.subjects.some((x) => x.id === code)) fail('That subject code already exists.');
  mutate((d) => {
    if (id) Object.assign(d.subjects.find((x) => x.id === id), { name: f.name.trim(), classIds: f.classIds, color: f.color || '#0072e5' });
    else d.subjects.push({ id: code, name: f.name.trim(), color: f.color || '#0072e5', classIds: f.classIds });
  });
}
export function deleteSubject(id) {
  const { s } = actor('subjects.manage');
  if (s.teachers.some((t) => t.assignments.some((a) => a.subjectId === id)) || s.assignments.some((a) => a.subjectId === id)) fail('This subject is in use by teachers or assignments. Reassign those first.');
  mutate((d) => (d.subjects = d.subjects.filter((x) => x.id !== id)));
}
export function setTimetableSlot(sectionId, day, periodIdx, subjectId) {
  const { s } = actor('timetable.manage');
  let teacherId = null;
  if (subjectId) {
    teacherId = teacherOf(s, sectionId, subjectId)?.id || null;
    if (!teacherId) fail(`No teacher is assigned to ${subjectName(s, subjectId)} for this section. Assign one in Classes & Sections first.`);
    const clash = s.sections.find((sec) => sec.id !== sectionId && s.timetable[sec.id]?.[day]?.[periodIdx]?.t === teacherId);
    if (clash) fail(`${idx(s).teachers[teacherId].name} is already teaching ${sectionLabel(s, clash.id)} in that period.`);
  }
  mutate((d) => void (d.timetable[sectionId][day][periodIdx] = { s: subjectId || null, t: teacherId }));
}

// ───────── attendance ─────────
export function saveAttendance({ date, sectionId, period = 1, marks }) {
  const { s, u } = actor();
  const admin = can(u.role, 'attendance.any');
  if (!admin && !can(u.role, 'attendance.mark')) deny();
  if (!admin && !teachesSection(s, u.linkedId, sectionId)) deny('You can only mark attendance for your own classes.');
  if (date > today()) fail('Attendance cannot be marked for a future date.');
  if (!admin && date < addDays(today(), -2)) deny('Attendance older than 2 days can only be changed by the administration.');
  const roster = idx(s).studentsBySection[sectionId] || [];
  const clean = {};
  roster.forEach((st) => { if (marks[st.id] === 'A' || marks[st.id] === 'L') clean[st.id] = marks[st.id]; });
  const prev = s.attendance[date]?.[sectionId]?.[period]?.marks || {};
  mutate((d) => {
    ((d.attendance[date] ||= {})[sectionId] ||= {})[period] = { by: u.linkedId || u.id, at: new Date().toISOString(), marks: clean };
    const newly = Object.entries(clean).filter(([sid, v]) => prev[sid] !== v);
    newly.forEach(([sid, v]) => notify(d, 'attendance', [parentUserOf(s, sid)], `${studentName(s, sid)} was marked ${v === 'A' ? 'absent' : 'late'} on ${date} (period ${period}).`, '/app/parent/attendance'));
    const absent = Object.values(clean).filter((v) => v === 'A').length;
    if (absent >= 6) notify(d, null, adminIds(d), `High absence: ${absent} students absent in ${sectionLabel(s, sectionId)} on ${date}.`, '/app/admin/attendance');
  });
}

// ───────── exams and marks ─────────
export function saveExam(id, f) {
  const { s } = actor('exams.manage');
  if (!f.name?.trim()) fail('Exam name is required.');
  if (!f.date) fail('Exam date is required.');
  if (!(Number(f.max) > 0)) fail('Maximum marks must be a positive number.');
  if (!f.classIds?.length) fail('Choose at least one class.');
  mutate((d) => {
    const rec = { name: f.name.trim(), type: f.type || 'Unit Test', date: f.date, max: Number(f.max), classIds: f.classIds, status: f.date <= today() ? 'completed' : 'scheduled' };
    if (id) Object.assign(d.exams.find((x) => x.id === id), rec);
    else d.exams.push({ id: `E${Math.max(...d.exams.map((x) => Number(x.id.slice(1)))) + 1}`, ...rec });
  });
}
export function deleteExam(id) {
  const { s } = actor('exams.manage');
  if (s.marks[id] && Object.keys(s.marks[id]).length) fail('Marks have already been entered for this exam, so it cannot be deleted.');
  mutate((d) => (d.exams = d.exams.filter((x) => x.id !== id)));
}
export function saveMarks({ examId, sectionId, subjectId, values, submit }) {
  const { s, u } = actor('marks.enter');
  if (!teachesPair(s, u.linkedId, sectionId, subjectId)) deny('You can only enter marks for classes and subjects you teach.');
  const exam = idx(s).exams[examId];
  if (!exam) fail('Exam not found.');
  if (exam.date > today()) fail('This exam has not been conducted yet.');
  const key = marksKey(examId, sectionId, subjectId);
  if (s.marksStatus[key]?.status === 'approved') deny('These marks are approved. Ask the Principal to reopen them for editing.');
  const roster = idx(s).studentsBySection[sectionId] || [];
  const clean = {};
  for (const st of roster) {
    const raw = values[st.id];
    if (raw === '' || raw == null) { if (submit) fail(`Enter marks for ${st.name} (or use 0 if absent).`); continue; }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > exam.max) fail(`Marks for ${st.name} must be between 0 and ${exam.max}.`);
    clean[st.id] = n;
  }
  mutate((d) => {
    d.marks[examId] ||= {};
    d.marks[examId][subjectId] ||= {};
    roster.forEach((st) => delete d.marks[examId][subjectId][st.id]);
    Object.assign(d.marks[examId][subjectId], clean);
    d.marksStatus[key] = { status: submit ? 'submitted' : 'draft', by: u.linkedId, at: new Date().toISOString() };
    if (submit) {
      notify(d, null, adminIds(d), `${u.name} submitted ${subjectName(s, subjectId)} marks for ${sectionLabel(s, sectionId)} (${exam.name}).`, '/app/admin/marks');
      roster.forEach((st) => notify(d, 'marks', [`u_${st.id}`, `u_${st.parentId}`], `${exam.name}: ${subjectName(s, subjectId)} result is now available.`, '/app/student/academics'));
    }
  });
}
export function approveMarks(key, approve = true, note = '') {
  const { s, u } = actor('marks.approve');
  const cur = s.marksStatus[key];
  if (!cur || !['submitted', 'approved'].includes(cur.status)) fail('Only submitted marks can be approved.');
  const [examId, secId, subjectId] = key.split('|');
  mutate((d) => {
    d.marksStatus[key] = approve ? { ...cur, status: 'approved', approvedBy: u.id, at: new Date().toISOString() } : { ...cur, status: 'draft', note };
    if (!approve) notify(d, null, [`u_${cur.by}`], `${sectionLabel(s, secId)} ${subjectName(s, subjectId)} marks were sent back for correction. ${note}`.trim(), '/app/teacher/marks');
  });
}

export function remindTeachers(keys, text = '') {
  const { s } = actor('exams.manage');
  if (!keys.length) fail('Select at least one marks sheet.');
  const byTeacher = {};
  keys.forEach((k) => {
    const [examId, secId, sid] = k.split('|');
    const t = teacherOf(s, secId, sid);
    if (t) (byTeacher[t.id] ||= []).push(`${sectionLabel(s, secId)} ${subjectName(s, sid)} (${idx(s).exams[examId]?.name})`);
  });
  mutate((d) => Object.entries(byTeacher).forEach(([tid, list]) => notify(d, null, [`u_${tid}`], `Reminder: please submit marks for ${list.join(', ')}. ${text}`.trim(), '/app/teacher/marks')));
  return Object.keys(byTeacher).length;
}

// ───────── assignments ─────────
export function saveAssignment(id, f) {
  const { s, u } = actor('assignments.manage');
  if (!f.title?.trim()) fail('Title is required.');
  if (!f.sectionId || !f.subjectId) fail('Choose a class and subject.');
  if (!f.due) fail('Set a deadline.');
  if (!(Number(f.maxMarks) > 0)) fail('Maximum marks must be positive.');
  if (!teachesPair(s, u.linkedId, f.sectionId, f.subjectId)) deny('You can only create assignments for classes and subjects you teach.');
  if (id && idx(s).assignments[id]?.teacherId !== u.linkedId) deny('You can only edit your own assignments.');
  let newId = id;
  mutate((d) => {
    const rec = { title: f.title.trim(), description: f.description || '', sectionId: f.sectionId, subjectId: f.subjectId, chapter: f.chapter || '', due: f.due, maxMarks: Number(f.maxMarks), status: f.status || 'published', attachments: f.attachments || [] };
    if (id) Object.assign(d.assignments.find((x) => x.id === id), rec);
    else {
      newId = `A${String(d.assignments.length + 1).padStart(3, '0')}${Date.now().toString(36).slice(-3)}`;
      d.assignments.push({ id: newId, teacherId: u.linkedId, createdAt: new Date().toISOString(), ...rec });
    }
    const wasPublished = id && idx(s).assignments[id]?.status === 'published';
    if (rec.status === 'published' && !wasPublished) {
      const roster = idx(s).studentsBySection[f.sectionId] || [];
      notify(d, 'assignments', roster.map((x) => `u_${x.id}`), `New assignment: ${rec.title} (due ${rec.due})`, '/app/student/assignments');
      notify(d, 'assignments', roster.map((x) => `u_${x.parentId}`), `New assignment for your child: ${rec.title} (due ${rec.due})`, '/app/parent/assignments');
    }
  });
  return newId;
}
export function deleteAssignment(id) {
  const { s, u } = actor('assignments.manage');
  const a = idx(s).assignments[id];
  if (!a || a.teacherId !== u.linkedId) deny('You can only delete your own assignments.');
  mutate((d) => {
    d.assignments = d.assignments.filter((x) => x.id !== id);
    d.submissions = d.submissions.filter((x) => x.assignmentId !== id);
  });
}
export function submitAssignment(assignmentId, { text, fileName, fileData }) {
  const { s, u } = actor('assignments.submit');
  const a = idx(s).assignments[assignmentId];
  const st = idx(s).students[u.linkedId];
  if (!a || a.status !== 'published' || a.sectionId !== st.sectionId) deny('This assignment is not assigned to you.');
  if (!text?.trim() && !fileName) fail('Write an answer or attach a file before submitting.');
  const existing = (idx(s).subsByAssignment[assignmentId] || []).find((x) => x.studentId === st.id);
  if (existing?.status === 'reviewed') deny('This submission has already been evaluated and can no longer be changed.');
  const late = a.due < today();
  mutate((d) => {
    const rec = { assignmentId, studentId: st.id, at: new Date().toISOString(), text: text?.trim() || '', fileName: fileName || '', fileData: fileData || '', late, status: 'submitted', marks: null, feedback: '' };
    if (existing) Object.assign(d.submissions.find((x) => x.id === existing.id), rec);
    else d.submissions.push({ id: uid('SB'), ...rec });
    notify(d, 'assignments', [`u_${a.teacherId}`], `${st.name} submitted "${a.title}"${late ? ' (late)' : ''}.`, `/app/teacher/assignments/${a.id}`);
  });
}
export function reviewSubmission(submissionId, { marks, feedback }) {
  const { s, u } = actor('assignments.manage');
  const sub = s.submissions.find((x) => x.id === submissionId);
  const a = sub && idx(s).assignments[sub.assignmentId];
  if (!a || a.teacherId !== u.linkedId) deny('You can only evaluate submissions for your own assignments.');
  const m = Number(marks);
  if (!Number.isFinite(m) || m < 0 || m > a.maxMarks) fail(`Marks must be between 0 and ${a.maxMarks}.`);
  mutate((d) => {
    Object.assign(d.submissions.find((x) => x.id === submissionId), { marks: m, feedback: feedback || '', status: 'reviewed' });
    const st = idx(s).students[sub.studentId];
    notify(d, 'assignments', [`u_${st.id}`, `u_${st.parentId}`], `"${a.title}" was evaluated: ${m}/${a.maxMarks}.`, '/app/student/assignments');
  });
}

// ───────── resources ─────────
export function addResource(f) {
  const { s, u } = actor('resources.manage');
  if (!f.title?.trim()) fail('Title is required.');
  if (!f.subjectId) fail('Choose a subject.');
  if (!f.content?.trim() && !f.url?.trim() && !f.fileName) fail('Add some content, a link, or a file.');
  if (f.url && !/^https?:\/\//i.test(f.url)) fail('Links must start with http:// or https://');
  mutate((d) => d.resources.unshift({ id: uid('R'), type: f.type || 'notes', title: f.title.trim(), subjectId: f.subjectId, classIds: f.classIds?.length ? f.classIds : idx(s).subjects[f.subjectId].classIds, chapter: f.chapter || '', url: f.url || '', content: f.content || '', fileName: f.fileName || '', fileData: f.fileData || '', uploadedBy: u.linkedId || u.id, date: today() }));
}
export function deleteResource(id) {
  actor('resources.manage');
  mutate((d) => (d.resources = d.resources.filter((x) => x.id !== id)));
}
export function toggleSaveResource(resourceId) {
  const { u } = actor('resources.save');
  mutate((d) => {
    const list = (d.savedResources[u.linkedId] ||= []);
    const i = list.indexOf(resourceId);
    if (i >= 0) list.splice(i, 1);
    else list.push(resourceId);
  });
}

// ───────── fees ─────────
export function payFee(feeId, amount, mode = 'UPI') {
  const { s, u } = actor();
  const f = s.feeRecords.find((x) => x.id === feeId);
  if (!f) fail('Invoice not found.');
  const st = idx(s).students[f.studentId];
  const adminPay = can(u.role, 'fees.manage');
  if (!adminPay) {
    if (!can(u.role, 'fees.pay')) deny();
    if (st.parentId !== u.linkedId) deny('You can only pay fees for your own children.');
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) fail('Enter a valid amount.');
  if (amt > f.amount - f.paid) fail(`The outstanding balance is ₹${f.amount - f.paid}.`);
  mutate((d) => {
    const x = d.feeRecords.find((y) => y.id === feeId);
    x.paid += amt;
    x.pay.push({ amt, date: today(), mode });
    notify(d, null, adminIds(d), `Payment of ₹${amt.toLocaleString('en-IN')} received for ${st.name} (${f.term}).`, '/app/admin/fees');
  });
}
export function sendFeeReminders() {
  const { s } = actor('fees.manage');
  const overdue = s.feeRecords.filter((f) => f.due < today() && f.paid < f.amount);
  const parents = [...new Set(overdue.map((f) => idx(s).students[f.studentId]?.parentId).filter(Boolean))];
  mutate((d) => {
    parents.forEach((p) => notify(d, 'fees', [`u_${p}`], 'Fee reminder: you have an overdue invoice. Please clear it from the Fee Status page.', '/app/parent/fees'));
  });
  return parents.length;
}

// ───────── announcements, messaging, meetings ─────────
export function postAnnouncement(f) {
  const { u } = actor('announce.create');
  if (!f.title?.trim() || !f.body?.trim()) fail('Title and message are required.');
  if (!f.audience?.length) fail('Choose who should see this.');
  const sectionIds = f.sectionIds?.length ? f.sectionIds : undefined;
  mutate((d) => {
    d.announcements.unshift({ id: uid('AN'), title: f.title.trim(), body: f.body.trim(), audience: f.audience, sectionIds, date: today(), authorId: u.id, priority: f.priority || 'normal' });
    const roleOf = { teacher: 'teacher', parent: 'parent', student: 'student' };
    const inScope = (x) => {
      if (!sectionIds) return true;
      if (x.role === 'student') return sectionIds.includes(idx(s).students[x.linkedId]?.sectionId);
      if (x.role === 'parent') return childrenOf(s, x.linkedId).some((c) => sectionIds.includes(c.sectionId));
      if (x.role === 'teacher') return teacherSectionIds(s, x.linkedId).some((id) => sectionIds.includes(id));
      return false;
    };
    const targets = d.users.filter((x) => x.active && (f.audience.includes('all') || f.audience.includes(roleOf[x.role])) && inScope(x)).map((x) => x.id);
    notify(d, 'announcements', targets.filter((x) => x !== u.id), `Announcement: ${f.title.trim()}`, `/app/${{ teacher: 'teacher', student: 'student', parent: 'parent' }[idx(s).users[targets[0]]?.role] || 'parent'}/announcements`);
  });
}
export function deleteAnnouncement(id) {
  actor('announce.create');
  mutate((d) => (d.announcements = d.announcements.filter((x) => x.id !== id)));
}
export function sendMessage({ toId, studentId, body }) {
  const { s, u } = actor();
  if (!can(u.role, 'messages.send')) deny();
  if (!body?.trim()) fail('Write a message first.');
  const to = idx(s).users[toId];
  if (!to) fail('Recipient not found.');
  const st = idx(s).students[studentId];
  if (u.role === 'parent') {
    if (!st || st.parentId !== u.linkedId) deny('You can only message about your own children.');
    if (to.role !== 'teacher' || !s.teachers.find((t) => t.id === to.linkedId)?.assignments.some((a) => a.sectionId === st.sectionId) && !s.sections.some((x) => x.classTeacherId === to.linkedId && x.id === st.sectionId)) deny("You can message your child's teachers only.");
  } else if (u.role === 'teacher') {
    if (!st || to.role !== 'parent' || st.parentId !== to.linkedId || !teachesSection(s, u.linkedId, st.sectionId)) deny("You can message parents of students you teach only.");
  }
  mutate((d) => {
    d.messages.push({ id: uid('M'), fromId: u.id, toId, studentId, body: body.trim(), at: new Date().toISOString(), read: false });
    notify(d, null, [toId], `New message from ${u.name}`, to.role === 'parent' ? '/app/parent/communication' : '/app/teacher/messages');
  });
}
export function markThreadRead(otherId, studentId) {
  const { u } = actor();
  mutate((d) => d.messages.forEach((m) => { if (m.toId === u.id && m.fromId === otherId && m.studentId === studentId) m.read = true; }));
}
export function requestMeeting({ studentId, teacherId, date, reason }) {
  const { s, u } = actor('meetings.request');
  const st = idx(s).students[studentId];
  if (!st || st.parentId !== u.linkedId) deny('You can only request meetings about your own children.');
  if (!teacherId) fail('Choose a teacher.');
  if (!date || date < today()) fail('Choose a future date.');
  if (!reason?.trim()) fail('Add a reason for the meeting.');
  mutate((d) => {
    d.meetings.unshift({ id: uid('MT'), parentId: u.linkedId, studentId, teacherId, date, reason: reason.trim(), status: 'pending', createdAt: new Date().toISOString() });
    notify(d, null, [`u_${teacherId}`], `Meeting request from ${u.name} about ${st.name}`, '/app/teacher/messages');
  });
}
export function respondMeeting(id, status, note = '') {
  const { s, u } = actor('meetings.respond');
  const m = s.meetings.find((x) => x.id === id);
  if (!m || m.teacherId !== u.linkedId) deny('This request is not addressed to you.');
  if (!['accepted', 'declined'].includes(status)) fail('Invalid response.');
  mutate((d) => {
    Object.assign(d.meetings.find((x) => x.id === id), { status, note });
    notify(d, null, [`u_${m.parentId}`], `${u.name} ${status} your meeting request for ${m.date}. ${note}`.trim(), '/app/parent/meetings');
  });
}

// ───────── feedback, skills, achievements ─────────
export function addFeedback(studentId, text, type) {
  const { s, u } = actor('feedback.add');
  const st = idx(s).students[studentId];
  if (!st || !teachesSection(s, u.linkedId, st.sectionId)) deny('You can give feedback only to students you teach.');
  if (!text?.trim()) fail('Write the feedback first.');
  mutate((d) => {
    d.feedback.unshift({ id: uid('FB'), studentId, teacherId: u.linkedId, text: text.trim(), type: type || 'general', date: today() });
    notify(d, null, [`u_${st.parentId}`, `u_${st.id}`], `New teacher feedback from ${u.name}.`, '/app/parent/feedback');
  });
}
export function setSkills(studentId, skills) {
  const { s, u } = actor('growth.edit');
  const st = idx(s).students[studentId];
  if (!st || !teachesSection(s, u.linkedId, st.sectionId)) deny('You can rate only students you teach.');
  mutate((d) => void (d.skills[studentId] = skills));
}
export function addAchievement(studentId, f) {
  const { s, u } = actor();
  if (!(can(u.role, 'achievements.add') && u.linkedId === studentId) && !(can(u.role, 'growth.edit') && teachesSection(s, u.linkedId, idx(s).students[studentId]?.sectionId))) deny();
  if (!f.title?.trim()) fail('Title is required.');
  mutate((d) => d.achievements.unshift({ id: uid('AC'), studentId, title: f.title.trim(), category: f.category || 'project', date: f.date || today(), sample: false, addedBy: u.role }));
}
export function deleteAchievement(id) {
  const { s, u } = actor();
  const a = s.achievements.find((x) => x.id === id);
  if (!a) fail('Not found.');
  if (!(u.role === 'student' && u.linkedId === a.studentId) && !can(u.role, 'growth.edit')) deny();
  mutate((d) => (d.achievements = d.achievements.filter((x) => x.id !== id)));
}

// ───────── student planner, practice, preparation ─────────
const ownStudent = (u) => { if (u.role !== 'student') deny('Only students can change their own plan.'); return u.linkedId; };
export function addGoal(f) {
  const { u } = actor('planner.manage');
  const sid = ownStudent(u);
  if (!f.title?.trim()) fail('Give the goal a title.');
  if (!f.deadline) fail('Set a deadline.');
  mutate((d) => ((d.goals[sid] ||= []).push({ id: uid('G'), title: f.title.trim(), subjectId: f.subjectId || '', chapter: f.chapter || '', deadline: f.deadline, done: false, revised: 0, kind: f.kind || 'goal' })));
}
export function updateGoal(id, patch) {
  const { u } = actor('planner.manage');
  const sid = ownStudent(u);
  mutate((d) => { const g = (d.goals[sid] || []).find((x) => x.id === id); if (g) Object.assign(g, patch); });
}
export function deleteGoal(id) {
  const { u } = actor('planner.manage');
  const sid = ownStudent(u);
  mutate((d) => void (d.goals[sid] = (d.goals[sid] || []).filter((x) => x.id !== id)));
}
export function recordQuiz({ subjectId, chapter, score, total }) {
  const { u } = actor('quiz.take');
  const sid = ownStudent(u);
  mutate((d) => d.quizAttempts.push({ id: uid('Q'), studentId: sid, subjectId, chapter, score, total, date: today() }));
}
function prepOf(d, sid) {
  return (d.prep[sid] ||= { track: null, done: {}, tests: [], errors: [], daily: {} });
}
export function setPrepTrack(track) {
  const { s, u } = actor('prep.manage');
  const sid = ownStudent(u);
  if (track && !s.school.tracks[track]) fail('This preparation track is not enabled by your school.');
  mutate((d) => void (prepOf(d, sid).track = track));
}
export function togglePrepTopic(key) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  mutate((d) => { const p = prepOf(d, sid); p.done[key] ? delete p.done[key] : (p.done[key] = true); });
}
export function addPrepTest(f) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  if (!f.name?.trim()) fail('Test name is required.');
  const score = Number(f.score), max = Number(f.max);
  if (!(max > 0) || !(score >= 0) || score > max) fail('Enter a valid score and maximum.');
  mutate((d) => prepOf(d, sid).tests.push({ id: uid('PT'), name: f.name.trim(), type: f.type || 'mock', date: f.date || today(), score, max, topics: f.topics || {} }));
}
export function addPrepError(f) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  if (!f.question?.trim() || !f.fix?.trim()) fail('Add the question and the correct approach.');
  mutate((d) => prepOf(d, sid).errors.unshift({ id: uid('ER'), subjectId: f.subjectId, topic: f.topic || '', question: f.question.trim(), mistake: f.mistake || '', fix: f.fix.trim(), date: today() }));
}
export function deletePrepError(id) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  mutate((d) => void (prepOf(d, sid).errors = prepOf(d, sid).errors.filter((x) => x.id !== id)));
}
export function addDailyGoal(text) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  if (!text?.trim()) fail('Write the goal first.');
  mutate((d) => ((prepOf(d, sid).daily[today()] ||= []).push({ id: uid('D'), text: text.trim(), done: false })));
}
export function toggleDailyGoal(day, id) {
  const { u } = actor('prep.manage');
  const sid = ownStudent(u);
  mutate((d) => { const g = (prepOf(d, sid).daily[day] || []).find((x) => x.id === id); if (g) g.done = !g.done; });
}

// ───────── settings, users ─────────
export function updateSchool(patch) {
  actor('settings.manage');
  mutate((d) => void Object.assign(d.school, patch));
}
export function updateGrading(rows) {
  actor('settings.manage');
  const sorted = [...rows].sort((a, b) => b.min - a.min);
  if (!sorted.length || sorted[sorted.length - 1].min !== 0) fail('The lowest grade must start at 0%.');
  if (new Set(sorted.map((r) => r.min)).size !== sorted.length) fail('Each grade needs a different minimum.');
  if (sorted.some((r) => !r.grade?.trim() || !(r.min >= 0 && r.min <= 100))) fail('Each grade needs a name and a minimum between 0 and 100.');
  mutate((d) => void (d.school.grading = sorted.map((r) => ({ min: Number(r.min), grade: r.grade.trim() }))));
}
export function createStaffUser(f) {
  const { s } = actor('users.manage');
  if (!f.name?.trim()) fail('Name is required.');
  if (!/^\S+@\S+\.\S+$/.test(f.email || '')) fail('A valid email is required.');
  if (!['school_admin', 'principal', 'super_admin'].includes(f.role)) fail('Choose an administrative role.');
  if (s.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) fail('That email is already in use.');
  mutate((d) => d.users.push({ id: uid('u_'), role: f.role, name: f.name.trim(), title: f.title || '', email: f.email.trim(), linkedId: null, active: true }));
}
export function setUserActive(userId, active) {
  const { s, u } = actor('users.manage');
  if (userId === u.id) fail('You cannot deactivate your own account.');
  if (!idx(s).users[userId]) fail('User not found.');
  mutate((d) => void (d.users.find((x) => x.id === userId).active = active));
}
export function setUserRole(userId, role) {
  const { s, u } = actor('users.manage');
  const t = idx(s).users[userId];
  if (!t) fail('User not found.');
  if (userId === u.id) fail('You cannot change your own role.');
  if (!['school_admin', 'principal', 'super_admin'].includes(t.role) || !['school_admin', 'principal', 'super_admin'].includes(role)) fail('Only administrative roles can be changed here. Teachers, students and parents have fixed roles.');
  mutate((d) => void (d.users.find((x) => x.id === userId).role = role));
}

// ───────── notifications, AI ─────────
export function markNotificationRead(id) {
  const { u } = actor();
  mutate((d) => { const n = d.notifications.find((x) => x.id === id && x.userId === u.id); if (n) n.read = true; });
}
export function markAllNotificationsRead() {
  const { u } = actor();
  mutate((d) => d.notifications.forEach((n) => { if (n.userId === u.id) n.read = true; }));
}
export function saveConversation(convo) {
  const { u } = actor();
  mutate((d) => {
    const list = (d.aiConversations[u.id] ||= []);
    const i = list.findIndex((x) => x.id === convo.id);
    if (i >= 0) list[i] = convo;
    else list.unshift(convo);
    if (list.length > 30) list.length = 30;
  });
}
export function deleteConversation(id) {
  const { u } = actor();
  mutate((d) => void (d.aiConversations[u.id] = (d.aiConversations[u.id] || []).filter((x) => x.id !== id)));
}
export function saveCopilotItem(item) {
  const { u } = actor('copilot.use');
  mutate((d) => d.copilotLibrary.unshift({ id: uid('CP'), teacherId: u.linkedId, at: new Date().toISOString(), ...item }));
}
export function deleteCopilotItem(id) {
  const { u } = actor('copilot.use');
  mutate((d) => void (d.copilotLibrary = d.copilotLibrary.filter((x) => !(x.id === id && x.teacherId === u.linkedId))));
}
export function logReport(name) {
  const { u } = actor('reports.view');
  mutate((d) => void d.reportLog.unshift({ id: uid('RP'), name, at: new Date().toISOString(), by: u.name }));
}
