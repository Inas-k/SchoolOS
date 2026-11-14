import { Check } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import HeroShowcase from '../components/HeroShowcase';
import { ArrowIcon, PrimaryButton, SecondaryButton } from '../components/Buttons';
import { logoSrc } from '../assets';
import { LINKS } from '../config';

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
      <div className="ambient-orb ambient-orb-2" />
      <div className={`relative ${WRAP} pt-20 lg:pt-28 pb-20 lg:pb-28`}>
        <div className="max-w-4xl mx-auto text-center hero-stagger">
          <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6">
            Trusted by academies &amp; preschools in 10 countries
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-[-0.04em] text-gray-900 leading-[1.05]">
            Academies &amp; preschools,
            <br />
            meet your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">AI copilot</span>
              <span className="absolute bottom-1 start-0 end-0 h-3 lg:h-4 bg-primary/10 -skew-x-3" />
            </span>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            One platform for students, scheduling, billing, and communications — with an AI agent that works your daily operations
            backlog and advises you on what needs attention every week.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <PrimaryButton href={LINKS.register} arrow>
              Start Free Pilot
            </PrimaryButton>
            <SecondaryButton href="/demo/">Schedule a Demo</SecondaryButton>
          </div>
          <p className="mt-6 text-sm text-gray-400 uppercase tracking-wider font-medium">
            14-day free pilot · Set up in minutes · Cancel anytime
          </p>
        </div>
        <HeroShowcase />
      </div>
    </section>
  );
}

const STATS = [
  ['10+', 'Countries worldwide'],
  ['0%', 'Skooly Fees on Bank Payments'],
  ['2', 'Months Free on Annual Plans'],
  ['$0', 'Setup Fees — Live in Minutes'],
];

