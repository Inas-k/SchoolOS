import { useMemo, useState } from 'react';
import { Copy, Download, FileText, Pencil, Printer, Save, Share2, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { useAppState } from '../../lib/store';
import * as S from '../../lib/selectors';
import * as A from '../../lib/actions';
import { AI_MODE, copilotToText, generateCopilot } from '../../lib/ai';
import { CHAPTERS, getBank } from '../../data/curriculum';
import { downloadFile, fmtDateTime } from '../../lib/util';
import { Badge, Button, Card, DemoNote, EmptyState, Input, PageHeader, Section, Select, Textarea, useConfirm, useRun } from '../../ui/kit';
import { useMe } from '../../app/shell';
import { printNode } from '../shared';
import { useRef } from 'react';

const { idx } = S;
const KINDS = [['worksheet', 'Worksheet'], ['quiz', 'Quiz'], ['mcq', 'Multiple-choice questions'], ['short', 'Short-answer questions'], ['lessonplan', 'Lesson plan'], ['revision', 'Revision exercise'], ['remedial', 'Remedial learning activity'], ['parentMessage', 'Parent communication draft']];

function Blocks({ r }) {
  let n = 0;
  return (
    <div className="space-y-3 text-[15px] text-gray-800">
      {r.blocks.map((b, i) => {
        if (b.type === 'heading') return <h3 key={i} className="pt-2 text-sm font-extrabold uppercase tracking-wider text-gray-500">{b.text}</h3>;
        if (b.type === 'text') return <div key={i}><div className="font-bold text-gray-900">{b.heading}</div><p className="whitespace-pre-line leading-relaxed">{b.body}</p></div>;
        n++;
        if (b.type === 'mcq') return <div key={i}><p className="font-semibold text-gray-900">{n}. {b.q}</p><ul className="mt-1 grid sm:grid-cols-2 gap-x-6 text-sm">{b.options.map((o, j) => <li key={j} className={j === b.answer ? 'text-emerald-700 font-semibold' : ''}>({'abcd'[j]}) {o}{j === b.answer && ' ✓'}</li>)}</ul><p className="mt-1 text-xs text-gray-500">{b.explain}</p></div>;
        return <div key={i}><p className="font-semibold text-gray-900">{n}. {b.q}</p>{b.note && <p className="text-xs text-amber-700">{b.note}</p>}</div>;
      })}
    </div>
  );
}

export default function Copilot() {
  const s = useAppState();
  const { user } = useMe();
  const run = useRun();
  const t = idx(s).teachers[user.linkedId];
  const [ask, node] = useConfirm();
  const subjectIds = t.subjectIds;
  const classNos = [...new Set(t.assignments.map((a) => idx(s).classes[idx(s).sections[a.sectionId].classId].no))].sort((a, b) => a - b);
  // Default to a chapter that has approved content, so the first result is a real worksheet.
  const firstChapter = CHAPTERS[subjectIds[0]].find((c) => getBank(subjectIds[0], c)) || CHAPTERS[subjectIds[0]][0];
  const [f, setF] = useState({ kind: 'worksheet', subjectId: subjectIds[0], classNo: classNos.includes(10) ? 10 : classNos[0] || 10, chapter: firstChapter, difficulty: 'medium', count: 5, student: '', topic: 'appreciation' });
  const [res, setRes] = useState(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const ref = useRef(null);
  const myStudents = S.teacherStudents(s, t.id);
  const lib = s.copilotLibrary.filter((x) => x.teacherId === t.id);
  const grounded = !!getBank(f.subjectId, f.chapter);
  const gen = () => run(() => {
    if (f.kind === 'parentMessage' && !f.student) throw new Error('Choose a student for the parent message.');
    const r = generateCopilot(s, f);
    setRes(r); setText(copilotToText(r)); setEditing(false);
  }, 'Generated. Review and edit before using it.');
  const share = () => run(() => A.addResource({ title: res.title, subjectId: f.subjectId, chapter: f.chapter, type: f.kind === 'lessonplan' ? 'notes' : 'worksheet', content: text, classIds: [idx(s).classes[String(f.classNo)]?.id].filter(Boolean) }), 'Added to the Learning Hub. Students can open it now.');
  return (
    <>
      <PageHeader title="AI Teacher Copilot" subtitle="Draft worksheets, quizzes, lesson plans and messages in seconds. You review and edit everything." />
      <DemoNote><b>{AI_MODE.label}.</b> {AI_MODE.note} Chapters with approved content produce real questions with answers; others fall back to clearly marked templates.</DemoNote>
      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <Card className="p-5 h-fit space-y-3">
          <Select label="What do you need?" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} options={KINDS.map(([value, label]) => ({ value, label }))} />
          <div className="grid grid-cols-2 gap-3"><Select label="Class" value={f.classNo} onChange={(e) => setF({ ...f, classNo: Number(e.target.value) })} options={classNos.map((n) => ({ value: n, label: `Class ${n}` }))} /><Select label="Subject" value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value, chapter: CHAPTERS[e.target.value][0] })} options={subjectIds.map((id) => ({ value: id, label: S.subjectName(s, id) }))} /></div>
          <Select label="Chapter" value={f.chapter} onChange={(e) => setF({ ...f, chapter: e.target.value })} options={CHAPTERS[f.subjectId].map((c) => ({ value: c, label: c }))} hint={grounded ? 'Approved school content available for this chapter.' : 'No approved content yet. Output will use templates.'} />
          {f.kind !== 'parentMessage' && f.kind !== 'lessonplan' && <div className="grid grid-cols-2 gap-3"><Select label="Difficulty" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} /><Input label="Number of questions" type="number" min="1" max="10" value={f.count} onChange={(e) => setF({ ...f, count: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} /></div>}
          {f.kind === 'parentMessage' && <><Select label="Student" placeholder="Choose…" value={f.student} onChange={(e) => setF({ ...f, student: e.target.value })} options={myStudents.slice(0, 700).map((x) => ({ value: x.id, label: `${x.name} (${S.sectionLabel(s, x.sectionId)})` }))} /><Select label="Message type" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} options={[{ value: 'appreciation', label: 'Appreciation' }, { value: 'concern', label: 'Concern about progress' }, { value: 'attendance', label: 'Attendance' }, { value: 'homework', label: 'Pending homework' }]} /></>}
          <Button className="w-full" icon={Wand2} onClick={gen}>Generate</Button>
        </Card>
        <div>
          {res ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-extrabold text-gray-900">{res.title}</h2><p className="text-sm text-gray-600">{res.header}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone="amber">Demo AI</Badge><Badge tone="gray">Source: {res.meta.grounded}</Badge></div></div>
                <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditing(!editing)}>{editing ? 'Preview' : 'Edit text'}</Button><Button size="sm" variant="outline" icon={Copy} onClick={() => navigator.clipboard?.writeText(text).then(() => run(() => {}, 'Copied to clipboard.'), () => run(() => { throw new Error('Copy is blocked in this browser. Use Download instead.'); }))}>Copy</Button><Button size="sm" variant="outline" icon={Download} onClick={() => downloadFile(`${res.title.replace(/\W+/g, '-')}.txt`, text, 'text/plain;charset=utf-8')}>Download</Button><Button size="sm" variant="outline" icon={Printer} onClick={() => printNode(ref.current, res.title)}>Print</Button></div></div>
              <div className="mt-4 border-t border-gray-100 pt-4" ref={ref}>
                {editing ? <Textarea label="Edit the text (changes are used for saving, sharing and downloading)" rows={18} value={text} onChange={(e) => setText(e.target.value)} /> : editing === false && text === copilotToText(res) ? <><h2 className="hidden print:block text-xl font-bold">{res.title}</h2><Blocks r={res} /></> : <p className="whitespace-pre-line text-[15px] text-gray-800 leading-relaxed">{text}</p>}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2"><Button icon={Save} onClick={() => run(() => A.saveCopilotItem({ title: res.title, header: res.header, text, kind: f.kind, subjectId: f.subjectId, chapter: f.chapter }), 'Saved to your library.')}>Save to library</Button>{f.kind !== 'parentMessage' && <Button variant="outline" icon={Share2} onClick={share}>Share in Learning Hub</Button>}</div>
            </Card>
          ) : <Card><EmptyState icon={Sparkles} title="Your draft will appear here" text="Choose what you need on the left and press Generate." /></Card>}
        </div>
      </div>
      <Section className="mt-6" title="My saved drafts" subtitle="Only you can see these.">
        {lib.length ? <ul className="divide-y divide-gray-100">{lib.map((x) => <li key={x.id} className="py-3 flex flex-wrap items-center gap-3"><FileText className="w-5 h-5 text-gray-400" /><div className="flex-1 min-w-[200px]"><div className="font-semibold text-gray-900 text-sm">{x.title}</div><div className="text-xs text-gray-500">{x.header} · {fmtDateTime(x.at)}</div></div><Button size="sm" variant="outline" onClick={() => { setRes({ title: x.title, header: x.header, meta: { grounded: 'saved draft' }, blocks: [] }); setText(x.text); setEditing(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Open</Button><Button size="sm" variant="outline" icon={Download} onClick={() => downloadFile(`${x.title.replace(/\W+/g, '-')}.txt`, x.text, 'text/plain;charset=utf-8')}>Download</Button><button aria-label={`Delete ${x.title}`} className="p-1.5 text-gray-400 hover:text-red-600" onClick={() => ask({ title: 'Delete saved draft?', message: `“${x.title}” will be removed from your library.`, onConfirm: () => run(() => A.deleteCopilotItem(x.id), 'Draft deleted.') })}><Trash2 className="w-4 h-4" /></button></li>)}</ul> : <p className="text-sm text-gray-600">Nothing saved yet.</p>}
      </Section>
      {node}
    </>
  );
}
export { useMemo };
