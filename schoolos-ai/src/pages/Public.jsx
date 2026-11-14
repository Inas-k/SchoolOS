import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Check, GraduationCap, Heart, School, Sparkles, TrendingUp, Users, Wand2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import GeoBackground from '../components/GeoBackground';
import { loginAs, login } from '../lib/actions';
import { useAppState } from '../lib/store';
import { currentUser } from '../lib/selectors';
import { portalOf } from '../lib/perms';
import { Button, Card, Input, useToast } from '../ui/kit';
import { DEMO_PASSWORD } from '../data/seed';

const WRAP = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

const BLOCKS = [
  { id: 'admin', icon: School, tone: 'bg-cta/10 text-cta', title: 'Management portal', sub: 'Principal, correspondent and administration', items: ['Executive dashboard with live attendance, marks, assignment and fee figures', 'Students, teachers, classes, sections, subjects and timetable', 'Examinations, marks approval and printable report cards', 'Announcements, parent communication and fee management', 'AI School Insights with supporting data and suggested actions', 'Reports with CSV export, school settings, users and roles'] },
  { id: 'teachers', icon: Users, tone: 'bg-primary/10 text-primary', title: 'Teacher portal', sub: 'Daily teaching, in fewer clicks', items: ['Attendance by class, date and period, with history and edits', 'Assignments: create, publish, receive submissions, evaluate with feedback', 'Marks entry with drafts, submission and automatic grades', 'Student performance with weak-topic hints', 'AI Teacher Copilot: worksheets, quizzes, lesson plans, remedial activities, parent messages', 'Parent messages and meeting requests'] },
  { id: 'students', icon: GraduationCap, tone: 'bg-accent/10 text-accent', title: 'Student portal', sub: 'A learning environment, not just a results page', items: ['Learning Hub: notes, worksheets, previous papers and linked videos', 'AI Tutor with chapter context and practice questions', 'Study planner with goals, deadlines and revision tracking', 'Practice quizzes and chapter-wise performance', 'Board, JEE and NEET preparation tracker with an error notebook', 'Student Growth Passport combining academics, skills and achievements'] },
  { id: 'parents', icon: Heart, tone: 'bg-[#8e2155]/10 text-[#8e2155]', title: 'Parent portal', sub: 'Clarity without chasing the school', items: ['Attendance, results and report cards for each child', 'Assignment tracking and teacher feedback', 'School announcements and notifications', 'Message teachers and request meetings', 'Fee status with a payment flow', 'View only your own children, enforced by role'] },
];

export function Features() {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    else window.scrollTo(0, 0);
  }, [hash]);
  return (
    <main>
      <section className="relative bg-white overflow-clip">
        <div className="absolute inset-0 bg-mesh" aria-hidden="true" /><div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]" aria-hidden="true" /><GeoBackground variant="hero" />
        <div className={`relative ${WRAP} pt-20 pb-10 text-center hero-stagger`}>
          <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">The platform</span>
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-[-0.04em] text-gray-900 leading-[1.05] max-w-4xl mx-auto">Everything the school needs, in one connected system.</h1>
          <p className="mt-6 text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">Four portals, six roles and one shared data model. This is the full list of what the demo school can do today.</p>
          <div className="mt-8 flex justify-center gap-3 flex-col sm:flex-row"><PrimaryButton to="/demo" arrow>Try the live demo</PrimaryButton></div>
        </div>
      </section>
      <section className="relative overflow-clip bg-gray-50"><GeoBackground variant="side" /><div className={`relative ${WRAP} py-16 grid gap-6 md:grid-cols-2`}>
        {BLOCKS.map((b, i) => (
          <ScrollReveal key={b.id} delay={(i % 2) * 100}>
            <div id={b.id} className="card-soft lift p-6 lg:p-8 h-full scroll-mt-24">
              <span className={`w-11 h-11 rounded-xl grid place-items-center ${b.tone}`}><b.icon className="w-6 h-6" /></span>
              <h2 className="mt-4 text-2xl font-extrabold text-gray-900">{b.title}</h2>
              <p className="text-gray-600 mt-1">{b.sub}</p>
              <ul className="mt-5 space-y-2.5">{b.items.map((x) => <li key={x} className="flex gap-2.5 text-[15px] text-gray-700 leading-relaxed"><Check className="w-4 h-4 mt-1 text-emerald-600 shrink-0" strokeWidth={2.5} />{x}</li>)}</ul>
              <Link to={`/demo?role=${b.id === 'admin' ? 'admin' : b.id.slice(0, -1)}`} className="mt-6 inline-block font-semibold text-cta hover:text-cta-dark">Open this portal in the demo →</Link>
            </div>
          </ScrollReveal>
        ))}
      </div></section>
      <section id="ai" className="relative overflow-clip bg-ink text-white scroll-mt-16"><GeoBackground variant="dark" /><div className={`relative ${WRAP} py-16 lg:py-20`}>
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-[-0.03em]">AI features, honestly labelled</h2>
        <p className="mt-4 max-w-3xl text-gray-300 text-lg leading-relaxed">The AI features are built end to end and run in <b className="text-white">demo mode</b>: responses come from the school&apos;s curated question bank and templates, so they are predictable and safe for a presentation. No external AI model is connected. A production deployment would add a provider on the server, keeping keys out of the browser.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          {[['AI Teacher Copilot', 'Worksheets, quizzes, MCQs, short answers, lesson plans, revision and remedial activities, and parent messages. Choose class, subject, chapter, difficulty and count, then preview, edit and save.'], ['AI School Insights', 'Observations are calculated from attendance, assignment and marks data. Each shows the supporting numbers, a suggested intervention and a priority.'], ['AI Tutor', 'Select a subject and chapter, ask questions, simplify an explanation, or request practice questions with instant checking. Conversations are saved.'], ['Student Performance Intelligence', 'Subject trends, chapter-wise mastery and recommended practice, computed from marks, assignments and quizzes.']].map(([t, d], i) => <div key={t} className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 lift"><span className="w-10 h-10 rounded-xl bg-white/10 text-cta-soft grid place-items-center mb-4">{(() => { const I = [Wand2, Sparkles, Bot, TrendingUp][i]; return <I className="w-5 h-5" />; })()}</span><h3 className="font-extrabold text-cta-soft text-lg">{t}</h3><p className="mt-2 text-gray-300 leading-relaxed">{d}</p></div>)}
        </div>
      </div></section>
    </main>
  );
}

