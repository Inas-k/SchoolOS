import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bot, Check, FlaskConical, MessageSquarePlus, Plus, RotateCcw, Send, Trash2, X } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { AI_MODE, tutorReply } from '../../lib/ai';
import { CHAPTERS, PREP_TRACKS, bankKeys, getBank, prepSyllabus } from '../../data/curriculum';
import { cx, fmtDate, fmtShort, pct, today, uid, addDays, isWeekend } from '../../lib/util';
import { Badge, BarChart, Button, Card, DemoNote, EmptyState, HBars, Input, Modal, PageHeader, ProgressBar, Section, Select, Stat, Tabs, Textarea, toneForPct, useConfirm, useRun } from '../../ui/kit';
import { useActiveStudent, useMe } from '../../app/shell';

const { idx } = S;
const SUGGEST = ['Explain this chapter', 'Explain it simply', 'Give me practice questions', 'Show learning resources', 'What should I improve?'];

// ───────── AI Tutor ─────────
function PracticeItems({ items, picks, onPick }) {
  return (
    <div className="mt-3 space-y-4">{items.map((q, qi) => {
      const p = picks?.[qi];
      return (
        <div key={qi} className="rounded-xl bg-white border border-gray-200 p-3.5">
          <p className="font-semibold text-gray-900 text-[14.5px]">{qi + 1}. {q.q}</p>
          <div className="mt-2 grid gap-1.5">{q.o.map((o, oi) => {
            const done = p != null;
            const right = oi === q.a;
            return <button key={oi} disabled={done} onClick={() => onPick(qi, oi)} className={cx('text-start px-3 py-2 rounded-lg border text-sm transition-colors', !done && 'border-gray-300 hover:border-primary hover:bg-primary-50', done && right && 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold', done && !right && p === oi && 'border-red-400 bg-red-50 text-red-900', done && !right && p !== oi && 'border-gray-200 text-gray-500')}>({'abcd'[oi]}) {o}</button>;
          })}</div>
          {p != null && <p className="mt-2 text-[13px] text-gray-700"><b>{p === q.a ? 'Correct.' : 'Not quite.'}</b> {q.e}</p>}
        </div>
      );
    })}</div>
  );
}

export function Tutor() {
  const s = useAppState();
  const { user } = useMe();
  const { student: st } = useActiveStudent();
  const run = useRun();
  const subjects = S.subjectIdsOfClass(s, st.classId);
  const [subjectId, setSubjectId] = useState('');
  const [chapter, setChapter] = useState('');
  const convos = s.aiConversations[user.id] || [];
  const [cur, setCur] = useState(() => ({ id: uid('C'), title: 'New conversation', messages: [] }));
  const [text, setText] = useState('');
  const bottom = useRef(null);
  const [ask, node] = useConfirm();
  useEffect(() => {
    // Braces matter: scrollIntoView() may return a Promise, and an effect must not return one.
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [cur.messages.length]);
  const persist = (c) => { setCur(c); if (c.messages.length) A.saveConversation(c); };
  const send = (q) => {
    const msg = (q ?? text).trim();
    if (!msg) return;
    const r = tutorReply(s, st.id, { text: msg, subjectId, chapter });
    const next = { ...cur, title: cur.messages.length ? cur.title : msg.slice(0, 48), messages: [...cur.messages, { role: 'user', text: msg }, { role: 'ai', text: r.text, practice: r.practice, resources: r.resources, picks: {} }] };
    persist(next);
    setText('');
  };
  const pick = (mi, qi, oi) => persist({ ...cur, messages: cur.messages.map((m, i) => (i === mi ? { ...m, picks: { ...m.picks, [qi]: oi } } : m)) });
  return (
    <>
      <PageHeader title="AI Tutor" subtitle="Ask about a chapter, get a simpler explanation, or practise with instant checking." />
      <DemoNote><b>{AI_MODE.label}.</b> Answers come from your school’s approved notes and question bank. If a topic isn’t covered, the tutor says so instead of guessing.</DemoNote>
      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-3 h-fit">
          <Button className="w-full" icon={MessageSquarePlus} onClick={() => setCur({ id: uid('C'), title: 'New conversation', messages: [] })}>New chat</Button>
          <ul className="mt-3 space-y-1 max-h-[420px] overflow-y-auto">{convos.map((c) => <li key={c.id} className={cx('group flex items-center rounded-lg', cur.id === c.id && 'bg-primary-50')}><button onClick={() => setCur(c)} className="flex-1 text-start px-2.5 py-2 text-sm text-gray-800 truncate">{c.title}</button><button aria-label={`Delete chat ${c.title}`} className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete this conversation?', message: 'The chat history will be removed.', onConfirm: () => { A.deleteConversation(c.id); if (cur.id === c.id) setCur({ id: uid('C'), title: 'New conversation', messages: [] }); } })}><Trash2 className="w-3.5 h-3.5" /></button></li>)}{!convos.length && <li className="px-2 py-3 text-xs text-gray-500">Your past chats appear here.</li>}</ul>
        </Card>
        <Card className="flex flex-col min-h-[520px]">
          <div className="grid sm:grid-cols-2 gap-3 p-4 border-b border-gray-100"><Select label="Subject (optional)" placeholder="Any subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapter(''); }} options={subjects.map((id) => ({ value: id, label: S.subjectName(s, id) }))} /><Select label="Chapter (optional)" placeholder="Any chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} options={(CHAPTERS[subjectId] || []).map((c) => ({ value: c, label: c + (getBank(subjectId, c) ? '' : '  (no approved content yet)') }))} /></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]" aria-live="polite">
            {!cur.messages.length && <div className="text-center py-8"><span className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary grid place-items-center"><Bot className="w-6 h-6" /></span><p className="mt-3 font-bold text-gray-900">What would you like to learn?</p><p className="text-sm text-gray-600">Pick a subject and chapter above, then try one of these.</p><div className="mt-4 flex flex-wrap gap-2 justify-center">{SUGGEST.map((q) => <button key={q} onClick={() => send(q)} className="px-3 py-1.5 rounded-full border border-gray-300 text-[13px] font-semibold text-gray-700 hover:border-primary hover:text-primary">{q}</button>)}</div></div>}
            {cur.messages.map((m, i) => m.role === 'user' ? <div key={i} className="ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-primary text-white px-4 py-2.5 text-[14.5px]">{m.text}</div> : (
              <div key={i} className="max-w-[92%] rounded-2xl rounded-es-md bg-gray-100 px-4 py-3 text-[14.5px] text-gray-900"><p className="whitespace-pre-line leading-relaxed">{m.text}</p>{m.practice && <PracticeItems items={m.practice} picks={m.picks} onPick={(qi, oi) => pick(i, qi, oi)} />}{m.resources?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{m.resources.map((rid) => { const r = s.resources.find((x) => x.id === rid); return r ? <Link key={rid} to="../resources" relative="path" className="text-[13px] font-semibold text-primary bg-white border border-gray-200 rounded-lg px-2.5 py-1">{r.title}</Link> : null; })}</div>}<div className="mt-2 text-[10.5px] text-gray-500">Demo AI · from approved school content</div></div>
            ))}
            <div ref={bottom} />
          </div>
          <form className="p-3 border-t border-gray-100 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}><input aria-label="Ask the AI Tutor" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question… e.g. explain the discriminant" className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-xl" /><Button type="submit" icon={Send}>Send</Button></form>
        </Card>
      </div>
      {node}
    </>
  );
}

// ───────── Study planner ─────────
export function Planner() {
  const s = useAppState();
  const { student: st } = useActiveStudent();
  const run = useRun();
  const [ask, node] = useConfirm();
  const goals = [...(s.goals[st.id] || [])].sort((a, b) => Number(a.done) - Number(b.done) || a.deadline.localeCompare(b.deadline));
  const [form, setForm] = useState(null);
  const subjects = S.subjectIdsOfClass(s, st.classId);
  const wkEnd = addDays(today(), 7);
  const week = goals.filter((g) => g.deadline <= wkEnd);
  const weekDone = week.filter((g) => g.done).length;
  const revised = goals.reduce((n, g) => n + (g.revised || 0), 0);
  return (
    <>
      <PageHeader title="Study Planner" subtitle="Set goals, track topics and log revision." actions={<Button icon={Plus} onClick={() => setForm({ title: '', subjectId: '', chapter: '', deadline: addDays(today(), 7), kind: 'goal' })}>Add goal or topic</Button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-5"><Stat label="Completed this week" value={`${weekDone}/${week.length}`} sub="items due in the next 7 days" tone="green" /><Stat label="Open items" value={goals.filter((g) => !g.done).length} tone="amber" /><Stat label="Revision sessions logged" value={revised} tone="blue" /></div>
      <Card className="p-4 mb-5"><div className="flex justify-between text-sm font-semibold text-gray-800 mb-2"><span>Weekly progress</span><span>{week.length ? pct(weekDone, week.length) : 0}%</span></div><ProgressBar value={week.length ? pct(weekDone, week.length) : 0} tone="green" label="Weekly progress" /></Card>
      {!goals.length && <Card><EmptyState title="No goals yet" text="Add your first goal, like finishing a chapter before the next test." /></Card>}
      <ul className="space-y-2.5">{goals.map((g) => { const overdue = !g.done && g.deadline < today(); return (
        <li key={g.id} className="card-soft p-4 flex flex-wrap items-center gap-3">
          <button role="checkbox" aria-checked={g.done} aria-label={`Complete "${g.title}"`} onClick={() => run(() => A.updateGoal(g.id, { done: !g.done }), g.done ? 'Reopened.' : 'Completed. Well done!')} className={cx('w-6 h-6 rounded-md border grid place-items-center shrink-0', g.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-500')}>{g.done && <Check className="w-4 h-4" />}</button>
          <div className="flex-1 min-w-[200px]"><div className={cx('font-semibold text-gray-900', g.done && 'line-through text-gray-500')}>{g.title}</div><div className="text-xs text-gray-500">{g.subjectId ? `${S.subjectName(s, g.subjectId)}${g.chapter ? ' · ' + g.chapter : ''} · ` : ''}{g.kind === 'goal' ? 'Goal' : 'Topic'} · due {fmtDate(g.deadline)}</div></div>
          {overdue && <Badge tone="red">Overdue</Badge>}<Badge tone="gray">Revised {g.revised || 0}×</Badge>
          <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => run(() => A.updateGoal(g.id, { revised: (g.revised || 0) + 1 }), 'Revision logged.')}>Log revision</Button>
          <button aria-label={`Delete ${g.title}`} className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete this item?', message: `“${g.title}” will be removed from your planner.`, onConfirm: () => run(() => A.deleteGoal(g.id), 'Removed.') })}><Trash2 className="w-4 h-4" /></button>
        </li>); })}</ul>
      <Modal open={!!form} onClose={() => setForm(null)} title="Add to planner" footer={<><Button variant="outline" onClick={() => setForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.addGoal(form); setForm(null); }, 'Added to your planner.')}>Add</Button></>}>
        {form && <div className="space-y-3"><Input label="What do you want to achieve?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish Trigonometry revision" /><Select label="Type" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} options={[{ value: 'goal', label: 'Goal' }, { value: 'topic', label: 'Topic to study' }]} /><div className="grid grid-cols-2 gap-3"><Select label="Subject" placeholder="None" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value, chapter: '' })} options={subjects.map((id) => ({ value: id, label: S.subjectName(s, id) }))} /><Select label="Chapter" placeholder="None" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} options={(CHAPTERS[form.subjectId] || []).map((c) => ({ value: c, label: c }))} /></div><Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>}
      </Modal>
      {node}
    </>
  );
}

