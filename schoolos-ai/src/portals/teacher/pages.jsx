import { WelcomeBanner } from '../../ui/kit';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Check, ClipboardCheck, Clock, GraduationCap, NotebookPen, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { avg, fmtDate, fmtDateTime, fmtShort, pct, today } from '../../lib/util';
import { PERIODS } from '../../data/seed';
import { CHAPTERS } from '../../data/curriculum';
import { Avatar, Badge, Button, Card, DataTable, EmptyState, FileInput, Input, Modal, PageHeader, ProgressBar, Section, Select, Stat, Tabs, Textarea, toneForPct, useConfirm, useRun } from '../../ui/kit';
import { useMe } from '../../app/shell';
import { AssignmentStatusBadge, Messenger, PerformanceView, Passport, TimetableGrid } from '../shared';

const { idx } = S;
const useTeacher = () => { const { s, user } = useMe(); return { s, user, t: idx(s).teachers[user.linkedId] }; };

export function Dashboard() {
  const { s, user, t } = useTeacher();
  const mySecs = S.teacherSectionIds(s, t.id);
  const students = S.teacherStudents(s, t.id);
  const slots = S.teacherTodaySlots(s, t.id);
  const pendingAtt = mySecs.filter((id) => !s.attendance[today()]?.[id]?.[1] && idx(s).sections[id]);
  const mine = s.assignments.filter((a) => a.teacherId === t.id);
  const awaiting = mine.reduce((n, a) => n + (idx(s).subsByAssignment[a.id] || []).filter((x) => x.status === 'submitted').length, 0);
  const upcoming = s.exams.filter((e) => e.date > today()).sort((a, b) => a.date.localeCompare(b.date));
  const marksTodo = S.marksTasks(s, t.id).filter((x) => x.conducted && ['pending', 'draft'].includes(x.status));
  const recent = s.submissions.filter((x) => mine.some((a) => a.id === x.assignmentId)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const attention = students.map((st) => ({ st, att: S.studentAttendance(s, st.id).pct, low: S.chapterMastery(s, st.id).filter((m) => m.percent < 50).length })).filter((x) => x.att < s.school.attendanceThreshold || x.low >= 1).sort((a, b) => a.att - b.att).slice(0, 6);
  return (
    <>
      <WelcomeBanner title={`Welcome, ${t.name.replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '')}`} subtitle={`${t.subjectIds.map((x) => S.subjectName(s, x)).join(', ')} · ${fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long' })}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Classes today" value={slots.length} sub="periods on your timetable" icon={Clock} to="timetable" />
        <Stat label="My students" value={students.length} sub={`${mySecs.length} sections`} icon={GraduationCap} tone="pink" to="students" />
        <Stat label="Attendance pending" value={pendingAtt.length} sub={pendingAtt.length ? pendingAtt.map((id) => S.sectionLabel(s, id)).join(', ') : 'All marked for today'} icon={CalendarCheck} tone={pendingAtt.length ? 'amber' : 'green'} to="attendance" />
        <Stat label="Awaiting evaluation" value={awaiting} sub="student submissions" icon={NotebookPen} tone={awaiting ? 'amber' : 'green'} to="assignments" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Today's classes" action={<Link to="timetable" className="text-sm font-semibold text-cta">Full timetable →</Link>}>
          {slots.length ? <ul className="divide-y divide-gray-100">{slots.map((x) => <li key={x.period} className="py-2.5 flex items-center gap-3"><span className="w-20 text-xs text-gray-500">P{x.period} · {PERIODS[x.period - 1].time}</span><b className="text-gray-900">{S.subjectName(s, x.s)}</b><Badge tone="blue">Class {S.sectionLabel(s, x.sectionId)}</Badge><Link to="attendance" className="ms-auto text-sm font-semibold text-cta">Take attendance</Link></li>)}</ul> : <p className="text-sm text-gray-600">No classes today.</p>}
        </Section>
        <Section title="Upcoming examinations">
          {upcoming.length ? <ul className="space-y-2.5">{upcoming.map((e) => <li key={e.id} className="text-sm flex justify-between"><b className="text-gray-900">{e.name}</b><span className="text-gray-600">{fmtDate(e.date)}</span></li>)}</ul> : <p className="text-sm text-gray-600">None scheduled.</p>}
          {marksTodo.length > 0 && <Link to="marks" className="mt-4 block rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900 font-semibold">{marksTodo.length} marks sheet{marksTodo.length > 1 ? 's' : ''} still to enter →</Link>}
        </Section>
        <Section title="Recent student activity">
          {recent.length ? <ul className="space-y-2.5">{recent.map((x) => <li key={x.id} className="text-sm"><b className="text-gray-900">{S.studentName(s, x.studentId)}</b> submitted <span className="text-gray-700">{idx(s).assignments[x.assignmentId]?.title}</span><div className="text-[11px] text-gray-500">{fmtDateTime(x.at)}{x.late ? ' · late' : ''}</div></li>)}</ul> : <p className="text-sm text-gray-600">No submissions yet.</p>}
        </Section>
        <Section className="lg:col-span-2" title="Students who may need attention" subtitle="Low attendance or topics with mastery under 50%. A prompt to check in, not a label.">
          {attention.length ? <ul className="divide-y divide-gray-100">{attention.map(({ st, att, low }) => <li key={st.id} className="py-2.5 flex items-center gap-3"><Avatar name={st.name} size={30} /><div className="flex-1"><div className="font-semibold text-gray-900 text-sm">{st.name}</div><div className="text-xs text-gray-500">Class {S.sectionLabel(s, st.sectionId)}</div></div>{att < s.school.attendanceThreshold && <Badge tone="red">Attendance {att}%</Badge>}{low > 0 && <Badge tone="amber">{low} weak topic{low > 1 ? 's' : ''}</Badge>}</li>)}</ul> : <p className="text-sm text-gray-600">Everyone looks on track.</p>}
        </Section>
      </div>
    </>
  );
}

export function MyClasses() {
  const { s, t } = useTeacher();
  const nav = useNavigate();
  const rows = S.teacherSectionIds(s, t.id).map((id) => { const roster = idx(s).studentsBySection[id] || []; const subs = t.assignments.filter((a) => a.sectionId === id).map((a) => S.subjectName(s, a.subjectId)); const att = roster.length ? avg(roster.map((x) => S.studentAttendance(s, x.id).pct)) : 0; return { id, label: S.sectionLabel(s, id), n: roster.length, subs, ct: idx(s).sections[id].classTeacherId === t.id, att: Number(att.toFixed(1)) }; });
  return (
    <>
      <PageHeader title="My Classes" subtitle="Sections you teach or are class teacher of." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold text-gray-900">Class {r.label}</h2>{r.ct && <Badge tone="pink">Class teacher</Badge>}</div>
          <p className="mt-1 text-sm text-gray-600">{r.subs.join(', ') || 'Class teacher only'}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><div className="text-xs text-gray-500">Students</div><b className="text-lg text-gray-900">{r.n}</b></div><div><div className="text-xs text-gray-500">Avg attendance</div><b className="text-lg text-gray-900">{r.att}%</b></div></div>
          <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => nav('../students', { relative: 'path' })}>Students</Button><Button size="sm" variant="outline" onClick={() => nav('../attendance', { relative: 'path' })}>Attendance</Button></div>
        </Card>
      ))}</div>
    </>
  );
}

export function MyStudents() {
  const { s, user, t } = useTeacher();
  const run = useRun();
  const [view, setView] = useState(null);
  const [fb, setFb] = useState(null);
  const params = new URLSearchParams(window.location.search);
  const rows = S.teacherStudents(s, t.id).map((st) => ({ st, att: S.studentAttendance(s, st.id), sum: S.studentSubjectSummary(s, st.id) }));
  const ids = S.teacherSectionIds(s, t.id);
  return (
    <>
      <PageHeader title="My Students" subtitle={`${rows.length} students in your classes.`} />
      <Card className="p-4">
        <DataTable pageSize={12} exportName="my-students" rows={rows} rowKey={(r) => r.st.id} search={(r) => `${r.st.name} ${r.st.admNo}`} filters={[{ key: 'sec', label: 'All sections', options: ids.map((id) => ({ value: id, label: `Class ${S.sectionLabel(s, id)}` })), get: (r) => r.st.sectionId }]}
          columns={[
            { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.st.name} size={30} /><div><div className="font-semibold text-gray-900">{r.st.name}</div><div className="text-xs text-gray-500">Roll {r.st.rollNo}</div></div></div> },
            { key: 'c', label: 'Class', value: (r) => S.sectionLabel(s, r.st.sectionId) },
            { key: 'a', label: 'Attendance', sort: (r) => r.att.pct, value: (r) => `${r.att.pct}%`, render: (r) => <Badge tone={toneForPct(r.att.pct)}>{r.att.pct}%</Badge> },
            { key: 'av', label: 'Academic avg', sort: (r) => (r.sum.length ? avg(r.sum.map((x) => x.avg)) : -1), value: (r) => (r.sum.length ? `${avg(r.sum.map((x) => x.avg)).toFixed(1)}%` : '–') },
            { key: 'x', label: '', render: (r) => <div className="flex gap-1.5 justify-end"><Button size="sm" variant="outline" onClick={() => setView(r.st)}>Profile</Button><Button size="sm" variant="outline" onClick={() => setFb({ st: r.st, text: '', type: 'positive' })}>Feedback</Button></div> },
          ]} />
      </Card>
      <Modal open={!!view} wide onClose={() => setView(null)} title={view?.name || ''}>{view && <Passport student={view} canEditSkills canAddAchievement canDeleteAchievement />}</Modal>
      <Modal open={!!fb} onClose={() => setFb(null)} title={`Feedback for ${fb?.st.name}`} footer={<><Button variant="outline" onClick={() => setFb(null)}>Cancel</Button><Button onClick={() => run(() => { A.addFeedback(fb.st.id, fb.text, fb.type); setFb(null); }, 'Feedback sent to the student and parent.')}>Send feedback</Button></>}>
        {fb && <div className="space-y-3"><Select label="Type" value={fb.type} onChange={(e) => setFb({ ...fb, type: e.target.value })} options={[{ value: 'positive', label: 'Appreciation' }, { value: 'improvement', label: 'Area to improve' }, { value: 'general', label: 'General note' }]} /><Textarea label="Feedback" rows={4} value={fb.text} onChange={(e) => setFb({ ...fb, text: e.target.value })} /></div>}
      </Modal>
    </>
  );
}

// ───── Assignments ─────
export function Assignments() {
  const { s, t } = useTeacher();
  const nav = useNavigate();
  const run = useRun();
  const [ask, node] = useConfirm();
  const pairs = t.assignments.map((a) => ({ value: `${a.sectionId}|${a.subjectId}`, label: `Class ${S.sectionLabel(s, a.sectionId)} · ${S.subjectName(s, a.subjectId)}` })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  const blank = { id: null, title: '', description: '', pair: pairs[0]?.value, chapter: '', due: '', maxMarks: 10, attachments: [], file: null };
  const [form, setForm] = useState(null);
  const rows = s.assignments.filter((a) => a.teacherId === t.id).map((a) => ({ a, ...S.assignmentStats(s, a), label: S.sectionLabel(s, a.sectionId) })).sort((x, y) => y.a.due.localeCompare(x.a.due));
  const [secId, subjId] = (form?.pair || '|').split('|');
  const save = (status) => run(() => { const att = form.file ? [...form.attachments, { name: form.file.name, data: form.file.data }] : form.attachments; A.saveAssignment(form.id, { ...form, sectionId: secId, subjectId: subjId, status, attachments: att }); setForm(null); }, status === 'published' ? 'Assignment published. Students and parents were notified.' : 'Saved as draft. Students cannot see it yet.');
  const edit = (a) => setForm({ ...blank, ...a, id: a.id, pair: `${a.sectionId}|${a.subjectId}` });
  return (
    <>
      <PageHeader title="Assignments" subtitle="Create work, review submissions and give feedback." actions={<Button icon={Plus} onClick={() => setForm({ ...blank })}>New assignment</Button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-5"><Stat label="Assignments" value={rows.length} tone="blue" /><Stat label="Awaiting evaluation" value={rows.reduce((n, r) => n + r.awaiting, 0)} tone="amber" /><Stat label="Missing (overdue)" value={rows.reduce((n, r) => n + r.missing, 0)} tone="red" /></div>
      <Card className="p-4">
        <DataTable pageSize={10} exportName="my-assignments" rows={rows} rowKey={(r) => r.a.id} search={(r) => `${r.a.title} ${r.label}`} onRowClick={(r) => nav(r.a.id)} filters={[{ key: 'st', label: 'Any state', options: [{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }], get: (r) => r.a.status }]}
          columns={[
            { key: 't', label: 'Assignment', value: (r) => r.a.title, render: (r) => <div><div className="font-semibold text-gray-900">{r.a.title}</div><div className="text-xs text-gray-500">{S.subjectName(s, r.a.subjectId)} · {r.a.chapter}</div></div> },
            { key: 'c', label: 'Class', value: (r) => r.label }, { key: 'd', label: 'Due', value: (r) => r.a.due, render: (r) => fmtShort(r.a.due) },
            { key: 'st', label: 'State', value: (r) => r.a.status, render: (r) => <Badge tone={r.a.status === 'published' ? 'green' : 'gray'}>{r.a.status}</Badge> },
            { key: 'sb', label: 'Submitted', sort: (r) => r.rate, value: (r) => `${r.submitted}/${r.roster}`, render: (r) => <div className="flex items-center gap-2 min-w-[120px]"><ProgressBar className="flex-1" value={r.rate} tone={toneForPct(r.rate)} label={r.a.title} /><span className="text-xs tabular-nums">{r.submitted}/{r.roster}</span></div> },
            { key: 'aw', label: 'To evaluate', value: (r) => r.awaiting },
            { key: 'x', label: '', render: (r) => <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}><button aria-label={`Edit ${r.a.title}`} className="p-1.5 text-gray-500 hover:text-primary" onClick={() => edit(r.a)}><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.a.title}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete assignment?', message: `“${r.a.title}” and its ${r.submitted} submissions will be removed.`, onConfirm: () => run(() => A.deleteAssignment(r.a.id), 'Assignment deleted.') })}><Trash2 className="w-4 h-4" /></button></div> },
          ]} />
      </Card>
      <Modal open={!!form} wide onClose={() => setForm(null)} title={form?.id ? 'Edit assignment' : 'New assignment'} footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button variant="outline" onClick={() => save('draft')}>Save draft</Button><Button onClick={() => save('published')}>{form?.id && form.status === 'published' ? 'Save & keep published' : 'Publish'}</Button></>}>
        {form && <div className="grid gap-3 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Class and subject *" value={form.pair} onChange={(e) => setForm({ ...form, pair: e.target.value, chapter: '' })} options={pairs} />
          <Select label="Chapter" placeholder="Select…" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} options={(CHAPTERS[subjId] || []).map((c) => ({ value: c, label: c }))} />
          <Input label="Deadline *" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          <Input label="Maximum marks *" type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          <Textarea className="sm:col-span-2" label="Description / instructions" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="sm:col-span-2"><FileInput label="Attachment (optional)" onFile={(f) => setForm({ ...form, file: f })} />{form.attachments?.length > 0 && <p className="mt-1 text-xs text-gray-600">Existing: {form.attachments.map((x) => x.name).join(', ')}</p>}</div>
        </div>}
      </Modal>
      {node}
    </>
  );
}

export function AssignmentDetail() {
  const { id } = useParams();
  const { s, t } = useTeacher();
  const run = useRun();
  const a = idx(s).assignments[id];
  const [rev, setRev] = useState(null);
  const [tab, setTab] = useState('all');
  if (!a || a.teacherId !== t.id) return <EmptyState title="Assignment not found" text="It may have been deleted, or it belongs to another teacher." action={<Link to=".." relative="path" className="text-cta font-semibold">Back to assignments</Link>} />;
  const st = S.assignmentStats(s, a);
  const roster = idx(s).studentsBySection[a.sectionId] || [];
  const subs = idx(s).subsByAssignment[a.id] || [];
  const rows = roster.map((x) => { const sub = subs.find((y) => y.studentId === x.id); return { st: x, sub, key: S.assignmentState(s, a, x.id).key }; });
  const shown = rows.filter((r) => tab === 'all' || (tab === 'evaluate' ? r.sub?.status === 'submitted' : tab === 'late' ? r.sub?.late : tab === 'missing' ? !r.sub : r.sub?.status === 'reviewed'));
  const saveRev = () => run(() => { A.reviewSubmission(rev.sub.id, { marks: rev.marks, feedback: rev.feedback }); setRev(null); }, 'Evaluation saved. The student and parent can see it now.');
  return (
    <>
      <Link to=".." relative="path" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-cta mb-3"><ArrowLeft className="w-4 h-4" />All assignments</Link>
      <PageHeader title={a.title} subtitle={`${S.subjectName(s, a.subjectId)} · ${a.chapter} · Class ${S.sectionLabel(s, a.sectionId)} · due ${fmtDate(a.due)} · ${a.maxMarks} marks`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5"><Stat label="Submitted" value={`${st.submitted}/${st.roster}`} tone="green" /><Stat label="To evaluate" value={st.awaiting} tone="amber" /><Stat label="Late" value={st.late} tone="amber" /><Stat label="Missing" value={st.missing} sub={a.due >= today() ? 'not overdue yet' : 'past deadline'} tone="red" /></div>
      <Tabs value={tab} onChange={setTab} tabs={[['all', 'All', rows.length], ['evaluate', 'To evaluate', st.awaiting], ['reviewed', 'Evaluated', st.reviewed], ['late', 'Late', st.late], ['missing', 'Not submitted', rows.filter((r) => !r.sub).length]].map(([value, label, count]) => ({ value, label, count }))} />
      <Card className="p-4 mt-4">
        <DataTable pageSize={12} rows={shown} rowKey={(r) => r.st.id} exportName={`submissions-${a.id}`} search={(r) => r.st.name} columns={[
          { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <b className="text-gray-900">{r.st.name}</b> },
          { key: 's', label: 'Status', value: (r) => r.key, render: (r) => <AssignmentStatusBadge k={r.key} /> },
          { key: 'at', label: 'Submitted', value: (r) => r.sub?.at || '', render: (r) => (r.sub ? fmtDateTime(r.sub.at) : '–') },
          { key: 'm', label: `Marks (/${a.maxMarks})`, value: (r) => r.sub?.marks ?? '–' },
          { key: 'x', label: '', render: (r) => r.sub ? <Button size="sm" variant={r.sub.status === 'reviewed' ? 'outline' : 'primary'} onClick={() => setRev({ ...r, marks: r.sub.marks ?? '', feedback: r.sub.feedback || '' })}>{r.sub.status === 'reviewed' ? 'Edit evaluation' : 'Evaluate'}</Button> : null },
        ]} />
      </Card>
      <Modal open={!!rev} onClose={() => setRev(null)} title={`Evaluate: ${rev?.st.name}`} footer={<><Button variant="outline" onClick={() => setRev(null)}>Cancel</Button><Button icon={Check} onClick={saveRev}>Save evaluation</Button></>}>
        {rev && <div className="space-y-3"><div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm"><div className="text-xs text-gray-500 mb-1">Student’s submission · {fmtDateTime(rev.sub.at)}{rev.sub.late ? ' · late' : ''}</div><p className="text-gray-800 whitespace-pre-line">{rev.sub.text}</p>{rev.sub.fileName && <p className="mt-2">File: {rev.sub.fileData ? <a className="text-primary font-semibold" href={rev.sub.fileData} download={rev.sub.fileName}>{rev.sub.fileName}</a> : rev.sub.fileName}</p>}</div><Input label={`Marks (0 to ${a.maxMarks})`} type="number" min="0" max={a.maxMarks} value={rev.marks} onChange={(e) => setRev({ ...rev, marks: e.target.value })} /><Textarea label="Feedback for the student" rows={3} value={rev.feedback} onChange={(e) => setRev({ ...rev, feedback: e.target.value })} /></div>}
      </Modal>
    </>
  );
}

export function Exams() {
  const { s, t } = useTeacher();
  const mine = S.marksTasks(s, t.id);
  return (
    <>
      <PageHeader title="Examinations" subtitle="Schedule and your marks-entry status. Enter marks on the Marks Entry page." />
      <div className="space-y-4">{[...s.exams].sort((a, b) => b.date.localeCompare(a.date)).map((e) => { const tasks = mine.filter((x) => x.exam.id === e.id); const done = tasks.filter((x) => ['submitted', 'approved'].includes(x.status)).length; const over = S.examIsConducted(e); return (
        <Card key={e.id} className="p-5"><div className="flex flex-wrap items-center gap-3 justify-between"><div><h2 className="font-extrabold text-gray-900 text-lg">{e.name}</h2><p className="text-sm text-gray-600">{fmtDate(e.date)} · {e.max} marks · {e.type}</p></div><Badge tone={over ? 'green' : 'blue'}>{over ? 'Conducted' : 'Upcoming'}</Badge></div>{over && <><div className="mt-3 flex items-center gap-3 text-sm"><ProgressBar className="flex-1" value={pct(done, tasks.length)} tone={done === tasks.length ? 'green' : 'amber'} label="My marks entry" /><span className="tabular-nums">{done}/{tasks.length} sheets</span></div><div className="mt-3 flex flex-wrap gap-2">{tasks.map((x) => <Badge key={x.key} tone={{ pending: 'gray', draft: 'amber', submitted: 'blue', approved: 'green' }[x.status]}>{S.sectionLabel(s, x.sectionId)} {S.subjectName(s, x.subjectId)}: {x.status}</Badge>)}</div></>}</Card>); })}</div>
    </>
  );
}

export function Performance() {
  const { s, t } = useTeacher();
  const ids = S.teacherSectionIds(s, t.id);
  const [sec, setSec] = useState(ids[0]);
  const [sel, setSel] = useState(null);
  const roster = idx(s).studentsBySection[sec] || [];
  const rows = roster.map((st) => { const sum = S.studentSubjectSummary(s, st.id); const m = S.chapterMastery(s, st.id).sort((a, b) => a.percent - b.percent)[0]; return { st, avg: sum.length ? avg(sum.map((x) => x.avg)) : null, trend: sum.length ? avg(sum.map((x) => x.trend)) : 0, weak: m && m.percent < 60 ? `${m.chapter} (${m.percent}%)` : '' }; });
  const mySubs = t.assignments.filter((a) => a.sectionId === sec).map((a) => a.subjectId);
  const subjAvg = mySubs.map((sid) => { const vals = roster.map((r) => S.marksFor(s, r.id).filter((m) => m.subjectId === sid).map((m) => m.percent)).flat(); return { sid, v: vals.length ? Number(avg(vals).toFixed(1)) : null }; });
  return (
    <>
      <PageHeader title="Student Performance" subtitle="Class results, trends and weak topics for the students you teach." />
      <div className="max-w-xs mb-4"><Select label="Class and section" value={sec} onChange={(e) => setSec(e.target.value)} options={ids.map((id) => ({ value: id, label: `Class ${S.sectionLabel(s, id)}` }))} /></div>
      {subjAvg.length > 0 && <div className="grid gap-4 sm:grid-cols-3 mb-5">{subjAvg.map((x) => <Stat key={x.sid} label={`${S.subjectName(s, x.sid)} average`} value={x.v != null ? `${x.v}%` : '–'} tone={x.v != null ? toneForPct(x.v) : 'gray'} sub="across published exams" />)}</div>}
      <Card className="p-4"><DataTable pageSize={12} exportName={`performance-${sec}`} rows={rows} rowKey={(r) => r.st.id} search={(r) => r.st.name} columns={[
        { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <b className="text-gray-900">{r.st.name}</b> },
        { key: 'a', label: 'Average', sort: (r) => r.avg ?? -1, value: (r) => (r.avg != null ? `${r.avg.toFixed(1)}%` : '–'), render: (r) => r.avg != null ? <Badge tone={toneForPct(r.avg)}>{r.avg.toFixed(1)}%</Badge> : '–' },
        { key: 't', label: 'Trend', sort: (r) => r.trend, value: (r) => r.trend.toFixed(1), render: (r) => <span className={r.trend > 1 ? 'text-emerald-700 font-semibold' : r.trend < -1 ? 'text-red-700 font-semibold' : 'text-gray-600'}>{r.trend > 0 ? '▲' : r.trend < 0 ? '▼' : '–'} {Math.abs(r.trend).toFixed(1)}</span> },
        { key: 'w', label: 'Weakest assessed topic', value: (r) => r.weak || '–' },
        { key: 'x', label: '', render: (r) => <Button size="sm" variant="outline" onClick={() => setSel(r.st)}>Details</Button> },
      ]} /></Card>
      <Modal open={!!sel} wide onClose={() => setSel(null)} title={sel?.name || ''}>{sel && <PerformanceView student={sel} />}</Modal>
    </>
  );
}

export function Messages() {
  const { s, user, t } = useTeacher();
  const run = useRun();
  const [resp, setResp] = useState(null);
  const meets = s.meetings.filter((m) => m.teacherId === t.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Messages & Meetings" subtitle="Talk to parents of the students you teach." />
      <Messenger />
      <Section className="mt-6" title="Meeting requests">
        {meets.length ? <ul className="divide-y divide-gray-100">{meets.map((m) => <li key={m.id} className="py-3 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-[220px]"><div className="font-semibold text-gray-900 text-sm">{idx(s).parents[m.parentId]?.name} about {S.studentName(s, m.studentId)}</div><div className="text-[13px] text-gray-600">{fmtDate(m.date)} · {m.reason}</div></div><Badge tone={{ pending: 'amber', accepted: 'green', declined: 'red' }[m.status]}>{m.status}</Badge>{m.status === 'pending' && <><Button size="sm" onClick={() => run(() => A.respondMeeting(m.id, 'accepted'), 'Meeting accepted. The parent was notified.')}>Accept</Button><Button size="sm" variant="danger" onClick={() => setResp({ id: m.id, note: '' })}>Decline</Button></>}</li>)}</ul> : <p className="text-sm text-gray-600">No meeting requests.</p>}
      </Section>
      <Modal open={!!resp} onClose={() => setResp(null)} title="Decline meeting" footer={<><Button variant="outline" onClick={() => setResp(null)}>Cancel</Button><Button onClick={() => run(() => { A.respondMeeting(resp.id, 'declined', resp.note); setResp(null); }, 'Declined. The parent was notified.')}>Decline</Button></>}>
        {resp && <Input label="Message to the parent (optional)" value={resp.note} onChange={(e) => setResp({ ...resp, note: e.target.value })} placeholder="e.g. Please choose another day." />}
      </Modal>
    </>
  );
}

export function Profile() {
  const { s, user, t } = useTeacher();
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="p-6 max-w-2xl"><div className="flex items-center gap-4"><Avatar name={t.name} size={64} color="#8e2155" /><div><h2 className="text-xl font-extrabold text-gray-900">{t.name}</h2><p className="text-sm text-gray-600">{t.subjectIds.map((x) => S.subjectName(s, x)).join(', ')} teacher</p></div></div>
        <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{[['Email', t.email], ['Phone', t.phone], ['Qualification', t.qualification], ['Joined', fmtDate(t.joined)], ['Class teacher of', s.sections.filter((x) => x.classTeacherId === t.id).map((x) => S.sectionLabel(s, x.id)).join(', ') || '–'], ['Teaching', [...new Set(t.assignments.map((a) => S.sectionLabel(s, a.sectionId)))].join(', ')]].map(([k, v]) => <div key={k}><dt className="text-gray-500 text-xs">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>)}</dl>
        <p className="mt-5 text-xs text-gray-500">Profile details are managed by the school administration.</p></Card>
    </>
  );
}
export { TimetableGrid, ClipboardCheck, Users, useMemo };

