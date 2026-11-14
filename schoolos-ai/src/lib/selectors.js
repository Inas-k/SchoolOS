// Derived data. Everything dashboards and insights show is computed here from the stored records.
import { avg, fromISO, fmtShort, pct, todayISO, addDays, isWeekend } from './util';

const cache = new WeakMap();
const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));
const groupBy = (arr, fn) => arr.reduce((m, x) => ((m[fn(x)] ||= []).push(x), m), {});

export function idx(s) {
  let c = cache.get(s);
  if (!c) {
    c = {
      students: byId(s.students), teachers: byId(s.teachers), sections: byId(s.sections), classes: byId(s.classes), subjects: byId(s.subjects),
      parents: byId(s.parents), users: byId(s.users), exams: byId(s.exams), assignments: byId(s.assignments),
      studentsBySection: groupBy(s.students.filter((x) => x.status === 'active'), (x) => x.sectionId),
      subsByAssignment: groupBy(s.submissions, (x) => x.assignmentId),
      subsByStudent: groupBy(s.submissions, (x) => x.studentId),
      feesByStudent: groupBy(s.feeRecords, (x) => x.studentId),
    };
    cache.set(s, c);
  }
  return c;
}

export const today = () => todayISO();
export const currentUser = (s) => (s.session.userId ? idx(s).users[s.session.userId] : null);
export const subjectIdsOfClass = (s, classId) => s.subjects.filter((x) => x.classIds.includes(classId)).map((x) => x.id);
export const subjectIdsOfSection = (s, secId) => subjectIdsOfClass(s, idx(s).sections[secId]?.classId);
export const sectionLabel = (s, secId) => {
  const sec = idx(s).sections[secId];
  return sec ? `${idx(s).classes[sec.classId]?.no ?? sec.classId}-${sec.name}` : '';
};
export const sectionName = sectionLabel;
export const teacherOf = (s, secId, subjectId) => s.teachers.find((t) => t.assignments.some((a) => a.sectionId === secId && a.subjectId === subjectId));
export const subjectName = (s, id) => idx(s).subjects[id]?.name || id;
const SHORT = { ENG: 'English', MAT: 'Maths', SCI: 'Science', SOC: 'Social', CSC: 'CS', HIN: 'Hindi', PHY: 'Physics', CHE: 'Chem.', BIO: 'Biology' };
export const subjectShort = (s, id) => SHORT[id] || (idx(s).subjects[id]?.name || id).split(' ')[0];
export const studentName = (s, id) => idx(s).students[id]?.name || 'Unknown';
export const teacherName = (s, id) => idx(s).teachers[id]?.name || 'Unassigned';

// ---- teacher scope
export function teacherSectionIds(s, teacherId) {
  const t = idx(s).teachers[teacherId];
  if (!t) return [];
  const ids = new Set(t.assignments.map((a) => a.sectionId));
  s.sections.filter((x) => x.classTeacherId === teacherId).forEach((x) => ids.add(x.id));
  return [...ids].sort(sectionSort);
}
const sectionSort = (a, b) => {
  const [na, sa] = a.split('-');
  const [nb, sb] = b.split('-');
  return Number(na) - Number(nb) || sa.localeCompare(sb);
};
export const teacherStudents = (s, teacherId) => teacherSectionIds(s, teacherId).flatMap((id) => idx(s).studentsBySection[id] || []);
export const teachesPair = (s, teacherId, secId, subjectId) => !!idx(s).teachers[teacherId]?.assignments.some((a) => a.sectionId === secId && a.subjectId === subjectId);
export const teachesSection = (s, teacherId, secId) => teacherSectionIds(s, teacherId).includes(secId);
export const sortedSections = (s) => [...s.sections].sort((a, b) => sectionSort(a.id, b.id));

// ---- grading
export function gradeFor(s, percent) {
  const g = [...s.school.grading].sort((a, b) => b.min - a.min);
  return (g.find((x) => percent >= x.min) || g[g.length - 1]).grade;
}
export const gradeTone = (grade) => (['A1', 'A2'].includes(grade) ? 'green' : ['B1', 'B2'].includes(grade) ? 'blue' : ['C1', 'C2'].includes(grade) ? 'amber' : 'red');

