import { useState } from 'react';
import { Check, Eye, FileText, Plus, Pencil, Printer, Trash2, Bell } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { can } from '../../lib/perms';
import { downloadFile, fmtDate, fmtShort, toCSV, today, pct } from '../../lib/util';
import { Avatar, Badge, Button, Card, Checkboxes, DataTable, EmptyState, Input, Modal, PageHeader, ProgressBar, Section, Select, Stat, Tabs, toneForPct, useConfirm, useRun } from '../../ui/kit';
import { classOptions, examOptions, sectionOptions, subjectOptions, teacherOptions } from '../common';
import AttendanceMarker from '../attendance';
import { ReportCardModal, TimetableGrid } from '../shared';
import { STATUS_LABEL, STATUS_TONE } from '../marks';
import { useMe } from '../../app/shell';

const { idx } = S;

// ───── Classes & Sections ─────
export function Classes() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const [ask, node] = useConfirm();
  const [addSec, setAddSec] = useState(null);
  const [addCls, setAddCls] = useState(null);
  const [assign, setAssign] = useState(null);
  const manage = can(role, 'classes.manage');
  const rows = S.sortedSections(s).map((sec) => ({ ...sec, label: S.sectionLabel(s, sec.id), n: (idx(s).studentsBySection[sec.id] || []).length }));
  return (
    <>
      <PageHeader title="Classes & Sections" subtitle="Class teachers, rooms and which teacher takes each subject." actions={manage && <><Button variant="outline" icon={Plus} onClick={() => setAddCls('')}>Add class</Button><Button icon={Plus} onClick={() => setAddSec({ classId: s.classes[0].id, name: '' })}>Add section</Button></>} />
      <Card className="p-4">
        <DataTable pageSize={14} exportName="sections" rows={rows} search={(r) => r.label} columns={[
          { key: 'c', label: 'Section', value: (r) => r.label, render: (r) => <b className="text-gray-900">Class {r.label}</b> },
          { key: 'n', label: 'Students', value: (r) => r.n, className: 'tabular-nums' },
          { key: 't', label: 'Class teacher', render: (r) => manage ? <select aria-label={`Class teacher of ${r.label}`} value={r.classTeacherId || ''} onChange={(e) => run(() => A.updateSection(r.id, { classTeacherId: e.target.value, room: r.room }), 'Class teacher updated.')} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm max-w-[220px]"><option value="">None</option>{teacherOptions(s).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : S.teacherName(s, r.classTeacherId), value: (r) => S.teacherName(s, r.classTeacherId) },
          { key: 'r', label: 'Room', value: (r) => r.room || '–' },
          { key: 'x', label: '', render: (r) => <div className="flex gap-2 justify-end"><Button size="sm" variant="outline" onClick={() => setAssign(r.id)}>Subject teachers</Button>{manage && <button aria-label={`Delete section ${r.label}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete section?', message: `Class ${r.label} will be removed. This is only possible when it has no students.`, onConfirm: () => run(() => A.deleteSection(r.id), 'Section deleted.') })}><Trash2 className="w-4 h-4" /></button>}</div> },
        ]} />
      </Card>
      <Modal open={!!assign} wide onClose={() => setAssign(null)} title={`Subject teachers: Class ${assign ? S.sectionLabel(s, assign) : ''}`} footer={<Button onClick={() => setAssign(null)}>Done</Button>}>
        {assign && <ul className="divide-y divide-gray-100">{S.subjectIdsOfSection(s, assign).map((sid) => { const cur = S.teacherOf(s, assign, sid); const cands = s.teachers.filter((t) => t.subjectIds.includes(sid)); return <li key={sid} className="py-2.5 flex items-center justify-between gap-3"><span className="font-semibold text-gray-900">{S.subjectName(s, sid)}</span>{manage ? <select aria-label={`${S.subjectName(s, sid)} teacher`} value={cur?.id || ''} onChange={(e) => run(() => A.assignTeacher(assign, sid, e.target.value), 'Teacher assigned. The timetable was updated.')} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"><option value="" disabled>Choose…</option>{cands.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : <span className="text-sm text-gray-700">{cur?.name || 'Unassigned'}</span>}</li>; })}</ul>}
      </Modal>
      <Modal open={!!addSec} onClose={() => setAddSec(null)} title="Add section" footer={<><Button variant="outline" onClick={() => setAddSec(null)}>Cancel</Button><Button onClick={() => run(() => { A.addSection(addSec.classId, addSec.name); setAddSec(null); }, 'Section added.')}>Add</Button></>}>
        {addSec && <div className="space-y-3"><Select label="Class" value={addSec.classId} onChange={(e) => setAddSec({ ...addSec, classId: e.target.value })} options={classOptions(s)} /><Input label="Section name" placeholder="e.g. C" maxLength={2} value={addSec.name} onChange={(e) => setAddSec({ ...addSec, name: e.target.value })} /></div>}
      </Modal>
      <Modal open={addCls !== null} onClose={() => setAddCls(null)} title="Add class" footer={<><Button variant="outline" onClick={() => setAddCls(null)}>Cancel</Button><Button onClick={() => run(() => { A.addClass(addCls); setAddCls(null); }, 'Class added. Now add its sections and subjects.')}>Add</Button></>}>
        <Input label="Class number (1 to 12)" type="number" min="1" max="12" value={addCls ?? ''} onChange={(e) => setAddCls(e.target.value)} />
      </Modal>
      {node}
    </>
  );
}

// ───── Subjects ─────
export function Subjects() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const [ask, node] = useConfirm();
  const [form, setForm] = useState(null);
  const manage = can(role, 'subjects.manage');
  return (
    <>
      <PageHeader title="Subjects" subtitle="Subjects and the classes that study them." actions={manage && <Button icon={Plus} onClick={() => setForm({ name: '', code: '', color: '#0072e5', classIds: [] })}>Add subject</Button>} />
      <Card className="p-4">
        <DataTable rows={s.subjects} exportName="subjects" search={(r) => `${r.name} ${r.id}`} columns={[
          { key: 'n', label: 'Subject', value: (r) => r.name, render: (r) => <div className="flex items-center gap-2"><i className="w-3 h-3 rounded" style={{ background: r.color }} /><b className="text-gray-900">{r.name}</b></div> },
          { key: 'c', label: 'Code', value: (r) => r.id },
          { key: 'cl', label: 'Classes', value: (r) => r.classIds.map((c) => idx(s).classes[c]?.no).join(', ') },
          { key: 't', label: 'Teachers', value: (r) => s.teachers.filter((t) => t.subjectIds.includes(r.id)).length },
          { key: 'x', label: '', render: (r) => manage && <div className="flex gap-1 justify-end"><button aria-label={`Edit ${r.name}`} className="p-1.5 text-gray-500 hover:text-primary" onClick={() => setForm({ ...r, code: r.id, edit: true })}><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.name}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete subject?', message: `${r.name} will be removed. This only works if no teacher or assignment uses it.`, onConfirm: () => run(() => A.deleteSubject(r.id), 'Subject deleted.') })}><Trash2 className="w-4 h-4" /></button></div> },
        ]} />
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.edit ? `Edit ${form.name}` : 'Add subject'} footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.saveSubject(form.edit ? form.id : null, form); setForm(null); }, 'Subject saved.')}>Save</Button></>}>
        {form && <div className="space-y-3"><Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Code (2 to 4 letters)" disabled={form.edit} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} /><Input label="Colour" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /><Checkboxes label="Taught in classes" value={form.classIds} onChange={(v) => setForm({ ...form, classIds: v })} options={classOptions(s)} /></div>}
      </Modal>
      {node}
    </>
  );
}

// ───── Timetable ─────
export function TimetablePage() {
  const s = useAppState();
  const { role } = useMe();
  const [sec, setSec] = useState('10-B');
  const manage = can(role, 'timetable.manage');
  const [edit, setEdit] = useState(false);
  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly timetable by section. The system blocks a teacher from being in two classes at once." actions={manage && <Button variant={edit ? 'dark' : 'outline'} icon={edit ? Check : Pencil} onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Edit timetable'}</Button>} />
      <div className="max-w-xs mb-4"><Select label="Class and section" value={sec} onChange={(e) => setSec(e.target.value)} options={sectionOptions(s)} /></div>
      <TimetableGrid sectionId={sec} editable={edit && manage} />
    </>
  );
}

// ───── Attendance (admin) ─────
export function AttendanceAdmin() {
  const s = useAppState();
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState(S.latestAttendanceDate(s));
  const a = S.attendanceOn(s, date);
  const secs = S.sortedSections(s).map((sec) => { const d = S.attendanceIndex(s).bySectionDate[date]?.[sec.id]; return { sec, label: S.sectionLabel(s, sec.id), d, pct: d ? pct(d.total - d.absent, d.total, 1) : null }; });
  const low = s.students.filter((st) => st.status === 'active').map((st) => ({ st, ...S.studentAttendance(s, st.id) })).filter((x) => x.pct < s.school.attendanceThreshold).sort((x, y) => x.pct - y.pct);
  return (
    <>
      <PageHeader title="Attendance" subtitle="School-wide attendance. Administrators can also correct any record." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Daily overview' }, { value: 'mark', label: 'Mark or correct' }, { value: 'low', label: 'Low attendance', count: low.length }]} />
      <div className="mt-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="max-w-xs"><Input label="Date" type="date" max={today()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-4"><Stat label="Attendance" value={a ? `${a.pct}%` : '–'} tone={a ? toneForPct(a.pct) : 'gray'} /><Stat label="Absent" value={a?.absent ?? '–'} tone="red" /><Stat label="Late" value={a?.late ?? '–'} tone="amber" /><Stat label="Sections marked" value={`${a?.sections ?? 0}/${s.sections.length}`} tone="blue" /></div>
            <Card className="p-4"><DataTable pageSize={14} exportName={`attendance-${date}`} rows={secs} rowKey={(r) => r.sec.id} columns={[
              { key: 's', label: 'Section', value: (r) => r.label, render: (r) => <b className="text-gray-900">Class {r.label}</b> },
              { key: 't', label: 'Class teacher', value: (r) => S.teacherName(s, r.sec.classTeacherId) },
              { key: 'ab', label: 'Absent', value: (r) => r.d?.absent ?? '–' }, { key: 'l', label: 'Late', value: (r) => r.d?.late ?? '–' },
              { key: 'p', label: 'Attendance', sort: (r) => r.pct ?? -1, value: (r) => (r.pct != null ? `${r.pct}%` : 'Not marked'), render: (r) => r.pct == null ? <Badge tone="gray">Not marked</Badge> : <div className="flex items-center gap-2 min-w-[140px]"><ProgressBar className="flex-1" value={r.pct} tone={toneForPct(r.pct)} label={r.label} /><span className="tabular-nums w-12 text-end">{r.pct}%</span></div> },
            ]} /></Card>
          </div>
        )}
        {tab === 'mark' && <AttendanceMarker />}
        {tab === 'low' && <Section title={`Students below ${s.school.attendanceThreshold}%`} subtitle="A prompt for a supportive conversation, not a judgement."><DataTable pageSize={12} exportName="low-attendance" rows={low} rowKey={(r) => r.st.id} search={(r) => r.st.name} columns={[{ key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <b className="text-gray-900">{r.st.name}</b> }, { key: 'c', label: 'Class', value: (r) => S.sectionLabel(s, r.st.sectionId) }, { key: 'a', label: 'Absent', value: (r) => r.absent }, { key: 'p', label: 'Attendance', sort: (r) => r.pct, value: (r) => `${r.pct}%`, render: (r) => <Badge tone="red">{r.pct}%</Badge> }]} /></Section>}
      </div>
    </>
  );
}

// ───── Exams ─────
export function Exams() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const [ask, node] = useConfirm();
  const [form, setForm] = useState(null);
  const manage = can(role, 'exams.manage');
  const list = [...s.exams].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <PageHeader title="Examinations" subtitle="Schedule exams. Teachers then enter marks, and the principal approves them." actions={manage && <Button icon={Plus} onClick={() => setForm({ name: '', type: 'Unit Test', date: '', max: 50, classIds: s.classes.map((c) => c.id) })}>Schedule exam</Button>} />
      <Card className="p-4">
        <DataTable rows={list} exportName="exams" search={(r) => r.name} columns={[
          { key: 'n', label: 'Exam', value: (r) => r.name, render: (r) => <b className="text-gray-900">{r.name}</b> },
          { key: 't', label: 'Type', value: (r) => r.type }, { key: 'd', label: 'Date', value: (r) => r.date, render: (r) => fmtDate(r.date) },
          { key: 'm', label: 'Max marks', value: (r) => r.max }, { key: 'c', label: 'Classes', value: (r) => r.classIds.map((c) => idx(s).classes[c]?.no).join(', ') },
          { key: 's', label: 'Status', value: (r) => (S.examIsConducted(r) ? 'Conducted' : 'Upcoming'), render: (r) => <Badge tone={S.examIsConducted(r) ? 'green' : 'blue'}>{S.examIsConducted(r) ? 'Conducted' : 'Upcoming'}</Badge> },
          { key: 'r', label: 'Marks entry', render: (r) => { if (!S.examIsConducted(r)) return '–'; const t = S.marksTasks(s).filter((x) => x.exam.id === r.id); const d = t.filter((x) => ['submitted', 'approved'].includes(x.status)).length; return <span className="tabular-nums text-sm">{d}/{t.length}</span>; } },
          { key: 'x', label: '', render: (r) => manage && <div className="flex gap-1 justify-end"><button aria-label={`Edit ${r.name}`} className="p-1.5 text-gray-500 hover:text-primary" onClick={() => setForm({ ...r })}><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.name}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete exam?', message: `${r.name} will be removed. Exams with marks entered cannot be deleted.`, onConfirm: () => run(() => A.deleteExam(r.id), 'Exam deleted.') })}><Trash2 className="w-4 h-4" /></button></div> },
        ]} />
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Schedule exam'} footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.saveExam(form.id, form); setForm(null); }, 'Exam saved.')}>Save</Button></>}>
        {form && <div className="space-y-3"><Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={['Unit Test', 'Term', 'Pre-Board', 'Final'].map((v) => ({ value: v, label: v }))} /><Input label="Maximum marks" type="number" min="1" value={form.max} onChange={(e) => setForm({ ...form, max: e.target.value })} /></div><Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /><Checkboxes label="Classes" value={form.classIds} onChange={(v) => setForm({ ...form, classIds: v })} options={classOptions(s)} /></div>}
      </Modal>
      {node}
    </>
  );
}

// ───── Marks (admin approval) ─────
export function MarksAdmin() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const approver = can(role, 'marks.approve');
  const [examId, setExamId] = useState([...s.exams].filter(S.examIsConducted).sort((a, b) => b.date.localeCompare(a.date))[0]?.id);
  const [view, setView] = useState(null);
  const [back, setBack] = useState(null);
  const tasks = S.marksTasks(s).filter((t) => t.exam.id === examId && t.conducted);
  const c = (k) => tasks.filter((t) => t.status === k).length;
  const submitted = tasks.filter((t) => t.status === 'submitted');
  const open = tasks.filter((t) => ['pending', 'draft'].includes(t.status));
  return (
    <>
      <PageHeader title="Marks" subtitle="Track entry progress, review submitted marks and approve results." actions={<>{approver && submitted.length > 0 && <Button icon={Check} onClick={() => run(() => submitted.forEach((t) => A.approveMarks(t.key, true)), `${submitted.length} marks sheets approved.`)}>Approve all submitted ({submitted.length})</Button>}{open.length > 0 && <Button variant="outline" icon={Bell} onClick={() => run(() => A.remindTeachers(open.map((t) => t.key)), (n) => `Reminders sent to ${n} teachers.`)}>Remind pending ({open.length})</Button>}</>} />
      <div className="max-w-xs mb-4"><Select label="Examination" value={examId} onChange={(e) => setExamId(e.target.value)} options={examOptions(s).filter((o) => S.examIsConducted(idx(s).exams[o.value]))} /></div>
      <div className="grid gap-4 sm:grid-cols-4 mb-5">{['pending', 'draft', 'submitted', 'approved'].map((k) => <Stat key={k} label={STATUS_LABEL[k]} value={c(k)} tone={STATUS_TONE[k]} />)}</div>
      <Card className="p-4">
        <DataTable pageSize={12} exportName="marks-status" rows={tasks} rowKey={(r) => r.key} search={(r) => `${S.sectionLabel(s, r.sectionId)} ${S.subjectName(s, r.subjectId)} ${S.teacherName(s, r.teacherId)}`}
          filters={[{ key: 'st', label: 'Any status', options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })), get: (r) => r.status }, { key: 'sec', label: 'All sections', options: sectionOptions(s), get: (r) => r.sectionId }, { key: 'sub', label: 'All subjects', options: subjectOptions(s), get: (r) => r.subjectId }]}
          columns={[
            { key: 's', label: 'Section', value: (r) => S.sectionLabel(s, r.sectionId), render: (r) => <b className="text-gray-900">Class {S.sectionLabel(s, r.sectionId)}</b> },
            { key: 'su', label: 'Subject', value: (r) => S.subjectName(s, r.subjectId) }, { key: 't', label: 'Teacher', value: (r) => S.teacherName(s, r.teacherId) },
            { key: 'st', label: 'Status', value: (r) => STATUS_LABEL[r.status], render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
            { key: 'x', label: '', render: (r) => <div className="flex gap-1.5 justify-end">{['submitted', 'approved'].includes(r.status) && <Button size="sm" variant="outline" icon={Eye} onClick={() => setView(r)}>View</Button>}{approver && r.status === 'submitted' && <Button size="sm" onClick={() => run(() => A.approveMarks(r.key, true), 'Marks approved.')}>Approve</Button>}{approver && ['submitted', 'approved'].includes(r.status) && <Button size="sm" variant="danger" onClick={() => setBack({ key: r.key, note: '', approved: r.status === 'approved' })}>{r.status === 'approved' ? 'Reopen' : 'Send back'}</Button>}{['pending', 'draft'].includes(r.status) && <Button size="sm" variant="outline" onClick={() => run(() => A.remindTeachers([r.key]), 'Reminder sent.')}>Remind</Button>}</div> },
          ]} />
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} wide title={view ? `${S.subjectName(s, view.subjectId)} · Class ${S.sectionLabel(s, view.sectionId)} · ${view.exam.name}` : ''}>
        {view && <DataTable pageSize={12} rows={idx(s).studentsBySection[view.sectionId] || []} columns={[{ key: 'n', label: 'Student', render: (r) => r.name }, { key: 'm', label: `Marks (/${view.exam.max})`, render: (r) => s.marks[view.exam.id]?.[view.subjectId]?.[r.id] ?? '–' }, { key: 'g', label: 'Grade', render: (r) => { const m = s.marks[view.exam.id]?.[view.subjectId]?.[r.id]; return m == null ? '–' : <Badge tone={S.gradeTone(S.gradeFor(s, pct(m, view.exam.max)))}>{S.gradeFor(s, pct(m, view.exam.max))}</Badge>; } }]} />}
      </Modal>
      <Modal open={!!back} onClose={() => setBack(null)} title={back?.approved ? 'Reopen approved marks' : 'Send marks back to teacher'} footer={<><Button variant="outline" onClick={() => setBack(null)}>Cancel</Button><Button onClick={() => run(() => { A.approveMarks(back.key, false, back.note); setBack(null); }, 'Marks returned to the teacher for correction.')}>{back?.approved ? 'Reopen' : 'Send back'}</Button></>}>
        {back && <Input label="Reason / instructions for the teacher" value={back.note} onChange={(e) => setBack({ ...back, note: e.target.value })} />}
      </Modal>
    </>
  );
}

// ───── Report cards ─────
export function ReportCards() {
  const s = useAppState();
  const [examId, setExamId] = useState([...s.exams].filter(S.examIsConducted).sort((a, b) => b.date.localeCompare(a.date))[0]?.id);
  const [sec, setSec] = useState('10-B');
  const [open, setOpen] = useState(null);
  const roster = idx(s).studentsBySection[sec] || [];
  const ranks = S.sectionRanks(s, sec, examId);
  const rows = roster.map((st) => ({ st, ...S.examResult(s, st.id, examId), rank: ranks[st.id] }));
  return (
    <>
      <PageHeader title="Report Cards" subtitle="Generate printable report cards from published marks." />
      <Card className="p-4 mb-5"><div className="grid gap-3 sm:grid-cols-2"><Select label="Examination" value={examId} onChange={(e) => setExamId(e.target.value)} options={examOptions(s).filter((o) => S.examIsConducted(idx(s).exams[o.value]))} /><Select label="Class and section" value={sec} onChange={(e) => setSec(e.target.value)} options={sectionOptions(s)} /></div></Card>
      <Card className="p-4">
        <DataTable pageSize={12} exportName={`results-${sec}`} rows={rows} rowKey={(r) => r.st.id} search={(r) => r.st.name} initialSort={{ key: 'rk', dir: 'asc' }} columns={[
          { key: 'rk', label: 'Rank', value: (r) => r.rank ?? 999, render: (r) => r.rank ? `#${r.rank}` : '–' },
          { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <b className="text-gray-900">{r.st.name}</b> },
          { key: 't', label: 'Total', value: (r) => (r.rows.length ? `${r.total}/${r.max}` : '–') },
          { key: 'p', label: 'Percent', sort: (r) => r.percent, value: (r) => (r.rows.length ? `${r.percent}%` : '–'), render: (r) => r.rows.length ? <Badge tone={toneForPct(r.percent)}>{r.percent}%</Badge> : '–' },
          { key: 'g', label: 'Grade', value: (r) => (r.rows.length ? r.grade : '–') },
          { key: 'c', label: 'Subjects published', value: (r) => `${r.rows.length}/${S.subjectIdsOfSection(s, sec).length}` },
          { key: 'x', label: '', render: (r) => <Button size="sm" variant="outline" icon={FileText} disabled={!r.rows.length} onClick={() => setOpen(r.st.id)}>Report card</Button> },
        ]} />
      </Card>
      <ReportCardModal open={!!open} onClose={() => setOpen(null)} studentId={open} examId={examId} />
    </>
  );
}

// ───── Assignments monitoring ─────
export function AssignmentsMonitor() {
  const s = useAppState();
  const [view, setView] = useState(null);
  const rows = s.assignments.map((a) => ({ a, ...S.assignmentStats(s, a), label: S.sectionLabel(s, a.sectionId) }));
  const totals = rows.reduce((t, r) => ({ sub: t.sub + r.submitted, ros: t.ros + r.roster, awaiting: t.awaiting + r.awaiting, missing: t.missing + r.missing }), { sub: 0, ros: 0, awaiting: 0, missing: 0 });
  const missingList = view ? (idx(s).studentsBySection[view.a.sectionId] || []).filter((st) => S.assignmentState(s, view.a, st.id).key === 'missing' || S.assignmentState(s, view.a, st.id).key === 'pending') : [];
  return (
    <>
      <PageHeader title="Assignments" subtitle="Monitor homework across the school. Teachers create and evaluate; you watch completion." />
      <div className="grid gap-4 sm:grid-cols-4 mb-5"><Stat label="Assignments" value={rows.length} tone="blue" /><Stat label="Submission rate" value={`${pct(totals.sub, totals.ros)}%`} tone="green" /><Stat label="Awaiting evaluation" value={totals.awaiting} tone="amber" /><Stat label="Missing (overdue)" value={totals.missing} tone="red" /></div>
      <Card className="p-4">
        <DataTable pageSize={12} exportName="assignments" rows={rows} rowKey={(r) => r.a.id} search={(r) => `${r.a.title} ${r.label} ${S.teacherName(s, r.a.teacherId)}`} filters={[{ key: 'sec', label: 'All sections', options: sectionOptions(s), get: (r) => r.a.sectionId }, { key: 'sub', label: 'All subjects', options: subjectOptions(s), get: (r) => r.a.subjectId }]}
          columns={[
            { key: 't', label: 'Assignment', value: (r) => r.a.title, render: (r) => <div><div className="font-semibold text-gray-900">{r.a.title}</div><div className="text-xs text-gray-500">{S.subjectName(s, r.a.subjectId)} · {S.teacherName(s, r.a.teacherId)}</div></div> },
            { key: 's', label: 'Section', value: (r) => r.label }, { key: 'd', label: 'Due', value: (r) => r.a.due, render: (r) => fmtShort(r.a.due) },
            { key: 'sb', label: 'Submitted', sort: (r) => r.rate, value: (r) => `${r.submitted}/${r.roster}`, render: (r) => <div className="flex items-center gap-2 min-w-[130px]"><ProgressBar className="flex-1" value={r.rate} tone={toneForPct(r.rate)} label={r.a.title} /><span className="text-xs tabular-nums">{r.submitted}/{r.roster}</span></div> },
            { key: 'aw', label: 'Awaiting', value: (r) => r.awaiting }, { key: 'm', label: 'Missing', value: (r) => r.missing },
            { key: 'x', label: '', render: (r) => <Button size="sm" variant="outline" onClick={() => setView(r)}>Who is pending</Button> },
          ]} />
      </Card>
      <Modal open={!!view} onClose={() => setView(null)} title={view ? `Not yet submitted: ${view.a.title}` : ''}>
        {view && (missingList.length ? <ul className="divide-y divide-gray-100">{missingList.map((st) => <li key={st.id} className="py-2 flex justify-between text-sm"><span className="font-semibold text-gray-900">{st.name}</span><span className="text-gray-500">Roll {st.rollNo}</span></li>)}</ul> : <p className="text-sm text-gray-600">Everyone has submitted.</p>)}
      </Modal>
    </>
  );
}
export { Printer, Avatar, EmptyState };
