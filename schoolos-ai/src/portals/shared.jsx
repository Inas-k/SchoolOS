import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Award, BookOpen, Download, ExternalLink, FileText, Heart, Pencil, Plus, Printer, Send, Trash2, Video } from 'lucide-react';
import { useAppState } from '../lib/store';
import * as S from '../lib/selectors';
import * as A from '../lib/actions';
import { can } from '../lib/perms';
import { avg, cx, downloadFile, fmtDate, fmtDateTime, fmtShort, money, pct, toCSV, today, weekdayShort } from '../lib/util';
import { PERIODS, DAYS } from '../data/seed';
import { CHAPTERS } from '../data/curriculum';
import { Avatar, Badge, BarChart, Button, Card, Checkboxes, DataTable, Donut, EmptyState, Field, FileInput, HBars, Input, LineChart, Modal, PageHeader, ProgressBar, Section, Select, Stat, Tabs, Textarea, toneForPct, useConfirm, useRun } from '../ui/kit';
import { useMe } from '../app/shell';

const { idx } = S;
const subjColor = (s, id) => idx(s).subjects[id]?.color || '#0072e5';

// ───────── Attendance (read-only per student) ─────────
export function AttendanceView({ student }) {
  const s = useAppState();
  const a = S.studentAttendance(s, student.id);
  const dates = S.attendanceIndex(s).dates.slice(-20);
  const days = dates.map((d) => ({ d, st: S.attendanceStatusOn(s, student.id, d) }));
  const tone = a.pct >= 90 ? 'green' : a.pct >= s.school.attendanceThreshold ? 'amber' : 'red';
  const color = { green: '#059669', amber: '#d97706', red: '#dc2626' }[tone];
  const absences = days.filter((x) => x.st === 'A' || x.st === 'L').reverse();
  return (
    <div className="space-y-5">
      {a.pct < s.school.attendanceThreshold && (
        <div className="flex gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-900"><AlertTriangle className="w-5 h-5 shrink-0" /><p>Attendance is <b>{a.pct}%</b>, below the school requirement of {s.school.attendanceThreshold}%.</p></div>
      )}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-5 flex items-center gap-4 lg:col-span-1"><Donut value={a.pct} color={color} sub="attended" /><div><div className="font-bold text-gray-900">{student.name.split(' ')[0]}</div><div className="text-sm text-gray-600">Overall attendance</div></div></Card>
        <Stat label="Days present" value={a.present} sub={`of ${a.total} recorded`} tone="green" />
        <Stat label="Days absent" value={a.absent} tone="red" />
        <Stat label="Late arrivals" value={a.late} tone="amber" />
      </div>
      <Section title="Last 20 school days" subtitle="Green is present, red is absent, amber is late, grey is not marked yet.">
        <div className="flex flex-wrap gap-1.5">
          {days.map(({ d, st }) => (
            <div key={d} title={`${fmtDate(d)}: ${st === 'P' ? 'Present' : st === 'A' ? 'Absent' : st === 'L' ? 'Late' : 'Not marked'}`} className={cx('w-[46px] rounded-lg py-1.5 text-center text-[11px] font-bold', st === 'P' ? 'bg-emerald-100 text-emerald-800' : st === 'A' ? 'bg-red-100 text-red-800' : st === 'L' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500')}>
              <div>{weekdayShort(d)}</div><div className="text-[10px] font-semibold opacity-80">{fmtShort(d)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Absences and late arrivals">
        {absences.length ? <ul className="divide-y divide-gray-100">{absences.map((x) => <li key={x.d} className="py-2.5 flex justify-between text-sm"><span className="font-semibold text-gray-900">{fmtDate(x.d, { weekday: 'long', day: 'numeric', month: 'long' })}</span><Badge tone={x.st === 'A' ? 'red' : 'amber'}>{x.st === 'A' ? 'Absent' : 'Late'}</Badge></li>)}</ul> : <p className="text-sm text-gray-600">No absences in the last 20 school days.</p>}
      </Section>
    </div>
  );
}

// ───────── Academics + report card ─────────
export function reportCardData(s, studentId, examId) {
  const st = idx(s).students[studentId];
  const exam = idx(s).exams[examId];
  const res = S.examResult(s, studentId, examId);
  const ranks = S.sectionRanks(s, st.sectionId, examId);
  const att = S.studentAttendance(s, studentId);
  const roster = idx(s).studentsBySection[st.sectionId] || [];
  const rows = res.rows.map((r) => {
    const vals = roster.map((x) => s.marks[examId]?.[r.subjectId]?.[x.id]).filter((v) => v != null);
    return { ...r, classAvg: vals.length ? Number(avg(vals).toFixed(1)) : null };
  });
  const ct = idx(s).teachers[idx(s).sections[st.sectionId].classTeacherId];
  const remark = res.percent >= 85 ? 'Outstanding performance. Keep it up.' : res.percent >= 70 ? 'Good work. Consistent practice will lift results further.' : res.percent >= 50 ? 'Satisfactory. More regular revision is advised.' : 'Needs focused support. Please meet the class teacher.';
  return { st, exam, res, rows, rank: ranks[studentId], strength: roster.filter((x) => ranks[x.id]).length, att, ct, remark, section: S.sectionLabel(s, st.sectionId) };
}
export function ReportCard({ studentId, examId }) {
  const s = useAppState();
  const d = reportCardData(s, studentId, examId);
  if (!d.rows.length) return <EmptyState title="No published results" text="Marks for this exam have not been submitted yet." />;
  return (
    <div className="report-card bg-white text-gray-900 border border-gray-300 rounded-lg p-6 text-sm">
      <div className="text-center border-b-2 border-gray-900 pb-3">
        <h2 className="text-xl font-extrabold tracking-tight">{s.school.name}</h2>
        <p className="text-gray-600">Academic Year {s.school.academicYear} · {d.exam.name} · Report Card</p>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-3 text-[13px]">
        <div><b>Name:</b> {d.st.name}</div><div><b>Admission No:</b> {d.st.admNo}</div>
        <div><b>Class:</b> {d.section}</div><div><b>Roll No:</b> {d.st.rollNo}</div>
        <div><b>Date of birth:</b> {fmtDate(d.st.dob)}</div><div><b>Attendance:</b> {d.att.pct}%</div>
      </div>
      <table className="w-full border border-gray-300 text-[13px]">
        <thead className="bg-gray-100"><tr>{['Subject', 'Marks', 'Out of', 'Percent', 'Grade', 'Class avg'].map((h) => <th key={h} className="border border-gray-300 px-2 py-1.5 text-start">{h}</th>)}</tr></thead>
        <tbody>{d.rows.map((r) => <tr key={r.subjectId}><td className="border border-gray-300 px-2 py-1.5">{S.subjectName(s, r.subjectId)}</td><td className="border border-gray-300 px-2 py-1.5">{r.mark}</td><td className="border border-gray-300 px-2 py-1.5">{r.max}</td><td className="border border-gray-300 px-2 py-1.5">{r.percent}%</td><td className="border border-gray-300 px-2 py-1.5 font-bold">{r.grade}</td><td className="border border-gray-300 px-2 py-1.5">{r.classAvg ?? '–'}</td></tr>)}</tbody>
        <tfoot><tr className="bg-gray-50 font-bold"><td className="border border-gray-300 px-2 py-1.5">Total</td><td className="border border-gray-300 px-2 py-1.5">{d.res.total}</td><td className="border border-gray-300 px-2 py-1.5">{d.res.max}</td><td className="border border-gray-300 px-2 py-1.5">{d.res.percent}%</td><td className="border border-gray-300 px-2 py-1.5">{d.res.grade}</td><td className="border border-gray-300 px-2 py-1.5" /></tr></tfoot>
      </table>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 py-3 text-[13px]">
        <div><b>Rank in section:</b> {d.rank ? `${d.rank} of ${d.strength}` : '–'}</div>
        <div><b>Result status:</b> {d.rows.every((r) => r.final) ? 'Final' : 'Provisional (awaiting approval)'}</div>
        {!d.res.complete && <div className="col-span-2 text-amber-700"><b>Note:</b> Some subjects are not yet published, so the total is incomplete.</div>}
        <div className="col-span-2"><b>Remarks:</b> {d.remark}</div>
      </div>
      <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[12px] text-gray-600"><div className="border-t border-gray-400 pt-1">{d.ct?.name || 'Class teacher'}<br />Class Teacher</div><div className="border-t border-gray-400 pt-1">Parent / Guardian</div><div className="border-t border-gray-400 pt-1">Principal</div></div>
      <p className="mt-4 text-[11px] text-gray-500 text-center">Demo document generated from fictional records.</p>
    </div>
  );
}
export function printNode(node, title = 'Print') {
  const css = [...document.querySelectorAll('link[rel=stylesheet],style')].map((n) => n.outerHTML).join('');
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f);
  f.contentDocument.open();
  f.contentDocument.write(`<!doctype html><html><head><title>${title}</title>${css}</head><body style="background:#fff;padding:16px">${node.outerHTML}</body></html>`);
  f.contentDocument.close();
  f.onload = () => { setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1500); }, 250); };
  setTimeout(() => { if (f.contentDocument.readyState === 'complete' && !f.dataset.done) { f.dataset.done = '1'; f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1500); } }, 700);
}
export function ReportCardModal({ open, onClose, studentId, examId }) {
  const ref = useRef(null);
  const s = useAppState();
  const d = open && examId ? reportCardData(s, studentId, examId) : null;
  const csv = () => downloadFile(`report-card-${d.st.admNo}-${d.exam.name.replace(/\W+/g, '-')}.csv`, toCSV(d.rows, [{ label: 'Subject', value: (r) => S.subjectName(s, r.subjectId) }, { label: 'Marks', value: (r) => r.mark }, { label: 'Max', value: (r) => r.max }, { label: 'Percent', value: (r) => r.percent }, { label: 'Grade', value: (r) => r.grade }]));
  return (
    <Modal open={open} onClose={onClose} wide title="Report card" footer={d && d.rows.length ? <><Button variant="outline" icon={Download} onClick={csv}>CSV</Button><Button icon={Printer} onClick={() => printNode(ref.current, 'Report card')}>Print / Save as PDF</Button></> : null}>
      <div ref={ref}>{open && examId && <ReportCard studentId={studentId} examId={examId} />}</div>
    </Modal>
  );
}
export function AcademicsView({ student }) {
  const s = useAppState();
  const published = s.exams.filter((e) => S.marksFor(s, student.id, e.id).length).sort((a, b) => b.date.localeCompare(a.date));
  const [examId, setExamId] = useState(published[0]?.id);
  const [card, setCard] = useState(false);
  const cur = published.find((e) => e.id === examId) || published[0];
  if (!published.length) return <EmptyState title="No published results yet" text="Results appear here as soon as teachers submit marks." />;
  const res = S.examResult(s, student.id, cur.id);
  const rank = S.sectionRanks(s, student.sectionId, cur.id)[student.id];
  const roster = idx(s).studentsBySection[student.sectionId] || [];
  const upcoming = s.exams.filter((e) => e.date > today()).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="space-y-5">
      <Tabs tabs={published.map((e) => ({ value: e.id, label: e.name }))} value={cur.id} onChange={setExamId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={`${res.total}/${res.max}`} sub={res.complete ? 'All subjects published' : 'Some subjects pending'} tone="blue" />
        <Stat label="Percentage" value={`${res.percent}%`} tone={toneForPct(res.percent)} />
        <Stat label="Grade" value={res.grade} tone={S.gradeTone(res.grade)} />
        <Stat label="Rank in section" value={rank ? `#${rank}` : '–'} sub={`of ${roster.length} students`} tone="purple" />
      </div>
      <Section title={cur.name} subtitle={`Conducted ${fmtDate(cur.date)}`} action={<Button variant="outline" size="sm" icon={FileText} onClick={() => setCard(true)}>Report card</Button>}>
        <DataTable pageSize={12} columns={[
          { key: 's', label: 'Subject', render: (r) => <span className="font-semibold text-gray-900">{S.subjectName(s, r.subjectId)}</span>, value: (r) => S.subjectName(s, r.subjectId) },
          { key: 'm', label: 'Marks', render: (r) => `${r.mark} / ${r.max}`, sort: (r) => r.mark },
          { key: 'p', label: 'Percent', render: (r) => <div className="flex items-center gap-2 min-w-[120px]"><ProgressBar value={r.percent} tone={toneForPct(r.percent)} className="flex-1" /><span className="tabular-nums w-12 text-end">{r.percent}%</span></div>, sort: (r) => r.percent },
          { key: 'g', label: 'Grade', render: (r) => <Badge tone={S.gradeTone(r.grade)}>{r.grade}</Badge>, value: (r) => r.grade },
          { key: 'st', label: 'Status', render: (r) => (r.final ? <Badge tone="green">Final</Badge> : <Badge tone="amber">Provisional</Badge>) },
        ]} rows={S.marksFor(s, student.id, cur.id)} rowKey={(r) => r.subjectId} />
      </Section>
      {upcoming.length > 0 && <Section title="Upcoming examinations"><ul className="divide-y divide-gray-100">{upcoming.map((e) => <li key={e.id} className="py-2.5 flex justify-between text-sm"><span className="font-semibold">{e.name}</span><span className="text-gray-600">{fmtDate(e.date)} · {e.max} marks</span></li>)}</ul></Section>}
      <ReportCardModal open={card} onClose={() => setCard(false)} studentId={student.id} examId={cur.id} />
    </div>
  );
}

// ───────── Assignments ─────────
const STATE_META = { pending: ['Pending', 'blue'], submitted: ['Submitted', 'green'], late: ['Submitted late', 'amber'], reviewed: ['Evaluated', 'purple'], missing: ['Missing', 'red'] };
export function AssignmentStatusBadge({ k }) {
  const [t, tone] = STATE_META[k];
  return <Badge tone={tone}>{t}</Badge>;
}
export function AssignmentsList({ student, detailBase, onOpen }) {
  const s = useAppState();
  const [tab, setTab] = useState('all');
  const all = S.assignmentsForStudent(s, student.id).map((a) => ({ a, st: S.assignmentState(s, a, student.id) }));
  const count = (k) => all.filter((x) => (k === 'all' ? true : k === 'submitted' ? ['submitted', 'late'].includes(x.st.key) : x.st.key === k)).length;
  const list = all.filter((x) => (tab === 'all' ? true : tab === 'submitted' ? ['submitted', 'late'].includes(x.st.key) : x.st.key === tab));
  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} tabs={[['all', 'All'], ['pending', 'Pending'], ['submitted', 'Submitted'], ['reviewed', 'Evaluated'], ['missing', 'Missing']].map(([value, label]) => ({ value, label, count: count(value) }))} />
      {!list.length && <EmptyState title="Nothing here" text="No assignments in this category." />}
      <ul className="grid gap-3 lg:grid-cols-2">
        {list.map(({ a, st }) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-3"><div><div className="text-[13px] font-semibold" style={{ color: subjColor(s, a.subjectId) }}>{S.subjectName(s, a.subjectId)} · {a.chapter}</div><div className="mt-0.5 font-bold text-gray-900">{a.title}</div></div><AssignmentStatusBadge k={st.key} /></div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-600"><span>Due {fmtDate(a.due)}</span><span>{S.teacherName(s, a.teacherId)}</span>{st.sub?.status === 'reviewed' && <span className="font-bold text-gray-900">Marks {st.sub.marks}/{a.maxMarks}</span>}</div>
              {st.sub?.feedback && <p className="mt-2 text-[13px] text-gray-700 bg-gray-50 rounded-lg px-3 py-2">“{st.sub.feedback}”</p>}
            </>
          );
          return <li key={a.id}>{detailBase ? <Link to={`${detailBase}/${a.id}`} className="card-soft card-soft-hover block p-4 hover:-translate-y-0.5">{body}</Link> : <button onClick={() => onOpen(a)} className="card-soft card-soft-hover block p-4 w-full text-start hover:-translate-y-0.5">{body}</button>}</li>;
        })}
      </ul>
    </div>
  );
}
export function AssignmentDetailBody({ assignment: a, student, canSubmit }) {
  const s = useAppState();
  const run = useRun();
  const st = S.assignmentState(s, a, student.id);
  const [text, setText] = useState(st.sub?.text === 'Submitted solutions (demo record).' ? '' : st.sub?.text || '');
  const [file, setFile] = useState(null);
  const locked = st.sub?.status === 'reviewed';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{S.subjectName(s, a.subjectId)}</Badge><span className="text-sm text-gray-600">{a.chapter}</span><AssignmentStatusBadge k={st.key} /></div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm"><div><div className="text-gray-500 text-xs">Due</div><b>{fmtDate(a.due)}</b></div><div><div className="text-gray-500 text-xs">Teacher</div><b>{S.teacherName(s, a.teacherId)}</b></div><div><div className="text-gray-500 text-xs">Maximum marks</div><b>{a.maxMarks}</b></div></div>
      <div><div className="text-xs font-semibold text-gray-500 mb-1">Instructions</div><p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-line">{a.description || 'No additional instructions.'}</p></div>
      {a.attachments?.length > 0 && <div><div className="text-xs font-semibold text-gray-500 mb-1">Attachments</div><ul className="space-y-1">{a.attachments.map((f) => <li key={f.name} className="text-sm">{f.data ? <a className="text-primary font-semibold" href={f.data} download={f.name}>{f.name}</a> : f.name}</li>)}</ul></div>}
      {st.sub?.status === 'reviewed' && <div className="rounded-xl bg-violet-50 border border-violet-200 p-4"><div className="font-extrabold text-violet-900">Result: {st.sub.marks} / {a.maxMarks} ({pct(st.sub.marks, a.maxMarks)}%)</div>{st.sub.feedback && <p className="mt-1 text-sm text-violet-900">Teacher feedback: {st.sub.feedback}</p>}</div>}
      {st.sub && <div className="text-sm text-gray-600">Submitted {fmtDateTime(st.sub.at)}{st.sub.late ? ' (after the deadline)' : ''}{st.sub.fileName ? ` · ${st.sub.fileName}` : ''}</div>}
      {canSubmit && !locked && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <Textarea label={st.sub ? 'Update your answer' : 'Your answer'} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your answer or notes for the teacher…" />
          <FileInput label="Attach a file (optional)" onFile={setFile} />
          {a.due < today() && !st.sub && <p className="text-sm text-amber-700">The deadline has passed. This will be recorded as a late submission.</p>}
          <Button icon={Send} onClick={() => run(() => A.submitAssignment(a.id, { text, fileName: file?.name, fileData: file?.data }), st.sub ? 'Submission updated.' : 'Assignment submitted.')}>{st.sub ? 'Update submission' : 'Submit assignment'}</Button>
        </div>
      )}
      {canSubmit && locked && <p className="text-sm text-gray-600">This work has been evaluated and can no longer be changed.</p>}
    </div>
  );
}

