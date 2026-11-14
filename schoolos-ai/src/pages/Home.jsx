import { Link } from 'react-router-dom';
import { Award, Bot, Brain, CalendarCheck, Check, ClipboardCheck, Clock, Heart, GraduationCap, Layers, NotebookPen, School, Shield, Sparkles, Users, Wand2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import HeroPreview from '../components/HeroPreview';
import GeoBackground from '../components/GeoBackground';
import { ArrowIcon, PrimaryButton, SecondaryButton } from '../components/Buttons';

const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const EYEBROW = 'inline-block text-sm font-bold uppercase tracking-[0.2em] mb-4 text-primary';
const H2 = 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.1] text-gray-900';
const DARK_CARD = 'h-full rounded-2xl bg-white/[0.04] border border-white/10 p-6 lg:p-8';

function SectionHeading({ eyebrow, title, intro }) {
  return (
    <ScrollReveal>
      <div className="max-w-2xl mb-14 lg:mb-18 text-center mx-auto">
        <span className={EYEBROW}>{eyebrow}</span>
        <h2 className={H2}>{title}</h2>
        {intro && <p className="mt-5 text-lg leading-relaxed text-gray-700">{intro}</p>}
      </div>
    </ScrollReveal>
  );
}

function Hero() {
  return (
    <section className="relative overflow-clip bg-white">
      <div className="ambient-orb ambient-orb-1" />
      <div className="ambient-orb ambient-orb-2" /><GeoBackground variant="hero" /><div className="absolute inset-0 bg-mesh" aria-hidden="true" /><div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" aria-hidden="true" />
      <div className={`relative ${WRAP} pt-20 lg:pt-28 pb-20 lg:pb-28`}>
        <div className="max-w-4xl mx-auto text-center hero-stagger">
          <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6">The Intelligent School Operating System</span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-[-0.04em] text-gray-900 leading-[1.05]">
            Run the school.
            <br />
            Grow every{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">student</span>
              <span className="absolute bottom-1 start-0 end-0 h-3 lg:h-4 bg-primary/10 -skew-x-3 hl-grow" />
            </span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            One platform to manage school operations, empower teachers and accelerate every student&apos;s growth. Four connected portals for management, teachers, students and parents.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <PrimaryButton to="/demo" arrow>Try the live demo</PrimaryButton>
            <SecondaryButton to="/features">Explore the platform</SecondaryButton>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Portals included">{[[School, 'Management'], [Users, 'Teachers'], [GraduationCap, 'Students'], [Heart, 'Parents']].map(([I, l]) => <span key={l} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 ring-1 ring-gray-200 px-3 py-1.5 text-[13px] font-semibold text-gray-700"><I className="w-3.5 h-3.5 text-primary" />{l}</span>)}</div><p className="mt-5 text-sm text-gray-400 uppercase tracking-wider font-medium">Fictional demo school · Switch roles in one click · No sign-up</p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

const STATS = [['4', 'Connected portals'], ['6', 'Role-based access levels'], ['50+', 'Working screens'], ['500+', 'Students in the demo school']];

function Stats() {
  return (
    <section className="border-y border-gray-200 bg-gray-50">
      <div className={`${WRAP} py-10 lg:py-12`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map(([value, label], i) => (
            <ScrollReveal key={label} delay={i * 100}>
              <div className="relative pb-4 stat-line">
                <div className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight tabular-nums"><AnimatedCounter value={value} /></div>
                <div className="mt-1 text-base text-gray-600 font-medium">{label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PROBLEM_ICONS = [Layers, Clock, Users];
const SPINE_ICONS = [CalendarCheck, NotebookPen, ClipboardCheck, Award, Brain, Shield];
const AI_ICONS = [Wand2, Sparkles, Bot];
const PROBLEMS = [
  ['Scattered tools', 'Attendance on paper, marks in spreadsheets, fees in another system and parent updates on chat apps. Nothing talks to anything else.'],
  ['Slow feedback', 'Management learns about a falling class average or a pending marks sheet weeks late, when it is hard to act.'],
  ['One-size teaching', 'Teachers spend evenings preparing worksheets and drafting messages, with little time left for the students who need help.'],
];
function Problem() {
  return (
    <section className="relative bg-ink text-white overflow-clip"><GeoBackground variant="dark" />
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cta-soft mb-4">The problem</span>
          <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15]">Schools run on five systems that never meet.</h2>
        </ScrollReveal>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map(([big, copy], i) => (
            <ScrollReveal key={big} delay={(i + 1) * 100}>
              <div className={DARK_CARD}>
                <span className="w-10 h-10 rounded-xl bg-white/10 text-cta-soft grid place-items-center mb-4">{(() => { const I = PROBLEM_ICONS[i]; return <I className="w-5 h-5" />; })()}</span><div className="text-2xl lg:text-3xl font-extrabold text-cta-soft">{big}</div>
                <p className="mt-3 text-base text-gray-300 leading-relaxed">{copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const DOORS = [
  { to: '/demo?role=admin', bg: 'bg-[#22405f]', hover: 'hover:shadow-[0_24px_48px_-16px_rgb(34_64_95/0.5)]', tone: 'text-cta-soft', eyebrow: 'For management', title: 'Principal & Administration', blurb: 'A control centre for the whole school, with AI-assisted insights that point to what needs attention.', points: ['Live dashboard: attendance, marks, assignments, fees', 'Students, teachers, classes, timetable and exams', 'Approve marks, issue report cards, send circulars', 'AI School Insights computed from your own data'], cta: 'Open the management demo' },
  { to: '/demo?role=teacher', bg: 'bg-[#8e2155]', hover: 'hover:shadow-[0_24px_48px_-16px_rgb(142_33_85/0.5)]', tone: 'text-white', eyebrow: 'For teachers', title: 'Teacher Portal & Copilot', blurb: 'Take attendance in seconds, evaluate work and generate lesson material with the Teacher Copilot.', points: ['Mark attendance and enter marks in minutes', 'Create assignments and give feedback', 'Generate worksheets, quizzes and lesson plans', 'See which students need attention'], cta: 'Open the teacher demo' },
];
function Solution() {
  return (
    <section className="relative overflow-clip bg-white py-20 lg:py-28"><GeoBackground variant="side" />
      <div className={`relative z-[1] ${WRAP}`}>
        <SectionHeading eyebrow="The solution" title="One platform, four experiences" intro="Management, teachers, students and parents share the same live data. Mark a student absent and every dashboard that matters updates." />
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {DOORS.map((d) => (
              <Link key={d.to} className={`group flex flex-col rounded-3xl ${d.bg} p-8 lg:p-10 text-white transition-all duration-300 hover:-translate-y-1 ${d.hover}`} to={d.to}>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${d.tone} opacity-80 mb-3`}>{d.eyebrow}</span>
                <h3 className="text-2xl lg:text-3xl font-extrabold mb-4">{d.title}</h3>
                <p className="text-base lg:text-lg text-white/85 leading-relaxed mb-6">{d.blurb}</p>
                <ul className="space-y-2.5 mb-8">{d.points.map((p) => <li key={p} className="flex items-start gap-2.5 text-base text-white/85 leading-relaxed"><Check className={`w-4 h-4 mt-1.5 flex-shrink-0 ${d.tone}`} strokeWidth={2.5} aria-hidden="true" />{p}</li>)}</ul>
                <span className={`mt-auto inline-flex items-center gap-1.5 text-base font-bold ${d.tone}`}>{d.cta}<ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const SPINE = [
  ['Attendance that flows', 'A teacher marks a student absent. The parent is notified and the management dashboard updates immediately.', '/features#admin'],
  ['Assignments, end to end', 'Publish, submit, evaluate and give feedback. Students and parents see marks and comments as soon as they are saved.', '/features#teachers'],
  ['Marks, grades, report cards', 'Configurable grading rules, an approval step for the principal, and printable report cards.', '/features#admin'],
  ['Student Growth Passport', 'Academics, attendance, projects, competitions, skills and teacher feedback in one profile that follows the student.', '/features#students'],
  ['Board, JEE and NEET prep', 'Syllabus tracking, diagnostics, mock results, weak-topic analysis and an error notebook, enabled per school.', '/features#students'],
  ['Role-based access', 'Six roles with clear permissions. Parents see only their own children. Teachers manage only their own classes.', '/features#parents'],
];
function Spine() {
  return (
    <section className="relative overflow-clip bg-gray-50 py-20 lg:py-28"><GeoBackground variant="side" />
      <div className={`relative z-[1] ${WRAP}`}>
        <SectionHeading eyebrow="Connected workflows" title="Built so one action updates every portal." intro="Nothing here is a static screenshot. Every portal reads and writes the same records." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPINE.map(([title, copy, to], i) => (
            <ScrollReveal key={title} delay={i * 100}>
              <div className="h-full card-soft lift p-6 lg:p-8 flex flex-col">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">{(() => { const I = SPINE_ICONS[i]; return <I className="w-5 h-5" />; })()}</span><h3 className="text-lg font-extrabold text-gray-900 mb-3">{title}</h3>
                <p className="text-base text-gray-700 leading-relaxed">{copy}</p>
                <Link className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-cta hover:text-cta-dark transition-colors" to={to}>Learn more<ArrowIcon className="w-4 h-4" /></Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const AI = [
  ['AI Teacher Copilot', 'Generate worksheets, quizzes, MCQs, lesson plans, remedial activities and parent messages. Preview, edit and save.'],
  ['AI School Insights', 'Management sees what changed, the data behind it, a suggested intervention and a priority. Computed from real records.'],
  ['AI Tutor for students', 'Ask subject questions, simplify explanations and get practice questions, answered from school-approved material.'],
];
function Copilot() {
  return (
    <section id="ai" className="relative bg-ink text-white overflow-clip"><GeoBackground variant="dark" />
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cta-soft mb-4">AI that assists, never decides</p>
          <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15]">Meet the SchoolOS Copilot</h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-300 leading-relaxed">AI supports decisions. People make them. In this demo the AI runs in a clearly labelled demo mode using the school&apos;s own question bank, with no external model connected.</p>
        </ScrollReveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {AI.map(([title, copy], i) => (
            <ScrollReveal key={title} delay={(i + 1) * 100}>
              <div className={DARK_CARD}><span className="w-10 h-10 rounded-xl bg-white/10 text-cta-soft grid place-items-center mb-4">{(() => { const I = AI_ICONS[i]; return <I className="w-5 h-5" />; })()}</span><h3 className="text-lg font-extrabold text-cta-soft">{title}</h3><p className="mt-3 text-base text-gray-300 leading-relaxed">{copy}</p></div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={300}>
          <Link className="mt-10 inline-flex items-center gap-1.5 text-base font-bold text-cta-soft hover:text-white transition-colors" to="/features#ai">See all AI features<ArrowIcon className="w-4 h-4" /></Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

const STEPS = [
  ['1', 'Sign in as a teacher', 'Open the teacher portal and mark a student absent in Class 10-B.'],
  ['2', 'Switch to the principal', 'The attendance dashboard and AI insights reflect the change.'],
  ['3', 'Switch to the parent', 'The parent portal shows the absence and a notification.'],
];
function Walkthrough() {
  return (
    <section className="relative bg-white overflow-clip"><GeoBackground variant="side" />
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <SectionHeading eyebrow="Demo walkthrough" title="See one action travel across the school" />
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6"><div className="hidden md:block absolute top-[52px] start-[16%] end-[16%] h-px bg-gray-300" aria-hidden="true"><i className="travel-dot absolute -top-[5px] w-[11px] h-[11px] rounded-full bg-primary shadow-[0_0_0_4px_rgb(0_114_229/0.15)]" /></div>
          {STEPS.map(([n, title, copy], i) => (
            <ScrollReveal key={n} delay={i * 100}>
              <div className="card-soft p-6 lg:p-8 h-full">
                <div className="w-10 h-10 rounded-full bg-primary text-white grid place-items-center text-lg font-extrabold mb-4 ring-4 ring-primary/10">{n}</div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-base text-gray-700 leading-relaxed">{copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative bg-gray-50 overflow-clip bg-mesh"><GeoBackground variant="side" />
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cta mb-4">Start now</span>
          <h2 className="max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15] text-gray-900">Explore a working school in two minutes.</h2>
          <p className="mt-6 max-w-2xl text-lg text-gray-700 leading-relaxed">Open the demo school, switch between the principal, a teacher, a student and a parent, and try the real workflows. Every record is fictional. Changes persist in your browser and can be reset at any time.</p>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <PrimaryButton to="/demo" arrow>Try the live demo</PrimaryButton>
            <SecondaryButton to="/features">Explore the platform</SecondaryButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <Problem />
      <Solution />
      <Spine />
      <Copilot />
      <Walkthrough />
      <FinalCta />
    </main>
  );
}