// ---- attendance
export function attendanceIndex(s) {
  const c = idx(s);
  if (c.att) return c.att;
  const byStudent = {};
  const byDate = {};
  const bySectionDate = {};
  const touch = (sid) => (byStudent[sid] ||= { total: 0, absent: 0, late: 0 });
  for (const date of Object.keys(s.attendance)) {
    for (const [secId, periods] of Object.entries(s.attendance[date])) {
      const roster = c.studentsBySection[secId] || [];
      for (const rec of Object.values(periods)) {
        const a = Object.values(rec.marks).filter((v) => v === 'A').length;
        const l = Object.values(rec.marks).filter((v) => v === 'L').length;
        roster.forEach((st) => {
          const t = touch(st.id);
          t.total++;
          if (rec.marks[st.id] === 'A') t.absent++;
          if (rec.marks[st.id] === 'L') t.late++;
        });
        const d = (byDate[date] ||= { total: 0, absent: 0, late: 0, sections: 0 });
        d.total += roster.length;
        d.absent += a;
        d.late += l;
        d.sections++;
        const sd = ((bySectionDate[date] ||= {})[secId] ||= { total: 0, absent: 0, late: 0 });
        sd.total += roster.length;
        sd.absent += a;
        sd.late += l;
      }
    }
  }
  c.att = { byStudent, byDate, bySectionDate, dates: Object.keys(byDate).sort() };
  return c.att;
}
export function studentAttendance(s, studentId) {
  const t = attendanceIndex(s).byStudent[studentId] || { total: 0, absent: 0, late: 0 };
  const present = t.total - t.absent;
  return { ...t, present, pct: t.total ? pct(present, t.total, 1) : 100 };
}
export function dailyAttendance(s, n = 20) {
  const a = attendanceIndex(s);
  return a.dates.slice(-n).map((date) => {
    const d = a.byDate[date];
    return { date, pct: pct(d.total - d.absent, d.total, 1), absent: d.absent, late: d.late, total: d.total };
  });
}
export const attendanceStatusOn = (s, studentId, date, period = 1) => {
  const st = idx(s).students[studentId];
  const rec = s.attendance[date]?.[st?.sectionId]?.[period];
  if (!rec) return null;
  return rec.marks[studentId] || 'P';
};
export function sectionAttendanceTrend(s, secId, n = 10) {
  const a = attendanceIndex(s);
  return a.dates.slice(-n).map((date) => {
    const d = a.bySectionDate[date]?.[secId];
    return { date, pct: d ? pct(d.total - d.absent, d.total, 1) : null };
  });
}
export function latestAttendanceDate(s) {
  return attendanceIndex(s).dates.slice(-1)[0] || today();
}
export function attendanceOn(s, date) {
  const d = attendanceIndex(s).byDate[date];
  return d ? { ...d, pct: pct(d.total - d.absent, d.total, 1) } : null;
}
export function pendingAttendanceSections(s, date = today(), period = 1) {
  return sortedSections(s).filter((sec) => !s.attendance[date]?.[sec.id]?.[period]);
}

