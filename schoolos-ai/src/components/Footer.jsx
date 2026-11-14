import { Link } from 'react-router-dom';
import Logo from './Logo';

const LINK = 'text-base text-gray-300 hover:text-white transition-colors';
const H3 = 'text-xs font-bold uppercase tracking-[0.2em] text-white mb-5';
const COLS = [
  ['Platform', [['/features', 'Overview'], ['/features#ai', 'AI features'], ['/demo', 'Demo walkthrough'], ['/login', 'Login']]],
  ['Portals', [['/features#admin', 'Management'], ['/features#teachers', 'Teachers'], ['/features#students', 'Students'], ['/features#parents', 'Parents']]],
  ['Try it', [['/demo', 'Open the demo school'], ['/login', 'Sign in with a demo account']]],
];

export default function Footer() {
  return (
    <footer className="bg-ink text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-xs">The Intelligent School Operating System. One platform to manage school operations, empower teachers and accelerate every student&apos;s growth.</p>
          </div>
          {COLS.map(([title, links]) => (
            <div key={title}>
              <h3 className={H3}>{title}</h3>
              <ul className="space-y-3">{links.map(([to, label]) => <li key={label}><Link className={LINK} to={to}>{label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-500">© 2026 SchoolOS AI. The demo school, people and records shown are fictional.</span>
          <span className="text-xs text-gray-500">The Intelligent School Operating System</span>
        </div>
      </div>
    </footer>
  );
}
