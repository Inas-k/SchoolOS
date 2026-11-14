import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Send } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { can } from '../../lib/perms';
import { avg, fmtDate, money, pct, today } from '../../lib/util';
import { Badge, BarChart, Button, Card, Checkboxes, DataTable, Donut, HBars, Input, Modal, PageHeader, Section, Select, Stat, Tabs, Textarea, toneForPct, useRun } from '../../ui/kit';
import { classOptions, sectionOptions } from '../common';
import { FeesView } from '../shared';
import { useMe } from '../../app/shell';

const { idx } = S;

export function Fees() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const [tab, setTab] = useState('overview');
  const [pay, setPay] = useState(null);
  const [amt, setAmt] = useState('');
  const [mode, setMode] = useState('Cash');
  const manage = can(role, 'fees.manage');
  const sum = S.feeSummary(s);
  const byClass = s.classes.map((c) => { const x = S.feeSummary(s, (st) => st.classId === c.id); return { label: c.no, value: x.pct }; });
  const rows = s.feeRecords.map((f) => ({ f, st: idx(s).students[f.studentId], state: S.feeState(s, f) })).filter((r) => r.st);
  const tone = { paid: 'green', partial: 'amber', overdue: 'red', upcoming: 'gray' };
  const dues = rows.filter((r) => r.state === 'overdue');
  const total = dues.reduce((a, r) => a + r.f.amount - r.f.paid, 0);
  return (
    <>
      <PageHeader title="Fees" subtitle="Collections, dues and payment records." actions={manage && <Button icon={Bell} onClick={() => run(() => A.sendFeeReminders(), (n) => `Reminders sent to ${n} families.`)}>Send reminders for overdue ({dues.length})</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5"><Stat label="Billed so far" value={money(sum.billed)} tone="blue" /><Stat label="Collected" value={money(sum.collected)} sub={`${sum.pct}% of billed`} tone="green" /><Stat label="Overdue balance" value={money(total)} sub={`${dues.length} invoices`} tone="red" /><div className="card-soft p-4 flex items-center gap-4"><Donut value={sum.pct} color="#059669" size={84} /><div className="text-sm text-gray-600">Collection rate</div></div></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'By class' }, { value: 'invoices', label: 'All invoices' }, { value: 'overdue', label: 'Overdue', count: dues.length }]} />
      <div className="mt-5">
        {tab === 'overview' && <Section title="Collection rate by class" subtitle="Share of billed fees collected"><BarChart unit="%" max={100} data={byClass} highlight={(d) => d.value < 70} /></Section>}
        {tab !== 'overview' && (
          <Card className="p-4">
            <DataTable pageSize={12} exportName="fee-invoices" rows={tab === 'overdue' ? dues : rows} rowKey={(r) => r.f.id} search={(r) => `${r.st.name} ${r.st.admNo} ${r.f.term}`} filters={[{ key: 'cls', label: 'All classes', options: classOptions(s), get: (r) => r.st.classId }, { key: 'term', label: 'All terms', options: ['Term 1', 'Term 2', 'Term 3'].map((v) => ({ value: v, label: v })), get: (r) => r.f.term }, ...(tab === 'overdue' ? [] : [{ key: 'state', label: 'Any status', options: ['paid', 'partial', 'overdue', 'upcoming'].map((v) => ({ value: v, label: v })), get: (r) => r.state }])]}
              columns={[
                { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <div><b className="text-gray-900">{r.st.name}</b><div className="text-xs text-gray-500">Class {S.sectionLabel(s, r.st.sectionId)}</div></div> },
                { key: 't', label: 'Term', value: (r) => r.f.term }, { key: 'a', label: 'Amount', value: (r) => r.f.amount, render: (r) => money(r.f.amount) },
                { key: 'p', label: 'Paid', value: (r) => r.f.paid, render: (r) => money(r.f.paid) }, { key: 'd', label: 'Due', value: (r) => r.f.due, render: (r) => fmtDate(r.f.due) },
                { key: 's', label: 'Status', value: (r) => r.state, render: (r) => <Badge tone={tone[r.state]}>{r.state}</Badge> },
                { key: 'x', label: '', render: (r) => manage && r.f.paid < r.f.amount && <Button size="sm" variant="outline" onClick={() => { setPay(r.f); setAmt(String(r.f.amount - r.f.paid)); }}>Record payment</Button> },
              ]} />
          </Card>
        )}
      </div>
      <Modal open={!!pay} onClose={() => setPay(null)} title="Record a payment" footer={<><Button variant="outline" onClick={() => setPay(null)}>Cancel</Button><Button onClick={() => run(() => { A.payFee(pay.id, amt, mode); setPay(null); }, 'Payment recorded.')}>Record</Button></>}>
        {pay && <div className="space-y-3"><p className="text-sm text-gray-700">{S.studentName(s, pay.studentId)} · {pay.term} · outstanding <b>{money(pay.amount - pay.paid)}</b></p><Input label="Amount (₹)" type="number" min="1" value={amt} onChange={(e) => setAmt(e.target.value)} /><Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value)} options={['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque'].map((v) => ({ value: v, label: v }))} /></div>}
      </Modal>
    </>
  );
}