// ---- exams and marks
export const examIsConducted = (e) => e.date <= today();
export const marksKey = (examId, secId, subjectId) => `${examId}|${secId}|${subjectId}`;
export const marksEntryStatus = (s, examId, secId, subjectId) => s.marksStatus[marksKey(examId, secId, subjectId)]?.status || 'pending';
const VISIBLE = ['submitted', 'approved'];
export function marksFor(s, studentId, examId) {
  const st = idx(s).students[studentId];
  if (!st) return [];
  const out = [];
  for (const exam of s.exams) {
    if (examId && exam.id !== examId) continue;
    for (const sid of subjectIdsOfClass(s, st.classId)) {
      const stat = s.marksStatus[marksKey(exam.id, st.sectionId, sid)];
      if (!stat || !VISIBLE.includes(stat.status)) continue;
      const v = s.marks[exam.id]?.[sid]?.[studentId];
      if (v == null) continue;
      const percent = pct(v, exam.max, 1);
      out.push({ examId: exam.id, exam, subjectId: sid, mark: v, max: exam.max, percent, grade: gradeFor(s, percent), final: stat.status === 'approved' });
    }
  }
  return out;
}
export function examResult(s, studentId, examId) {
  const rows = marksFor(s, studentId, examId);
  const total = rows.reduce((a, r) => a + r.mark, 0);
  const max = rows.reduce((a, r) => a + r.max, 0);
  const percent = pct(total, max, 1);
  return { rows, total, max, percent, grade: gradeFor(s, percent), complete: rows.length === subjectIdsOfClass(s, idx(s).students[studentId]?.classId).length };
}
export function sectionRanks(s, secId, examId) {
  const roster = idx(s).studentsBySection[secId] || [];
  const list = roster.map((st) => ({ id: st.id, ...examResult(s, st.id, examId) })).filter((r) => r.rows.length);
  list.sort((a, b) => b.percent - a.percent);
  return Object.fromEntries(list.map((r, i) => [r.id, i + 1]));
}
export function examAverageBy(s, examId, scope = 'section') {
  const out = {};
  const groups = scope === 'section' ? sortedSections(s).map((x) => x.id) : s.classes.map((c) => c.id);
  for (const g of groups) {
    const ids = scope === 'section' ? (idx(s).studentsBySection[g] || []).map((x) => x.id) : s.students.filter((x) => x.classId === g && x.status === 'active').map((x) => x.id);
    const vals = ids.map((id) => examResult(s, id, examId)).filter((r) => r.rows.length).map((r) => r.percent);
    if (vals.length) out[g] = Number(avg(vals).toFixed(1));
  }
  return out;
}
export function subjectAverages(s, examId, filter = () => true) {
  const sums = {};
  for (const st of s.students) {
    if (st.status !== 'active' || !filter(st)) continue;
    for (const r of marksFor(s, st.id, examId)) (sums[r.subjectId] ||= []).push(r.percent);
  }
  return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, Number(avg(v).toFixed(1))]));
}
export function performanceOverTime(s, filter = () => true) {
  return s.exams.filter(examIsConducted).map((e) => {
    const vals = [];
    for (const st of s.students) if (st.status === 'active' && filter(st)) {
      const r = examResult(s, st.id, e.id);
      if (r.rows.length) vals.push(r.percent);
    }
    return { exam: e.name, value: Number(avg(vals).toFixed(1)) };
  });
}
export function marksTasks(s, teacherId = null) {
  const tasks = [];
  for (const exam of s.exams) {
    for (const sec of sortedSections(s)) {
      for (const sid of subjectIdsOfSection(s, sec.id)) {
        const t = teacherOf(s, sec.id, sid);
        if (teacherId && t?.id !== teacherId) continue;
        const status = marksEntryStatus(s, exam.id, sec.id, sid);
        tasks.push({ key: marksKey(exam.id, sec.id, sid), exam, sectionId: sec.id, subjectId: sid, teacherId: t?.id, status, conducted: examIsConducted(exam) });
      }
    }
  }
  return tasks;
}
export function marksCompletion(s) {
  const t = marksTasks(s).filter((x) => x.conducted);
  const done = t.filter((x) => ['submitted', 'approved'].includes(x.status)).length;
  return { done, total: t.length, pct: pct(done, t.length, 0), pending: t.filter((x) => x.status === 'pending' || x.status === 'draft') };
}

