import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { GraduationCap, Heart, School, Users } from 'lucide-react';
import Logo from './Logo';
import { useAppState } from '../lib/store';
import { currentUser } from '../lib/selectors';
import { portalOf } from '../lib/perms';

const NAV_LINK = 'px-2.5 xl:px-4 py-2 font-sans whitespace-nowrap text-sm font-semibold transition-colors';
const NAV_BTN = 'flex items-center gap-1 px-2.5 xl:px-4 py-2 font-sans whitespace-nowrap text-sm font-semibold text-gray-900 hover:text-primary transition-colors';
const PANEL_CARD = 'bg-white rounded-2xl overflow-hidden border border-gray-900/10 shadow-[0_2px_4px_rgb(0_0_0/0.04),0_24px_48px_-12px_rgb(0_0_0/0.18)]';

const PORTALS = [
  ['admin', 'Management', 'Principal, correspondent and administrators', School, 'text-cta'],
  ['teachers', 'Teachers', 'Attendance, assignments, marks and AI Copilot', Users, 'text-primary'],
  ['students', 'Students', 'Learning hub, AI tutor, planner and growth passport', GraduationCap, 'text-accent'],
  ['parents', 'Parents', 'Attendance, results, fees and teacher communication', Heart, 'text-[#8e2155]'],
];

function Chevron({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PortalsMenu() {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div className="relative" onMouseEnter={() => { clearTimeout(timer.current); setOpen(true); }} onMouseLeave={() => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 150); }}>
      <button className={NAV_BTN} onClick={() => setOpen(!open)} aria-expanded={open}>Portals<Chevron open={open} /></button>
      {open && (
        <div className="absolute top-full start-1/2 -translate-x-1/2 pt-2 w-[340px]">
          <div className={`${PANEL_CARD} p-2`}>
            {PORTALS.map(([hash, title, blurb, Icon, tone]) => (
              <Link key={hash} to={`/features#${hash}`} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-xl p-3 hover:bg-primary-50 transition-colors">
                <Icon className={`w-5 h-5 mt-0.5 ${tone}`} />
                <span><span className="block text-sm font-bold text-gray-900">{title}</span><span className="block text-sm text-gray-600">{blurb}</span></span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const s = useAppState();
  const me = currentUser(s);
  useEffect(() => setMobileOpen(false), [loc.pathname, loc.hash]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const link = ({ isActive }) => `${NAV_LINK} ${isActive ? 'text-primary' : 'text-gray-900 hover:text-primary'}`;
  const cta = 'px-4 xl:px-5 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl bg-cta text-white shadow-md shadow-cta/25 hover:bg-cta-dark transition-all';
  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-[border-color,box-shadow] duration-300 ${scrolled ? 'border-gray-900/10 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(0_0_0/0.12)]' : 'border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Link className="flex-shrink-0" to="/" aria-label="SchoolOS AI home"><Logo /></Link>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            <NavLink end to="/features" className={link}>Platform</NavLink>
            <PortalsMenu />
            <Link className={`${NAV_LINK} text-gray-900 hover:text-primary`} to="/features#ai">AI features</Link>
            <NavLink to="/demo" className={link}>Demo walkthrough</NavLink>
          </nav>
          <div className="hidden lg:flex items-center gap-1 xl:gap-3">
            {me ? (
              <Link to={`/app/${portalOf(me.role)}`} className={cta}>Open my portal</Link>
            ) : (
              <>
                <Link to="/login" className={`${NAV_LINK} text-gray-900 hover:text-primary`}>Login</Link>
                <Link to="/demo" className={cta}>Try the live demo</Link>
              </>
            )}
          </div>
          <button className="lg:hidden p-2 text-gray-700" aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-1">
            <Link className="block px-3 py-2.5 text-sm font-semibold text-gray-900" to="/features">Platform</Link>
            {PORTALS.map(([hash, title]) => <Link key={hash} className="block ps-7 pe-3 py-2 text-sm text-gray-700 hover:text-primary" to={`/features#${hash}`}>{title} portal</Link>)}
            <Link className="block px-3 py-2.5 text-sm font-semibold text-gray-900" to="/features#ai">AI features</Link>
            <Link className="block px-3 py-2.5 text-sm font-semibold text-gray-900" to="/demo">Demo walkthrough</Link>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {me ? <Link to={`/app/${portalOf(me.role)}`} className="block px-3 py-2.5 text-sm font-semibold rounded-xl text-white bg-cta text-center">Open my portal</Link> : <><Link to="/login" className="block px-3 py-2.5 text-sm font-medium text-gray-700 text-center border border-gray-200">Login</Link><Link to="/demo" className="block px-3 py-2.5 text-sm font-semibold rounded-xl text-white bg-cta text-center">Try the live demo</Link></>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
