import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, RefreshCw, X, Users2, ShieldAlert } from 'lucide-react';
import { useAppState, isStorageFull } from '../lib/store';
import { currentUser, childrenOf, idx, myNotifications } from '../lib/selectors';
import { can, portalOf, ROLES } from '../lib/perms';
import { cx, fmtDateTime } from '../lib/util';
import { loginAs, logout, markAllNotificationsRead, markNotificationRead, resetDemoData } from '../lib/actions';
import { Avatar, Badge, Button, Modal, useConfirm, useRun } from '../ui/kit';
import { NAV, PORTAL_ICON, PORTAL_LABEL } from './nav';
import Logo from '../components/Logo';
import GeoBackground from '../components/GeoBackground';

export const useMe = () => {
  const s = useAppState();
  const user = currentUser(s);
  return { s, user, role: user?.role, portal: portalOf(user?.role) };
};

// Parent can have several children; students have exactly one.
const ChildCtx = createContext(null);
export function useActiveStudent() {
  return useContext(ChildCtx);
}
function ChildProvider({ children }) {
  const { s, user } = useMe();
  const [pick, setPick] = useState(() => sessionStorage.getItem('schoolos.child') || '');
  const kids = useMemo(() => (user?.role === 'parent' ? childrenOf(s, user.linkedId) : user?.role === 'student' ? [idx(s).students[user.linkedId]].filter(Boolean) : []), [s, user]);
  const student = kids.find((k) => k.id === pick) || kids[0] || null;
  const value = useMemo(() => ({ student, kids, setChild: (id) => { sessionStorage.setItem('schoolos.child', id); setPick(id); } }), [student, kids]);
  return <ChildCtx.Provider value={value}>{children}</ChildCtx.Provider>;
}
export function ChildSwitcher() {
  const { kids, student, setChild } = useActiveStudent();
  if (kids.length < 2) return null;
  return (
    <div className="flex items-center gap-2 mb-4" role="group" aria-label="Choose child">
      <span className="text-sm font-semibold text-gray-600 inline-flex items-center gap-1.5"><Users2 className="w-4 h-4" />Viewing</span>
      {kids.map((k) => <button key={k.id} onClick={() => setChild(k.id)} aria-pressed={student?.id === k.id} className={cx('px-3 py-1.5 rounded-lg text-sm font-semibold border', student?.id === k.id ? 'bg-primary text-white border-primary' : 'bg-white border-gray-300 text-gray-700 hover:border-primary')}>{k.name.split(' ')[0]} · Class {k.sectionId}</button>)}
    </div>
  );
}

/** Route guard: signed in and allowed into this portal; optionally requires a permission. */
export function PortalGuard({ portal, children }) {
  return <PortalGuardInner portal={portal}>{children}</PortalGuardInner>;
}
function PortalGuardInner({ portal, children }) {
  const { user, portal: mine } = useMe();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (mine !== portal) return <Navigate to={`/app/${mine}`} replace />;
  return (
    <ChildProvider>
      <Shell portal={portal}>{children}</Shell>
    </ChildProvider>
  );
}
export function RequirePerm({ perm, children }) {
  const { user } = useMe();
  if (!can(user?.role, perm)) return <NoAccess />;
  return children;
}
export function NoAccess() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <span className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 grid place-items-center"><ShieldAlert className="w-7 h-7" /></span>
      <h1 className="mt-4 text-xl font-extrabold text-gray-900">You don’t have access to this page</h1>
      <p className="mt-2 text-gray-600">Your role does not include this area. Switch role from the top bar or return to your dashboard.</p>
    </div>
  );
}

const DEMO_ACCOUNTS = [
  ['admin', 'Correspondent / Super Admin'], ['principal', 'Principal'], ['schoolAdmin', 'School Admin (limited)'], ['teacher', 'Teacher'], ['student', 'Student'], ['parent', 'Parent'],
];

function RoleSwitcher() {
  const { s, user } = useMe();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const ids = s.demo.userIds;
  const run = useRun();
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white ps-1.5 pe-2.5 py-1.5 hover:border-gray-300">
        <Avatar name={user.name} size={30} color="#d01858" />
        <span className="hidden sm:block text-start leading-tight"><span className="block text-[13px] font-bold text-gray-900 max-w-[150px] truncate">{user.name}</span><span className="block text-[11px] text-gray-500">{ROLES[user.role].label}</span></span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 mt-2 w-72 rounded-2xl bg-white border border-gray-200 shadow-xl p-2 z-50">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">Demo role switcher</div>
          <p className="px-3 pb-2 text-xs text-gray-500">For demonstrations only. Real deployments use individual sign-in.</p>
          {DEMO_ACCOUNTS.map(([key, label]) => (
            <button key={key} role="menuitem" onClick={() => { const r = loginAs(ids[key]); setOpen(false); nav(`/app/${portalOf(r.role)}`); }} className={cx('w-full text-start flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-50', user.id === ids[key] && 'bg-primary-50 font-semibold')}>
              <span>{label}</span>{user.id === ids[key] && <Badge tone="blue">Current</Badge>}
            </button>
          ))}
          <div className="my-2 border-t border-gray-100" />
          <button role="menuitem" onClick={() => { logout(); nav('/'); }} className="w-full text-start flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"><LogOut className="w-4 h-4" />Sign out</button>
          <button role="menuitem" onClick={() => { setOpen(false); window.dispatchEvent(new Event('schoolos:reset')); }} className="w-full text-start flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"><RefreshCw className="w-4 h-4" />Reset demo data…</button>
        </div>
      )}
    </div>
  );
}
function useOutside(ref, fn) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && fn();
    const k = (e) => e.key === 'Escape' && fn();
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  });
}