// ---- assignments
export function assignmentState(s, a, studentId) {
  const sub = (idx(s).subsByAssignment[a.id] || []).find((x) => x.studentId === studentId);
  const overdue = a.due < today();
  if (sub) return { key: sub.status === 'reviewed' ? 'reviewed' : sub.late ? 'late' : 'submitted', sub };
  return { key: overdue ? 'missing' : 'pending', sub: null };
}
export function assignmentStats(s, a) {
  const roster = idx(s).studentsBySection[a.sectionId] || [];
  const subs = idx(s).subsByAssignment[a.id] || [];
  const reviewed = subs.filter((x) => x.status === 'reviewed').length;
  const late = subs.filter((x) => x.late).length;
  const overdue = a.due < today();
  return { roster: roster.length, submitted: subs.length, reviewed, awaiting: subs.length - reviewed, late, missing: overdue ? roster.length - subs.length : 0, rate: pct(subs.length, roster.length) };
}
export function assignmentsForStudent(s, studentId) {
  const st = idx(s).students[studentId];
  if (!st) return [];
  return s.assignments.filter((a) => a.sectionId === st.sectionId && a.status === 'published').sort((a, b) => b.due.localeCompare(a.due));
}
export function sectionCompletion(s) {
  return sortedSections(s).map((sec) => {
    const due = s.assignments.filter((a) => a.sectionId === sec.id && a.due < today() && a.status === 'published');
    const roster = (idx(s).studentsBySection[sec.id] || []).length;
    const subs = due.reduce((n, a) => n + (idx(s).subsByAssignment[a.id] || []).length, 0);
    return { sectionId: sec.id, label: sectionLabel(s, sec.id), rate: pct(subs, due.length * roster, 1), assignments: due.length };
  });
}

// ---- performance intelligence
export function chapterMastery(s, studentId) {
  const m = {};
  const add = (subjectId, chapter, percent) => {
    const k = `${subjectId}|${chapter}`;
    (m[k] ||= { subjectId, chapter, vals: [] }).vals.push(percent);
  };
  for (const sub of idx(s).subsByStudent[studentId] || []) {
    if (sub.status !== 'reviewed' || sub.marks == null) continue;
    const a = idx(s).assignments[sub.assignmentId];
    if (a) add(a.subjectId, a.chapter, pct(sub.marks, a.maxMarks));
  }
  for (const q of s.quizAttempts) if (q.studentId === studentId) add(q.subjectId, q.chapter, pct(q.score, q.total));
  return Object.values(m).map((x) => ({ ...x, percent: Math.round(avg(x.vals)), n: x.vals.length }));
}
export function studentSubjectSummary(s, studentId) {
  const rows = marksFor(s, studentId);
  const by = {};
  rows.forEach((r) => (by[r.subjectId] ||= []).push(r));
  return Object.entries(by).map(([subjectId, list]) => {
    const sorted = [...list].sort((a, b) => a.exam.date.localeCompare(b.exam.date));
    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    return { subjectId, avg: Number(avg(list.map((r) => r.percent)).toFixed(1)), latest: latest.percent, trend: prev ? Number((latest.percent - prev.percent).toFixed(1)) : 0, history: sorted.map((r) => ({ exam: r.exam.name, value: r.percent })) };
  });
}
export function recommendations(s, studentId) {
  const out = [];
  const subj = studentSubjectSummary(s, studentId);
  const mastery = chapterMastery(s, studentId).sort((a, b) => a.percent - b.percent);
  mastery.filter((m) => m.percent < 60).slice(0, 2).forEach((m) => out.push({ kind: 'practice', text: `Practise "${m.chapter}" (${subjectName(s, m.subjectId)}): mastery ${m.percent}%`, subjectId: m.subjectId, chapter: m.chapter }));
  subj.filter((x) => x.trend < -5).forEach((x) => out.push({ kind: 'trend', text: `${subjectName(s, x.subjectId)} dropped ${Math.abs(x.trend)} points since the last exam. Review recent chapters.`, subjectId: x.subjectId }));
  const pend = assignmentsForStudent(s, studentId).filter((a) => assignmentState(s, a, studentId).key === 'pending');
  if (pend.length) out.push({ kind: 'assignment', text: `${pend.length} assignment${pend.length > 1 ? 's' : ''} waiting. Next due ${fmtShort(pend.sort((a, b) => a.due.localeCompare(b.due))[0].due)}.`, link: '/app/student/assignments' });
  const att = studentAttendance(s, studentId);
  if (att.pct < s.school.attendanceThreshold) out.push({ kind: 'attendance', text: `Attendance is ${att.pct}%, below the ${s.school.attendanceThreshold}% requirement.` });
  return out;
}

