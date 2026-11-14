// Deterministic demo dataset for ONE FICTIONAL school. All people, achievements and figures are invented.
import { addDays, clamp, rng, schoolDaysBack, todayISO, isWeekend } from '../lib/util';
import { CHAPTERS, SUBJECTS, classSubjects, getBank, bankKeys } from './curriculum';

export const STORAGE_KEY = 'schoolos.demo.v3'; // bump when the seed shape or content changes
export const DEMO_PASSWORD = 'demo123';
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
export const PERIODS = [
  { no: 1, time: '08:30 – 09:15' }, { no: 2, time: '09:15 – 10:00' }, { no: 3, time: '10:20 – 11:05' }, { no: 4, time: '11:05 – 11:50' },
  { no: 5, time: '12:30 – 13:15' }, { no: 6, time: '13:15 – 14:00' }, { no: 7, time: '14:00 – 14:45' },
];

const FM = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Reyansh', 'Krish', 'Ishaan', 'Kabir', 'Rohan', 'Dev', 'Neil', 'Yash', 'Karthik', 'Siddharth', 'Ayaan', 'Rahul', 'Nikhil', 'Pranav', 'Tarun', 'Harsh', 'Manav', 'Dhruv', 'Samar', 'Veer'];
const FF = ['Ananya', 'Diya', 'Saanvi', 'Myra', 'Aadhya', 'Isha', 'Kavya', 'Riya', 'Meera', 'Tara', 'Navya', 'Pooja', 'Sneha', 'Anika', 'Priya', 'Tanvi', 'Aisha', 'Zara', 'Nisha', 'Lakshmi', 'Divya', 'Sana', 'Ira', 'Mahi'];
const LN = ['Sharma', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Gupta', 'Menon', 'Singh', 'Das', 'Khan', 'Joshi', 'Kulkarni', 'Banerjee', 'Pillai', 'Shetty', 'Bhatt', 'Chopra', 'Desai', 'Rao', 'Mehta', 'Verma', 'Kapoor', 'Naidu', 'Thomas', 'George', 'Fernandes', 'Krishnan', 'Ahmed', 'Bose', 'Hegde'];
const TF = ['Anita', 'Sunita', 'Deepa', 'Lata', 'Rekha', 'Shalini', 'Geeta', 'Neha', 'Swati', 'Usha', 'Preeti', 'Radha', 'Jyoti', 'Asha', 'Seema'];
const TM = ['Ramesh', 'Suresh', 'Anil', 'Mahesh', 'Prakash', 'Vinod', 'Sanjay', 'Ravi', 'Ajay', 'Manoj', 'Naveen', 'Gopal', 'Satish', 'Kiran', 'Imran'];
const FEEDBACK_POS = ['Participates actively and helps classmates understand difficult ideas.', 'Consistently submits neat, well-organised work.', 'Showed excellent improvement in the last unit test.', 'Asks thoughtful questions that deepen class discussion.', 'Demonstrates strong leadership while working in groups.'];
const FEEDBACK_IMP = ['Needs to revise fundamentals before the next assessment; recommend extra practice sheets.', 'Should focus on completing assignments on time.', 'Capable of more; please encourage regular revision at home.', 'Attention in class drops towards the end of the day; seat change suggested.'];
const ACH = [
  ['Inter-school Science Quiz (sample record)', 'competition'], ['Mathematics Olympiad Participation (sample record)', 'competition'], ['Robotics Club Project: Line-follower Robot (sample record)', 'project'],
  ['Annual Day Dance Performance (sample record)', 'arts'], ['District Athletics: 100m Finalist (sample record)', 'sports'], ['Student Council Class Representative (sample record)', 'leadership'],
  ['Coding Workshop Certificate (sample record)', 'certificate'], ['Environmental Awareness Drive Volunteer (sample record)', 'leadership'], ['Inter-house Debate Winner (sample record)', 'competition'], ['School Football Team Member (sample record)', 'sports'],
];

const pad = (n, w = 4) => String(n).padStart(w, '0');
const phone = (r) => `+91 9${r.int(100000000, 999999999)}`;

export function nextSchoolDay(iso, n = 1) {
  let d = iso;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (!isWeekend(d)) left--;
  }
  return d;
}