function Stats() {
  return (
    <section className="border-y border-gray-200 bg-gray-50">
      <div className={`${WRAP} py-10 lg:py-12`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map(([value, label], i) => (
            <ScrollReveal key={label} delay={i * 100}>
              <div className="relative pb-4 stat-line">
                <div className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight tabular-nums">
                  <AnimatedCounter value={value} />
                </div>
                <div className="mt-1 text-base text-gray-600 font-medium">{label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const PROBLEMS = [
  ['8–12 hrs', 'a week of owner admin in a typical centre — schedules, screenshots, chasing, payroll — all reconstructable, none automated.'],
  ['Since 2020', 'every centre has bought software — a booking tool here, accounting there, messaging somewhere else. Adoption happened; integration never did.'],
  ['2010-era', 'the school-management systems that do exist are passive databases — they record what happened, chase nothing, and advise no one.'],
];

function Problem() {
  return (
    <section className="relative bg-ink text-white overflow-clip">
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cta-soft mb-4">The Problem</span>
          <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15]">
            Five systems later, the glue is still WhatsApp, Excel, and a parent&apos;s bank-transfer screenshot.
          </h2>
        </ScrollReveal>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROBLEMS.map(([big, copy], i) => (
            <ScrollReveal key={big} delay={(i + 1) * 100}>
              <div className={DARK_CARD}>
                <div className="text-3xl lg:text-4xl font-extrabold text-cta-soft tabular-nums">{big}</div>
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
  {
    href: '/academy/',
    bg: 'bg-[#22405f]',
    hover: 'hover:shadow-[0_24px_48px_-16px_rgb(34_64_95/0.5)]',
    eyebrowTone: 'text-cta-soft',
    checkTone: 'text-cta-soft',
    ctaTone: 'text-cta-soft',
    eyebrow: 'For academies',
    title: 'Skooly Academy',
    blurb: 'For music schools, dance studios, sports academies, tuition and language centres — and adult training providers. All ages, the whole term on one screen.',
    points: [
      'Make-up classes parents book themselves on WhatsApp',
      'Fees that reconcile themselves — bank payments & credit cards',
      'Teacher pay computed from actual sessions',
      'Term renewals as a workflow, not a hope',
      'Adult mode: corporate invoicing, certificates, SkillsFuture & HRD Corp claim support',
    ],
    cta: 'Explore Skooly Academy',
  },
  {
    href: '/preschool/',
    bg: 'bg-[#8e2155]',
    hover: 'hover:shadow-[0_24px_48px_-16px_rgb(142_33_85/0.5)]',
    eyebrowTone: 'text-white/70',
    checkTone: 'text-white/80',
    ctaTone: 'text-white',
    eyebrow: 'For preschools',
    title: 'Skooly Preschool',
    blurb: 'For preschools, kindergartens and nurseries — the day, documented and shared with love.',
    points: [
      "The daily feed: meals, naps, photos — in each family's language",
      'Ratios enforced in the roster, inspection-ready always',
      'Government subsidies & grants reconciled automatically',
      'Gate check-in/out, incidents, learning journals',
    ],
    cta: 'Explore Skooly Preschool',
  },
];

function Solution() {
  return (
    <section className="relative overflow-clip bg-white py-20 lg:py-28 ">
      <div className={`relative z-[1] ${WRAP}`}>
        <SectionHeading
          eyebrow="The Solution"
          title="One platform, two front doors"
          intro="Pick the Skooly built for how you teach — both run on the same engine, with an AI copilot working your operations underneath."
        />
        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {DOORS.map((d) => (
              <a
                key={d.href}
                className={`group flex flex-col rounded-3xl ${d.bg} p-8 lg:p-10 text-white transition-all duration-300 hover:-translate-y-1 ${d.hover}`}
                href={d.href}
              >
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${d.eyebrowTone} mb-3`}>{d.eyebrow}</span>
                <h3 className="text-2xl lg:text-3xl font-extrabold mb-4">{d.title}</h3>
                <p className="text-base lg:text-lg text-white/85 leading-relaxed mb-6">{d.blurb}</p>
                <ul className="space-y-2.5 mb-8">
                  {d.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-base text-white/85 leading-relaxed">
                      <Check className={`w-4 h-4 mt-1.5 flex-shrink-0 ${d.checkTone}`} strokeWidth={2.5} aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
                <span className={`mt-auto inline-flex items-center gap-1.5 text-base font-bold ${d.ctaTone}`}>
                  {d.cta}
                  <ArrowIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </span>
              </a>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const SPINE = [
  ['Billing on your rails', 'Bank payments and credit cards — auto-matched to families, so the screenshot hour dies. Gentle, family-safe fee reminders built in.', '/academy/features/billing-payments/'],
  ['Families on WhatsApp', 'Updates, fee reminders, daily reports and two-way threads in the app parents already use — in the language your families speak. Every message on the record.', '/academy/features/communications/'],
  ['Staff, rosters & pay', 'Pay computed from actual sessions — hourly, per-class or revenue-share for academy instructors. Ratio-aware rosters and qualification tracking for preschool teams.', '/preschool/features/staff-management/'],
  ['Enrolment & families', 'Trial to enrolment to renewal; siblings as one family, one bill — across both doors. Waitlists that fill themselves.', '/academy/features/enrollment-booking/'],
  ["The owner's cockpit", 'Occupancy, collections, renewals due, staff cost per session — the numbers an owner-operator has never seen in one place, read weekly by your AI copilot.', '/academy/features/ai-assistant/'],
  ['Compliance that files itself', "E-invoicing, regulatory records and minors'-data protection, shaped to your country's rules. Built into the core, not bolted on.", null],
];

function Spine() {
  return (
    <section className="relative overflow-clip bg-gray-50 py-20 lg:py-28 ">
      <div className={`relative z-[1] ${WRAP}`}>
        <SectionHeading
          eyebrow="The Shared Spine"
          title="Built once. Working behind both doors."
          intro="Whichever Skooly you choose, the same engine handles the money, the messages, the staff, and the paperwork."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPINE.map(([title, copy, href], i) => (
            <ScrollReveal key={title} delay={i * 100}>
              <div className="h-full card-soft p-6 lg:p-8 flex flex-col">
                <h3 className="text-lg font-extrabold text-gray-900 mb-3">{title}</h3>
                <p className="text-base text-gray-700 leading-relaxed">{copy}</p>
                {href && (
                  <a className="mt-4 inline-flex items-center gap-1.5 text-base font-semibold text-cta hover:text-cta-dark transition-colors" href={href}>
                    Learn more
                    <ArrowIcon className="w-4 h-4 rtl:rotate-180" />
                  </a>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
            <a className="text-base font-semibold text-primary hover:text-primary-dark transition-colors" href="/academy/features/">
              All Academy features→
            </a>
            <a className="text-base font-semibold text-primary hover:text-primary-dark transition-colors" href="/preschool/features/">
              All Preschool features→
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

const COPILOT = [
  ['Daily — the morning brief', 'Cover gaps, overdue invoices, churn flags and lead follow-ups — each arriving with a drafted action ready for your tap.'],
  ['Weekly — the pulse', 'Leads, trials and bookings against your four-week average, plus a watch list that connects the dots across classes, staff and demand.'],
  ['Monthly — the Skooly Score', 'A deterministic score across growth, retention, money, utilization and operations — with the why behind every move.'],
];

function Copilot() {
  return (
    <section className="relative bg-ink text-white overflow-clip">
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cta-soft mb-4">
            7:02am · the brief that read your whole academy before you woke
          </p>
          <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15]">
            Meet the Skooly Copilot
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-gray-300 leading-relaxed">
            Numbers computed from your data. Words written by AI. Every action waits for your tap.
          </p>
        </ScrollReveal>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {COPILOT.map(([title, copy], i) => (
            <ScrollReveal key={title} delay={(i + 1) * 100}>
              <div className={DARK_CARD}>
                <h3 className="text-lg font-extrabold text-cta-soft">{title}</h3>
                <p className="mt-3 text-base text-gray-300 leading-relaxed">{copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={300}>
          <a className="mt-10 inline-flex items-center gap-1.5 text-base font-bold text-cta-soft hover:text-white transition-colors" href="/academy/features/ai-assistant/">
            See how the copilot works
            <ArrowIcon className="w-4 h-4 rtl:rotate-180" />
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "The move over went really smoothly. At first, there was a little bit to get used to, but once we got familiar with everything, it became much easier. One thing that's definitely easier now is managing our daily activities and updates for parents. It's more organised, and parents can easily see what their children have been doing throughout the day without having to keep asking us.",
    name: 'Adrienne Amanda Mamartus',
    role: 'Childcare Supervisor, Taska Wonderbeats, Malaysia',
    tag: 'Preschool',
    logo: logoSrc('TW', '#8e2155'),
  },
  {
    quote: "I'd recommend giving Skooly a try if you're looking to make your school or daycare administration more organized and efficient. As a daycare operator, we want to spend less time on administrative tasks and more time focusing on children's growth and development. Having a platform that supports that goal can make a real difference, especially as your business grows.",
    name: 'Jonathan Tanuwijaya',
    role: 'Owner, Jollybee Daycare, Jakarta, Indonesia',
    tag: 'Daycare',
    logo: logoSrc('JD', '#d9a300'),
  },
  {
    quote: 'Amazing work with this app. I started looking for better alternatives by searching, downloading and testing various apps, keeping in mind that we are on a small island with limited funds available. This upgrade to Skooly just made us so excited. After testing it out this morning, I felt like I opened a gift on Christmas morning!',
    name: 'Angie Afamasaga',
    role: 'Centre Owner, Little Wonders, Samoa',
    tag: 'Preschool',
    logo: logoSrc('LW', '#0d9488'),
  },
];

function Testimonials() {
  return (
    <section className="relative bg-white overflow-clip">
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <SectionHeading eyebrow="Testimonials" title="Trusted by academies & preschools" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 100}>
              <div className="card-soft p-6 lg:p-8">
                <div className="text-primary text-3xl font-serif leading-none mb-4">“</div>
                <p className="text-base text-gray-700 leading-relaxed mb-6">{t.quote}</p>
                <div className="border-t border-gray-100 pt-4 flex items-start gap-3">
                  <img
                    alt=""
                    loading="lazy"
                    width="48"
                    height="48"
                    decoding="async"
                    className="rounded-xl ring-1 ring-black/5 flex-shrink-0 bg-white"
                    style={{ color: 'transparent', width: 48, height: 48 }}
                    src={t.logo}
                  />
                  <div>
                    <div className="text-base font-semibold text-gray-900">{t.name}</div>
                    <div className="text-sm text-gray-600 mt-0.5">{t.role}</div>
                    <div className="inline-block mt-2 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                      {t.tag}
                    </div>
                  </div>
                </div>
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
    <section className="relative bg-gray-50 overflow-clip">
      <div className={`relative ${WRAP} py-20 lg:py-28`}>
        <ScrollReveal>
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-cta mb-4">Start free</span>
          <h2 className="max-w-4xl text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] leading-[1.15] text-gray-900">
            A 14-day pilot. $0 setup. Live in minutes.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-gray-700 leading-relaxed">
            Set up your programs, fees, and schedules yourself in minutes — or bring the Excel, the WhatsApp groups, and the export from
            whatever system you&apos;re switching from, and on premium plans our team migrates it all for you. Two months free on annual
            plans. Children&apos;s data protected as minors&apos; data — never used to train anything, never sold.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <PrimaryButton href={LINKS.register} arrow>
              Start your free pilot
            </PrimaryButton>
            <SecondaryButton href="/demo/">Schedule a Demo</SecondaryButton>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Across 10+ countries · iOS &amp; Android apps included · Transparent pricing:{' '}
            <span>
              <a className="font-semibold text-gray-700 underline underline-offset-2 decoration-gray-300 hover:text-cta hover:decoration-cta transition-colors" href="/academy/pricing/">
                Academy
              </a>
            </span>
            <span>
              {' · '}
              <a className="font-semibold text-gray-700 underline underline-offset-2 decoration-gray-300 hover:text-cta hover:decoration-cta transition-colors" href="/preschool/pricing/">
                Preschool
              </a>
            </span>
          </p>
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
      <Testimonials />
      <FinalCta />
    </main>
  );
}
