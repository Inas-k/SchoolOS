import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { can, ROLES } from '../../lib/perms';
import { fmtDate, money, today } from '../../lib/util';
import { Avatar, Badge, Button, Card, Checkboxes, DataTable, EmptyState, Input, Modal, PageHeader, Section, Select, Stat, Tabs, Textarea, toneForPct, useConfirm, useRun } from '../../ui/kit';
import { classOptions, sectionOptions, subjectOptions } from '../common';
import { AcademicsView, AttendanceView, FeesView, Passport } from '../shared';
import { useMe } from '../../app/shell';

const { idx } = S;
const BLANK = { name: '', gender: 'M', dob: '', sectionId: '', admNo: '', bloodGroup: '', address: '', parentName: '', parentEmail: '', parentPhone: '', status: 'active' };

export function Students() {
  const s = useAppState();
  const { role } = useMe();
  const nav = useNavigate();
  const run = useRun();
  const [ask, node] = useConfirm();
  const [form, setForm] = useState(null);
  const edit = !!form?.id;
  const manage = can(role, 'students.manage');
  const rows = s.students.map((st) => ({ ...st, att: S.studentAttendance(s, st.id).pct, section: S.sectionLabel(s, st.sectionId) }));
  const save = () => run(() => { edit ? A.updateStudent(form.id, form) : A.addStudent(form); setForm(null); }, edit ? 'Student updated.' : 'Student added. Parent and student accounts were created.');
  const openEdit = (st) => { const p = idx(s).parents[st.parentId]; setForm({ ...st, parentName: p?.name || '', parentPhone: p?.phone || '', parentEmail: p?.email || '' }); };
  return (
    <>
      <PageHeader title="Students" subtitle={`${s.students.length} students across ${s.sections.length} sections.`} actions={manage && <Button icon={UserPlus} onClick={() => setForm({ ...BLANK, sectionId: s.sections[0].id })}>Add student</Button>} />
      <Card className="p-4">
        <DataTable pageSize={12} exportName="students" rows={rows} onRowClick={(r) => nav(r.id)} search={(r) => `${r.name} ${r.admNo} ${r.section}`}
          filters={[{ key: 'class', label: 'All classes', options: classOptions(s), get: (r) => r.classId }, { key: 'sec', label: 'All sections', options: sectionOptions(s), get: (r) => r.sectionId }, { key: 'status', label: 'Any status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], get: (r) => r.status }]}
          columns={[
            { key: 'n', label: 'Student', value: (r) => r.name, render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size={30} /><div><div className="font-semibold text-gray-900">{r.name}</div><div className="text-xs text-gray-500">{r.admNo}</div></div></div> },
            { key: 'c', label: 'Class', value: (r) => r.section },
            { key: 'r', label: 'Roll', value: (r) => r.rollNo, className: 'tabular-nums' },
            { key: 'p', label: 'Parent', value: (r) => idx(s).parents[r.parentId]?.name || '' },
            { key: 'a', label: 'Attendance', sort: (r) => r.att, value: (r) => `${r.att}%`, render: (r) => <Badge tone={toneForPct(r.att)}>{r.att}%</Badge> },
            { key: 's', label: 'Status', value: (r) => r.status, render: (r) => <Badge tone={r.status === 'active' ? 'green' : 'gray'}>{r.status}</Badge> },
            { key: 'x', label: '', render: (r) => manage && <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}><button aria-label={`Edit ${r.name}`} className="p-1.5 text-gray-500 hover:text-primary" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.name}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete student?', message: `${r.name} and all their attendance, marks-linked records, submissions, fees and accounts will be permanently removed.`, onConfirm: () => run(() => A.deleteStudent(r.id), 'Student deleted.') })}><Trash2 className="w-4 h-4" /></button></div> },
          ]} />
      </Card>
      <Modal open={!!form} wide onClose={() => setForm(null)} title={edit ? `Edit ${form.name}` : 'Add student'} footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>{edit ? 'Save changes' : 'Add student'}</Button></>}>
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Admission number" placeholder="Auto-generated if empty" value={form.admNo} onChange={(e) => setForm({ ...form, admNo: e.target.value })} />
            <Select label="Class and section *" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} options={sectionOptions(s)} />
            <Input label="Date of birth *" type="date" max={today()} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} options={[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }]} />
            <Select label="Blood group" placeholder="Unknown" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((v) => ({ value: v, label: v }))} />
            <Input className="sm:col-span-2" label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Parent / guardian name *" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
            <Input label="Parent phone" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
            {!edit && <Input className="sm:col-span-2" label="Parent email" type="email" hint="Used as the parent's demo login. Leave empty to auto-generate." value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />}
            {edit && <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />}
          </div>
        )}
      </Modal>
      {node}
    </>
  );
}