// ───────── Practice quizzes ─────────
export function Practice() {
  const s = useAppState();
  const { student: st } = useActiveStudent();
  const run = useRun();
  const [sp] = useSearchParams();
  const avail = bankKeys().filter((k) => S.subjectIdsOfClass(s, st.classId).includes(k.subjectId));
  const first = avail.find((k) => k.subjectId === sp.get('subject') && k.chapter === sp.get('chapter')) || avail[0];
  const [sel, setSel] = useState(first ? `${first.subjectId}|${first.chapter}` : '');
  const [started, setStarted] = useState(false);
  const [picks, setPicks] = useState({});
  const [done, setDone] = useState(false);
  const [subjectId, chapter] = sel.split('|');
  const bank = getBank(subjectId, chapter);
  const attempts = s.quizAttempts.filter((q) => q.studentId === st.id).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const score = bank ? bank.mcqs.filter((q, i) => picks[i] === q.a).length : 0;
  const reset = () => { setStarted(false); setPicks({}); setDone(false); };
  const finish = () => { if (Object.keys(picks).length < bank.mcqs.length) return run(() => { throw new Error('Answer every question before submitting.'); }); run(() => A.recordQuiz({ subjectId, chapter, score, total: bank.mcqs.length }), `You scored ${score}/${bank.mcqs.length}. Your chapter mastery has been updated.`); setDone(true); };
  return (
    <>
      <PageHeader title="Practice & Quizzes" subtitle="Short quizzes from the school’s approved question bank. Results feed your chapter mastery." />
      {!avail.length ? <Card><EmptyState title="No quizzes for your class yet" /></Card> : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card className="p-4 h-fit space-y-3"><Select label="Topic" value={sel} onChange={(e) => { setSel(e.target.value); reset(); }} options={avail.map((k) => ({ value: `${k.subjectId}|${k.chapter}`, label: `${S.subjectName(s, k.subjectId)}: ${k.chapter}` }))} /><p className="text-sm text-gray-600">{bank?.mcqs.length} multiple-choice questions · instant feedback</p>{!started && <Button className="w-full" icon={FlaskConical} onClick={() => setStarted(true)}>Start quiz</Button>}</Card>
          <div>
            {started && bank && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-gray-900">{chapter}</h2>{done && <Badge tone={toneForPct(pct(score, bank.mcqs.length))}>Score {score}/{bank.mcqs.length}</Badge>}</div>
                <div className="space-y-4">{bank.mcqs.map((q, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 p-3.5"><p className="font-semibold text-gray-900 text-[14.5px]">{i + 1}. {q.q}</p><div className="mt-2 grid gap-1.5">{q.o.map((o, oi) => <button key={oi} disabled={done} onClick={() => setPicks({ ...picks, [i]: oi })} className={cx('text-start px-3 py-2 rounded-lg border text-sm', picks[i] === oi && !done && 'border-primary bg-primary-50 font-semibold', !done && picks[i] !== oi && 'border-gray-300 hover:border-gray-400', done && oi === q.a && 'border-emerald-500 bg-emerald-50 font-semibold', done && picks[i] === oi && oi !== q.a && 'border-red-400 bg-red-50')}>({'abcd'[oi]}) {o}</button>)}</div>{done && <p className="mt-2 text-[13px] text-gray-700"><b>{picks[i] === q.a ? 'Correct.' : `Answer: (${'abcd'[q.a]}).`}</b> {q.e}</p>}</div>
                ))}</div>
                <div className="mt-5 flex gap-2">{!done ? <Button icon={Check} onClick={finish}>Submit answers</Button> : <><Button variant="outline" icon={RotateCcw} onClick={() => { setPicks({}); setDone(false); }}>Try again</Button><Link className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-primary" to="../tutor" relative="path">Ask the AI Tutor about this →</Link></>}</div>
              </Card>
            )}
            <Section className="mt-5" title="My quiz history">{attempts.length ? <ul className="divide-y divide-gray-100">{attempts.slice(0, 8).map((a) => <li key={a.id} className="py-2.5 flex items-center justify-between text-sm"><span><b className="text-gray-900">{a.chapter}</b> <span className="text-gray-500">· {S.subjectName(s, a.subjectId)} · {fmtShort(a.date)}</span></span><Badge tone={toneForPct(pct(a.score, a.total))}>{a.score}/{a.total}</Badge></li>)}</ul> : <p className="text-sm text-gray-600">No attempts yet.</p>}</Section>
          </div>
        </div>
      )}
    </>
  );
}

