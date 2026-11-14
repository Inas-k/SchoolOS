import { WelcomeBanner } from '../../ui/kit';
import { useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { CalendarCheck, CreditCard, GraduationCap, NotebookPen, Plus } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { addDays, fmtDate, fmtShort, money, today } from '../../lib/util';
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, PageHeader, Section, Select, Stat, Textarea, toneForPct, useRun } from '../../ui/kit';
import { ChildSwitcher, NoAccess, useActiveStudent, useMe } from '../../app/shell';
import { AcademicsView, AnnouncementsPage, AssignmentDetailBody, AssignmentsList, AttendanceView, FeesView, Messenger, Passport, PerformanceView } from '../shared';

const { idx } = S;
const Scoped = ({ title, subtitle, children }) => (<><PageHeader title={title} subtitle={subtitle} /><ChildSwitcher />{children}</>);

function Dashboard() {
  const s = useAppState();
  const { user } = useMe();
  const { kids } = useActiveStudent();
  const unread = s.notifications.filter((n) => n.userId === user.id && !n.read).length;
  return (
    <>
      <WelcomeBanner title={`Hello, ${user.name.replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '')}`} subtitle={`${unread ? `${unread} new notification${unread > 1 ? 's' : ''}. ` : ''}Here is how your ${kids.length > 1 ? 'children are' : 'child is'} doing.`} />
      <div className="space-y-6">{kids.map((st) => {
        const att = S.studentAttendance(s, st.id);
        const sum = S.studentSubjectSummary(s, st.id);
        const avg = sum.length ? sum.reduce((a, b) => a + b.avg, 0) / sum.length : null;
        const asg = S.assignmentsForStudent(s, st.id).map((a) => ({ a, k: S.assignmentState(s, a, st.id).key }));
        const pend = asg.filter((x) => x.k === 'pending'), miss = asg.filter((x) => x.k === 'missing');
        const fees = (idx(s).feesByStudent[st.id] || []);
        const due = fees.filter((f) => S.feeState(s, f) === 'overdue');
        const rec = s.attendance[today()]?.[st.sectionId]?.[1];
        const todayStatus = rec ? (rec.marks[st.id] === 'A' ? ['Absent today', 'red'] : rec.marks[st.id] === 'L' ? ['Late today', 'amber'] : ['Present today', 'green']) : ['Not marked yet', 'gray'];
        const fb = s.feedback.filter((x) => x.studentId === st.id).sort((a, b) => b.date.localeCompare(a.date))[0];
        const upcoming = s.exams.filter((e) => e.date > today()).sort((a, b) => a.date.localeCompare(b.date))[0];
        return (
          <Card key={st.id} className="p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4"><Avatar name={st.name} size={48} color="#d01858" /><div className="flex-1"><h2 className="text-xl font-extrabold text-gray-900">{st.name}</h2><p className="text-sm text-gray-600">Class {S.sectionLabel(s, st.sectionId)} · Class teacher {S.teacherName(s, idx(s).sections[st.sectionId].classTeacherId)}</p></div><Badge tone={todayStatus[1]}>{todayStatus[0]}</Badge></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Attendance" value={`${att.pct}%`} sub={`${att.absent} absent · ${att.late} late`} icon={CalendarCheck} tone={toneForPct(att.pct)} to="attendance" />
              <Stat label="Academic average" value={avg != null ? `${avg.toFixed(1)}%` : '–'} sub="published results" icon={GraduationCap} tone="blue" to="academics" />
              <Stat label="Assignments" value={pend.length} sub={miss.length ? `${miss.length} missing` : 'pending, none missing'} icon={NotebookPen} tone={miss.length ? 'red' : 'amber'} to="assignments" />
              <Stat label="Fees" value={due.length ? 'Overdue' : 'Up to date'} sub={due.length ? `${due.length} invoice${due.length > 1 ? 's' : ''} overdue` : 'Nothing overdue'} icon={CreditCard} tone={due.length ? 'red' : 'green'} to="fees" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm"><div className="rounded-xl bg-gray-50 p-3.5"><div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Latest teacher feedback</div>{fb ? <><p className="text-gray-800">“{fb.text}”</p><p className="text-xs text-gray-500 mt-1">{S.teacherName(s, fb.teacherId)} · {fmtShort(fb.date)}</p></> : <p className="text-gray-600">No feedback yet.</p>}</div><div className="rounded-xl bg-gray-50 p-3.5"><div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Coming up</div>{upcoming ? <p className="text-gray-800"><b>{upcoming.name}</b> on {fmtDate(upcoming.date)}</p> : <p className="text-gray-600">No exams scheduled.</p>}{pend[0] && <p className="text-gray-800 mt-1">Next assignment due {fmtShort(pend.sort((x, y) => x.a.due.localeCompare(y.a.due))[0].a.due)}</p>}</div></div>
          </Card>
        );
      })}</div>
    </>
  );
}

