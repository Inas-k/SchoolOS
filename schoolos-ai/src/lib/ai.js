// DEMO-MODE AI. No model or network is involved: every response is deterministic and comes from
// the school's curated knowledge base (src/data/curriculum.js) plus templates. The UI labels it as demo.
import { CHAPTERS, getBank, findBankByText, bankKeys } from '../data/curriculum';
import { subjectName, studentAttendance, studentSubjectSummary, idx, chapterMastery } from './selectors';

export const AI_MODE = { demo: true, label: 'Demo AI (no model connected)', note: 'Responses come from the school’s approved question bank and templates. Connect an AI provider on the server to enable open-ended answers.' };

const shuffle = (arr, seed) => {
  const a = [...arr];
  let h = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const hash = (str) => [...str].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const diffWord = { easy: 'foundation', medium: 'standard', hard: 'challenge' };

function questionPool(s, subjectId, chapter, count, difficulty) {
  const bank = getBank(subjectId, chapter);
  const seed = hash(`${subjectId}${chapter}${difficulty}`);
  const mcqs = bank ? (difficulty === 'hard' ? [...bank.mcqs].reverse() : bank.mcqs) : [];
  const out = mcqs.map((m) => ({ ...m, from: 'bank' }));
  const short = bank ? bank.short.map((q) => ({ q, from: 'bank' })) : [];
  const sName = subjectName(s, subjectId);
  const templated = [
    { q: `Explain the main idea of "${chapter}" in your own words and give one real-life example.` },
    { q: `List three important terms from "${chapter}" and define each in one sentence.` },
    { q: `Write a short note on why "${chapter}" is important in ${sName}.` },
    { q: `Create one problem on "${chapter}" and solve it step by step.` },
    { q: `Identify a common mistake students make in "${chapter}" and explain how to avoid it.` },
  ].map((x) => ({ ...x, from: 'template' }));
  return { mcqs: out.length ? out : [], short: [...short, ...shuffle(templated, seed)], bank: !!bank };
}

/** Teacher Copilot: returns { title, blocks, meta } where blocks are rendered and saved by the UI. */
export function generateCopilot(s, p) {
  const { kind, subjectId, chapter, classNo, difficulty = 'medium', count = 5, student, topic } = p;
  const sName = subjectName(s, subjectId);
  const pool = questionPool(s, subjectId, chapter, count, difficulty);
  const meta = { kind, subject: sName, chapter, classNo, difficulty, demo: true, grounded: pool.bank ? 'school question bank' : 'generic templates (no approved content for this chapter yet)' };
  const header = `Class ${classNo} · ${sName} · ${chapter}`;
  const blocks = [];
  const mcqBlocks = (n) => {
    const base = pool.mcqs.slice(0, n);
    const out = base.map((m) => ({ type: 'mcq', q: m.q, options: m.o, answer: m.a, explain: m.e }));
    for (let i = out.length; i < n; i++) out.push({ type: 'short', q: pool.short[i % pool.short.length].q, note: 'Template question. Teacher to review before use.' });
    return out;
  };
  const shortBlocks = (n) => Array.from({ length: n }, (_, i) => ({ type: 'short', q: pool.short[i % pool.short.length].q, note: pool.short[i % pool.short.length].from === 'template' ? 'Template question. Teacher to review before use.' : '' }));

  switch (kind) {
    case 'worksheet': {
      const nm = Math.max(1, Math.ceil(count / 2));
      blocks.push({ type: 'text', heading: 'Instructions', body: `Name: ____________   Class: ${classNo}   Date: ________\nAttempt all questions. Show your working. Level: ${diffWord[difficulty]}.` });
      blocks.push({ type: 'heading', text: 'Section A: Objective questions' }, ...mcqBlocks(nm));
      blocks.push({ type: 'heading', text: 'Section B: Short answers' }, ...shortBlocks(Math.max(1, count - nm)));
      return { title: `Worksheet: ${chapter}`, header, meta, blocks };
    }
    case 'quiz':
      blocks.push({ type: 'text', heading: 'Quick quiz', body: `${count} questions · ${diffWord[difficulty]} level · 1 mark each` }, ...mcqBlocks(count));
      return { title: `Quiz: ${chapter}`, header, meta, blocks };
    case 'mcq':
      blocks.push(...mcqBlocks(count));
      return { title: `MCQs: ${chapter}`, header, meta, blocks };
    case 'short':
      blocks.push(...shortBlocks(count));
      return { title: `Short-answer questions: ${chapter}`, header, meta, blocks };
    case 'lessonplan': {
      const bank = getBank(subjectId, chapter);
      blocks.push(
        { type: 'text', heading: 'Learning objectives', body: `By the end of the lesson students will be able to:\n• Explain the key ideas of ${chapter}\n• Apply them to ${diffWord[difficulty]}-level problems\n• Identify and correct common errors` },
        { type: 'text', heading: 'Prior knowledge check (5 min)', body: `Ask 3 oral questions that connect to earlier chapters in ${sName}.` },
        { type: 'text', heading: 'Concept introduction (15 min)', body: bank ? bank.concept : `Introduce ${chapter} with a real-life hook, then state the core definitions on the board.` },
        { type: 'text', heading: 'Guided practice (15 min)', body: bank ? `Work through together:\n1. ${bank.mcqs[0].q}\n2. ${bank.mcqs[1].q}` : 'Solve two worked examples on the board, asking students to predict each next step.' },
        { type: 'text', heading: 'Independent practice (10 min)', body: `Students attempt ${count} questions from the generated worksheet. Teacher circulates and notes misconceptions.` },
        { type: 'text', heading: 'Exit ticket (5 min)', body: bank ? bank.short[0] : `One-minute reflection: “What is the most important idea in ${chapter}?”` },
        { type: 'text', heading: 'Differentiation', body: 'Support: sentence starters and a worked example. Extension: an open-ended real-world application.' },
        { type: 'text', heading: 'Homework', body: `Assign the ${chapter} worksheet through the Assignments page.` },
      );
      return { title: `Lesson plan: ${chapter}`, header, meta: { ...meta, duration: '50 minutes' }, blocks };
    }
    case 'revision':
      blocks.push({ type: 'text', heading: 'Revision summary', body: getBank(subjectId, chapter)?.concept || `Revise the key definitions, formulae and worked examples from ${chapter}.` }, { type: 'heading', text: 'Rapid-fire practice' }, ...mcqBlocks(count));
      return { title: `Revision exercise: ${chapter}`, header, meta, blocks };
    case 'remedial': {
      const bank = getBank(subjectId, chapter);
      blocks.push(
        { type: 'text', heading: 'Why this activity', body: `For students who scored below 60% in ${chapter}. The goal is to rebuild the concept in small steps, not to repeat the test.` },
        { type: 'text', heading: 'Step 1: Re-teach in simple words', body: bank ? bank.simple : `Explain ${chapter} using a concrete everyday example and one diagram.` },
        { type: 'text', heading: 'Step 2: Guided examples', body: bank ? bank.mcqs.slice(0, 2).map((m, i) => `Example ${i + 1}: ${m.q}\n→ ${m.e}`).join('\n\n') : 'Work two examples together, writing every step.' },
        { type: 'heading', text: 'Step 3: Small-step practice' }, ...mcqBlocks(Math.min(count, 4)),
        { type: 'text', heading: 'Step 4: Check', body: 'Ask the student to explain the idea back in their own words. Record progress in the Growth Passport.' },
      );
      return { title: `Remedial activity: ${chapter}`, header, meta, blocks };
    }
    case 'parentMessage': {
      const st = student ? idx(s).students[student] : null;
      const first = st?.name.split(' ')[0] || 'your child';
      const att = st ? studentAttendance(s, st.id) : null;
      const subj = st ? studentSubjectSummary(s, st.id) : [];
      const best = [...subj].sort((a, b) => b.avg - a.avg)[0];
      const weak = [...subj].sort((a, b) => a.avg - b.avg)[0];
      const bodies = {
        appreciation: `Dear Parent,\n\nI am pleased to share that ${first} has been doing well in ${sName}. ${best ? `${first} is performing strongly in ${subjectName(s, best.subjectId)} (average ${best.avg}%). ` : ''}${first} participates actively in class. Please encourage this consistency at home.\n\nWarm regards,`,
        concern: `Dear Parent,\n\nI would like to discuss ${first}'s progress in ${sName}. ${weak ? `Recent results in ${subjectName(s, weak.subjectId)} (average ${weak.avg}%) show scope for improvement. ` : ''}I have suggested a short daily practice routine, and the chapter "${chapter}" would be a good starting point. I would be glad to meet if that helps.\n\nWarm regards,`,
        attendance: `Dear Parent,\n\nI have noticed that ${first}'s attendance is ${att ? att.pct + '%' : 'lower than expected'}. Regular attendance is important for steady progress. Please let me know if there is anything we can do to help, and share the reason for recent absences.\n\nWarm regards,`,
        homework: `Dear Parent,\n\n${first} has pending work in ${sName}${chapter ? ` (${chapter})` : ''}. Kindly help ${first} complete it by the deadline shown on the Assignments page.\n\nWarm regards,`,
      };
      blocks.push({ type: 'text', heading: 'Draft message', body: bodies[topic] || bodies.appreciation });
      return { title: 'Parent communication draft', header: st ? `For the parent of ${st.name}` : 'Parent message', meta: { ...meta, grounded: st ? 'this student’s attendance and marks' : 'template' }, blocks };
    }
    default:
      return { title: 'Nothing generated', header, meta, blocks: [{ type: 'text', heading: 'Unknown option', body: 'Choose what to generate.' }] };
  }
}

export function copilotToText(r) {
  const lines = [r.title, r.header, ''];
  let n = 0;
  for (const b of r.blocks) {
    if (b.type === 'heading') lines.push('', b.text.toUpperCase());
    else if (b.type === 'text') lines.push('', b.heading + ':', b.body);
    else if (b.type === 'mcq') {
      n++;
      lines.push('', `${n}. ${b.q}`, ...b.options.map((o, i) => `   (${'abcd'[i]}) ${o}`), `   Answer: ${'abcd'[b.answer]}. ${b.explain}`);
    } else if (b.type === 'short') {
      n++;
      lines.push('', `${n}. ${b.q}${b.note ? `  [${b.note}]` : ''}`);
    }
  }
  lines.push('', `Generated in ${AI_MODE.label}. Review before use.`);
  return lines.join('\n');
}

// ───── student AI tutor ─────
export function tutorReply(s, studentId, { text, subjectId, chapter }) {
  const t = (text || '').toLowerCase();
  const intent = /simpl|easy|layman|like i'?m|eli5|dumb/.test(t) ? 'simplify' : /practi[sc]e|quiz|question|test me|mcq/.test(t) ? 'practice' : /resource|notes|video|material|read|worksheet|paper/.test(t) ? 'resources' : /weak|improve|where should|what should i study|plan/.test(t) ? 'advise' : 'explain';
  let target = subjectId && chapter ? { subjectId, chapter } : null;
  if (!target || !getBank(target.subjectId, target.chapter)) target = findBankByText(`${text} ${chapter || ''}`, subjectId || undefined) || (subjectId && chapter ? { subjectId, chapter } : null);

  if (intent === 'advise' && studentId) {
    const weak = chapterMastery(s, studentId).sort((a, b) => a.percent - b.percent).slice(0, 3);
    if (!weak.length) return { text: 'I do not have enough assessed work yet to find weak topics. Take a practice quiz or finish an assignment and ask again.', resources: [] };
    return { text: `Based on your reviewed assignments and practice quizzes, these topics need attention:\n${weak.map((w) => `• ${subjectName(s, w.subjectId)}: ${w.chapter} (mastery ${w.percent}%)`).join('\n')}\n\nStart with the first one: ask me to explain it, then take a practice quiz.`, resources: [], suggest: weak[0] };
  }
  const bank = target && getBank(target.subjectId, target.chapter);
  if (!bank) {
    const chapters = bankKeys().slice(0, 8).map((k) => `${subjectName(s, k.subjectId)}: ${k.chapter}`);
    return { text: `I could not find approved school material for that topic, and in demo mode I don't improvise answers.\n\nTry selecting a subject and chapter above, or ask about one of these:\n${chapters.map((c) => '• ' + c).join('\n')}`, resources: [] };
  }
  const resourceIds = s.resources.filter((r) => r.subjectId === target.subjectId && r.chapter === target.chapter).map((r) => r.id);
  const head = `${subjectName(s, target.subjectId)} · ${target.chapter}`;
  if (intent === 'simplify') return { text: `${head}\n\nIn simple words: ${bank.simple}\n\nWant to test yourself? Say “give me practice questions”.`, resources: resourceIds, topic: target };
  if (intent === 'practice') {
    const n = /(\d+)/.exec(t)?.[1];
    return { text: `Here ${bank.mcqs.length === 1 ? 'is a question' : 'are practice questions'} on ${target.chapter}. Pick an answer, then I will check it.`, practice: bank.mcqs.slice(0, Math.min(Number(n) || 3, bank.mcqs.length)), resources: resourceIds, topic: target };
  }
  if (intent === 'resources') return { text: `Here are the approved resources for ${head}. Open them from the Learning Hub or use the links below.`, resources: resourceIds, topic: target };
  return { text: `${head}\n\n${bank.concept}\n\nIf this feels heavy, ask me to “explain it simply”, or say “give me practice questions”.`, resources: resourceIds, topic: target };
}

export const chaptersOf = (subjectId) => CHAPTERS[subjectId] || [];