function Bells() {
  const { s, user } = useMe();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const list = myNotifications(s, user.id);
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} className="relative p-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300">
        <Bell className="w-[18px] h-[18px] text-gray-700" />
        {unread > 0 && <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cta text-white text-[10px] font-bold grid place-items-center">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 mt-2 w-[min(92vw,360px)] rounded-2xl bg-white border border-gray-200 shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"><b className="text-sm text-gray-900">Notifications</b><button disabled={!unread} onClick={() => markAllNotificationsRead()} className="text-xs font-semibold text-primary disabled:text-gray-400">Mark all read</button></div>
          <ul className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {list.slice(0, 20).map((n) => (
              <li key={n.id}>
                <button onClick={() => { markNotificationRead(n.id); setOpen(false); if (n.link) nav(n.link.startsWith('/app/announcements') ? `/app/${portalOf(user.role)}/announcements` : n.link); }} className={cx('w-full text-start px-4 py-3 hover:bg-gray-50', !n.read && 'bg-primary-50/60')}>
                  <p className="text-[13px] text-gray-800 leading-snug">{n.text}</p><p className="text-[11px] text-gray-500 mt-1">{fmtDateTime(n.at)}</p>
                </button>
              </li>
            ))}
            {!list.length && <li className="px-4 py-8 text-center text-sm text-gray-500">You’re all caught up.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function Shell({ portal, children }) {
  const { s, user } = useMe();
  const [drawer, setDrawer] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const run = useRun();
  useEffect(() => setDrawer(false), [loc.pathname]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    const open = () => setResetOpen(true);
    window.addEventListener('schoolos:reset', open);
    return () => window.removeEventListener('schoolos:reset', open);
  }, []);
  const groups = NAV[portal].map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(user.role, i.perm)) })).filter((g) => g.items.length);
  const PIcon = PORTAL_ICON[portal];
  const side = (
    <nav aria-label="Main" className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center border-b border-gray-100 shrink-0"><Link to={`/app/${portal}`}><Logo /></Link></div>
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 rounded-xl bg-ink text-white px-3 py-2.5"><PIcon className="w-4 h-4 text-cta-soft" /><div className="leading-tight"><div className="text-[11px] text-white/60">{s.school.name}</div><div className="text-[13px] font-bold">{PORTAL_LABEL[portal]} portal</div></div></div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((g) => (
          <div key={g.group} className="mt-3">
            <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">{g.group}</div>
            {g.items.map((i) => (
              <NavLink key={i.to} to={`/app/${portal}${i.to ? '/' + i.to : ''}`} end={i.end} className={({ isActive }) => cx('flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-semibold transition-colors', isActive ? 'bg-cta/10 text-cta relative before:absolute before:start-0 before:inset-y-2 before:w-[3px] before:rounded-full before:bg-cta' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')}>
                <i.icon className="w-[18px] h-[18px] shrink-0" />{i.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen bg-gray-50"><GeoBackground variant="app" />
      <aside className="hidden lg:block fixed inset-y-0 start-0 w-64 bg-white border-e border-gray-200 z-30">{side}</aside>
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 start-0 w-72 bg-white shadow-2xl">{side}</aside>
        </div>
      )}
      <div className="lg:ps-64">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="flex items-center gap-3 h-16 px-4 lg:px-8">
            <button className="lg:hidden p-2 -ms-2 rounded-lg hover:bg-gray-100" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu className="w-6 h-6" /></button>
            <Badge tone="amber" className="hidden sm:inline-flex">DEMO MODE · fictional data</Badge>
            <div className="ms-auto flex items-center gap-2"><Bells /><RoleSwitcher /></div>
          </div>
        </header>
        <main key={loc.pathname} className="px-4 lg:px-8 py-6 max-w-[1400px] page-in" id="main">
          {isStorageFull() && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm px-3 py-2">Browser storage is full, so recent changes may not persist after refresh. Use “Reset demo data” to free space.</div>}
          {children}
        </main>
      </div>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset demo data?" footer={<><Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button><Button onClick={() => { run(() => resetDemoData(), 'Demo data restored to its original state.'); setResetOpen(false); nav(`/app/${portal}`); }}>Reset everything</Button></>}>
        <p className="text-[15px] text-gray-700 leading-relaxed">This discards every change made in this browser (attendance, marks, assignments, messages and so on) and restores the original fictional school. You will stay signed in as {user.name}.</p>
      </Modal>
    </div>
  );
}

export function useParamStudent() {
  const { id } = useParams();
  const { s } = useMe();
  return idx(s).students[id];
}

