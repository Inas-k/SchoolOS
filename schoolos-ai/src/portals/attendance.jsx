import { useEffect, useMemo, useState } from 'react';
import { Check, Clock, RotateCcw, X } from 'lucide-react';
import { useAppState } from '../lib/store';
import * as S from '../lib/selectors';
import * as A from '../lib/actions';
import { can } from '../lib/perms';
import { addDays, cx, fmtDate, fmtDateTime, fmtShort, isWeekend, pct, today } from '../lib/util';
import { PERIODS } from '../data/seed';
import { Avatar, Badge, Button, Card, DataTable, EmptyState, Input, Section, Select, Stat, Tabs, toneForPct, useRun } from '../ui/kit';
import { useMe } from '../app/shell';
import { sectionOptions } from './common';

const { idx } = S;
const OPT = [['P', 'Present', Check, 'bg-emerald-600 text-white border-emerald-600', 'text-emerald-700'], ['A', 'Absent', X, 'bg-red-600 text-white border-red-600', 'text-red-700'], ['L', 'Late', Clock, 'bg-amber-500 text-white border-amber-500', 'text-amber-700']];

export default function AttendanceMarker({ allowedSectionIds }) {
  const s = useAppState();
  const { user, role } = useMe();
  const run = useRun();
  const admin = can(role, 'attendance.any');
  const options = sectionOptions(s, allowedSectionIds);
  // Open on a section that still needs attendance today; otherwise the first one.
  const firstPending = S.pendingAttendanceSections(s, today(), 1).find((x) => options.some((o) => o.value === x.id));
  const [sectionId, setSectionId] = useState(firstPending?.id || options[0]?.value || '');
  const [date, setDate] = useState(today());
  const [period, setPeriod] = useState(1);
  const [tab, setTab] = useState('mark');
  const roster = idx(s).studentsBySection[sectionId] || [];
  const rec = s.attendance[date]?.[sectionId]?.[period];
  const [marks, setMarks] = useState({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setMarks(rec ? { ...rec.marks } : {}); setDirty(false); }, [sectionId, date, period, rec]);
  const counts = useMemo(() => ({ A: Object.values(marks).filter((v) => v === 'A').length, L: Object.values(marks).filter((v) => v === 'L').length }), [marks]);
  const stale = !admin && date < addDays(today(), -2);
  const set = (id, v) => { setMarks((m) => { const n = { ...m }; if (v === 'P') delete n[id]; else n[id] = v; return n; }); setDirty(true); };
  const save = () => run(() => A.saveAttendance({ date, sectionId, period, marks }), `Attendance saved: ${counts.A} absent, ${counts.L} late. Parents of absent or late students were notified.`);
  const history = S.attendanceIndex(s).dates.slice(-10).reverse().map((d) => ({ d, r: s.attendance[d]?.[sectionId]?.[1] }));
  const summary = roster.map((st) => ({ st, ...S.studentAttendance(s, st.id) })).sort((a, b) => a.pct - b.pct);
  const pending = S.pendingAttendanceSections(s, date, period).filter((x) => !allowedSectionIds || allowedSectionIds.includes(x.id));
  if (!options.length) return <Card><EmptyState title="No classes assigned" text="You have no classes assigned yet." /></Card>;
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select label="Class and section" value={sectionId} onChange={(e) => setSectionId(e.target.value)} options={options} />
          <Input label="Date" type="date" max={today()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <Select label="Period" value={period} onChange={(e) => setPeriod(Number(e.target.value))} options={PERIODS.map((p) => ({ value: p.no, label: `Period ${p.no} (${p.time})` }))} />
        </div>
        {isWeekend(date) && <p className="mt-3 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">{fmtDate(date)} is a weekend. You can still record attendance if the school was open.</p>}
        {pending.length > 0 && date === today() && <p className="mt-3 text-sm text-gray-700">Not yet marked for this period: {pending.map((p) => <button key={p.id} className="me-1.5 px-2 py-0.5 rounded-md bg-gray-100 hover:bg-primary hover:text-white text-[13px] font-semibold" onClick={() => setSectionId(p.id)}>{S.sectionLabel(s, p.id)}</button>)}</p>}
      </Card>
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'mark', label: 'Mark attendance' }, { value: 'history', label: 'Previous attendance' }, { value: 'summary', label: 'Student summary' }]} />
      {tab === 'mark' && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex-1 min-w-[220px]">
              <div className="font-extrabold text-gray-900">Class {S.sectionLabel(s, sectionId)} · {fmtDate(date)} · Period {period}</div>
              <div className="text-[13px] text-gray-600">{rec ? <>Saved {fmtDateTime(rec.at)} by {S.teacherName(s, rec.by) !== 'Unassigned' ? S.teacherName(s, rec.by) : idx(s).users[rec.by]?.name || 'administration'}</> : 'Not marked yet. Everyone defaults to present.'}</div>
            </div>
            <Badge tone="green">{roster.length - counts.A - counts.L} present</Badge><Badge tone="red">{counts.A} absent</Badge><Badge tone="amber">{counts.L} late</Badge>
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => { setMarks({}); setDirty(true); }}>All present</Button>
          </div>
          {stale && <p className="px-4 py-2 text-sm text-red-800 bg-red-50">Attendance older than 2 days can only be changed by the administration.</p>}
          <ul className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
            {roster.map((st) => {
              const v = marks[st.id] || 'P';
              const a = S.studentAttendance(s, st.id);
              return (
                <li key={st.id} className={cx('flex flex-wrap items-center gap-3 px-4 py-2.5', v === 'A' && 'bg-red-50/60', v === 'L' && 'bg-amber-50/60')}>
                  <span className="w-7 text-xs text-gray-500 tabular-nums">{st.rollNo}</span>
                  <Avatar name={st.name} size={30} />
                  <div className="flex-1 min-w-[140px]"><div className="font-semibold text-gray-900 text-sm">{st.name}</div><div className={cx('text-[11px]', a.pct < s.school.attendanceThreshold ? 'text-red-700 font-semibold' : 'text-gray-500')}>{a.pct}% overall</div></div>
                  <div role="radiogroup" aria-label={`Attendance for ${st.name}`} className="flex gap-1">
                    {OPT.map(([k, label, Icon, on]) => <button key={k} role="radio" aria-checked={v === k} disabled={stale} onClick={() => set(st.id, k)} className={cx('inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[12.5px] font-semibold transition-colors disabled:opacity-50', v === k ? on : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400')}><Icon className="w-3.5 h-3.5" />{label}</button>)}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="p-4 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">{dirty ? 'You have unsaved changes.' : rec ? 'All changes saved.' : 'Nothing saved yet.'}</span>
            <Button onClick={save} disabled={stale || (!dirty && !!rec)}>{rec ? 'Update attendance' : 'Save attendance'}</Button>
          </div>
        </Card>
      )}
      {tab === 'history' && (
        <Section title={`Class ${S.sectionLabel(s, sectionId)}: last 10 school days`} subtitle="Period 1 records. Pick a day to review or correct it.">
          <DataTable pageSize={10} rows={history} rowKey={(r) => r.d} columns={[
            { key: 'd', label: 'Date', render: (r) => <b className="text-gray-900">{fmtDate(r.d, { weekday: 'short', day: 'numeric', month: 'short' })}</b>, value: (r) => r.d },
            { key: 'p', label: 'Present', value: (r) => (r.r ? roster.length - Object.values(r.r.marks).filter((v) => v === 'A').length : '–') },
            { key: 'a', label: 'Absent', value: (r) => (r.r ? Object.values(r.r.marks).filter((v) => v === 'A').length : '–') },
            { key: 'l', label: 'Late', value: (r) => (r.r ? Object.values(r.r.marks).filter((v) => v === 'L').length : '–') },
            { key: 'n', label: 'Names', render: (r) => <span className="text-[13px] text-gray-700">{r.r ? Object.entries(r.r.marks).filter(([, v]) => v === 'A').map(([id]) => idx(s).students[id]?.name.split(' ')[0]).join(', ') || '–' : 'Not marked'}</span> },
            { key: 'x', label: '', render: (r) => <Button size="sm" variant="outline" onClick={() => { setDate(r.d); setPeriod(1); setTab('mark'); }}>Open</Button> },
          ]} />
        </Section>
      )}
      {tab === 'summary' && (
        <Section title={`Attendance summary for ${S.sectionLabel(s, sectionId)}`} subtitle={`Students below ${s.school.attendanceThreshold}% are highlighted.`}>
          <DataTable pageSize={12} exportName={`attendance-${sectionId}`} rows={summary} rowKey={(r) => r.st.id} search={(r) => r.st.name} columns={[
            { key: 'n', label: 'Student', value: (r) => r.st.name, render: (r) => <span className="font-semibold text-gray-900">{r.st.name}</span> },
            { key: 'p', label: 'Present', value: (r) => r.present }, { key: 'a', label: 'Absent', value: (r) => r.absent }, { key: 'l', label: 'Late', value: (r) => r.late },
            { key: 'pc', label: 'Attendance', sort: (r) => r.pct, value: (r) => `${r.pct}%`, render: (r) => <Badge tone={r.pct < s.school.attendanceThreshold ? 'red' : toneForPct(r.pct)}>{r.pct}%</Badge> },
          ]} />
        </Section>
      )}
    </div>
  );
}
export { Stat, fmtShort, pct };