export function StudentDetail() {
  const { id } = useParams();
  const s = useAppState();
  const [tab, setTab] = useState('overview');
  const st = idx(s).students[id];
  if (!st) return <EmptyState title="Student not found" action={<Link to=".." className="text-cta font-semibold">Back to students</Link>} />;
  const parent = idx(s).parents[st.parentId];
  const att = S.studentAttendance(s, st.id);
  const sum = S.studentSubjectSummary(s, st.id);
  const overall = sum.length ? (sum.reduce((a, b) => a + b.avg, 0) / sum.length).toFixed(1) : null;
  const fee = (idx(s).feesByStudent[st.id] || []).reduce((a, f) => a + f.amount - f.paid, 0);
  const sec = idx(s).sections[st.sectionId];
  return (
    <>
      <Link to=".." relative="path" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-cta mb-3"><ArrowLeft className="w-4 h-4" />All students</Link>
      <Card className="p-5 mb-5 flex flex-wrap gap-4 items-center"><Avatar name={st.name} size={56} color="#d01858" /><div className="flex-1 min-w-[220px]"><h1 className="text-2xl font-extrabold text-gray-900">{st.name}</h1><p className="text-sm text-gray-600">Class {S.sectionLabel(s, st.sectionId)} · Roll {st.rollNo} · {st.admNo} · <Badge tone={st.status === 'active' ? 'green' : 'gray'}>{st.status}</Badge></p></div></Card>
      <Tabs value={tab} onChange={setTab} tabs={[['overview', 'Overview'], ['attendance', 'Attendance'], ['academics', 'Academics'], ['fees', 'Fees'], ['passport', 'Growth Passport']].map(([value, label]) => ({ value, label }))} />
      <div className="mt-5">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Attendance" value={`${att.pct}%`} tone={toneForPct(att.pct)} /><Stat label="Academic average" value={overall ? `${overall}%` : '–'} tone="blue" /><Stat label="Outstanding fees" value={money(fee)} tone={fee ? 'red' : 'green'} /><Stat label="Class teacher" value={S.teacherName(s, sec.classTeacherId).replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '')} tone="purple" /></div>
            <Section title="Profile"><dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">{[['Date of birth', fmtDate(st.dob)], ['Gender', st.gender === 'F' ? 'Female' : 'Male'], ['Blood group', st.bloodGroup || '–'], ['Address', st.address || '–'], ['Parent / guardian', parent?.name || '–'], ['Parent phone', parent?.phone || '–'], ['Parent email', parent?.email || '–'], ['Joined', fmtDate(st.joined)]].map(([k, v]) => <div key={k}><dt className="text-gray-500 text-xs">{k}</dt><dd className="font-semibold text-gray-900">{v}</dd></div>)}</dl></Section>
          </div>
        )}
        {tab === 'attendance' && <AttendanceView student={st} />}
        {tab === 'academics' && <AcademicsView student={st} />}
        {tab === 'fees' && <FeesView student={st} canPay={false} />}
        {tab === 'passport' && <Passport student={st} />}
      </div>
    </>
  );
}

