import { WelcomeBanner } from '../../ui/kit';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarX2, ClipboardCheck, GraduationCap, Layers, NotebookPen, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import { fmtDateTime, fmtDate, money, today } from '../../lib/util';
import { Badge, BarChart, Card, LineChart, PageHeader, Section, Stat, toneForPct } from '../../ui/kit';
import { KIND_LABEL, recentActivity } from '../common';
import { useMe } from '../../app/shell';

const PRIO = { high: 'red', medium: 'amber', low: 'gray' };

export default function Dashboard() {
  const s = useAppState();
  const { user } = useMe();
  const date = today();
  const att = S.attendanceOn(s, date) || S.attendanceOn(s, S.latestAttendanceDate(s));
  const attDate = S.attendanceOn(s, date) ? date : S.latestAttendanceDate(s);
  const pending = S.pendingAttendanceSections(s, date);
  const mc = S.marksCompletion(s);
  const fees = S.feeSummary(s);
  const latestExam = [...s.exams].filter(S.examIsConducted).sort((a, b) => b.date.localeCompare(a.date))[0];
  const byClass = latestExam ? S.examAverageBy(s, latestExam.id, 'class') : {};
  const bySubject = latestExam ? S.subjectAverages(s, latestExam.id) : {};
  const overall = Object.values(byClass).length ? (Object.values(byClass).reduce((a, b) => a + b, 0) / Object.values(byClass).length).toFixed(1) : '–';
  const awaiting = s.submissions.filter((x) => x.status === 'submitted').length;
  const completion = S.sectionCompletion(s);
  const active = s.students.filter((x) => x.status === 'active').length;
  const insights = S.schoolInsights(s).slice(0, 4);
  const trend = S.dailyAttendance(s, 20).map((d) => ({ label: d.date.slice(5), value: d.pct }));
  const activity = recentActivity(s);
  const overdueFees = S.feeSummary(s).overdueCount;
  const alerts = [
    pending.length > 0 && { text: `Attendance not yet marked for ${pending.length} section${pending.length > 1 ? 's' : ''} today (${pending.slice(0, 4).map((p) => S.sectionLabel(s, p.id)).join(', ')}${pending.length > 4 ? '…' : ''})`, to: 'attendance' },
    mc.pending.length > 0 && { text: `${mc.pending.length} marks sheets still pending or in draft`, to: 'marks' },
    s.submissions.length && awaiting > 0 && { text: `${awaiting} submitted assignments await teacher evaluation`, to: 'assignments' },
    overdueFees > 0 && { text: `${overdueFees} overdue fee invoices`, to: 'fees' },
  ].filter(Boolean);
  return (
    <>
      <WelcomeBanner title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(' ')[0]}`} subtitle={`${s.school.name} · ${fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total students" value={active.toLocaleString('en-IN')} sub={`${s.sections.length} sections`} icon={GraduationCap} to="students" />
        <Stat label="Total teachers" value={s.teachers.filter((t) => t.active).length} sub={`${s.subjects.length} subjects`} icon={Users} tone="pink" to="teachers" />
        <Stat label="Classes" value={s.classes.length} sub={`${s.sections.length} sections`} icon={Layers} tone="purple" to="classes" />
        <Stat label={attDate === date ? "Today's attendance" : 'Latest attendance'} value={att ? `${att.pct}%` : '–'} sub={att ? `${att.absent} absent · ${att.late} late · ${att.sections} sections marked` : 'Not marked yet'} icon={CalendarX2} tone={att ? toneForPct(att.pct) : 'gray'} to="attendance" />
        <Stat label="Absent students" value={att ? att.absent : '–'} sub={attDate === date ? 'today' : `on ${fmtDate(attDate)}`} icon={AlertTriangle} tone="red" to="attendance" />
        <Stat label="Awaiting evaluation" value={awaiting} sub="submitted assignments" icon={NotebookPen} tone="amber" to="assignments" />
        <Stat label={latestExam ? `${latestExam.name} average` : 'Exam performance'} value={overall === '–' ? overall : `${overall}%`} sub={`Marks entry ${mc.pct}% complete (${mc.done}/${mc.total})`} icon={ClipboardCheck} tone="green" to="marks" />
        <Stat label="Fee collection" value={`${fees.pct}%`} sub={`${money(fees.collected)} of ${money(fees.billed)} billed`} icon={Wallet} tone={toneForPct(fees.pct)} to="fees" />
      </div>

      {alerts.length > 0 && (
        <Card className="mt-5 p-4 border-amber-200 bg-amber-50/50">
          <h2 className="text-sm font-extrabold text-amber-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Needs attention</h2>
          <ul className="mt-2 space-y-1.5">{alerts.map((a) => <li key={a.to} className="text-sm text-gray-800 flex justify-between gap-3"><span>{a.text}</span><Link className="font-semibold text-cta shrink-0" to={a.to}>Open →</Link></li>)}</ul>
        </Card>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="AI School Brief" subtitle="Calculated from today's data. Suggestions for people to act on." action={<Link to="insights" className="text-sm font-semibold text-cta">All insights →</Link>}>
          {insights.length ? (
            <ul className="space-y-3">{insights.map((i) => (
              <li key={i.id} className="rounded-xl border border-gray-200 p-3.5">
                <div className="flex flex-wrap items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><b className="text-gray-900 text-[15px]">{i.title}</b><Badge tone={PRIO[i.priority]}>{i.priority}</Badge></div>
                <p className="mt-1 text-sm text-gray-700">{i.observation}</p>
                <p className="mt-1 text-sm text-gray-600"><b className="text-gray-800">Suggested:</b> {i.action}</p>
              </li>
            ))}</ul>
          ) : <p className="text-sm text-gray-600">No unusual patterns detected right now.</p>}
        </Section>
        <Section title="Recent school activity">
          <ul className="space-y-3">{activity.map((a, i) => (
            <li key={i} className="text-sm"><Link to={a.link} className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg"><div className="flex items-center gap-2"><Badge tone="gray">{KIND_LABEL[a.kind]}</Badge><span className="text-[11px] text-gray-500">{fmtDateTime(a.at)}</span></div><p className="mt-1 text-gray-800 leading-snug">{a.text}</p></Link></li>
          ))}</ul>
        </Section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title="Attendance trend" subtitle="School-wide, last 20 school days"><LineChart series={[{ name: 'Attendance', color: '#0072e5', data: trend }]} /></Section>
        <Section title="Academic performance over time" subtitle="Average % across all students"><LineChart series={[{ name: 'School average', color: '#d01858', data: S.performanceOverTime(s).map((p) => ({ label: p.exam, value: p.value })) }]} min={0} max={100} /></Section>
        <Section title="Class-wise performance" subtitle={latestExam?.name}><BarChart unit="%" max={100} data={s.classes.map((c) => ({ label: c.no, value: byClass[c.id] ?? 0 }))} highlight={(d) => d.value < 60} /></Section>
        <Section title="Subject-wise performance" subtitle={latestExam?.name}><BarChart unit="%" max={100} data={Object.entries(bySubject).map(([id, v]) => ({ label: S.subjectShort(s, id), value: v, color: S.idx(s).subjects[id]?.color }))} /></Section>
        <Section title="Assignment completion by section" subtitle="Share of due work submitted" className="lg:col-span-2"><BarChart unit="%" max={100} data={completion.map((c) => ({ label: c.label, value: Math.round(c.rate) }))} highlight={(d) => d.value < 70} height={200} /></Section>
      </div>
    </>
  );
}
export { TrendingUp };