export function buildSeed() {
  const r = rng(20260101);
  const today = todayISO();
  const nowIso = new Date().toISOString();

  // ---- structure
  const classes = [6, 7, 8, 9, 10, 11, 12].map((n) => ({ id: String(n), name: `Class ${n}`, no: n }));
  const sections = classes.flatMap((c) => ['A', 'B'].map((s) => ({ id: `${c.no}-${s}`, classId: c.id, name: s, classTeacherId: null, room: `${c.no}0${s === 'A' ? 1 : 2}` })));
  const subjects = SUBJECTS.map((s) => ({ ...s, classIds: classes.filter((c) => classSubjects(c.no).includes(s.id)).map((c) => c.id) }));
  const classNoOf = (secId) => Number(secId.split('-')[0]);
  const subjectsOfSection = (secId) => classSubjects(classNoOf(secId));

  // ---- teachers
  const COUNTS = { ENG: 5, MAT: 5, SCI: 4, SOC: 3, CSC: 3, HIN: 3, PHY: 3, CHE: 3, BIO: 3 };
  const teachers = [];
  const usedNames = new Set();
  let tn = 1;
  for (const [sid, count] of Object.entries(COUNTS)) {
    for (let i = 0; i < count; i++) {
      let name;
      do {
        const female = r.chance(0.6);
        name = `${female ? r.pick(['Ms.', 'Mrs.']) : r.pick(['Mr.', 'Dr.'])} ${r.pick(female ? TF : TM)} ${r.pick(LN)}`;
      } while (usedNames.has(name));
      usedNames.add(name);
      teachers.push({ id: `T${pad(tn++, 2)}`, name, email: '', phone: phone(r), qualification: r.pick(['M.Sc., B.Ed.', 'M.A., B.Ed.', 'M.Tech., B.Ed.', 'M.Com., B.Ed.', 'Ph.D.']), subjectIds: [sid], assignments: [], joined: `${r.int(2012, 2025)}-06-01`, active: true });
    }
  }
  for (const sub of subjects) {
    const tOf = teachers.filter((t) => t.subjectIds[0] === sub.id);
    sections.filter((s) => sub.classIds.includes(s.classId)).forEach((sec, i) => tOf[i % tOf.length].assignments.push({ sectionId: sec.id, subjectId: sub.id }));
  }
  const teacherFor = (secId, sid) => teachers.find((t) => t.assignments.some((a) => a.sectionId === secId && a.subjectId === sid));
  // Demo teacher = the Mathematics teacher of 10-B
  const demoTeacher = teacherFor('10-B', 'MAT');
  demoTeacher.name = 'Ms. Anita Verma';
  demoTeacher.qualification = 'M.Sc. Mathematics, B.Ed.';
  sections.forEach((sec, i) => {
    const mine = subjectsOfSection(sec.id).map((s) => teacherFor(sec.id, s)).filter(Boolean);
    sec.classTeacherId = sec.id === '10-B' ? demoTeacher.id : mine[i % mine.length].id;
  });
  teachers.forEach((t) => {
    const parts = t.name.replace(/^(Mr|Mrs|Ms|Dr)\.\s*/, '').toLowerCase().split(' ');
    t.email = `${parts.join('.')}@evergreen.demo`;
  });

  // ---- timetable (greedy, teacher-conflict free)
  const timetable = {};
  const busy = {};
  const slotKey = (d, p) => `${d}${p}`;
  sections.forEach((sec) => (timetable[sec.id] = Object.fromEntries(DAYS.map((d) => [d, []]))));
  DAYS.forEach((day, di) => {
    for (let p = 0; p < 7; p++) {
      sections.forEach((sec, si) => {
        const subs = subjectsOfSection(sec.id);
        const usedToday = timetable[sec.id][day].map((x) => x.s);
        let pick = null;
        for (let k = 0; k < subs.length * 2 && !pick; k++) {
          const sid = subs[(si + di * 2 + p + k) % subs.length];
          const t = teacherFor(sec.id, sid);
          const doubled = usedToday.filter((x) => x === sid).length >= (k < subs.length ? 1 : 2);
          if (t && !(busy[slotKey(day, p)] || new Set()).has(t.id) && !doubled) pick = { s: sid, t: t.id };
        }
        if (pick) {
          if (!busy[slotKey(day, p)]) busy[slotKey(day, p)] = new Set();
          busy[slotKey(day, p)].add(pick.t);
        }
        timetable[sec.id][day].push(pick || { s: null, t: null });
      });
    }
  });

  // ---- parents and students
  const students = [];
  const parents = [];
  const ability = {};
  const dilig = {};
  const affinity = {};
  let sn = 1;
  for (const sec of sections) {
    const no = classNoOf(sec.id);
    for (let k = 0; k < 36; k++) {
      const id = `S${pad(sn)}`;
      const female = r.chance(0.5);
      const surname = r.pick(LN);
      const pid = `P${pad(sn)}`;
      const dad = r.chance(0.5);
      parents.push({ id: pid, name: `${dad ? 'Mr.' : 'Mrs.'} ${r.pick(dad ? TM : TF)} ${surname}`, email: `parent.${pad(sn)}@evergreen.demo`, phone: phone(r), childIds: [id] });
      students.push({ id, admNo: `EH${2026 - (no - 5)}${pad(sn, 3)}`, name: `${r.pick(female ? FF : FM)} ${surname}`, gender: female ? 'F' : 'M', dob: `${2026 - (no + 5)}-${pad(r.int(1, 12), 2)}-${pad(r.int(1, 28), 2)}`, classId: String(no), sectionId: sec.id, parentId: pid, rollNo: k + 1, bloodGroup: r.pick(['A+', 'B+', 'O+', 'AB+', 'O-', 'A-']), address: `${r.int(1, 99)}, ${r.pick(['Lake View', 'Park Street', 'Green Avenue', 'Rose Lane', 'Hill Road'])}, Demo City`, status: 'active', joined: `${2026 - (no - 5)}-06-01` });
      ability[id] = clamp(r.normal(0.68, 0.14), 0.3, 0.97);
      dilig[id] = clamp(r.normal(0.82, 0.14), 0.35, 1);
      affinity[id] = Object.fromEntries(SUBJECTS.map((s) => [s.id, r.normal(0, 0.08)]));
      sn++;
    }
  }
  const demoStudent = students.find((s) => s.sectionId === '10-B');
  const sibling = students.find((s) => s.sectionId === '7-A');
  const demoParent = parents.find((p) => p.id === demoStudent.parentId);
  demoStudent.name = 'Aarav Sharma';
  demoParent.name = 'Mr. Vikram Sharma';
  sibling.name = 'Diya Sharma';
  parents.splice(parents.findIndex((p) => p.id === sibling.parentId), 1);
  sibling.parentId = demoParent.id;
  demoParent.childIds = [demoStudent.id, sibling.id];
  ability[demoStudent.id] = 0.8;
  dilig[demoStudent.id] = 0.95;
  affinity[demoStudent.id].ENG = 0.1;
  affinity[demoStudent.id].MAT = 0.02;
  const byId = Object.fromEntries(students.map((s) => [s.id, s]));
  const studentsOf = (secId) => students.filter((s) => s.sectionId === secId);

  // ---- attendance (period 1 history; a few sections left pending today for the live demo)
  const days = schoolDaysBack(today, 20);
  const PENDING_TODAY = new Set(['10-B', '9-A', '7-B']);
  const attendance = {};
  for (const date of days) {
    attendance[date] = {};
    const recent = days.indexOf(date) >= 15;
    for (const sec of sections) {
      if (date === today && PENDING_TODAY.has(sec.id)) continue;
      const marks = {};
      for (const s of studentsOf(sec.id)) {
        let p = (1 - dilig[s.id]) * 0.3 + 0.015;
        if (sec.id === '10-B' && recent) p += 0.13; // deliberate dip: surfaces in AI insights
        if (r() < p) marks[s.id] = r.chance(0.22) ? 'L' : 'A';
      }
      attendance[date][sec.id] = { 1: { by: sec.classTeacherId, at: `${date}T09:00:00.000Z`, marks } };
    }
  }

  // ---- exams and marks
  const exams = [
    { id: 'E1', name: 'Unit Test 1', type: 'Unit Test', date: addDays(today, -105), max: 50, classIds: classes.map((c) => c.id), status: 'completed' },
    { id: 'E2', name: 'Mid-Term Examination', type: 'Term', date: addDays(today, -42), max: 100, classIds: classes.map((c) => c.id), status: 'completed' },
    { id: 'E3', name: 'Unit Test 2', type: 'Unit Test', date: addDays(today, 14), max: 50, classIds: classes.map((c) => c.id), status: 'scheduled' },
  ];
  const marks = { E1: {}, E2: {} };
  const marksStatus = {};
  const PENDING_MARKS = new Set(['E2|10-B|MAT', 'E2|12-A|MAT']);
  for (const ex of exams.slice(0, 2)) {
    for (const sec of sections) {
      for (const sid of subjectsOfSection(sec.id)) {
        const key = `${ex.id}|${sec.id}|${sid}`;
        if (PENDING_MARKS.has(key)) {
          marksStatus[key] = { status: 'pending' };
          continue;
        }
        marks[ex.id][sid] ||= {};
        for (const s of studentsOf(sec.id)) {
          let strength = ability[s.id] + affinity[s.id][sid] + r.normal(0, 0.06);
          if (sid === 'PHY' && classNoOf(sec.id) === 12) strength -= 0.2; // deliberate weak spot
          if (s.id === demoStudent.id && sid === 'MAT') strength -= 0.04;
          marks[ex.id][sid][s.id] = Math.round(clamp(strength, 0.12, 0.99) * ex.max);
        }
        marksStatus[key] = { status: 'approved', by: teacherFor(sec.id, sid)?.id, at: `${ex.date}T12:00:00.000Z` };
      }
    }
  }

  // ---- assignments and submissions
  const assignments = [];
  const submissions = [];
  let an = 1;
  let sbn = 1;
  const dueA1 = schoolDaysBack(today, 12)[0];
  const dueA2 = schoolDaysBack(today, 3)[0];
  const dueA3 = nextSchoolDay(today, 4);
  sections.forEach((sec, si) => {
    const subs = subjectsOfSection(sec.id);
    const plan = sec.id === '10-B'
      ? [['MAT', 'Algebra: Quadratic Equations'], ['MAT', 'Trigonometry'], ['MAT', 'Mensuration']]
      : [0, 1, 2].map((k) => { const sid = subs[(si + k * 2) % subs.length]; return [sid, CHAPTERS[sid][(si + k) % CHAPTERS[sid].length]]; });
    plan.forEach(([sid, chapter], k) => {
      const t = teacherFor(sec.id, sid);
      const due = [dueA1, dueA2, dueA3][k];
      const a = { id: `A${pad(an++, 3)}`, title: `${chapter}: ${['Practice Set', 'Worksheet', 'Problem Solving'][k]}`, description: `Complete the assigned problems on "${chapter}". Show all working steps neatly and revise the class notes before attempting.`, sectionId: sec.id, subjectId: sid, chapter, teacherId: t.id, due, maxMarks: 10, status: 'published', createdAt: `${addDays(due, -7)}T10:00:00.000Z`, attachments: [] };
      assignments.push(a);
      for (const s of studentsOf(sec.id)) {
        const open = k === 2;
        if (!r.chance(open ? (s.id === demoStudent.id ? 0 : dilig[s.id] * 0.35) : dilig[s.id])) continue;
        const late = !open && r.chance(0.1);
        let bias = 0;
        if (s.id === demoStudent.id && chapter === 'Algebra: Quadratic Equations') bias = -0.35;
        if (s.id === demoStudent.id && chapter === 'Trigonometry') bias = -0.12;
        const reviewed = k === 0 || (k === 1 && r.chance(0.55) && sec.id !== '10-B');
        const score = Math.round(clamp(ability[s.id] + affinity[s.id][sid] + bias + r.normal(0, 0.08), 0.15, 1) * 10);
        submissions.push({ id: `SB${pad(sbn++, 5)}`, assignmentId: a.id, studentId: s.id, at: `${(() => { const d = late ? addDays(due, 1) : addDays(due, -r.int(0, 3)); return d > today ? today : d; })()}T17:30:00.000Z`, text: 'Submitted solutions (demo record).', fileName: '', late, status: reviewed ? 'reviewed' : 'submitted', marks: reviewed ? score : null, feedback: reviewed ? (score >= 8 ? 'Excellent, clear working.' : score >= 6 ? 'Good effort. Check the steps in the last two questions.' : 'Please revisit the concept and attempt the corrections.') : '' });
      }
    });
  });

  // ---- resources (content derived from the curated question bank)
  const resources = [];
  let rn = 1;
  const clsFor = (sid) => subjects.find((s) => s.id === sid).classIds;
  for (const { subjectId, chapter } of bankKeys()) {
    const b = getBank(subjectId, chapter);
    const t = teachers.find((x) => x.subjectIds[0] === subjectId);
    const base = { subjectId, classIds: clsFor(subjectId), chapter, uploadedBy: t?.id, date: addDays(today, -r.int(10, 80)) };
    resources.push({ ...base, id: `R${pad(rn++, 3)}`, type: 'notes', title: `${chapter}: Concept Notes`, content: `${b.concept}\n\nIn simple words: ${b.simple}` });
    resources.push({ ...base, id: `R${pad(rn++, 3)}`, type: 'worksheet', title: `${chapter}: Practice Worksheet`, content: [...b.mcqs.map((m, i) => `Q${i + 1}. ${m.q}\n${m.o.map((o, j) => `   (${'abcd'[j]}) ${o}`).join('\n')}`), ...b.short.map((q, i) => `Q${b.mcqs.length + i + 1}. ${q}`), '\nAnswer key (MCQs): ' + b.mcqs.map((m, i) => `${i + 1}-${'abcd'[m.a]}`).join(', ')].join('\n\n') });
    resources.push({ ...base, id: `R${pad(rn++, 3)}`, type: 'paper', title: `${chapter}: Previous-style Question Paper`, content: [`${chapter} (Time: 30 min)`, ...b.mcqs.map((m, i) => `${i + 1}. ${m.q}`), ...b.short.map((q, i) => `${b.mcqs.length + i + 1}. ${q}`)].join('\n\n') });
  }
  for (const sub of subjects) {
    CHAPTERS[sub.id].slice(0, 3).forEach((chapter) => {
      resources.push({ id: `R${pad(rn++, 3)}`, type: 'video', title: `${chapter}: Video Lessons`, subjectId: sub.id, classIds: sub.classIds, chapter, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${sub.name} ${chapter} lesson`)}`, uploadedBy: teachers.find((x) => x.subjectIds[0] === sub.id)?.id, date: addDays(today, -r.int(10, 80)), content: '' });
    });
  }

  // ---- fees
  const feeRecords = [];
  const terms = [['Term 1', addDays(today, -120), 0.94], ['Term 2', addDays(today, -10), 0.66], ['Term 3', addDays(today, 60), 0.08]];
  let fn = 1;
  for (const s of students) {
    const amount = 15000 + 1000 * Number(s.classId);
    terms.forEach(([term, due, payP]) => {
      const x = r();
      const paid = x < payP ? amount : x < payP + 0.08 && term !== 'Term 3' ? Math.round((amount * r.int(3, 7)) / 10 / 100) * 100 : 0;
      const payDate = addDays(due, -r.int(0, 20));
      feeRecords.push({ id: `F${pad(fn++, 5)}`, studentId: s.id, term, amount, due, paid, pay: paid ? [{ amt: paid, date: payDate > today ? today : payDate, mode: r.pick(['UPI', 'Card', 'Net Banking', 'Cash']) }] : [] });
    });
  }
  // demo parent: Term 2 for Aarav unpaid so the payment flow can be demonstrated
  const dr = feeRecords.find((f) => f.studentId === demoStudent.id && f.term === 'Term 2');
  dr.paid = 0;
  dr.pay = [];

  // ---- feedback, skills, achievements, goals, prep, quizzes
  const feedback = [];
  let fbn = 1;
  const addFb = (studentId, teacherId, text, type, date) => feedback.push({ id: `FB${pad(fbn++, 4)}`, studentId, teacherId, text, type, date });
  students.filter(() => r.chance(0.22)).forEach((s) => {
    const good = ability[s.id] > 0.65;
    const t = teacherFor(s.sectionId, r.pick(subjectsOfSection(s.sectionId)));
    addFb(s.id, t.id, r.pick(good ? FEEDBACK_POS : FEEDBACK_IMP), good ? 'positive' : 'improvement', addDays(today, -r.int(2, 60)));
  });
  const ct = teachers.find((t) => t.id === sections.find((s) => s.id === '10-B').classTeacherId);
  addFb(demoStudent.id, demoTeacher.id, 'Aarav is attentive and quick to grasp new concepts. He should practise more word problems on quadratic equations before the Unit Test 2.', 'improvement', addDays(today, -3));
  addFb(demoStudent.id, teacherFor('10-B', 'ENG').id, 'Excellent written expression. His essay on climate change was among the best in the class.', 'positive', addDays(today, -9));
  addFb(demoStudent.id, teacherFor('10-B', 'CSC').id, 'Built a well-structured Python quiz program for the mini project.', 'positive', addDays(today, -17));
  addFb(demoStudent.id, ct.id, 'Attendance has been regular. Encourage him to join the school debate club.', 'general', addDays(today, -25));

  const SK = ['communication', 'leadership', 'creativity', 'teamwork', 'criticalThinking'];
  const skills = {};
  students.forEach((s) => (skills[s.id] = Object.fromEntries(SK.map((k) => [k, clamp(Math.round(ability[s.id] * 4 + r.normal(0.5, 0.8)), 1, 5)]))));
  skills[demoStudent.id] = { communication: 5, leadership: 4, creativity: 4, teamwork: 4, criticalThinking: 4 };
  const achievements = [];
  let acn = 1;
  students.filter(() => r.chance(0.22)).forEach((s) => {
    for (let i = 0; i < r.int(1, 2); i++) {
      const [title, category] = r.pick(ACH);
      achievements.push({ id: `AC${pad(acn++, 4)}`, studentId: s.id, title, category, date: addDays(today, -r.int(10, 300)), sample: true });
    }
  });
  [['Inter-house Debate Winner (sample record)', 'competition', -40], ['Robotics Club Project: Line-follower Robot (sample record)', 'project', -75], ['Student Council Class Representative (sample record)', 'leadership', -120], ['Coding Workshop Certificate (sample record)', 'certificate', -150], ['School Football Team Member (sample record)', 'sports', -200]].forEach(([title, category, d]) =>
    achievements.push({ id: `AC${pad(acn++, 4)}`, studentId: demoStudent.id, title, category, date: addDays(today, d), sample: true }));

  const goals = {
    [demoStudent.id]: [
      { id: 'G1', title: 'Score 90%+ in Mathematics Unit Test 2', subjectId: 'MAT', chapter: 'Algebra: Quadratic Equations', deadline: addDays(today, 13), done: false, revised: 1, kind: 'goal' },
      { id: 'G2', title: 'Revise Trigonometric identities', subjectId: 'MAT', chapter: 'Trigonometry', deadline: addDays(today, 4), done: false, revised: 0, kind: 'topic' },
      { id: 'G3', title: 'Finish Light and Optics notes', subjectId: 'SCI', chapter: 'Light and Optics', deadline: addDays(today, 6), done: true, revised: 1, kind: 'topic' },
      { id: 'G4', title: 'Practise 20 Python programs', subjectId: 'CSC', chapter: 'Python Basics', deadline: addDays(today, 10), done: false, revised: 0, kind: 'goal' },
    ],
  };
  const quizAttempts = [
    { id: 'Q1', studentId: demoStudent.id, subjectId: 'MAT', chapter: 'Algebra: Quadratic Equations', score: 2, total: 4, date: addDays(today, -6) },
    { id: 'Q2', studentId: demoStudent.id, subjectId: 'MAT', chapter: 'Trigonometry', score: 3, total: 4, date: addDays(today, -5) },
    { id: 'Q3', studentId: demoStudent.id, subjectId: 'SCI', chapter: 'Force and Motion', score: 4, total: 4, date: addDays(today, -4) },
    { id: 'Q4', studentId: demoStudent.id, subjectId: 'SCI', chapter: 'Chemical Reactions', score: 3, total: 4, date: addDays(today, -2) },
  ];
  const prep = {
    [demoStudent.id]: {
      track: 'BOARD',
      done: Object.fromEntries(['ENG|Grammar: Tenses', 'ENG|Reading Comprehension', 'MAT|Number Systems', 'MAT|Geometry: Triangles', 'SCI|Force and Motion', 'SCI|Light and Optics', 'CSC|Python Basics'].map((k) => [k, true])),
      tests: [
        { id: 'PT1', name: 'Diagnostic Test: Mathematics', type: 'diagnostic', date: addDays(today, -30), score: 31, max: 50, topics: { 'MAT|Algebra: Quadratic Equations': 40, 'MAT|Trigonometry': 65, 'MAT|Geometry: Triangles': 85, 'MAT|Statistics and Probability': 70 } },
        { id: 'PT2', name: 'Mock Test 1 (Science)', type: 'mock', date: addDays(today, -14), score: 38, max: 50, topics: { 'SCI|Force and Motion': 90, 'SCI|Chemical Reactions': 75, 'SCI|Light and Optics': 80, 'SCI|Life Processes': 70 } },
      ],
      errors: [
        { id: 'ER1', subjectId: 'MAT', topic: 'Algebra: Quadratic Equations', question: 'Find the nature of roots of 2x² − 4x + 3 = 0', mistake: 'Used b² + 4ac instead of b² − 4ac.', fix: 'Discriminant is b² − 4ac = 16 − 24 = −8 < 0, so no real roots.', date: addDays(today, -12) },
        { id: 'ER2', subjectId: 'MAT', topic: 'Trigonometry', question: 'Value of sin 60° + cos 30°', mistake: 'Mixed up the values of sin 60° and sin 30°.', fix: 'Both are √3/2, so the sum is √3.', date: addDays(today, -8) },
      ],
      daily: { [today]: [{ id: 'D1', text: 'Solve 10 quadratic equation problems', done: false }, { id: 'D2', text: 'Revise Light and Optics formulae', done: true }] },
    },
  };

  // ---- people accounts
  const users = [
    { id: 'u_admin', role: 'super_admin', name: 'Rahul Menon', title: 'Correspondent', email: 'demo.admin@evergreen.demo', linkedId: null, active: true },
    { id: 'u_principal', role: 'principal', name: 'Dr. Meera Krishnan', title: 'Principal', email: 'demo.principal@evergreen.demo', linkedId: null, active: true },
    { id: 'u_schooladmin', role: 'school_admin', name: 'Kavita Rao', title: 'School Administrator', email: 'demo.schooladmin@evergreen.demo', linkedId: null, active: true },
    ...teachers.map((t) => ({ id: `u_${t.id}`, role: 'teacher', name: t.name, email: t.id === demoTeacher.id ? 'demo.teacher@evergreen.demo' : t.email, linkedId: t.id, active: true })),
    ...students.map((s) => ({ id: `u_${s.id}`, role: 'student', name: s.name, email: s.id === demoStudent.id ? 'demo.student@evergreen.demo' : `student.${s.id.slice(1)}@evergreen.demo`, linkedId: s.id, active: true })),
    ...parents.map((p) => ({ id: `u_${p.id}`, role: 'parent', name: p.name, email: p.id === demoParent.id ? 'demo.parent@evergreen.demo' : p.email, linkedId: p.id, active: true })),
  ];

  // ---- communication
  const announcements = [
    { id: 'AN1', title: 'Unit Test 2 Schedule Released', body: 'Unit Test 2 will begin in two weeks. The detailed timetable is available under Examinations. Teachers are requested to complete portions by next Friday.', audience: ['all'], date: addDays(today, -2), authorId: 'u_principal', priority: 'high' },
    { id: 'AN2', title: 'Parent-Teacher Meeting', body: 'The Term 2 parent-teacher meeting will be held on the last Saturday of this month. Parents can request a slot with subject teachers through the Meetings page.', audience: ['parent', 'teacher'], date: addDays(today, -5), authorId: 'u_principal', priority: 'normal' },
    { id: 'AN3', title: 'Term 2 Fee Reminder', body: 'The due date for Term 2 fees has passed. Kindly clear pending dues through the Fee Status page to avoid late charges.', audience: ['parent'], date: addDays(today, -4), authorId: 'u_schooladmin', priority: 'normal' },
    { id: 'AN4', title: 'Marks Entry Deadline: Mid-Term', body: 'All pending Mid-Term marks must be submitted for approval by end of this week.', audience: ['teacher'], date: addDays(today, -3), authorId: 'u_principal', priority: 'high' },
    { id: 'AN5', title: 'Inter-house Science Exhibition', body: 'Students of Classes 8 to 12 are invited to register projects with their science teachers.', audience: ['student', 'parent'], date: addDays(today, -8), authorId: 'u_admin', priority: 'normal' },
    { id: 'AN6', title: 'Library Week', body: 'The library will remain open until 4:30 PM during Library Week. New titles for every grade are now available.', audience: ['all'], date: addDays(today, -14), authorId: 'u_admin', priority: 'low' },
  ];
  const mt = demoTeacher.id;
  const messages = [
    { id: 'M1', fromId: 'u_' + demoParent.id, toId: 'u_' + mt, studentId: demoStudent.id, body: 'Good morning ma’am. Aarav found the last quadratic equations assignment difficult. Could you suggest some extra practice material?', at: `${addDays(today, -4)}T07:40:00.000Z`, read: true },
    { id: 'M2', fromId: 'u_' + mt, toId: 'u_' + demoParent.id, studentId: demoStudent.id, body: 'Good morning Mr. Sharma. I have uploaded a worksheet in the Learning Hub. A 20-minute daily practice will help. I am happy to discuss it in person too.', at: `${addDays(today, -4)}T11:10:00.000Z`, read: true },
    { id: 'M3', fromId: 'u_' + demoParent.id, toId: 'u_' + mt, studentId: demoStudent.id, body: 'Thank you, we will start from today.', at: `${addDays(today, -3)}T18:05:00.000Z`, read: false },
  ];
  const meetings = [
    { id: 'MT1', parentId: demoParent.id, studentId: demoStudent.id, teacherId: mt, date: nextSchoolDay(today, 5), reason: 'Discuss preparation plan for Unit Test 2', status: 'pending', createdAt: `${addDays(today, -1)}T10:00:00.000Z` },
  ];
  const notifications = [
    { id: 'N1', userId: 'u_principal', text: 'Mid-Term Mathematics marks are still pending for 10-B and 12-A.', at: `${addDays(today, -1)}T09:00:00.000Z`, read: false, link: '/app/admin/marks' },
    { id: 'N2', userId: 'u_admin', text: 'Mid-Term Mathematics marks are still pending for 10-B and 12-A.', at: `${addDays(today, -1)}T09:00:00.000Z`, read: false, link: '/app/admin/marks' },
    { id: 'N3', userId: 'u_' + demoParent.id, text: 'Term 2 fee for Aarav Sharma is overdue.', at: `${addDays(today, -4)}T09:00:00.000Z`, read: false, link: '/app/parent/fees' },
    { id: 'N4', userId: 'u_' + demoStudent.id, text: 'New assignment: Mensuration: Problem Solving', at: `${addDays(today, -2)}T09:00:00.000Z`, read: false, link: '/app/student/assignments' },
    { id: 'N5', userId: 'u_' + mt, text: 'Parent meeting request from Mr. Vikram Sharma', at: `${addDays(today, -1)}T10:00:00.000Z`, read: false, link: '/app/teacher/messages' },
  ];

  return {
    version: 1,
    seededAt: nowIso,
    demo: { students: demoStudent.id, teacher: demoTeacher.id, parent: demoParent.id, userIds: { admin: 'u_admin', principal: 'u_principal', schoolAdmin: 'u_schooladmin', teacher: 'u_' + demoTeacher.id, student: 'u_' + demoStudent.id, parent: 'u_' + demoParent.id } },
    school: {
      name: 'Evergreen Heights School', tagline: 'Fictional demo school', academicYear: '2026–27', city: 'Demo City',
      grading: [{ min: 90, grade: 'A1' }, { min: 80, grade: 'A2' }, { min: 70, grade: 'B1' }, { min: 60, grade: 'B2' }, { min: 50, grade: 'C1' }, { min: 40, grade: 'C2' }, { min: 33, grade: 'D' }, { min: 0, grade: 'E' }],
      attendanceThreshold: 75,
      notify: { attendance: true, assignments: true, marks: true, fees: true, announcements: true },
      tracks: { BOARD: true, JEE: true, NEET: true },
    },
    session: { userId: null },
    users, classes, sections, subjects, teachers, students, parents, timetable, attendance, exams, marks, marksStatus, assignments, submissions, resources, savedResources: {}, feeRecords, feedback, skills, achievements, goals, quizAttempts, prep, announcements, messages, meetings, notifications, aiConversations: {}, copilotLibrary: [], reportLog: [],
  };
}