// ---- fees
export function feeState(s, f) {
  if (f.paid >= f.amount) return 'paid';
  if (f.paid > 0) return f.due < today() ? 'overdue' : 'partial';
  return f.due < today() ? 'overdue' : 'upcoming';
}
export function feeSummary(s, filter = () => true) {
  let billed = 0, collected = 0, overdue = 0, overdueCount = 0;
  for (const f of s.feeRecords) {
    const st = idx(s).students[f.studentId];
    if (!st || !filter(st)) continue;
    if (f.due <= addDays(today(), 30)) billed += f.amount;
    if (f.due <= addDays(today(), 30)) collected += f.paid;
    if (feeState(s, f) === 'overdue') {
      overdue += f.amount - f.paid;
      overdueCount++;
    }
  }
  return { billed, collected, overdue, overdueCount, pct: pct(collected, billed) };
}

// ---- parents, messaging
export const childrenOf = (s, parentId) => (idx(s).parents[parentId]?.childIds || []).map((id) => idx(s).students[id]).filter(Boolean);
export const myNotifications = (s, userId) => s.notifications.filter((n) => n.userId === userId).sort((a, b) => b.at.localeCompare(a.at));
export function announcementsFor(s, role, user) {
  const aud = role === 'parent' ? 'parent' : role === 'teacher' ? 'teacher' : role === 'student' ? 'student' : 'admin';
  const mySections = () => {
    if (!user) return [];
    if (role === 'parent') return childrenOf(s, user.linkedId).map((c) => c.sectionId);
    if (role === 'student') return [idx(s).students[user.linkedId]?.sectionId];
    if (role === 'teacher') return teacherSectionIds(s, user.linkedId);
    return [];
  };
  return s.announcements
    .filter((a) => {
      if (aud === 'admin') return true;
      if (!(a.audience.includes('all') || a.audience.includes(aud))) return false;
      return !a.sectionIds?.length || a.sectionIds.some((x) => mySections().includes(x));
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

// ---- AI school insights (rule-based, computed from the data above)
export function schoolInsights(s) {
  const out = [];
  const a = attendanceIndex(s);
  const dates = a.dates;
  if (dates.length >= 8) {
    const recent = dates.slice(-5);
    const prior = dates.slice(-10, -5);
    const rate = (ds, secId) => {
      let t = 0, ab = 0;
      ds.forEach((d) => { const x = a.bySectionDate[d]?.[secId]; if (x) { t += x.total; ab += x.absent; } });
      return t ? ((t - ab) / t) * 100 : null;
    };
    const drops = sortedSections(s).map((sec) => ({ sec, now: rate(recent, sec.id), before: rate(prior, sec.id) })).filter((x) => x.now != null && x.before != null && x.before - x.now >= 3).sort((p, q) => q.before - q.now - (p.before - p.now));
    drops.slice(0, 2).forEach((d) => out.push({ id: `att-${d.sec.id}`, area: 'Attendance', priority: 'high', title: `Class ${sectionLabel(s, d.sec.id)} attendance has decreased this week`, observation: `Attendance fell from ${d.before.toFixed(1)}% to ${d.now.toFixed(1)}% over the last 5 school days.`, data: [['Previous 5 days', `${d.before.toFixed(1)}%`], ['Last 5 days', `${d.now.toFixed(1)}%`], ['Change', `${(d.now - d.before).toFixed(1)} pts`]], action: 'Ask the class teacher to contact parents of frequently absent students and check for a common cause (illness, transport, exams).', link: '/app/admin/attendance' }));
  }
  const mc = marksCompletion(s);
  const pendBySubj = {};
  mc.pending.filter((x) => x.status === 'pending').forEach((x) => ((pendBySubj[x.subjectId] ||= []).push(`${sectionLabel(s, x.sectionId)} (${x.exam.name})`)));
  Object.entries(pendBySubj).forEach(([sid, list]) => out.push({ id: `marks-${sid}`, area: 'Examinations', priority: 'high', title: `${subjectName(s, sid)} marks entry is pending for ${list.length} section${list.length > 1 ? 's' : ''}`, observation: `Marks have not been entered for ${list.join(', ')}. Overall marks entry completion is ${mc.pct}%.`, data: [['Pending sections', list.length], ['Entry completion', `${mc.pct}%`]], action: 'Send a reminder to the concerned teachers and set a submission deadline.', link: '/app/admin/marks' }));
  const sc = sectionCompletion(s);
  const incomplete = s.students.filter((st) => st.status === 'active').map((st) => ({ st, missing: s.assignments.filter((x) => x.sectionId === st.sectionId && x.due < today() && x.status === 'published' && !(idx(s).subsByAssignment[x.id] || []).some((y) => y.studentId === st.id)).length })).filter((x) => x.missing >= 2);
  if (incomplete.length) {
    const low = [...sc].sort((p, q) => p.rate - q.rate).slice(0, 3);
    out.push({ id: 'assign', area: 'Assignments', priority: incomplete.length > 40 ? 'high' : 'medium', title: `${incomplete.length} students have incomplete assignments`, observation: `These students have two or more overdue assignments with no submission. Lowest completion: ${low.map((x) => `${x.label} (${x.rate}%)`).join(', ')}.`, data: low.map((x) => [`Section ${x.label}`, `${x.rate}%`]), action: 'Review the list with class teachers and schedule a catch-up window before Unit Test 2.', link: '/app/admin/assignments' });
  }
  const conducted = [...s.exams].filter(examIsConducted).sort((p, q) => q.date.localeCompare(p.date))[0];
  if (conducted) {
    for (const cl of s.classes) {
      const overall = subjectAverages(s, conducted.id, (st) => st.classId === cl.id);
      const vals = Object.values(overall);
      if (!vals.length) continue;
      const mean = avg(vals);
      Object.entries(overall).filter(([, v]) => mean - v >= 10).forEach(([sid, v]) => out.push({ id: `subj-${cl.id}-${sid}`, area: 'Academics', priority: cl.no >= 11 ? 'high' : 'medium', title: `${cl.name} students need additional revision in ${subjectName(s, sid)}`, observation: `${subjectName(s, sid)} average is ${v}% in ${conducted.name}, ${(mean - v).toFixed(1)} points below the other subjects in ${cl.name}.`, data: [[`${subjectName(s, sid)} average`, `${v}%`], ['Class average (all subjects)', `${mean.toFixed(1)}%`]], action: `Plan revision sessions and remedial worksheets for ${subjectName(s, sid)}. The Teacher Copilot can draft them.`, link: '/app/admin/growth' }));
    }
  }
  const atRisk = s.students.filter((st) => st.status === 'active' && studentAttendance(s, st.id).pct < s.school.attendanceThreshold);
  if (atRisk.length) out.push({ id: 'risk', area: 'Attendance', priority: 'medium', title: `${atRisk.length} students are below the ${s.school.attendanceThreshold}% attendance requirement`, observation: 'Low attendance often precedes drops in marks. This is a prompt for support, not a judgement about any student.', data: [['Students below threshold', atRisk.length]], action: 'Share the list with class teachers for a supportive conversation with families.', link: '/app/admin/students' });
  const fs = feeSummary(s);
  if (fs.overdueCount) out.push({ id: 'fees', area: 'Fees', priority: 'low', title: `${fs.overdueCount} fee invoices are overdue`, observation: `Overdue balance is about ₹${Math.round(fs.overdue).toLocaleString('en-IN')}.`, data: [['Overdue invoices', fs.overdueCount]], action: 'Send automated reminders from the Fees page.', link: '/app/admin/fees' });
  const order = { high: 0, medium: 1, low: 2 };
  return out.sort((p, q) => order[p.priority] - order[q.priority]);
}

// ---- lookups used by tables
export const fullTimetable = (s, secId) => s.timetable[secId] || {};
export const weekdayOf = (iso) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][fromISO(iso).getDay()];
export const todaysSlots = (s, secId, date = today()) => {
  const d = weekdayOf(isWeekend(date) ? today() : date);
  return (s.timetable[secId]?.[d] || []).map((x, i) => ({ ...x, period: i + 1 }));
};
export const teacherTodaySlots = (s, teacherId, date = today()) => {
  const d = weekdayOf(date);
  const out = [];
  for (const sec of s.sections) (s.timetable[sec.id]?.[d] || []).forEach((x, i) => { if (x.t === teacherId) out.push({ ...x, period: i + 1, sectionId: sec.id }); });
  return out.sort((a, b) => a.period - b.period);
};