// ───────── Performance intelligence ─────────
export function PerformanceView({ student }) {
  const s = useAppState();
  const sum = S.studentSubjectSummary(s, student.id);
  const mastery = S.chapterMastery(s, student.id).sort((a, b) => b.percent - a.percent);
  const recs = S.recommendations(s, student.id);
  const exams = [...new Set(sum.flatMap((x) => x.history.map((h) => h.exam)))];
  const sorted = [...sum].sort((a, b) => b.avg - a.avg);
  const [filter, setFilter] = useState('');
  const [practiceFor, setPracticeFor] = useState(null);
  const nav = useNavigate();
  const { role } = useMe();
  if (!sum.length) return <EmptyState title="No published marks yet" text="Subject performance appears when exam marks are submitted." />;
  const series = sum.filter((x) => !filter || x.subjectId === filter).map((x) => ({ name: S.subjectName(s, x.subjectId), color: subjColor(s, x.subjectId), data: exams.map((e) => ({ label: e, value: x.history.find((h) => h.exam === e)?.value ?? null })) }));
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Subject-wise average" className="lg:col-span-2"><BarChart unit="%" max={100} data={sum.map((x) => ({ label: S.subjectShort(s, x.subjectId), value: Math.round(x.avg), color: subjColor(s, x.subjectId) }))} /></Section>
        <Section title="Strengths and focus areas">
          <div className="space-y-3 text-sm">
            <div><div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Strengths</div>{sorted.slice(0, 2).map((x) => <div key={x.subjectId} className="flex justify-between py-1"><span className="font-semibold">{S.subjectName(s, x.subjectId)}</span><Badge tone="green">{x.avg}%</Badge></div>)}</div>
            <div><div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Needs improvement</div>{sorted.slice(-2).reverse().map((x) => <div key={x.subjectId} className="flex justify-between py-1"><span className="font-semibold">{S.subjectName(s, x.subjectId)}</span><Badge tone="amber">{x.avg}%</Badge></div>)}</div>
          </div>
        </Section>
      </div>
      <Section title="Assessment history" action={<select aria-label="Subject filter" value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"><option value="">All subjects</option>{sum.map((x) => <option key={x.subjectId} value={x.subjectId}>{S.subjectName(s, x.subjectId)}</option>)}</select>}>
        <LineChart series={series} min={0} max={100} />
      </Section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Chapter-wise mastery" subtitle="From evaluated assignments and practice quizzes">
          {mastery.length ? <ul className="space-y-3">{mastery.map((m) => <li key={m.subjectId + m.chapter}><div className="flex justify-between text-[13px] mb-1"><span><b className="text-gray-900">{m.chapter}</b> <span className="text-gray-500">· {S.subjectName(s, m.subjectId)}</span></span><span className="tabular-nums font-semibold">{m.percent}%</span></div><ProgressBar value={m.percent} tone={toneForPct(m.percent)} label={m.chapter} /></li>)}</ul> : <p className="text-sm text-gray-600">No chapters assessed yet.</p>}
        </Section>
        <Section title="Recommended next steps" subtitle="Suggestions for practice, not judgements">
          {recs.length ? <ul className="space-y-3">{recs.map((r, i) => <li key={i} className="flex items-start justify-between gap-3 text-sm"><span className="text-gray-800">{r.text}</span>{role === 'student' && r.kind === 'practice' && <Button size="sm" variant="outline" onClick={() => nav(`/app/student/practice?subject=${r.subjectId}&chapter=${encodeURIComponent(r.chapter)}`)}>Practise</Button>}</li>)}</ul> : <p className="text-sm text-gray-600">Nothing urgent. Keep up the good work.</p>}
        </Section>
      </div>
    </div>
  );
}

