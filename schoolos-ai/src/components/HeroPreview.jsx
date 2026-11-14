import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarCheck, GraduationCap, Sparkles, Wallet, ClipboardCheck } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { useAppState } from '../lib/store';
import * as S from '../lib/selectors';
import { Badge, BarChart, Donut, LineChart } from '../ui/kit';
import { recentActivity } from '../portals/common';

/** Renders children only once the element has scrolled into view, so chart animations are seen. */
function InView({ children, className, rootMargin = '0px 0px -8% 0px' }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.2, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return <div ref={ref} className={className}>{seen ? children : null}</div>;
}

function Tile({ icon: Icon, label, value, tone, sub }) {
  const tones = { blue: 'bg-primary/10 text-primary', pink: 'bg-cta/10 text-cta', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700' };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-gray-500">{label}</span>
        <span className={`w-7 h-7 rounded-lg grid place-items-center ${tones[tone]}`}><Icon className="w-3.5 h-3.5" /></span>
      </div>
      <div className="mt-1.5 text-2xl font-extrabold text-gray-900 tabular-nums tracking-tight"><AnimatedCounter value={value} /></div>
      <div className="text-[11.5px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  );
}

/**
 * A live look at the product's management dashboard. Every number and chart is calculated
 * from the same demo records the real dashboard uses.
 */
export default function HeroPreview() {
  const s = useAppState();
  const att = S.attendanceOn(s, S.today()) || S.attendanceOn(s, S.latestAttendanceDate(s));
  const marks = S.marksCompletion(s);
  const fees = S.feeSummary(s);
  const students = s.students.filter((x) => x.status === 'active').length;
  const trend = S.dailyAttendance(s, 14).map((d) => ({ label: d.date.slice(5), value: d.pct }));
  const latest = [...s.exams].filter(S.examIsConducted).sort((a, b) => b.date.localeCompare(a.date))[0];
  const byClass = latest ? S.examAverageBy(s, latest.id, 'class') : {};
  const insights = S.schoolInsights(s).slice(0, 2);
  const insight = insights[0];
  const activity = recentActivity(s, 3);
  const classVals = s.classes.map((c) => Math.round(byClass[c.id] ?? 0));
  const axisMax = Math.min(100, Math.ceil((Math.max(...classVals, 10) + 8) / 10) * 10);

  return (
    <div className="relative max-w-5xl mx-auto mt-12 lg:mt-16">
      <div className="absolute -inset-x-6 -top-6 -bottom-10 rounded-[2rem] bg-gradient-to-br from-primary-50 via-white to-cta/[0.06] -z-0 blur-[2px]" aria-hidden="true" />
      <div className="relative rounded-2xl bg-white ring-1 ring-gray-900/10 shadow-[0_1px_2px_rgb(9_30_66/0.06),0_40px_80px_-24px_rgb(9_30_66/0.28)] overflow-hidden animate-scale-in" style={{ animationDelay: '0.45s' }}>
        <div className="flex items-center gap-3 h-9 px-3.5 bg-ink">
          <span className="flex gap-1.5" aria-hidden="true"><i className="w-2.5 h-2.5 rounded-full bg-white/25" /><i className="w-2.5 h-2.5 rounded-full bg-white/25" /><i className="w-2.5 h-2.5 rounded-full bg-white/25" /></span>
          <span className="text-[11px] font-semibold text-white/70 whitespace-nowrap truncate"><span className="hidden sm:inline">SchoolOS AI · </span>Management dashboard</span>
          <span className="ms-auto inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-300 whitespace-nowrap shrink-0"><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" /><span className="hidden sm:inline">Live demo data</span><span className="sm:hidden">Live</span></span>
        </div>
        <div className="p-4 sm:p-5 bg-gray-50/60">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile icon={GraduationCap} label="Students" value={String(students)} tone="blue" sub={`${s.sections.length} sections`} />
            <Tile icon={CalendarCheck} label="Attendance" value={`${Math.round(att?.pct ?? 0)}%`} tone="green" sub={`${att?.absent ?? 0} absent today`} />
            <Tile icon={ClipboardCheck} label="Marks entry" value={`${marks.pct}%`} tone="amber" sub={`${marks.done} of ${marks.total} sheets`} />
            <Tile icon={Wallet} label="Fees collected" value={`${fees.pct}%`} tone="pink" sub="of billed to date" />
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4 min-w-0">
              <div className="flex items-baseline justify-between"><h3 className="text-[13px] font-extrabold text-gray-900">Attendance trend</h3><span className="text-[11px] text-gray-500">last 14 school days</span></div>
              <InView className="mt-1 min-h-[170px]"><LineChart height={170} series={[{ name: 'Attendance', color: '#0072e5', data: trend }]} /></InView>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 min-w-0">
              <div className="flex items-baseline justify-between"><h3 className="text-[13px] font-extrabold text-gray-900">Class performance</h3><span className="text-[11px] text-gray-500">{latest?.name}</span></div>
              <InView className="mt-1 min-h-[170px]"><BarChart height={170} unit="" max={axisMax} data={s.classes.map((c, i) => ({ label: c.no, value: classVals[i], color: '#0072e5' }))} /></InView>
            </div>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-gray-900"><Sparkles className="w-3.5 h-3.5 text-primary" />AI School Brief</div>
              <ul className="mt-2.5 space-y-2">{insights.map((i) => <li key={i.id} className="flex items-start justify-between gap-3 text-[12.5px]"><span className="text-gray-800 font-semibold leading-snug">{i.title}</span><Badge tone={i.priority === 'high' ? 'red' : 'amber'}>{i.priority}</Badge></li>)}</ul>
              <p className="mt-2 text-[11px] text-gray-500">Computed from live records. Suggestions for people to act on.</p>
            </div>
            <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-gray-900"><Bell className="w-3.5 h-3.5 text-cta" />Recent activity</div>
              <ul className="mt-2.5 space-y-2">{activity.map((a, i) => <li key={i} className="text-[12px] text-gray-700 leading-snug truncate">• {a.text}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden min-[1440px]:block absolute -start-[196px] top-32 floaty z-10">
        <div className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-gray-900/10 shadow-[0_12px_32px_-8px_rgb(9_30_66/0.25)] px-4 py-3 animate-fade-up" style={{ animationDelay: '1s' }}>
          <span className="w-9 h-9 rounded-xl bg-cta/10 text-cta grid place-items-center"><Bell className="w-4.5 h-4.5" /></span>
          <div className="leading-tight"><div className="text-[13px] font-extrabold text-gray-900">Attendance saved</div><div className="text-[11.5px] text-gray-500">Parent notified instantly</div></div>
        </div>
      </div>
      {insight && (
        <div className="hidden min-[1440px]:block absolute -end-[196px] bottom-24 floaty-b z-10 w-[180px]">
          <div className="rounded-2xl bg-white ring-1 ring-gray-900/10 shadow-[0_12px_32px_-8px_rgb(9_30_66/0.25)] px-4 py-3 animate-fade-up" style={{ animationDelay: '1.2s' }}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary"><Sparkles className="w-3.5 h-3.5" />AI insight</div>
            <div className="mt-1 text-[13px] font-bold text-gray-900 leading-snug">{insight.title}</div>
            <div className="mt-0.5 text-[11.5px] text-gray-500">Computed from live records</div>
          </div>
        </div>
      )}
    </div>
  );
}
export { Donut };