function Children() {
  const s = useAppState();
  const { kids } = useActiveStudent();
  const [view, setView] = useState(null);
  return (
    <>
      <PageHeader title="My Children" subtitle="Profiles and Growth Passports for the children linked to your account." />
      <div className="grid gap-5 md:grid-cols-2">{kids.map((st) => (
        <Card key={st.id} className="p-5"><div className="flex items-center gap-4"><Avatar name={st.name} size={56} color="#d01858" /><div><h2 className="text-lg font-extrabold text-gray-900">{st.name}</h2><p className="text-sm text-gray-600">Class {S.sectionLabel(s, st.sectionId)} · Roll {st.rollNo} · {st.admNo}</p></div></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{[['Date of birth', fmtDate(st.dob)], ['Blood group', st.bloodGroup || '–'], ['Class teacher', S.teacherName(s, idx(s).sections[st.sectionId].classTeacherId)], ['Attendance', `${S.studentAttendance(s, st.id).pct}%`]].map(([k, v]) => <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>)}</dl>
          <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => setView({ st, kind: 'passport' })}>Growth Passport</Button><Button size="sm" variant="outline" onClick={() => setView({ st, kind: 'performance' })}>Performance</Button></div></Card>
      ))}</div>
      <Modal open={!!view} wide onClose={() => setView(null)} title={view ? `${view.st.name}: ${view.kind === 'passport' ? 'Growth Passport' : 'Performance'}` : ''}>{view?.kind === 'passport' && <Passport student={view.st} />}{view?.kind === 'performance' && <PerformanceView student={view.st} />}</Modal>
    </>
  );
}

function Assignments() {
  const { student } = useActiveStudent();
  const s = useAppState();
  const [open, setOpen] = useState(null);
  return (
    <Scoped title="Assignment Tracking" subtitle="What is pending, submitted, evaluated or missing. Only your child can submit work.">
      <AssignmentsList student={student} onOpen={setOpen} />
      <Modal open={!!open} wide onClose={() => setOpen(null)} title={open?.title || ''}>{open && <AssignmentDetailBody assignment={open} student={student} canSubmit={false} />}</Modal>
    </Scoped>
  );
}