export function Teachers() {
  const s = useAppState();
  const { role } = useMe();
  const run = useRun();
  const [ask, node] = useConfirm();
  const [form, setForm] = useState(null);
  const manage = can(role, 'teachers.manage');
  const rows = s.teachers.map((t) => ({ ...t, classes: [...new Set(t.assignments.map((a) => S.sectionLabel(s, a.sectionId)))], load: t.assignments.length }));
  const save = () => run(() => { A.saveTeacher(form.id, form); setForm(null); }, form.id ? 'Teacher updated.' : 'Teacher added with a login account.');
  return (
    <>
      <PageHeader title="Teachers" subtitle={`${s.teachers.length} teachers. Class and subject assignments are managed in Classes & Sections.`} actions={manage && <Button icon={Plus} onClick={() => setForm({ name: '', email: '', phone: '', qualification: '', subjectIds: [] })}>Add teacher</Button>} />
      <Card className="p-4">
        <DataTable pageSize={12} exportName="teachers" rows={rows} search={(r) => `${r.name} ${r.email} ${r.subjectIds.join(' ')}`} filters={[{ key: 'sub', label: 'All subjects', options: subjectOptions(s), get: (r) => r.subjectIds[0] }]}
          columns={[
            { key: 'n', label: 'Teacher', value: (r) => r.name, render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.name} size={30} color="#8e2155" /><div><div className="font-semibold text-gray-900">{r.name}</div><div className="text-xs text-gray-500">{r.email}</div></div></div> },
            { key: 's', label: 'Subject', value: (r) => r.subjectIds.map((x) => S.subjectName(s, x)).join(', ') },
            { key: 'c', label: 'Classes taught', value: (r) => r.classes.join(' '), render: (r) => <span className="text-[13px] text-gray-700">{r.classes.join(', ') || '–'}</span> },
            { key: 'l', label: 'Periods load', value: (r) => r.load, className: 'tabular-nums' },
            { key: 'a', label: 'Status', value: (r) => (r.active ? 'Active' : 'Inactive'), render: (r) => <Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'x', label: '', render: (r) => manage && <div className="flex gap-1 justify-end"><button aria-label={`Edit ${r.name}`} className="p-1.5 text-gray-500 hover:text-primary" onClick={() => setForm({ ...r })}><Pencil className="w-4 h-4" /></button><button aria-label={`Delete ${r.name}`} className="p-1.5 text-gray-500 hover:text-red-600" onClick={() => ask({ title: 'Delete teacher?', message: `${r.name} and their login will be removed.`, onConfirm: () => run(() => A.deleteTeacher(r.id), 'Teacher deleted.') })}><Trash2 className="w-4 h-4" /></button></div> },
          ]} />
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.name}` : 'Add teacher'} footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {form && <div className="space-y-3"><Input label="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><Input label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} /><Checkboxes label="Subjects *" value={form.subjectIds} onChange={(v) => setForm({ ...form, subjectIds: v })} options={subjectOptions(s)} />{form.id && <Select label="Status" value={form.active ? 'y' : 'n'} onChange={(e) => setForm({ ...form, active: e.target.value === 'y' })} options={[{ value: 'y', label: 'Active' }, { value: 'n', label: 'Inactive' }]} />}</div>}
      </Modal>
      {node}
    </>
  );
}

export function Users() {
  const s = useAppState();
  const { user } = useMe();
  const run = useRun();
  const [form, setForm] = useState(null);
  const staff = ['super_admin', 'school_admin', 'principal'];
  return (
    <>
      <PageHeader title="Users & Roles" subtitle="Accounts and what each role is allowed to do." actions={<Button icon={Plus} onClick={() => setForm({ name: '', email: '', role: 'school_admin', title: '' })}>Add administrator</Button>} />
      <div className="grid gap-4 md:grid-cols-3 mb-5">
        {[['super_admin', 'Everything, including users and roles.'], ['principal', 'All school operations, marks approval and AI insights. Cannot manage user accounts.'], ['school_admin', 'Operations and settings. Cannot approve marks or manage user accounts.']].map(([r, d]) => <Card key={r} className="p-4"><Badge tone="pink">{ROLES[r].label}</Badge><p className="mt-2 text-sm text-gray-700">{d}</p></Card>)}
        {[['teacher', 'Only their own classes and subjects: attendance, assignments, marks.'], ['student', 'Only their own records and learning tools.'], ['parent', 'Only their linked children.']].map(([r, d]) => <Card key={r} className="p-4"><Badge tone="blue">{ROLES[r].label}</Badge><p className="mt-2 text-sm text-gray-700">{d}</p></Card>)}
      </div>
      <Card className="p-4">
        <DataTable pageSize={12} exportName="users" rows={s.users} search={(r) => `${r.name} ${r.email} ${r.role}`} filters={[{ key: 'role', label: 'All roles', options: Object.entries(ROLES).map(([v, x]) => ({ value: v, label: x.label })), get: (r) => r.role }, { key: 'act', label: 'Any status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Deactivated' }], get: (r) => r.active }]}
          columns={[
            { key: 'n', label: 'Name', value: (r) => r.name, render: (r) => <div><div className="font-semibold text-gray-900">{r.name}{r.id === user.id && <Badge tone="blue" className="ms-2">You</Badge>}</div><div className="text-xs text-gray-500">{r.email}</div></div> },
            { key: 'r', label: 'Role', value: (r) => ROLES[r.role].label, render: (r) => staff.includes(r.role) && r.id !== user.id ? <select aria-label={`Role of ${r.name}`} value={r.role} onChange={(e) => run(() => A.setUserRole(r.id, e.target.value), 'Role updated.')} className="border border-gray-300 rounded-lg px-2 py-1 text-sm">{staff.map((x) => <option key={x} value={x}>{ROLES[x].label}</option>)}</select> : ROLES[r.role].label },
            { key: 's', label: 'Status', value: (r) => (r.active ? 'Active' : 'Deactivated'), render: (r) => <Badge tone={r.active ? 'green' : 'red'}>{r.active ? 'Active' : 'Deactivated'}</Badge> },
            { key: 'x', label: '', render: (r) => r.id !== user.id && <Button size="sm" variant="outline" onClick={() => run(() => A.setUserActive(r.id, !r.active), r.active ? 'Account deactivated.' : 'Account reactivated.')}>{r.active ? 'Deactivate' : 'Reactivate'}</Button> },
          ]} />
      </Card>
      <Modal open={!!form} onClose={() => setForm(null)} title="Add administrator" footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.createStaffUser(form); setForm(null); }, 'Account created. Password: demo123')}>Create account</Button></>}>
        {form && <div className="space-y-3"><Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><Input label="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={staff.map((x) => ({ value: x, label: ROLES[x].label }))} /></div>}
      </Modal>
    </>
  );
}
export { Textarea };
