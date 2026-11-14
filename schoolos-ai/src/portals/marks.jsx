import { useEffect, useMemo, useState } from 'react';
import { Lock, Save, Send } from 'lucide-react';
import { useAppState } from '../lib/store';
import * as S from '../lib/selectors';
import * as A from '../lib/actions';
import { avg, cx, fmtDate, pct, today } from '../lib/util';
import { Avatar, Badge, BarChart, Button, Card, EmptyState, Section, Select, Stat, useRun } from '../ui/kit';
import { useMe } from '../app/shell';

const { idx } = S;
export const STATUS_TONE = { pending: 'gray', draft: 'amber', submitted: 'blue', approved: 'green' };
export const STATUS_LABEL = { pending: 'Not entered', draft: 'Draft', submitted: 'Submitted', approved: 'Approved' };

export default function MarksEntry() {
  const s = useAppState();
  const { user } = useMe();
  const run = useRun();
  const teacher = idx(s).teachers[user.linkedId];
  const pairs = teacher.assignments.map((a) => ({ ...a, value: `${a.sectionId}|${a.subjectId}`, label: `Class ${S.sectionLabel(s, a.sectionId)} · ${S.subjectName(s, a.subjectId)}` })).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  const exams = [...s.exams].filter(S.examIsConducted).sort((a, b) => b.date.localeCompare(a.date));
  const [examId, setExamId] = useState(exams[0]?.id);
  const [pair, setPair] = useState(pairs[0]?.value);
  const [sectionId, subjectId] = (pair || '|').split('|');
  const exam = idx(s).exams[examId];
  const key = S.marksKey(examId, sectionId, subjectId);
  const status = S.marksEntryStatus(s, examId, sectionId, subjectId);
  const info = s.marksStatus[key];
  const roster = idx(s).studentsBySection[sectionId] || [];
  const stored = s.marks[examId]?.[subjectId] || {};
  const [vals, setVals] = useState({});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setVals(Object.fromEntries(roster.filter((r) => stored[r.id] != null).map((r) => [r.id, String(stored[r.id])]))); setDirty(false); }, [examId, pair, info?.at, status]);
  const locked = status === 'approved';
  const entered = roster.filter((r) => vals[r.id] !== undefined && vals[r.id] !== '').map((r) => Number(vals[r.id]));
  const stats = useMemo(() => {
    if (!entered.length) return null;
    const pcts = entered.map((v) => pct(v, exam.max, 1));
    const dist = {};
    pcts.forEach((p) => { const g = S.gradeFor(s, p); dist[g] = (dist[g] || 0) + 1; });
    const pass = pcts.filter((p) => p >= 33).length;
    return { avg: avg(pcts).toFixed(1), hi: Math.max(...entered), lo: Math.min(...entered), pass: pct(pass, pcts.length), dist };
  }, [vals, exam, s.school.grading]);
  const bad = (id) => { const v = vals[id]; if (v === undefined || v === '') return false; const n = Number(v); return !Number.isFinite(n) || n < 0 || n > exam.max; };
  const save = (submit) => run(() => { A.saveMarks({ examId, sectionId, subjectId, values: vals, submit }); setDirty(false); }, submit ? 'Marks submitted. Students, parents and the principal can now see them.' : 'Draft saved.');
  if (!pairs.length) return <Card><EmptyState title="No subjects assigned" /></Card>;
  const mine = S.marksTasks(s, user.linkedId).filter((t) => t.conducted);
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="My marks sheets" value={mine.length} tone="blue" /><Stat label="Submitted or approved" value={mine.filter((t) => ['submitted', 'approved'].includes(t.status)).length} tone="green" /><Stat label="Still to enter" value={mine.filter((t) => ['pending', 'draft'].includes(t.status)).length} tone="amber" /></div>
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2"><Select label="Examination" value={examId} onChange={(e) => setExamId(e.target.value)} options={exams.map((e) => ({ value: e.id, label: `${e.name} (max ${e.max})` }))} /><Select label="Class and subject" value={pair} onChange={(e) => setPair(e.target.value)} options={pairs.map((p) => ({ value: p.value, label: `${p.label}${['pending', 'draft'].includes(S.marksEntryStatus(s, examId, p.sectionId, p.subjectId)) ? '  •  pending' : ''}` }))} /></div>
      </Card>
      {exam && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]"><div className="font-extrabold text-gray-900">{exam.name} · {S.subjectName(s, subjectId)} · Class {S.sectionLabel(s, sectionId)}</div><div className="text-[13px] text-gray-600">Conducted {fmtDate(exam.date)} · maximum {exam.max} marks</div></div>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
            {locked && <span className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold"><Lock className="w-4 h-4" />Approved. Ask the Principal to reopen.</span>}
            {info?.note && status === 'draft' && <span className="text-sm text-red-700">Returned: {info.note}</span>}
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-2 text-start w-14">Roll</th><th className="px-2 py-2 text-start">Student</th><th className="px-2 py-2 text-start w-36">Marks (0–{exam.max})</th><th className="px-2 py-2 text-start w-24">Percent</th><th className="px-2 py-2 text-start w-20">Grade</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{roster.map((st) => {
              const v = vals[st.id]; const has = v !== undefined && v !== '' && !bad(st.id); const p = has ? pct(Number(v), exam.max, 1) : null;
              return <tr key={st.id}><td className="px-4 py-1.5 text-gray-500 tabular-nums">{st.rollNo}</td><td className="px-2 py-1.5"><div className="flex items-center gap-2"><Avatar name={st.name} size={26} /><span className="font-semibold text-gray-900">{st.name}</span></div></td>
                <td className="px-2 py-1.5"><input aria-label={`Marks for ${st.name}`} inputMode="decimal" disabled={locked} value={v ?? ''} onChange={(e) => { setVals({ ...vals, [st.id]: e.target.value }); setDirty(true); }} className={cx('w-24 px-2.5 py-1.5 border rounded-lg tabular-nums disabled:bg-gray-50', bad(st.id) ? 'border-red-500 bg-red-50' : 'border-gray-300')} />{bad(st.id) && <div className="text-[11px] text-red-600 mt-0.5">0 to {exam.max}</div>}</td>
                <td className="px-2 py-1.5 tabular-nums text-gray-700">{p != null ? `${p}%` : '–'}</td><td className="px-2 py-1.5">{p != null ? <Badge tone={S.gradeTone(S.gradeFor(s, p))}>{S.gradeFor(s, p)}</Badge> : '–'}</td></tr>;
            })}</tbody>
          </table></div>
          {!locked && <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-gray-600">{entered.length} of {roster.length} entered{dirty ? ' · unsaved changes' : ''}. Use 0 for an absent student.</span><div className="flex gap-2"><Button variant="outline" icon={Save} onClick={() => save(false)}>Save draft</Button><Button icon={Send} onClick={() => save(true)}>Submit marks</Button></div></div>}
        </Card>
      )}
      {stats && (
        <Section title="Subject performance (this class)" subtitle="Updates as you type">
          <div className="grid gap-4 sm:grid-cols-4 mb-4"><Stat label="Average" value={`${stats.avg}%`} tone="blue" /><Stat label="Highest" value={stats.hi} tone="green" /><Stat label="Lowest" value={stats.lo} tone="red" /><Stat label="Pass rate" value={`${stats.pass}%`} sub="33% pass mark" tone="purple" /></div>
          <BarChart data={s.school.grading.map((g) => ({ label: g.grade, value: stats.dist[g.grade] || 0 }))} height={150} />
        </Section>
      )}
    </div>
  );
}