function Feedback() {
  const s = useAppState();
  const { student } = useActiveStudent();
  const list = s.feedback.filter((x) => x.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const tone = { positive: ['Appreciation', 'green'], improvement: ['Area to improve', 'amber'], general: ['Note', 'gray'] };
  return (
    <Scoped title="Teacher Feedback" subtitle={`Comments about ${student.name.split(' ')[0]} from teachers.`}>
      {!list.length && <Card><EmptyState title="No feedback yet" /></Card>}
      <div className="space-y-3">{list.map((f) => <Card key={f.id} className="p-4"><div className="flex items-center justify-between gap-2"><b className="text-gray-900">{S.teacherName(s, f.teacherId)}</b><div className="flex items-center gap-2"><Badge tone={tone[f.type]?.[1] || 'gray'}>{tone[f.type]?.[0] || 'Note'}</Badge><span className="text-xs text-gray-500">{fmtDate(f.date)}</span></div></div><p className="mt-2 text-[15px] text-gray-700 leading-relaxed">{f.text}</p></Card>)}</div>
    </Scoped>
  );
}

function Meetings() {
  const s = useAppState();
  const { user } = useMe();
  const { kids, student } = useActiveStudent();
  const run = useRun();
  const [form, setForm] = useState(null);
  const mine = s.meetings.filter((m) => m.parentId === user.linkedId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const teachersOf = (stId) => { const st = idx(s).students[stId]; return st ? s.teachers.filter((t) => t.assignments.some((a) => a.sectionId === st.sectionId) || idx(s).sections[st.sectionId].classTeacherId === t.id).map((t) => ({ value: t.id, label: `${t.name} (${t.subjectIds.map((x) => S.subjectName(s, x)).join(', ')})` })) : []; };
  return (
    <>
      <PageHeader title="Meeting Requests" subtitle="Request time with a teacher. They will accept or suggest another day." actions={<Button icon={Plus} onClick={() => setForm({ studentId: student.id, teacherId: '', date: addDays(today(), 3), reason: '' })}>Request a meeting</Button>} />
      <Card className="p-4">{mine.length ? <ul className="divide-y divide-gray-100">{mine.map((m) => <li key={m.id} className="py-3 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-[220px]"><div className="font-semibold text-gray-900 text-sm">{S.teacherName(s, m.teacherId)} · about {S.studentName(s, m.studentId)}</div><div className="text-[13px] text-gray-600">{fmtDate(m.date)} · {m.reason}</div>{m.note && <div className="text-[13px] text-gray-700 mt-0.5">Teacher’s note: {m.note}</div>}</div><Badge tone={{ pending: 'amber', accepted: 'green', declined: 'red' }[m.status]}>{m.status}</Badge></li>)}</ul> : <EmptyState title="No meeting requests yet" />}</Card>
      <Modal open={!!form} onClose={() => setForm(null)} title="Request a meeting" footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.requestMeeting(form); setForm(null); }, 'Request sent. You will be notified when the teacher responds.')}>Send request</Button></>}>
        {form && <div className="space-y-3"><Select label="Child" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value, teacherId: '' })} options={kids.map((k) => ({ value: k.id, label: k.name }))} /><Select label="Teacher" placeholder="Choose…" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} options={teachersOf(form.studentId)} /><Input label="Preferred date" type="date" min={today()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><Textarea label="Reason" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>}
      </Modal>
    </>
  );
}

function Profile() {
  const s = useAppState();
  const { user } = useMe();
  const p = idx(s).parents[user.linkedId];
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="p-6 max-w-2xl"><div className="flex items-center gap-4"><Avatar name={user.name} size={64} /><div><h2 className="text-xl font-extrabold text-gray-900">{user.name}</h2><p className="text-sm text-gray-600">Parent / guardian</p></div></div><dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{[['Email', p?.email], ['Phone', p?.phone || '–'], ['Children', S.childrenOf(s, user.linkedId).map((c) => c.name).join(', ')]].map(([k, v]) => <div key={k}><dt className="text-gray-500 text-xs">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>)}</dl><p className="mt-5 text-xs text-gray-500">To update contact details, please contact the school office.</p></Card>
    </>
  );
}

export default function Parent() {
  const { student } = useActiveStudent();
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="children" element={<Children />} />
      <Route path="attendance" element={<Scoped title="Attendance"><AttendanceView student={student} /></Scoped>} />
      <Route path="academics" element={<Scoped title="Academic Performance" subtitle="Published results and report cards."><AcademicsView student={student} /><div className="mt-6"><PerformanceView student={student} /></div></Scoped>} />
      <Route path="assignments" element={<Assignments />} />
      <Route path="feedback" element={<Feedback />} />
      <Route path="announcements" element={<AnnouncementsPage />} />
      <Route path="communication" element={<><PageHeader title="Communication" subtitle="Message your children’s teachers." /><Messenger /></>} />
      <Route path="meetings" element={<Meetings />} />
      <Route path="fees" element={<Scoped title="Fee Status" subtitle="Invoices and payments."><FeesView student={student} canPay /></Scoped>} />
      <Route path="profile" element={<Profile />} />
      <Route path="*" element={<NoAccess />} />
    </Routes>
  );
}
export { Link, Section };