const CARDS = [
  { key: 'admin', title: 'Principal / Administrator', icon: School, desc: 'Dashboard, AI insights, students, exams, marks approval, fees and reports.', tone: 'bg-[#22405f]', who: 'Rahul Menon, Correspondent' },
  { key: 'teacher', title: 'Teacher', icon: Users, desc: 'Mark attendance, create assignments, enter marks, use the AI Copilot.', tone: 'bg-[#8e2155]', who: 'Ms. Anita Verma, Mathematics' },
  { key: 'student', title: 'Student', icon: GraduationCap, desc: 'Learning hub, AI tutor, planner, growth passport and exam preparation.', tone: 'bg-primary', who: 'Aarav Sharma, Class 10-B' },
  { key: 'parent', title: 'Parent', icon: Heart, desc: 'Attendance, results, fees, feedback and teacher communication.', tone: 'bg-accent', who: 'Mr. Vikram Sharma, two children' },
];

export function Demo() {
  const s = useAppState();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const enter = (key) => {
    const u = loginAs(s.demo.userIds[key]);
    nav(`/app/${portalOf(u.role)}`);
  };
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const highlight = sp.get('role');
  return (
    <main className="relative bg-gray-50 min-h-[70vh] overflow-clip"><GeoBackground variant="hero" />
      <div className="absolute inset-0 bg-mesh" aria-hidden="true" />
      <div className={`relative ${WRAP} py-14 lg:py-20`}>
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">Live demo</span>
          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-[-0.03em] text-gray-900">Choose who you want to be</h1>
          <p className="mt-4 text-lg text-gray-700">Evergreen Heights School is fictional. You can switch role at any time from the top bar. Changes persist in this browser and can be reset.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <button key={c.key} onClick={() => enter(c.key)} className={`group card-soft lift text-start p-6 flex flex-col ${highlight === c.key ? 'ring-2 ring-cta' : ''}`}>
              <span className={`w-12 h-12 rounded-2xl grid place-items-center text-white ${c.tone}`}><c.icon className="w-6 h-6" /></span>
              <h2 className="mt-4 text-lg font-extrabold text-gray-900">{c.title}</h2>
              <p className="mt-2 text-[15px] text-gray-700 leading-relaxed flex-1">{c.desc}</p>
              <p className="mt-4 text-[13px] text-gray-500">Signs in as {c.who}</p>
              <span className="mt-3 font-semibold text-cta transition-transform group-hover:translate-x-1">Enter demo →</span>
            </button>
          ))}
        </div>
        <Card className="mt-10 p-6 max-w-3xl mx-auto">
          <h2 className="font-extrabold text-gray-900">Suggested 3-minute journey</h2>
          <ol className="mt-3 space-y-2 text-[15px] text-gray-700 list-decimal ps-5 leading-relaxed">
            <li>Enter as <b>Teacher</b>, open Attendance, pick Class 10-B and mark a student absent, then save.</li>
            <li>Use the top-bar switcher to become the <b>Principal</b> and watch the dashboard and AI insights react.</li>
            <li>Switch to the <b>Parent</b> to see the absence, a notification and the child&apos;s results.</li>
            <li>Become the <b>Student</b> to try the AI Tutor and the Growth Passport.</li>
          </ol>
        </Card>
      </div>
    </main>
  );
}

export function Login() {
  const s = useAppState();
  const me = currentUser(s);
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  if (me) return <Navigate to={loc.state?.from?.startsWith(`/app/${portalOf(me.role)}`) ? loc.state.from : `/app/${portalOf(me.role)}`} replace />;
  const submit = (e) => {
    e.preventDefault();
    try {
      const u = login(email, pw);
      nav(`/app/${portalOf(u.role)}`);
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <main className="relative bg-gray-50 min-h-[70vh] grid place-items-center px-4 py-14 overflow-clip"><GeoBackground variant="hero" />
      <div className="absolute inset-0 bg-mesh" aria-hidden="true" />
      <div className="relative w-full max-w-md animate-fade-up">
        <Card className="p-7">
          <h1 className="text-2xl font-extrabold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">Demo accounts only. Every account uses the password <code className="bg-gray-100 rounded px-1.5 py-0.5">{DEMO_PASSWORD}</code>.</p>
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo.teacher@evergreen.demo" />
            <Input label="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Quick fill</p>
            <div className="flex flex-wrap gap-2">
              {[['Administrator', 'demo.admin'], ['Principal', 'demo.principal'], ['Teacher', 'demo.teacher'], ['Student', 'demo.student'], ['Parent', 'demo.parent']].map(([l, e]) => <button key={l} type="button" onClick={() => { setEmail(`${e}@evergreen.demo`); setPw(DEMO_PASSWORD); }} className="px-3 py-1.5 rounded-lg border border-gray-300 text-[13px] font-semibold text-gray-700 hover:border-primary">{l}</button>)}
            </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-sm text-gray-600">Just exploring? <Link to="/demo" className="font-semibold text-cta">Use one-click demo roles</Link></p>
      </div>
    </main>
  );
}
