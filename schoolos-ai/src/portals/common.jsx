import * as S from '../lib/selectors';

export const sectionOptions = (s, ids) =>
  S.sortedSections(s).filter((x) => !ids || ids.includes(x.id)).map((x) => ({ value: x.id, label: `Class ${S.sectionLabel(s, x.id)}` }));
export const classOptions = (s) => s.classes.map((c) => ({ value: c.id, label: c.name }));
export const subjectOptions = (s, ids) => s.subjects.filter((x) => !ids || ids.includes(x.id)).map((x) => ({ value: x.id, label: x.name }));
export const examOptions = (s) => [...s.exams].sort((a, b) => b.date.localeCompare(a.date)).map((e) => ({ value: e.id, label: e.name }));
export const teacherOptions = (s) => s.teachers.map((t) => ({ value: t.id, label: t.name }));

export const KIND_LABEL = { attendance: 'Attendance', submission: 'Assignment', marks: 'Marks', announcement: 'Announcement', payment: 'Payment' };

/** Recent activity feed built from real records (so cross-role actions show up here). */
export function recentActivity(s, limit = 8) {
  const out = [];
  for (const [date, secs] of Object.entries(s.attendance)) {
    for (const [secId, periods] of Object.entries(secs)) {
      for (const [p, rec] of Object.entries(periods)) {
        const absent = Object.values(rec.marks).filter((v) => v === 'A').length;
        out.push({ at: rec.at, kind: 'attendance', text: `Attendance marked for ${S.sectionLabel(s, secId)} (period ${p}): ${absent} absent`, link: 'attendance' });
      }
    }
  }
  [...s.submissions].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3).forEach((x) => out.push({ at: x.at, kind: 'submission', text: `${S.studentName(s, x.studentId)} submitted an assignment${x.status === 'reviewed' ? ' (evaluated)' : ''}`, link: 'assignments' }));
  Object.entries(s.marksStatus).forEach(([k, v]) => {
    if (v.at && ['submitted', 'approved'].includes(v.status)) {
      const [examId, secId, sid] = k.split('|');
      out.push({ at: v.at, kind: 'marks', text: `${S.subjectName(s, sid)} marks ${v.status} for ${S.sectionLabel(s, secId)} (${S.idx(s).exams[examId]?.name})`, link: 'marks' });
    }
  });
  s.announcements.forEach((a) => out.push({ at: `${a.date}T08:00:00.000Z`, kind: 'announcement', text: `Announcement: ${a.title}`, link: 'announcements' }));
  // Payments are numerous; show only the two most recent so other activity stays visible.
  const pays = [];
  s.feeRecords.forEach((f) => f.pay.slice(-1).forEach((p) => pays.push({ at: `${p.date}T12:00:00.000Z`, kind: 'payment', text: `₹${p.amt.toLocaleString('en-IN')} fee received (${S.studentName(s, f.studentId)})`, link: 'fees' })));
  pays.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 2).forEach((x) => out.push(x));
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