export function Communication() {
  const s = useAppState();
  const run = useRun();
  const [f, setF] = useState({ title: '', body: '', sectionIds: [], priority: 'normal' });
  const [allSecs, setAllSecs] = useState(true);
  const meets = [...s.meetings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const threads = s.messages.length;
  const log = s.announcements.filter((a) => a.audience.includes('parent')).slice(0, 8);
  const sent = () => run(() => { A.postAnnouncement({ title: f.title, body: f.body, audience: ['parent'], priority: f.priority, sectionIds: allSecs ? [] : f.sectionIds }); setF({ title: '', body: '', sectionIds: [], priority: 'normal' }); }, 'Message sent to parents. They will see a notification.');
  return (
    <>
      <PageHeader title="Parent Communication" subtitle="Send circulars to parents of selected classes, and oversee teacher meetings." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Send a message to parents">
          <div className="space-y-3">
            <Input label="Subject" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Textarea label="Message" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={allSecs} onChange={(e) => setAllSecs(e.target.checked)} />All classes</label>
            {!allSecs && <Checkboxes label="Choose sections" value={f.sectionIds} onChange={(v) => setF({ ...f, sectionIds: v })} options={sectionOptions(s).map((o) => ({ value: o.value, label: o.label.replace('Class ', '') }))} />}
            <Select label="Priority" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} />
            <Button icon={Send} onClick={sent}>Send to parents</Button>
          </div>
        </Section>
        <Section title="Recently sent" subtitle={`${threads} parent-teacher messages exchanged · ${meets.length} meeting requests`}>
          <ul className="divide-y divide-gray-100">{log.map((a) => <li key={a.id} className="py-2.5"><div className="font-semibold text-gray-900 text-sm">{a.title}</div><div className="text-xs text-gray-500">{fmtDate(a.date)}{a.sectionIds?.length ? ` · Classes ${a.sectionIds.join(', ')}` : ' · All classes'}</div></li>)}</ul>
          <Link to="../announcements" relative="path" className="mt-3 inline-block text-sm font-semibold text-cta">All announcements →</Link>
        </Section>
      </div>
      <Section className="mt-5" title="Parent-teacher meeting requests">
        <DataTable pageSize={8} rows={meets} exportName="meetings" columns={[{ key: 'p', label: 'Parent', value: (r) => idx(s).parents[r.parentId]?.name || '' }, { key: 's', label: 'Student', value: (r) => S.studentName(s, r.studentId) }, { key: 't', label: 'Teacher', value: (r) => S.teacherName(s, r.teacherId) }, { key: 'd', label: 'Requested date', value: (r) => r.date, render: (r) => fmtDate(r.date) }, { key: 'r', label: 'Reason', value: (r) => r.reason }, { key: 'st', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={{ pending: 'amber', accepted: 'green', declined: 'red' }[r.status]}>{r.status}</Badge> }]} />
      </Section>
    </>
  );
}