// ───────── Growth passport ─────────
function Radar({ values, labels, size = 220 }) {
  const n = labels.length, c = size / 2, r = size / 2 - 38;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [c + Math.cos(a) * r * (v / 5), c + Math.sin(a) * r * (v / 5)]; };
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Skills radar chart">
      {[1, 2, 3, 4, 5].map((l) => <polygon key={l} points={labels.map((_, i) => pt(i, l).join(',')).join(' ')} fill="none" stroke="#e4e4e7" />)}
      {labels.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 5)[0]} y2={pt(i, 5)[1]} stroke="#e4e4e7" />)}
      <polygon points={values.map((v, i) => pt(i, v).join(',')).join(' ')} fill="#0072e5" fillOpacity="0.18" stroke="#0072e5" strokeWidth="2.5" />
      {labels.map((l, i) => { const [x, y] = pt(i, 5.9); return <text key={l} x={x} y={y} fontSize="10.5" fontWeight="600" fill="#3f3f46" textAnchor="middle" dominantBaseline="middle">{l}</text>; })}
    </svg>
  );
}
const SKILL_LABELS = { communication: 'Communication', leadership: 'Leadership', creativity: 'Creativity', teamwork: 'Teamwork', criticalThinking: 'Critical thinking' };
const ACH_TONE = { competition: 'pink', project: 'blue', sports: 'green', arts: 'purple', leadership: 'amber', certificate: 'gray' };
export function Passport({ student, canEditSkills, canAddAchievement, canDeleteAchievement }) {
  const s = useAppState();
  const run = useRun();
  const ref = useRef(null);
  const att = S.studentAttendance(s, student.id);
  const sum = S.studentSubjectSummary(s, student.id);
  const overall = sum.length ? Number(avg(sum.map((x) => x.avg)).toFixed(1)) : null;
  const asg = S.assignmentsForStudent(s, student.id).filter((a) => a.due < today());
  const done = asg.filter((a) => S.assignmentState(s, a, student.id).key !== 'missing').length;
  const mastery = S.chapterMastery(s, student.id).sort((a, b) => b.percent - a.percent);
  const skills = s.skills[student.id] || { communication: 3, leadership: 3, creativity: 3, teamwork: 3, criticalThinking: 3 };
  const [skillDraft, setSkillDraft] = useState(null);
  const ach = s.achievements.filter((x) => x.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const fb = s.feedback.filter((x) => x.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const goals = s.goals[student.id] || [];
  const [addOpen, setAddOpen] = useState(false);
  const [af, setAf] = useState({ title: '', category: 'project', date: today() });
  const [ask, confirmNode] = useConfirm();
  const keys = Object.keys(SKILL_LABELS);
  const sk = skillDraft || skills;
  return (
    <div className="space-y-5" ref={ref}>
      <Card className="p-5 lg:p-6 bg-ink !border-ink text-white">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={student.name} size={64} color="#d01858" />
          <div className="flex-1 min-w-[200px]"><h2 className="text-2xl font-extrabold">{student.name}</h2><p className="text-white/70 text-sm">Class {S.sectionLabel(s, student.sectionId)} · Admission {student.admNo} · Growth Passport</p></div>
          <Button variant="outline" size="sm" icon={Printer} onClick={() => printNode(ref.current, 'Growth Passport')}>Print</Button>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Academic average" value={overall != null ? `${overall}%` : '–'} sub={overall != null ? `Grade ${S.gradeFor(s, overall)}` : 'No results yet'} tone="blue" />
        <Stat label="Attendance" value={`${att.pct}%`} tone={toneForPct(att.pct)} />
        <Stat label="Assignments completed" value={asg.length ? `${pct(done, asg.length)}%` : '–'} sub={`${done} of ${asg.length} due`} tone="green" />
        <Stat label="Achievements" value={ach.length} sub="Projects, competitions, activities" tone="pink" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Skills profile" subtitle="Rated 1 to 5 by teachers" action={canEditSkills && (skillDraft ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSkillDraft(null)}>Cancel</Button><Button size="sm" onClick={() => run(() => { A.setSkills(student.id, skillDraft); setSkillDraft(null); }, 'Skills updated.')}>Save</Button></div> : <Button size="sm" variant="outline" icon={Pencil} onClick={() => setSkillDraft({ ...skills })}>Edit</Button>)}>
          <div className="flex flex-wrap items-center gap-4 justify-center">
            <Radar values={keys.map((k) => sk[k])} labels={keys.map((k) => SKILL_LABELS[k])} />
            <ul className="space-y-2 text-sm min-w-[190px]">{keys.map((k) => <li key={k} className="flex items-center justify-between gap-3"><span className="text-gray-700">{SKILL_LABELS[k]}</span>{skillDraft ? <select aria-label={SKILL_LABELS[k]} value={sk[k]} onChange={(e) => setSkillDraft({ ...skillDraft, [k]: Number(e.target.value) })} className="border border-gray-300 rounded-md px-2 py-1">{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select> : <b className="tabular-nums">{sk[k]}/5</b>}</li>)}</ul>
          </div>
        </Section>
        <Section title="Subject strengths and topics to improve">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Strongest topics</div>{mastery.slice(0, 3).map((m) => <div key={m.chapter + m.subjectId} className="py-1 flex justify-between gap-2"><span>{m.chapter}</span><Badge tone="green">{m.percent}%</Badge></div>)}{!mastery.length && <p className="text-gray-500">Not enough data yet.</p>}</div>
            <div><div className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">Topics to improve</div>{[...mastery].reverse().slice(0, 3).filter((m) => m.percent < 75).map((m) => <div key={m.chapter + m.subjectId} className="py-1 flex justify-between gap-2"><span>{m.chapter}</span><Badge tone="amber">{m.percent}%</Badge></div>)}</div>
          </div>
        </Section>
      </div>
      <Section title="Projects, competitions and activities" action={canAddAchievement && <Button size="sm" icon={Plus} onClick={() => setAddOpen(true)}>Add</Button>}>
        {ach.length ? <ul className="divide-y divide-gray-100">{ach.map((a) => <li key={a.id} className="py-3 flex items-start gap-3"><span className="mt-0.5 w-9 h-9 rounded-xl bg-amber-50 text-amber-700 grid place-items-center shrink-0"><Award className="w-5 h-5" /></span><div className="flex-1"><div className="font-semibold text-gray-900">{a.title}</div><div className="text-[13px] text-gray-500">{fmtDate(a.date)}</div></div><Badge tone={ACH_TONE[a.category]}>{a.category}</Badge>{a.sample && <Badge tone="gray">Sample</Badge>}{canDeleteAchievement && <button aria-label={`Delete ${a.title}`} className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Remove this record?', message: `“${a.title}” will be removed from the passport.`, onConfirm: () => run(() => A.deleteAchievement(a.id), 'Record removed.') })}><Trash2 className="w-4 h-4" /></button>}</li>)}</ul> : <p className="text-sm text-gray-600">No records yet.</p>}
        <p className="mt-3 text-xs text-gray-500">Records marked “Sample” are fictional demo data.</p>
      </Section>
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Teacher feedback">{fb.length ? <ul className="space-y-3">{fb.map((f) => <li key={f.id} className="text-sm"><div className="flex justify-between"><b className="text-gray-900">{S.teacherName(s, f.teacherId)}</b><span className="text-gray-500 text-xs">{fmtDate(f.date)}</span></div><p className="mt-0.5 text-gray-700">{f.text}</p></li>)}</ul> : <p className="text-sm text-gray-600">No feedback yet.</p>}</Section>
        <Section title="Personal goals">{goals.length ? <ul className="space-y-2.5">{goals.map((g) => <li key={g.id} className="flex items-center gap-2 text-sm"><span className={cx('w-4 h-4 rounded border grid place-items-center text-[10px]', g.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300')}>{g.done ? '✓' : ''}</span><span className={cx(g.done && 'line-through text-gray-500')}>{g.title}</span><span className="ms-auto text-xs text-gray-500">by {fmtShort(g.deadline)}</span></li>)}</ul> : <p className="text-sm text-gray-600">No goals set. Students set goals in the Study Planner.</p>}</Section>
      </div>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add to passport" footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => run(() => { A.addAchievement(student.id, af); setAddOpen(false); setAf({ title: '', category: 'project', date: today() }); }, 'Added to the passport.')}>Add</Button></>}>
        <div className="space-y-3"><Input label="Title" value={af.title} onChange={(e) => setAf({ ...af, title: e.target.value })} placeholder="e.g. Science fair: working model of a windmill" /><Select label="Category" value={af.category} onChange={(e) => setAf({ ...af, category: e.target.value })} options={['project', 'competition', 'sports', 'arts', 'leadership', 'certificate'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} /><Input label="Date" type="date" max={today()} value={af.date} onChange={(e) => setAf({ ...af, date: e.target.value })} /></div>
      </Modal>
      {confirmNode}
    </div>
  );
}

// ───────── Fees ─────────
export function FeesView({ student, canPay }) {
  const s = useAppState();
  const run = useRun();
  const recs = (idx(s).feesByStudent[student.id] || []).sort((a, b) => a.due.localeCompare(b.due));
  const [pay, setPay] = useState(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const total = recs.reduce((a, f) => a + f.amount, 0), paid = recs.reduce((a, f) => a + f.paid, 0);
  const overdue = recs.filter((f) => S.feeState(s, f) === 'overdue');
  const tone = { paid: 'green', partial: 'amber', overdue: 'red', upcoming: 'gray' };
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total fees (year)" value={money(total)} tone="blue" /><Stat label="Paid" value={money(paid)} sub={`${pct(paid, total)}% of the year`} tone="green" /><Stat label="Outstanding" value={money(total - paid)} sub={overdue.length ? `${overdue.length} overdue` : 'Nothing overdue'} tone={overdue.length ? 'red' : 'gray'} /></div>
      <Section title={`Invoices for ${student.name}`} pad={false}>
        <div className="px-5 pb-5">
          <DataTable pageSize={10} rows={recs} columns={[
            { key: 't', label: 'Term', render: (f) => <b className="text-gray-900">{f.term}</b> },
            { key: 'a', label: 'Amount', render: (f) => money(f.amount) },
            { key: 'p', label: 'Paid', render: (f) => money(f.paid) },
            { key: 'd', label: 'Due date', render: (f) => fmtDate(f.due) },
            { key: 's', label: 'Status', render: (f) => <Badge tone={tone[S.feeState(s, f)]}>{S.feeState(s, f)}</Badge> },
            { key: 'x', label: '', render: (f) => (canPay && f.paid < f.amount ? <Button size="sm" onClick={() => { setPay(f); setAmount(String(f.amount - f.paid)); }}>Pay now</Button> : f.pay.length ? <span className="text-xs text-gray-500">Last paid {fmtShort(f.pay[f.pay.length - 1].date)}</span> : null) },
          ]} />
        </div>
      </Section>
      <Modal open={!!pay} onClose={() => setPay(null)} title={`Pay ${pay?.term} fee`} footer={<><Button variant="outline" onClick={() => setPay(null)}>Cancel</Button><Button onClick={() => run(() => { A.payFee(pay.id, amount, mode); setPay(null); }, 'Payment recorded. A receipt is available in the invoice list.')}>Pay {amount ? money(Number(amount)) : ''}</Button></>}>
        {pay && <div className="space-y-3"><p className="text-sm text-gray-700">Outstanding: <b>{money(pay.amount - pay.paid)}</b>. You can pay in full or part.</p><Input label="Amount (₹)" type="number" min="1" max={pay.amount - pay.paid} value={amount} onChange={(e) => setAmount(e.target.value)} /><Select label="Payment method" value={mode} onChange={(e) => setMode(e.target.value)} options={['UPI', 'Card', 'Net Banking'].map((v) => ({ value: v, label: v }))} /><p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">Demo payment: no money moves. It simply records the payment so you can see the workflow.</p></div>}
      </Modal>
    </div>
  );
}

// ───────── Announcements ─────────
export function AnnouncementsPage() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const canPost = can(role, 'announce.create');
  const { user } = useMe();
  const list = S.announcementsFor(s, role, user);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', body: '', audience: ['all'], priority: 'normal' });
  const [ask, node] = useConfirm();
  const prio = { high: 'red', normal: 'blue', low: 'gray' };
  return (
    <>
      <PageHeader title="Announcements" subtitle="Circulars and notices from the school." actions={canPost && <Button icon={Plus} onClick={() => setOpen(true)}>New announcement</Button>} />
      {!list.length && <Card><EmptyState title="No announcements" text="Nothing has been posted for you yet." /></Card>}
      <div className="space-y-3">{list.map((a) => (
        <Card key={a.id} className="p-5">
          <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-gray-900">{a.title}</h2><Badge tone={prio[a.priority]}>{a.priority}</Badge>{canPost && <Badge tone="gray">to {a.audience.join(', ')}</Badge>}</div><div className="text-[13px] text-gray-500 mt-0.5">{fmtDate(a.date)} · {idx(s).users[a.authorId]?.name || 'School'}</div></div>{canPost && <button aria-label={`Delete ${a.title}`} className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete announcement?', message: `“${a.title}” will be removed for everyone.`, onConfirm: () => run(() => A.deleteAnnouncement(a.id), 'Announcement deleted.') })}><Trash2 className="w-4 h-4" /></button>}</div>
          <p className="mt-2 text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">{a.body}</p>
        </Card>
      ))}</div>
      <Modal open={open} onClose={() => setOpen(false)} title="New announcement" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => run(() => { A.postAnnouncement(f); setOpen(false); setF({ title: '', body: '', audience: ['all'], priority: 'normal' }); }, 'Announcement published and notifications sent.')}>Publish</Button></>}>
        <div className="space-y-3"><Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /><Textarea label="Message" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /><Checkboxes label="Audience" value={f.audience} onChange={(v) => setF({ ...f, audience: v.includes('all') && v.length > 1 ? v.filter((x) => x !== 'all') : v.length ? v : ['all'] })} options={[{ value: 'all', label: 'Everyone' }, { value: 'teacher', label: 'Teachers' }, { value: 'student', label: 'Students' }, { value: 'parent', label: 'Parents' }]} /><Select label="Priority" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }]} /></div>
      </Modal>
      {node}
    </>
  );
}

// ───────── Timetable ─────────
export function TimetableGrid({ sectionId, teacherId, editable }) {
  const s = useAppState();
  const run = useRun();
  const dayNow = S.weekdayOf(today());
  const cell = (day, i) => {
    if (teacherId) {
      const sec = s.sections.find((x) => s.timetable[x.id]?.[day]?.[i]?.t === teacherId);
      return sec ? { subject: s.timetable[sec.id][day][i].s, label: S.sectionLabel(s, sec.id) } : null;
    }
    const x = s.timetable[sectionId]?.[day]?.[i];
    return x?.s ? { subject: x.s, label: S.teacherName(s, x.t) } : null;
  };
  const subs = S.subjectIdsOfSection(s, sectionId);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-gray-50 text-gray-600"><tr><th className="p-2.5 text-start w-28">Period</th>{DAYS.map((d) => <th key={d} className={cx('p-2.5 text-start', d === dayNow && 'text-cta')}>{d}{d === dayNow && ' (today)'}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {PERIODS.map((p, i) => (
            <tr key={p.no}>
              <td className="p-2.5 align-top"><div className="font-bold text-gray-900">Period {p.no}</div><div className="text-xs text-gray-500">{p.time}</div></td>
              {DAYS.map((d) => {
                const c = cell(d, i);
                return (
                  <td key={d} className={cx('p-2 align-top', d === dayNow && 'bg-cta/[0.03]')}>
                    {editable ? (
                      <select aria-label={`${d} period ${p.no}`} value={s.timetable[sectionId]?.[d]?.[i]?.s || ''} onChange={(e) => run(() => A.setTimetableSlot(sectionId, d, i, e.target.value), 'Timetable updated.')} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-[13px]"><option value="">Free period</option>{subs.map((x) => <option key={x} value={x}>{S.subjectName(s, x)}</option>)}</select>
                    ) : c ? <div className="rounded-lg px-2.5 py-1.5" style={{ background: subjColor(s, c.subject) + '14' }}><div className="font-bold text-[13px]" style={{ color: subjColor(s, c.subject) }}>{S.subjectName(s, c.subject)}</div><div className="text-xs text-gray-600">{c.label}</div></div> : <span className="text-xs text-gray-400">Free</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────── Learning resources ─────────
const RES_ICON = { notes: BookOpen, worksheet: FileText, paper: FileText, video: Video };
export function ResourceHub({ classId, canAdd, canDeleteAll, teacherId, student }) {
  const s = useAppState();
  const run = useRun();
  const { role } = useMe();
  const [q, setQ] = useState('');
  const [subj, setSubj] = useState('');
  const [type, setType] = useState('');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = { title: '', subjectId: '', chapter: '', type: 'notes', content: '', url: '', file: null };
  const [f, setF] = useState(blank);
  const [ask, node] = useConfirm();
  const saved = student ? s.savedResources[student.id] || [] : [];
  let list = s.resources.filter((r) => !classId || r.classIds.includes(classId));
  if (tab === 'saved') list = list.filter((r) => saved.includes(r.id));
  list = list.filter((r) => (!subj || r.subjectId === subj) && (!type || r.type === type) && (!q || `${r.title} ${r.chapter}`.toLowerCase().includes(q.toLowerCase())));
  const subjects = classId ? s.subjects.filter((x) => x.classIds.includes(classId)) : s.subjects;
  const download = (r) => downloadFile(`${r.title.replace(/[^\w]+/g, '-')}.txt`, `${r.title}\n${S.subjectName(s, r.subjectId)} · ${r.chapter}\n\n${r.content || r.url}`, 'text/plain;charset=utf-8');
  const canDelete = (r) => canDeleteAll || (teacherId && r.uploadedBy === teacherId);
  return (
    <div className="space-y-4">
      {student && <Tabs value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All resources' }, { value: 'saved', label: 'Saved', count: saved.length }]} />}
      <div className="flex flex-wrap gap-2 items-center">
        <input aria-label="Search resources" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or chapter…" className="flex-1 min-w-[200px] max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <select aria-label="Subject" value={subj} onChange={(e) => setSubj(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"><option value="">All subjects</option>{subjects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select aria-label="Type" value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"><option value="">All types</option>{[['notes', 'Notes'], ['worksheet', 'Worksheets'], ['paper', 'Question papers'], ['video', 'Videos']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        {canAdd && <Button className="ms-auto" icon={Plus} onClick={() => { setF(blank); setAddOpen(true); }}>Add resource</Button>}
      </div>
      {!list.length && <Card><EmptyState title="No resources found" text={tab === 'saved' ? 'Save resources to find them here.' : 'Try a different search or filter.'} /></Card>}
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => {
          const Icon = RES_ICON[r.type] || FileText;
          return (
            <li key={r.id} className="card-soft p-4 flex flex-col">
              <div className="flex items-start gap-3"><span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: subjColor(s, r.subjectId) + '18', color: subjColor(s, r.subjectId) }}><Icon className="w-5 h-5" /></span><div className="min-w-0"><div className="font-bold text-gray-900 leading-snug">{r.title}</div><div className="text-[13px] text-gray-600 mt-0.5">{S.subjectName(s, r.subjectId)} · {r.chapter || 'General'}</div></div></div>
              <div className="mt-3 flex items-center gap-2 flex-wrap"><Badge>{r.type}</Badge><span className="text-xs text-gray-500">{fmtShort(r.date)}</span></div>
              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                {r.type === 'video' && r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-3 py-1.5 text-[13px] font-semibold hover:bg-primary-dark">Open video search <ExternalLink className="w-3.5 h-3.5" /></a> : <Button size="sm" variant="blue" onClick={() => setView(r)}>Open</Button>}
                {r.type !== 'video' && <Button size="sm" variant="outline" icon={Download} onClick={() => { if (r.fileData) { const a = document.createElement('a'); a.href = r.fileData; a.download = r.fileName || 'file'; a.click(); } else download(r); }}>Download</Button>}
                {student && <Button size="sm" variant={saved.includes(r.id) ? 'dark' : 'outline'} onClick={() => run(() => A.toggleSaveResource(r.id), saved.includes(r.id) ? 'Removed from saved.' : 'Saved to your list.')}>{saved.includes(r.id) ? 'Saved' : 'Save'}</Button>}
                {canDelete(r) && <button aria-label={`Delete ${r.title}`} className="ms-auto p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete resource?', message: `“${r.title}” will be removed for all students.`, onConfirm: () => run(() => A.deleteResource(r.id), 'Resource deleted.') })}><Trash2 className="w-4 h-4" /></button>}
              </div>
            </li>
          );
        })}
      </ul>
      <Modal open={!!view} onClose={() => setView(null)} wide title={view?.title || ''} footer={view && <Button variant="outline" icon={Download} onClick={() => download(view)}>Download</Button>}>
        {view && <div><p className="text-sm text-gray-600 mb-3">{S.subjectName(s, view.subjectId)} · {view.chapter}</p>{view.url && <a className="text-primary font-semibold break-all" href={view.url} target="_blank" rel="noopener noreferrer">{view.url}</a>}{view.content && <pre className="whitespace-pre-wrap font-[inherit] text-[15px] text-gray-800 leading-relaxed">{view.content}</pre>}{view.fileName && <p className="mt-3 text-sm">Attached file: {view.fileData ? <a className="text-primary font-semibold" href={view.fileData} download={view.fileName}>{view.fileName}</a> : `${view.fileName} (name only in this demo)`}</p>}</div>}
      </Modal>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add learning resource" footer={<><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={() => run(() => { A.addResource({ ...f, fileName: f.file?.name, fileData: f.file?.data }); setAddOpen(false); }, 'Resource added to the Learning Hub.')}>Add resource</Button></>}>
        <div className="space-y-3">
          <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <div className="grid grid-cols-2 gap-3"><Select label="Subject" placeholder="Choose…" value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value, chapter: '' })} options={s.subjects.map((x) => ({ value: x.id, label: x.name }))} /><Select label="Chapter" placeholder="Any" value={f.chapter} onChange={(e) => setF({ ...f, chapter: e.target.value })} options={(CHAPTERS[f.subjectId] || []).map((c) => ({ value: c, label: c }))} /></div>
          <Select label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={[['notes', 'Notes'], ['worksheet', 'Worksheet'], ['paper', 'Question paper'], ['video', 'Video link']].map(([value, label]) => ({ value, label }))} />
          {f.type === 'video' ? <Input label="Video link" placeholder="https://" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /> : <><Textarea label="Content" rows={5} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} hint="Type or paste the notes, or attach a file below." /><FileInput label="Attach a file" onFile={(x) => setF({ ...f, file: x })} /></>}
        </div>
      </Modal>
      {node}
    </div>
  );
}

// ───────── Messenger (parent <-> teacher) ─────────
export function Messenger() {
  const s = useAppState();
  const { user, role } = useMe();
  const run = useRun();
  const [sel, setSel] = useState(null);
  const [body, setBody] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [nf, setNf] = useState({ studentId: '', toId: '' });
  const mine = s.messages.filter((m) => m.fromId === user.id || m.toId === user.id);
  const threads = useMemo(() => {
    const map = {};
    mine.forEach((m) => {
      const other = m.fromId === user.id ? m.toId : m.fromId;
      const k = `${other}|${m.studentId}`;
      (map[k] ||= { key: k, otherId: other, studentId: m.studentId, msgs: [] }).msgs.push(m);
    });
    return Object.values(map).map((t) => ({ ...t, msgs: t.msgs.sort((a, b) => a.at.localeCompare(b.at)) })).sort((a, b) => b.msgs[b.msgs.length - 1].at.localeCompare(a.msgs[a.msgs.length - 1].at));
  }, [mine.length, user.id, s.messages]);
  const cur = threads.find((t) => t.key === sel?.key) || (sel?.fresh ? sel : null) || threads[0];
  useEffect(() => {
    if (cur && !cur.fresh && cur.msgs.some((m) => m.toId === user.id && !m.read)) A.markThreadRead(cur.otherId, cur.studentId);
  }, [cur?.key, cur?.msgs?.length]);
  // choices for a new conversation
  const kids = role === 'parent' ? S.childrenOf(s, user.linkedId) : [];
  const teacherChoices = (stId) => {
    const st = idx(s).students[stId];
    if (!st) return [];
    return s.teachers.filter((t) => t.assignments.some((a) => a.sectionId === st.sectionId) || s.sections.some((x) => x.classTeacherId === t.id && x.id === st.sectionId)).map((t) => ({ value: `u_${t.id}`, label: `${t.name} (${t.subjectIds.map((x) => S.subjectName(s, x)).join(', ')})` }));
  };
  const myStudents = role === 'teacher' ? S.teacherStudents(s, user.linkedId) : [];
  const send = () => {
    const toId = cur.otherId, studentId = cur.studentId;
    if (run(() => A.sendMessage({ toId, studentId, body }), 'Message sent.')) setBody('');
  };
  const other = (id) => idx(s).users[id];
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden flex flex-col max-h-[620px]">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between"><b className="text-gray-900">Conversations</b><Button size="sm" icon={Plus} onClick={() => setNewOpen(true)}>New</Button></div>
          <ul className="overflow-y-auto divide-y divide-gray-100">
            {threads.map((t) => {
              const last = t.msgs[t.msgs.length - 1];
              const unread = t.msgs.filter((m) => m.toId === user.id && !m.read).length;
              return <li key={t.key}><button onClick={() => setSel(t)} className={cx('w-full text-start p-3 flex gap-3 hover:bg-gray-50', cur?.key === t.key && 'bg-primary-50')}><Avatar name={other(t.otherId)?.name || '?'} size={36} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="text-sm text-gray-900 truncate">{other(t.otherId)?.name}</b>{unread > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-cta text-white text-[11px] font-bold grid place-items-center">{unread}</span>}</div><div className="text-xs text-gray-500 truncate">Re: {S.studentName(s, t.studentId)}</div><div className="text-[13px] text-gray-600 truncate">{last.body}</div></div></button></li>;
            })}
            {!threads.length && <li><EmptyState title="No conversations" text="Start one with the New button." /></li>}
          </ul>
        </Card>
        <Card className="flex flex-col min-h-[420px] max-h-[620px]">
          {cur ? (
            <>
              <div className="p-4 border-b border-gray-100"><b className="text-gray-900">{other(cur.otherId)?.name}</b><div className="text-xs text-gray-500">About {S.studentName(s, cur.studentId)}</div></div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
                {(cur.msgs || []).map((m) => <div key={m.id} className={cx('max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed', m.fromId === user.id ? 'ms-auto bg-primary text-white' : 'bg-gray-100 text-gray-900')}>{m.body}<div className={cx('text-[10.5px] mt-1', m.fromId === user.id ? 'text-white/70' : 'text-gray-500')}>{fmtDateTime(m.at)}</div></div>)}
                {!cur.msgs?.length && <p className="text-sm text-gray-500">Write the first message below.</p>}
              </div>
              <form className="p-3 border-t border-gray-100 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}><input aria-label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" /><Button type="submit" icon={Send}>Send</Button></form>
            </>
          ) : <EmptyState title="Select or start a conversation" />}
        </Card>
      </div>
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New conversation" footer={<><Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button><Button onClick={() => { if (!nf.toId || !nf.studentId) return run(() => { throw new Error('Choose a student and a recipient.'); }); setSel({ key: `${nf.toId}|${nf.studentId}`, otherId: nf.toId, studentId: nf.studentId, msgs: [], fresh: true }); setNewOpen(false); }}>Start</Button></>}>
        <div className="space-y-3">
          {role === 'parent' && <><Select label="About which child?" placeholder="Choose…" value={nf.studentId} onChange={(e) => setNf({ studentId: e.target.value, toId: '' })} options={kids.map((k) => ({ value: k.id, label: k.name }))} /><Select label="Teacher" placeholder="Choose…" value={nf.toId} onChange={(e) => setNf({ ...nf, toId: e.target.value })} options={teacherChoices(nf.studentId)} /></>}
          {role === 'teacher' && <><Select label="Student" placeholder="Choose…" value={nf.studentId} onChange={(e) => { const st = idx(s).students[e.target.value]; setNf({ studentId: e.target.value, toId: st ? `u_${st.parentId}` : '' }); }} options={myStudents.slice(0, 600).map((x) => ({ value: x.id, label: `${x.name} (${S.sectionLabel(s, x.sectionId)})` }))} /><p className="text-sm text-gray-600">The message goes to the student’s parent: {nf.toId ? other(nf.toId)?.name : '—'}</p></>}
        </div>
      </Modal>
    </>
  );
}
export { Heart };
