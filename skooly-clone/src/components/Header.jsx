import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Globe } from 'lucide-react';
import Wordmark from './Wordmark';
import {
  ACADEMY_AUDIENCES,
  ACADEMY_FEATURES,
  LANGUAGES,
  LINKS,
  PRESCHOOL_AUDIENCES,
  PRESCHOOL_FEATURES,
} from '../config';

const NAV_LINK = 'px-2.5 xl:px-4 py-2 font-sans whitespace-nowrap text-sm font-semibold transition-colors';
const NAV_BTN =
  'flex items-center gap-1 px-2.5 xl:px-4 py-2 font-sans whitespace-nowrap text-sm font-semibold text-gray-900 hover:text-primary transition-colors';
const PANEL_CARD =
  'bg-white rounded-2xl overflow-hidden border border-gray-900/10 shadow-[0_2px_4px_rgb(0_0_0/0.04),0_24px_48px_-12px_rgb(0_0_0/0.18)]';
const FEATURE_LINK =
  'block rounded-lg px-2.5 py-2 text-sm font-medium text-gray-800 hover:bg-primary-50 hover:text-primary transition-colors';
const AUDIENCE_LINK = 'text-sm font-medium text-gray-600 hover:text-primary transition-colors';

function Chevron({ open }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LanguagePill() {
  return (
    <span className="relative inline-flex items-center gap-1.5 ps-3 pe-2.5 py-2 rounded-full border border-transparent hover:border-gray-200 focus-within:border-gray-200 transition-colors group">
      <Globe className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" strokeWidth={1.8} aria-hidden="true" />
      <span className="font-sans text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">English</span>
      <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary transition-colors" aria-hidden="true" />
      <select
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label="Language"
        defaultValue="en"
        onChange={(e) => {
          // Localised routes are outside this clone's scope; keep the control in place.
          e.target.value = 'en';
        }}
      >
        {LANGUAGES.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
    </span>
  );
}

function ProductHeader({ href, dot, tint, hoverTint, title, blurb }) {
  return (
    <a
      className={`group/prod flex items-center justify-between gap-3 rounded-xl p-3 ${tint} ${hoverTint} transition-colors`}
      href={href}
    >
      <div>
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className={`w-2 h-2 rounded-[3px] ${dot}`} aria-hidden="true" />
          {title}
        </span>
        <p className="text-sm text-gray-600 mt-0.5">{blurb}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-hover/prod:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}

function FeaturesPanel() {
  return (
    <div className="fixed top-18 left-1/2 -translate-x-1/2 pt-2 w-[840px]">
      <div className={`${PANEL_CARD} p-3`}>
        <div className="grid grid-cols-2 gap-3">
          <div className="pe-3 border-e border-gray-100">
            <ProductHeader
              href="/academy/"
              dot="bg-[#22405f]"
              tint="bg-[#22405f]/[0.05]"
              hoverTint="hover:bg-[#22405f]/[0.1]"
              title="Academy"
              blurb="For music schools, dance studios, sports academies & more"
            />
            <div className="mt-2 grid grid-cols-2 gap-x-1">
              {ACADEMY_FEATURES.map(([slug, label]) => (
                <a key={slug} className={FEATURE_LINK} href={`/academy/features/${slug}/`}>
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-2 px-2.5 pt-2.5 border-t border-gray-100">
              <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-1.5">Who it's for</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {ACADEMY_AUDIENCES.map(([slug, label]) => (
                  <a key={slug} className={AUDIENCE_LINK} href={`/academy/for/${slug}/`}>
                    {label}
                  </a>
                ))}
                <a className="text-sm font-medium text-primary hover:text-primary-dark transition-colors" href="/academy/#who-its-for">
                  All 11 academy types →
                </a>
              </div>
            </div>
            <div className="mt-1 p-2.5 border-t border-gray-100">
              <a className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-dark" href="/academy/features/">
                All Academy Features →
              </a>
            </div>
          </div>
          <div>
            <ProductHeader
              href="/preschool/"
              dot="bg-[#8e2155]"
              tint="bg-[#8e2155]/[0.05]"
              hoverTint="hover:bg-[#8e2155]/[0.1]"
              title="Preschool"
              blurb="For preschools, daycares & nurseries"
            />
            <div className="mt-2 grid grid-cols-2 gap-x-1">
              {PRESCHOOL_FEATURES.map(([slug, label]) => (
                <a key={slug} className={FEATURE_LINK} href={`/preschool/features/${slug}/`}>
                  {label}
                </a>
              ))}
            </div>
            <div className="mt-2 px-2.5 pt-2.5 border-t border-gray-100">
              <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-1.5">Who it's for</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {PRESCHOOL_AUDIENCES.map(([slug, label]) => (
                  <a key={slug} className={AUDIENCE_LINK} href={`/preschool/for/${slug}/`}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-1 p-2.5 border-t border-gray-100">
              <a className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-dark" href="/preschool/features/">
                All Preschool Features →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingPanel() {
  return (
    <div className="absolute top-full start-1/2 -translate-x-1/2 pt-2 w-[220px]">
      <div className={`${PANEL_CARD} p-1`}>
        {[
          ['/academy/pricing/', 'Academy'],
          ['/preschool/pricing/', 'Preschool'],
        ].map(([href, label]) => (
          <a key={href} className="group block p-3 hover:bg-primary-50 transition-colors" href={href}>
            <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary">{label}</span>
            <span className="block text-sm text-gray-600 mt-0.5">Simple, transparent plans</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/** Dropdown that opens on hover (closes 150ms after leave) and toggles on click. */
function NavDropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearTimeout(timer.current);
        setOpen(true);
      }}
      onMouseLeave={() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setOpen(false), 150);
      }}
    >
      <button className={NAV_BTN} onClick={() => setOpen(!open)}>
        {label}
        <Chevron open={open} />
      </button>
      {open && children}
    </div>
  );
}

function MobileMenu({ onNavigate }) {
  const sub = 'block px-3 py-2 text-sm text-gray-700 hover:text-primary';
  const subStrong = 'block px-3 py-2 text-sm font-medium text-primary';
  const top = 'block px-3 py-2.5 text-sm font-semibold text-gray-900';
  return (
    <div className="lg:hidden bg-white border-t border-gray-200" onClick={(e) => e.target.closest('a') && onNavigate()}>
      <div className="px-4 py-4 space-y-1">
        <a className={top} href="/academy/">Academy</a>
        <div className="ps-4 space-y-0.5">
          {ACADEMY_FEATURES.slice(0, 5).map(([slug, label]) => (
            <a key={slug} className={sub} href={`/academy/features/${slug}/`}>{label}</a>
          ))}
          <a className={subStrong} href="/academy/features/">All Academy Features →</a>
        </div>
        <a className={top} href="/preschool/">Preschool</a>
        <div className="ps-4 space-y-0.5">
          {PRESCHOOL_FEATURES.slice(0, 4).map(([slug, label]) => (
            <a key={slug} className={sub} href={`/preschool/features/${slug}/`}>{label}</a>
          ))}
          <a className={subStrong} href="/preschool/features/">All Preschool Features →</a>
        </div>
        <a className={top} href="/therapy-early-intervention/">Therapy</a>
        <div className="px-3 py-2.5 text-sm font-semibold text-gray-900">Pricing</div>
        <div className="ps-4 space-y-0.5">
          <a className={sub} href="/academy/pricing/">Academy</a>
          <a className={sub} href="/preschool/pricing/">Preschool</a>
        </div>
        <a className={top} href="/support/">Support</a>
        <a className={top} href="/demo/">Schedule Demo</a>
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <LanguagePill />
          <a href={LINKS.login} className="block px-3 py-2.5 text-sm font-medium text-gray-700 text-center border border-gray-200">Login</a>
          <a href={LINKS.register} className="block px-3 py-2.5 text-sm font-semibold rounded-xl text-white bg-cta text-center">Start Free Pilot</a>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = typeof window === 'undefined' ? '/' : window.location.pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const active = (seg) => path.includes(seg);
  const link = (seg) => `${NAV_LINK} ${active(seg) ? 'text-primary' : 'text-gray-900 hover:text-primary'}`;

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-[border-color,box-shadow] duration-300 ${
        scrolled
          ? 'border-gray-900/10 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(0_0_0/0.12)]'
          : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <a className="flex-shrink-0" href="/">
            <Wordmark className="h-7 w-auto lg:h-8" />
          </a>
          <nav className="hidden lg:flex items-center gap-1">
            <a className={link('/academy')} href="/academy/">Academy</a>
            <a className={link('/preschool')} href="/preschool/">Preschool</a>
            <a className={link('/therapy-early-intervention')} href="/therapy-early-intervention/">Therapy</a>
            <NavDropdown label="Features"><FeaturesPanel /></NavDropdown>
            <NavDropdown label="Pricing"><PricingPanel /></NavDropdown>
            <a className={`hidden xl:block ${NAV_LINK} text-gray-900 hover:text-primary`} href="/support/">Support</a>
          </nav>
          <div className="hidden lg:flex items-center gap-1 xl:gap-3">
            <LanguagePill />
            <a className={`${NAV_LINK} text-gray-900 hover:text-primary`} href="/demo/">Schedule Demo</a>
            <a href={LINKS.login} className={`${NAV_LINK} text-gray-900 hover:text-primary`}>Login</a>
            <a
              href={LINKS.register}
              className="px-4 xl:px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl bg-cta text-white shadow-md shadow-cta/25 hover:bg-cta-dark transition-all"
            >
              Start Free Pilot
            </a>
          </div>
          <button className="lg:hidden p-2 text-gray-700" aria-label="Toggle menu" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && <MobileMenu onNavigate={() => setMobileOpen(false)} />}
    </header>
  );
}