export function Growth() {
  const s = useAppState();
  const [cls, setCls] = useState('');
  const students = s.students.filter((x) => x.status === 'active' && (!cls || x.classId === cls));
  const data = students.map((st) => { const sub = S.studentSubjectSummary(s, st.id); const overall = sub.length ? avg(sub.map((x) => x.avg)) : null; const att = S.studentAttendance(s, st.id).pct; const asg = S.assignmentsForStudent(s, st.id).filter((a) => a.due < today()); const done = asg.filter((a) => S.assignmentState(s, a, st.id).key !== 'missing').length; return { st, overall, att, comp: asg.length ? pct(done, asg.length) : null, ach: s.achievements.filter((x) => x.studentId === st.id).length, trend: sub.length ? avg(sub.map((x) => x.trend)) : 0 }; });
  const attention = data.filter((d) => d.overall != null && d.overall < 55 || d.att < s.school.attendanceThreshold).sort((a, b) => (a.overall ?? 100) - (b.overall ?? 100));
  const bands = [['90+', 90, 101], ['80–89', 80, 90], ['70–79', 70, 80], ['60–69', 60, 70], ['50–59', 50, 60], ['<50', 0, 50]].map(([label, lo, hi]) => ({ label, value: data.filter((d) => d.overall != null && d.overall >= lo && d.overall < hi).length }));
  const skillKeys = ['communication', 'leadership', 'creativity', 'teamwork', 'criticalThinking'];
  const skillAvg = skillKeys.map((k) => ({ label: { communication: 'Comm.', leadership: 'Lead.', creativity: 'Creat.', teamwork: 'Team', criticalThinking: 'Think' }[k], value: Number(avg(students.map((x) => s.skills[x.id]?.[k] || 3)).toFixed(1)) }));
  const improving = data.filter((d) => d.trend > 3).length, declining = data.filter((d) => d.trend < -3).length;
  return (
    <>
      <PageHeader title="Student Growth Analytics" subtitle="Academic, attendance, assignment and skills signals across students. Open a student to see their full Growth Passport." />
      <div className="max-w-xs mb-4"><Select label="Class" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="All classes" options={classOptions(s)} /></div>
      <div className="grid gap-4 sm:grid-cols-4 mb-5"><Stat label="Students" value={students.length} tone="blue" /><Stat label="Improving" value={improving} sub="up 3+ points since last exam" tone="green" /><Stat label="Declining" value={declining} sub="down 3+ points" tone="amber" /><Stat label="May need support" value={attention.length} sub="low marks or attendance" tone="red" /></div>
      <div className="grid gap-5 lg:grid-cols-2 mb-5"><Section title="Overall performance distribution" subtitle="Students by average %"><BarChart data={bands} /></Section><Section title="Average skill rating (1–5)" subtitle="Teacher-assessed"><BarChart data={skillAvg} max={5} color="#7c3aed" /></Section></div>
      <Section title="Students who may need support" subtitle="A starting point for a supportive conversation, not a verdict.">
        <DataTable pageSize={8} exportName="students-needing-support" rows={attention} rowKey={(r) => r.st.id} search={(r) => r.st.name} columns={[{ key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <Link className="font-semibold text-primary" to={`../students/${r.st.id}`} relative="path">{r.st.name}</Link> }, { key: 'c', label: 'Class', value: (r) => S.sectionLabel(s, r.st.sectionId) }, { key: 'o', label: 'Average', sort: (r) => r.overall ?? -1, value: (r) => (r.overall != null ? `${r.overall.toFixed(1)}%` : '–'), render: (r) => r.overall != null ? <Badge tone={toneForPct(r.overall)}>{r.overall.toFixed(1)}%</Badge> : '–' }, { key: 'a', label: 'Attendance', sort: (r) => r.att, value: (r) => `${r.att}%`, render: (r) => <Badge tone={r.att < s.school.attendanceThreshold ? 'red' : 'gray'}>{r.att}%</Badge> }, { key: 'as', label: 'Assignments', value: (r) => (r.comp != null ? `${r.comp}%` : '–') }]} />
      </Section>
    </>
  );
}
export { HBars };