// ───────── Board / JEE / NEET preparation ─────────
export function Prep() {
  const s = useAppState();
  const { student: st } = useActiveStudent();
  const run = useRun();
  const [ask, node] = useConfirm();
  const p = s.prep[st.id] || { track: null, done: {}, tests: [], errors: [], daily: {} };
  const enabled = Object.entries(PREP_TRACKS).filter(([k]) => s.school.tracks[k]);
  const track = enabled.some(([k]) => k === p.track) ? p.track : null;
  const [tab, setTab] = useState('syllabus');
  const [testForm, setTestForm] = useState(null);
  const [errForm, setErrForm] = useState(null);
  const [goal, setGoal] = useState('');
  const classNo = idx(s).classes[st.classId].no;
  const syl = track ? prepSyllabus(track, classNo) : [];
  const keys = syl.flatMap((g) => g.topics.map((t) => `${g.subjectId}|${t}`));
  const doneN = keys.filter((k) => p.done[k]).length;
  const topicAgg = {};
  p.tests.forEach((t) => Object.entries(t.topics || {}).forEach(([k, v]) => (topicAgg[k] ||= []).push(v)));
  S.chapterMastery(s, st.id).forEach((m) => (topicAgg[`${m.subjectId}|${m.chapter}`] ||= []).push(m.percent));
  const weak = Object.entries(topicAgg).map(([k, v]) => ({ k, v: Math.round(v.reduce((a, b) => a + b, 0) / v.length) })).filter((x) => x.v < 65 && keys.includes(x.k)).sort((a, b) => a.v - b.v);
  const todo = [...weak.map((w) => w.k), ...keys.filter((k) => !p.done[k] && !weak.some((w) => w.k === k))];
  const calendar = Array.from({ length: 14 }, (_, i) => addDays(today(), i)).filter((d) => !isWeekend(d)).slice(0, 10).map((d, i) => ({ d, topics: [todo[i * 2], todo[i * 2 + 1]].filter(Boolean), revise: i % 4 === 3 ? 'Revision day: error notebook and quick quiz' : '' }));
  const daily = p.daily[today()] || [];
  const nm = (k) => { const [sid, t] = k.split('|'); return `${S.subjectName(s, sid)}: ${t}`; };
  if (!enabled.length) return <><PageHeader title="Board / JEE / NEET Preparation" /><Card><EmptyState title="No preparation tracks enabled" text="Your school has not enabled this module yet." /></Card></>;
  return (
    <>
      <PageHeader title="Board / JEE / NEET Preparation" subtitle="Track your syllabus, tests, weak topics and revision." />
      <Card className="p-4 mb-5"><div className="flex flex-wrap items-center gap-3"><b className="text-gray-900">My track</b>{enabled.map(([k, t]) => <button key={k} onClick={() => run(() => A.setPrepTrack(k), `${t.label} selected.`)} aria-pressed={track === k} className={cx('px-3.5 py-2 rounded-xl text-sm font-semibold border', track === k ? 'bg-ink text-white border-ink' : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400')}>{t.label}</button>)}</div>{track && <p className="mt-2 text-sm text-gray-600">{PREP_TRACKS[track].desc}</p>}</Card>
      {!track ? <Card><EmptyState title="Choose a track to begin" text="Pick the exam you are preparing for above." /></Card> : (
        <>
          <div className="grid gap-4 sm:grid-cols-4 mb-5"><Stat label="Syllabus completed" value={`${pct(doneN, keys.length)}%`} sub={`${doneN} of ${keys.length} topics`} tone="green" /><Stat label="Tests taken" value={p.tests.length} tone="blue" /><Stat label="Weak topics" value={weak.length} tone={weak.length ? 'amber' : 'green'} /><Stat label="Error notebook" value={p.errors.length} sub="entries" tone="purple" /></div>
          <Tabs value={tab} onChange={setTab} tabs={[['syllabus', 'Syllabus'], ['tests', 'Tests'], ['weak', 'Weak topics'], ['calendar', 'Revision calendar'], ['errors', 'Error notebook'], ['daily', 'Daily goals']].map(([value, label]) => ({ value, label }))} />
          <div className="mt-5">
            {tab === 'syllabus' && <div className="grid gap-5 lg:grid-cols-2">{syl.map((g) => { const d = g.topics.filter((t) => p.done[`${g.subjectId}|${t}`]).length; return <Section key={g.subjectId} title={S.subjectName(s, g.subjectId)} subtitle={`${d} of ${g.topics.length} topics done`}><ProgressBar value={pct(d, g.topics.length)} tone="green" className="mb-3" label={S.subjectName(s, g.subjectId)} /><ul className="space-y-1.5">{g.topics.map((t) => { const k = `${g.subjectId}|${t}`; return <li key={k}><label className="flex items-center gap-2.5 text-sm cursor-pointer"><input type="checkbox" checked={!!p.done[k]} onChange={() => run(() => A.togglePrepTopic(k))} className="w-4 h-4 accent-emerald-600" /><span className={cx(p.done[k] && 'line-through text-gray-500')}>{t}</span></label></li>; })}</ul></Section>; })}</div>}
            {tab === 'tests' && <Section title="Diagnostic and mock tests" action={<Button size="sm" icon={Plus} onClick={() => setTestForm({ name: '', type: 'mock', date: today(), score: '', max: 50 })}>Add result</Button>}>{p.tests.length ? <><BarChart height={170} unit="%" max={100} data={[...p.tests].sort((a, b) => a.date.localeCompare(b.date)).map((t) => ({ label: t.name.replace(/\(.*\)|Test|Mock|Diagnostic/g, '').trim().slice(0, 8) || 'Test', value: Math.round(pct(t.score, t.max)) }))} /><ul className="mt-4 divide-y divide-gray-100">{p.tests.map((t) => <li key={t.id} className="py-2.5 flex items-center justify-between text-sm"><span><b className="text-gray-900">{t.name}</b> <span className="text-gray-500">· {t.type} · {fmtShort(t.date)}</span></span><Badge tone={toneForPct(pct(t.score, t.max))}>{t.score}/{t.max}</Badge></li>)}</ul></> : <p className="text-sm text-gray-600">No tests recorded yet.</p>}</Section>}
            {tab === 'weak' && <Section title="Weak-topic analysis" subtitle="From mock tests, practice quizzes and evaluated assignments. Topics below 65%.">{weak.length ? <HBars rows={weak.map((w) => ({ label: nm(w.k), value: w.v }))} /> : <p className="text-sm text-gray-600">No weak topics found yet. Take more tests and quizzes for a clearer picture.</p>}</Section>}
            {tab === 'calendar' && <Section title="Revision calendar" subtitle="Next 10 school days. Weak topics come first, then topics not yet completed.">{calendar.some((c) => c.topics.length) ? <ul className="divide-y divide-gray-100">{calendar.map((c) => <li key={c.d} className="py-3 flex gap-4"><div className="w-24 shrink-0 font-bold text-gray-900 text-sm">{fmtDate(c.d, { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="flex-1 text-sm text-gray-800">{c.topics.map((t) => <div key={t}>• {nm(t)}</div>)}{c.revise && <div className="text-primary font-semibold mt-1">{c.revise}</div>}</div></li>)}</ul> : <p className="text-sm text-gray-600">Your syllabus is complete. Use the error notebook to revise.</p>}</Section>}
            {tab === 'errors' && <Section title="Error notebook" subtitle="Write down mistakes and the correct approach, then revisit them." action={<Button size="sm" icon={Plus} onClick={() => setErrForm({ subjectId: syl[0]?.subjectId, topic: '', question: '', mistake: '', fix: '' })}>Add entry</Button>}>{p.errors.length ? <ul className="space-y-3">{p.errors.map((e) => <li key={e.id} className="rounded-xl border border-gray-200 p-3.5 text-sm"><div className="flex justify-between gap-2"><div><Badge tone="purple">{S.subjectName(s, e.subjectId)}</Badge> <span className="text-gray-500 text-xs ms-1">{e.topic} · {fmtShort(e.date)}</span></div><button aria-label="Delete entry" className="text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete entry?', message: 'This error notebook entry will be removed.', onConfirm: () => run(() => A.deletePrepError(e.id), 'Entry deleted.') })}><Trash2 className="w-4 h-4" /></button></div><p className="mt-2 font-semibold text-gray-900">{e.question}</p>{e.mistake && <p className="mt-1 text-red-800"><b>What went wrong:</b> {e.mistake}</p>}<p className="mt-1 text-emerald-800"><b>Correct approach:</b> {e.fix}</p></li>)}</ul> : <p className="text-sm text-gray-600">No entries yet.</p>}</Section>}
            {tab === 'daily' && <Section title={`Goals for ${fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'short' })}`}><form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); run(() => A.addDailyGoal(goal), 'Goal added.') && setGoal(''); }}><input aria-label="New daily goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Solve 15 problems on Electrostatics" className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" /><Button type="submit" icon={Plus}>Add</Button></form>{daily.length ? <ul className="space-y-2">{daily.map((g) => <li key={g.id}><label className="flex items-center gap-2.5 text-sm cursor-pointer"><input type="checkbox" checked={g.done} onChange={() => run(() => A.toggleDailyGoal(today(), g.id))} className="w-4 h-4 accent-emerald-600" /><span className={cx(g.done && 'line-through text-gray-500')}>{g.text}</span></label></li>)}</ul> : <p className="text-sm text-gray-600">No goals for today yet.</p>}<p className="mt-3 text-xs text-gray-500">{daily.filter((g) => g.done).length} of {daily.length} done</p></Section>}
          </div>
        </>
      )}
      <Modal open={!!testForm} onClose={() => setTestForm(null)} title="Add test result" footer={<><Button variant="outline" onClick={() => setTestForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.addPrepTest(testForm); setTestForm(null); }, 'Test result saved.')}>Save</Button></>}>{testForm && <div className="space-y-3"><Input label="Test name" value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} /><div className="grid grid-cols-2 gap-3"><Select label="Type" value={testForm.type} onChange={(e) => setTestForm({ ...testForm, type: e.target.value })} options={[{ value: 'diagnostic', label: 'Diagnostic' }, { value: 'mock', label: 'Mock test' }]} /><Input label="Date" type="date" max={today()} value={testForm.date} onChange={(e) => setTestForm({ ...testForm, date: e.target.value })} /><Input label="Your score" type="number" min="0" value={testForm.score} onChange={(e) => setTestForm({ ...testForm, score: e.target.value })} /><Input label="Out of" type="number" min="1" value={testForm.max} onChange={(e) => setTestForm({ ...testForm, max: e.target.value })} /></div></div>}</Modal>
      <Modal open={!!errForm} onClose={() => setErrForm(null)} title="Add to error notebook" footer={<><Button variant="outline" onClick={() => setErrForm(null)}>Cancel</Button><Button onClick={() => run(() => { A.addPrepError(errForm); setErrForm(null); }, 'Added to your notebook.')}>Save</Button></>}>{errForm && <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Select label="Subject" value={errForm.subjectId} onChange={(e) => setErrForm({ ...errForm, subjectId: e.target.value })} options={syl.map((g) => ({ value: g.subjectId, label: S.subjectName(s, g.subjectId) }))} /><Input label="Topic" value={errForm.topic} onChange={(e) => setErrForm({ ...errForm, topic: e.target.value })} /></div><Textarea label="Question" rows={2} value={errForm.question} onChange={(e) => setErrForm({ ...errForm, question: e.target.value })} /><Textarea label="What went wrong?" rows={2} value={errForm.mistake} onChange={(e) => setErrForm({ ...errForm, mistake: e.target.value })} /><Textarea label="Correct approach" rows={2} value={errForm.fix} onChange={(e) => setErrForm({ ...errForm, fix: e.target.value })} /></div>}</Modal>
      {node}
    </>
  );
}
export { X, useMemo };

