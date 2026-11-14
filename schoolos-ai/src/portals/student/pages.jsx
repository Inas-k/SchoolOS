import { WelcomeBanner } from '../../ui/kit';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bot, CalendarCheck, ClipboardList, FlaskConical, Target, TrendingUp } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { cx, fmtDate, fmtShort, today } from '../../lib/util';
import { PERIODS } from '../../data/seed';
import { Avatar, Badge, BarChart, Button, Card, EmptyState, PageHeader, Section, Stat, toneForPct, useRun } from '../../ui/kit';
import { ChildSwitcher, useActiveStudent } from '../../app/shell';
import { AcademicsView, AssignmentDetailBody, AssignmentsList, AttendanceView, Passport, PerformanceView, TimetableGrid } from '../shared';

const { idx } = S;

export function Dashboard() {
  const s = useAppState();
  const { student: st } = useActiveStudent();
  const run = useRun();
  const att = S.studentAttendance(s, st.id);
  const slots = S.todaysSlots(s, st.sectionId);
  const asg = S.assignmentsForStudent(s, st.id).map((a) => ({ a, st: S.assignmentState(s, a, st.id) }));
  const pending = asg.filter((x) => x.st.key === 'pending').sort((x, y) => x.a.due.localeCompare(y.a.due));
  const upcoming = s.exams.filter((e) => e.date > today()).sort((a, b) => a.date.localeCompare(b.date));
  const sum = S.studentSubjectSummary(s, st.id);
  const fb = s.feedback.filter((x) => x.studentId === st.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const goals = (s.goals[st.id] || []).filter((g) => g.kind === 'goal' || !g.done).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4);
  const recs = S.recommendations(s, st.id);
  const todayRec = s.attendance[today()]?.[st.sectionId]?.[1];
  const status = todayRec ? (todayRec.marks[st.id] === 'A' ? 'Absent' : todayRec.marks[st.id] === 'L' ? 'Late' : 'Present') : null;
  return (
    <>
      <WelcomeBanner title={`Welcome back, ${st.name.split(' ')[0]}`} subtitle={`Class ${S.sectionLabel(s, st.sectionId)} · ${fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long' })}${status ? ` · Today: ${status}` : ''}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Attendance" value={`${att.pct}%`} sub={`${att.absent} absent · ${att.late} late`} icon={CalendarCheck} tone={toneForPct(att.pct)} to="attendance" />
        <Stat label="Pending assignments" value={pending.length} sub={pending[0] ? `Next due ${fmtShort(pending[0].a.due)}` : 'All caught up'} icon={ClipboardList} tone={pending.length ? 'amber' : 'green'} to="assignments" />
        <Stat label="Upcoming exam" value={upcoming[0] ? fmtShort(upcoming[0].date) : '–'} sub={upcoming[0]?.name || 'None scheduled'} icon={FlaskConical} tone="purple" to="academics" />
        <Stat label="Academic average" value={sum.length ? `${(sum.reduce((a, b) => a + b.avg, 0) / sum.length).toFixed(1)}%` : '–'} icon={TrendingUp} tone="blue" to="performance" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Today's timetable" action={<Link to="timetable" className="text-sm font-semibold text-cta">Full week →</Link>}>
          {slots.some((x) => x.s) ? <ul className="divide-y divide-gray-100">{slots.map((x) => <li key={x.period} className="py-2 flex items-center gap-3 text-sm"><span className="w-28 text-xs text-gray-500">P{x.period} · {PERIODS[x.period - 1].time}</span>{x.s ? <><b className="text-gray-900 w-36">{S.subjectName(s, x.s)}</b><span className="text-gray-600">{S.teacherName(s, x.t)}</span></> : <span className="text-gray-400">Free period</span>}</li>)}</ul> : <p className="text-sm text-gray-600">No classes today.</p>}
        </Section>
        <Section title="Recommended next actions">
          {recs.length ? <ul className="space-y-3">{recs.slice(0, 4).map((r, i) => <li key={i} className="text-sm text-gray-800 flex gap-2"><Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span>{r.text}{r.kind === 'practice' && <> <Link className="font-semibold text-cta" to={`practice?subject=${r.subjectId}&chapter=${encodeURIComponent(r.chapter)}`}>Practise</Link></>}</span></li>)}</ul> : <p className="text-sm text-gray-600">You’re on track. Keep it up.</p>}
        </Section>
        <Section title="Pending assignments" action={<Link to="assignments" className="text-sm font-semibold text-cta">All →</Link>}>
          {pending.length ? <ul className="space-y-2.5">{pending.slice(0, 4).map(({ a }) => <li key={a.id}><Link to={`assignments/${a.id}`} className="block rounded-lg hover:bg-gray-50 -mx-2 px-2 py-1"><div className="font-semibold text-gray-900 text-sm">{a.title}</div><div className="text-xs text-gray-500">{S.subjectName(s, a.subjectId)} · due {fmtShort(a.due)}</div></Link></li>)}</ul> : <p className="text-sm text-gray-600">Nothing pending.</p>}
        </Section>
        <Section title="Subject performance"><BarChart height={170} unit="%" max={100} data={sum.map((x) => ({ label: S.subjectShort(s, x.subjectId), value: Math.round(x.avg), color: idx(s).subjects[x.subjectId]?.color }))} /></Section>
        <Section title="Recent teacher feedback">
          {fb.length ? <ul className="space-y-3">{fb.map((f) => <li key={f.id} className="text-sm"><div className="flex justify-between"><b className="text-gray-900">{S.teacherName(s, f.teacherId)}</b><span className="text-xs text-gray-500">{fmtShort(f.date)}</span></div><p className="text-gray-700 mt-0.5">{f.text}</p></li>)}</ul> : <p className="text-sm text-gray-600">No feedback yet.</p>}
        </Section>
        <Section className="lg:col-span-3" title="My study goals" action={<Link to="planner" className="text-sm font-semibold text-cta">Open planner →</Link>}>
          {goals.length ? <ul className="grid sm:grid-cols-2 gap-3">{goals.map((g) => <li key={g.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"><button aria-label={g.done ? `Mark "${g.title}" not done` : `Mark "${g.title}" done`} onClick={() => run(() => A.updateGoal(g.id, { done: !g.done }), g.done ? 'Marked as not done.' : 'Nice work. Marked as done.')} className={cx('w-5 h-5 rounded border grid place-items-center text-[11px] shrink-0', g.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300')}>{g.done ? '✓' : ''}</button><div className="min-w-0 flex-1"><div className={cx('text-sm font-semibold text-gray-900', g.done && 'line-through text-gray-500')}>{g.title}</div><div className="text-xs text-gray-500">by {fmtShort(g.deadline)}</div></div></li>)}</ul> : <p className="text-sm text-gray-600">No goals yet. <Link className="text-cta font-semibold" to="planner">Set one in the planner</Link>.</p>}
        </Section>
      </div>
    </>
  );
}

export function Timetable() {
  const { student: st } = useActiveStudent();
  return (<><PageHeader title="Timetable" subtitle={`Class ${st.sectionId}`} /><TimetableGrid sectionId={st.sectionId} /></>);
}
export function Attendance() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="My Attendance" /><AttendanceView student={student} /></>);
}
export function Academics() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="My Academics" subtitle="Published results and report cards." /><AcademicsView student={student} /></>);
}
export function Assignments() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="My Assignments" subtitle="Open an assignment to read instructions and submit your work." /><AssignmentsList student={student} detailBase="." /></>);
}
export function AssignmentDetail() {
  const { id } = useParams();
  const s = useAppState();
  const { student } = useActiveStudent();
  const a = idx(s).assignments[id];
  if (!a || a.sectionId !== student.sectionId || a.status !== 'published') return <EmptyState title="Assignment not found" text="It may not be assigned to your class." action={<Link to=".." relative="path" className="text-cta font-semibold">Back to assignments</Link>} />;
  return (
    <>
      <Link to=".." relative="path" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-cta mb-3"><ArrowLeft className="w-4 h-4" />All assignments</Link>
      <PageHeader title={a.title} />
      <Card className="p-5 max-w-3xl"><AssignmentDetailBody assignment={a} student={student} canSubmit /></Card>
    </>
  );
}
export function Performance() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="My Performance" subtitle="Subject trends, chapter mastery and what to practise next." /><PerformanceView student={student} /></>);
}
export function PassportPage() {
  const { student } = useActiveStudent();
  return (<><PageHeader title="Student Growth Passport" subtitle="Your academics, skills, activities and goals in one place." /><Passport student={student} canAddAchievement canDeleteAchievement /></>);
}
export function Profile() {
  const s = useAppState();
  const { student: st } = useActiveStudent();
  const p = idx(s).parents[st.parentId];
  return (
    <>
      <PageHeader title="My Profile" />
      <Card className="p-6 max-w-2xl"><div className="flex items-center gap-4"><Avatar name={st.name} size={64} color="#d01858" /><div><h2 className="text-xl font-extrabold text-gray-900">{st.name}</h2><p className="text-sm text-gray-600">Class {S.sectionLabel(s, st.sectionId)} · Roll {st.rollNo}</p></div></div>
        <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{[['Admission number', st.admNo], ['Date of birth', fmtDate(st.dob)], ['Blood group', st.bloodGroup || '–'], ['Class teacher', S.teacherName(s, idx(s).sections[st.sectionId].classTeacherId)], ['Parent / guardian', p?.name || '–'], ['Address', st.address || '–']].map(([k, v]) => <div key={k}><dt className="text-gray-500 text-xs">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>)}</dl>
        <p className="mt-5 text-xs text-gray-500">To correct any detail, please ask the school office.</p></Card>
    </>
  );
}
export { ChildSwitcher, Target, useNavigate };
