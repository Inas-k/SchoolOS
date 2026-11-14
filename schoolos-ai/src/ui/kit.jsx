import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Download, Info, Search, X, XCircle, Inbox } from 'lucide-react';
import { cx, downloadFile, toCSV } from '../lib/util';
import GeoBackground from '../components/GeoBackground';

// ───────── Toasts ─────────
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((kind, text) => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);
  const api = useMemo(() => ({ success: (t) => push('success', t), error: (t) => push('error', t), info: (t) => push('info', t) }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 w-[min(92vw,380px)]" role="status" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className={cx('flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg animate-fade-in', i.kind === 'error' ? 'border-red-200' : i.kind === 'success' ? 'border-emerald-200' : 'border-gray-200')}>
            {i.kind === 'error' ? <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> : i.kind === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
            <p className="text-sm text-gray-800 leading-snug">{i.text}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
/** Run an action; toast the result. Returns true on success. */
export function useRun() {
  const toast = useToast();
  return useCallback((fn, ok) => {
    try {
      const r = fn();
      if (ok) toast.success(typeof ok === 'function' ? ok(r) : ok);
      return true;
    } catch (e) {
      toast.error(e.message || 'Something went wrong.');
      return false;
    }
  }, [toast]);
}

// ───────── Layout atoms ─────────
export const Card = ({ className, children, ...p }) => <div className={cx('card-soft', className)} {...p}>{children}</div>;
export function Section({ title, subtitle, action, children, className, pad = true }) {
  return (
    <Card className={cx('overflow-hidden min-w-0', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? 'px-5 pb-5' : ''}>{children}</div>
    </Card>
  );
}
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-[15px] text-gray-600 mt-1 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
const TONES = {
  gray: 'bg-gray-100 text-gray-700', blue: 'bg-primary/10 text-primary', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700', pink: 'bg-cta/10 text-cta', purple: 'bg-violet-50 text-violet-700',
};
const ACCENT = { blue: 'before:bg-primary', pink: 'before:bg-cta', green: 'before:bg-emerald-500', amber: 'before:bg-amber-500', red: 'before:bg-red-500', purple: 'before:bg-violet-500', gray: 'before:bg-gray-300' };
export function WelcomeBanner({ title, subtitle }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink via-[#14294a] to-[#22405f] text-white px-6 py-6 lg:px-8 lg:py-7 mb-5">
      <GeoBackground variant="banner" /><div className="absolute -top-16 -end-10 w-56 h-56 rounded-full bg-cta/25 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-20 start-1/3 w-64 h-64 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <h1 className="text-2xl lg:text-[30px] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-white/75">{subtitle}</p>}
      </div>
    </div>
  );
}
export const Badge = ({ tone = 'gray', children, className }) => <span className={cx('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap', TONES[tone], className)}>{children}</span>;
export function Stat({ label, value, sub, icon: Icon, tone = 'blue', to, onClick }) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-gray-600">{label}</div>
        <div className="mt-1 text-2xl lg:text-[28px] font-extrabold text-gray-900 tabular-nums tracking-tight">{value}</div>
        {sub && <div className="mt-0.5 text-[13px] text-gray-600">{sub}</div>}
      </div>
      {Icon && <span className={cx('w-10 h-10 rounded-xl grid place-items-center shrink-0', TONES[tone])}><Icon className="w-5 h-5" /></span>}
    </div>
  );
  const cls = `card-soft relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:content-[''] ${ACCENT[tone]} p-4 lg:p-5 block text-start w-full`;
  if (to) return <LinkLike to={to} className={cx(cls, 'card-soft-hover hover:-translate-y-0.5')}>{body}</LinkLike>;
  if (onClick) return <button onClick={onClick} className={cx(cls, 'card-soft-hover')}>{body}</button>;
  return <div className={cls}>{body}</div>;
}
import { Link } from 'react-router-dom';
const LinkLike = ({ to, children, ...p }) => <Link to={to} {...p}>{children}</Link>;
export const ProgressBar = ({ value, tone = 'blue', className, label }) => {
  const v = Math.max(0, Math.min(100, value || 0));
  const col = { blue: 'bg-primary', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', pink: 'bg-cta' }[tone];
  return <div className={cx('h-2 rounded-full bg-gray-100 overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><div className={cx('h-full rounded-full transition-all duration-500', col)} style={{ width: `${v}%` }} /></div>;
};
export const toneForPct = (p) => (p >= 85 ? 'green' : p >= 70 ? 'blue' : p >= 55 ? 'amber' : 'red');
export function EmptyState({ title, text, action, icon: Icon = Inbox }) {
  return (
    <div className="text-center py-10 px-4">
      <span className="mx-auto w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 grid place-items-center"><Icon className="w-6 h-6" /></span>
      <p className="mt-3 font-bold text-gray-900">{title}</p>
      {text && <p className="mt-1 text-sm text-gray-600 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export function DemoNote({ children }) {
  return <div className="flex gap-2 items-start rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-900"><Info className="w-4 h-4 mt-0.5 shrink-0" /><div>{children}</div></div>;
}
export const Loading = () => (
  <div className="max-w-5xl mx-auto px-6 py-16 space-y-4" role="status" aria-label="Loading">
    <div className="skeleton h-8 w-1/3" /><div className="skeleton h-4 w-2/3" />
    <div className="grid gap-4 sm:grid-cols-3 pt-4"><div className="skeleton h-28" /><div className="skeleton h-28" /><div className="skeleton h-28" /></div>
    <div className="skeleton h-56" />
  </div>
);

// ───────── Buttons ─────────
export function Button({ variant = 'primary', size = 'md', className, icon: Icon, children, ...p }) {
  const v = {
    primary: 'bg-cta text-white hover:bg-cta-dark shadow-sm', dark: 'bg-gray-900 text-white hover:bg-gray-700', outline: 'bg-white text-gray-900 border border-gray-300 hover:border-cta hover:text-cta', ghost: 'text-gray-700 hover:bg-gray-100', danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50', blue: 'bg-primary text-white hover:bg-primary-dark',
  }[variant];
  const sz = { sm: 'px-3 py-1.5 text-[13px] rounded-lg', md: 'px-4 py-2.5 text-sm rounded-xl', lg: 'px-6 py-3 text-base rounded-xl' }[size];
  return <button type="button" className={cx('inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none', v, sz, className)} {...p}>{Icon && <Icon className="w-4 h-4" />}{children}</button>;
}

// ───────── Modal / confirm ─────────
export function Modal({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-ink/50 animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={cx('relative bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] flex flex-col animate-scale-in', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 id={titleId} className="text-lg font-extrabold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 flex-wrap">{footer}</div>}
      </div>
    </div>
  );
}
export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant={danger ? 'dark' : 'primary'} className={danger ? '!bg-red-600 hover:!bg-red-700' : ''} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <div className="flex gap-3"><AlertTriangle className={cx('w-6 h-6 shrink-0', danger ? 'text-red-600' : 'text-amber-600')} /><p className="text-[15px] text-gray-700 leading-relaxed">{message}</p></div>
    </Modal>
  );
}
export function useConfirm() {
  const [st, setSt] = useState(null);
  const ask = useCallback((opts) => setSt(opts), []);
  const node = <ConfirmDialog open={!!st} {...(st || {})} onClose={() => setSt(null)} onConfirm={() => st?.onConfirm?.()} />;
  return [ask, node];
}

// ───────── Form fields ─────────
const FIELD = 'w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-500';
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-gray-700 mb-1">{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
export const Input = ({ label, hint, error, className, ...p }) => <Field label={label} hint={hint} error={error} className={className}>{(id) => <input id={id} className={FIELD} {...p} />}</Field>;
export const Textarea = ({ label, hint, className, rows = 3, ...p }) => <Field label={label} hint={hint} className={className}>{(id) => <textarea id={id} rows={rows} className={cx(FIELD, 'resize-y')} {...p} />}</Field>;
export const Select = ({ label, hint, options, placeholder, className, ...p }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => (
      <select id={id} className={FIELD} {...p}>
        {placeholder != null && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )}
  </Field>
);
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)} className={cx('px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors', value === t.value ? 'border-cta text-cta' : 'border-transparent text-gray-600 hover:text-gray-900')}>{t.label}{t.count != null && <span className="ms-1.5 text-xs text-gray-500">{t.count}</span>}</button>
      ))}
    </div>
  );
}
export function Checkboxes({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="block text-[13px] font-semibold text-gray-700 mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value);
          return <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])} className={cx('px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors', on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary')}>{o.label}</button>;
        })}
      </div>
    </fieldset>
  );
}
export function FileInput({ label, onFile, hint }) {
  const toast = useToast();
  return (
    <Field label={label} hint={hint || 'Files up to 300 KB are stored in this demo; larger files keep only their name.'}>
      {(id) => <input id={id} type="file" className="block w-full text-sm text-gray-700 file:me-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-gray-200" onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return onFile(null);
        if (f.size > 300 * 1024) { toast.info(`“${f.name}” is larger than 300 KB. Only the file name is kept in this demo.`); return onFile({ name: f.name, data: '' }); }
        const r = new FileReader();
        r.onload = () => onFile({ name: f.name, data: r.result });
        r.readAsDataURL(f);
      }} />}
    </Field>
  );
}

// ───────── DataTable ─────────
export function DataTable({ columns, rows, rowKey = (r) => r.id, search, filters = [], pageSize = 10, exportName, toolbar, onRowClick, empty, initialSort, dense }) {
  const [q, setQ] = useState('');
  const [fv, setFv] = useState({});
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(1);
  const list = useMemo(() => {
    let r = rows;
    if (q && search) r = r.filter((x) => search(x).toLowerCase().includes(q.toLowerCase()));
    for (const f of filters) if (fv[f.key]) r = r.filter((x) => String(f.get(x)) === fv[f.key]);
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      const val = c?.sort || c?.value;
      if (val) r = [...r].sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * (sort.dir === 'asc' ? 1 : -1); });
    }
    return r;
  }, [rows, q, fv, sort, search, filters, columns]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * pageSize, cur * pageSize);
  useEffect(() => setPage(1), [q, fv, sort]);
  const exportCsv = () => downloadFile(`${exportName}.csv`, toCSV(list, columns.filter((c) => c.value).map((c) => ({ label: c.label, value: c.value }))));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {search && (
          <label className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="sr-only">Search</span>
            <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full ps-9 pe-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </label>
        )}
        {filters.map((f) => (
          <select key={f.key} aria-label={f.label} value={fv[f.key] || ''} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <div className="ms-auto flex items-center gap-2">{toolbar}{exportName && <Button variant="outline" size="sm" icon={Download} onClick={exportCsv} disabled={!list.length}>Export CSV</Button>}</div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cx('text-start font-semibold px-3 py-2.5 whitespace-nowrap', c.className)} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.value || c.sort ? <button className="hover:text-gray-900" onClick={() => setSort(sort?.key === c.key ? (sort.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' })}>{c.label}{sort?.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</button> : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shown.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cx('bg-white transition-colors', onRowClick ? 'cursor-pointer hover:bg-primary-50/60' : 'hover:bg-gray-50')}>
                {columns.map((c) => <td key={c.key} className={cx('px-3 align-middle', dense ? 'py-1.5' : 'py-2.5', c.className)}>{c.render ? c.render(r) : c.value?.(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && (empty || <EmptyState title="Nothing to show" text={q || Object.values(fv).some(Boolean) ? 'No records match your search or filters.' : 'There are no records yet.'} />)}
      </div>
      {list.length > pageSize && (
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <span>Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, list.length)} of {list.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" icon={ChevronLeft} aria-label="Previous page" disabled={cur === 1} onClick={() => setPage(cur - 1)} />
            <span className="px-2 tabular-nums">Page {cur} of {pages}</span>
            <Button variant="outline" size="sm" icon={ChevronRight} aria-label="Next page" disabled={cur === pages} onClick={() => setPage(cur + 1)} />
          </div>
        </div>
      )}
      {list.length <= pageSize && list.length > 0 && <p className="mt-2 text-xs text-gray-500">{list.length} record{list.length > 1 ? 's' : ''}</p>}
    </div>
  );
}

// ───────── Charts (SVG, no dependency) ─────────
/** Measures an element's width so charts draw at true pixel size (constant, readable text). */
function useWidth(fallback = 520) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setW(Math.max(220, Math.floor(el.getBoundingClientRect().width)));
    set();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}
export function BarChart({ data, height = 190, max, color = '#0072e5', unit = '', onBarClick, highlight }) {
  const [ref, cw] = useWidth();
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  const longest = Math.max(...data.map((d) => String(d.label).length), 1);
  const minSlot = Math.max(34, longest * 7 + 8); // keeps long labels from colliding; narrower screens scroll
  const w = Math.max(cw, data.length * minSlot);
  const slot = w / data.length;
  const bw = Math.min(34, slot * 0.6);
  return (
    <div ref={ref} className="overflow-x-auto">
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="block" role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((t) => <line key={t} x1="0" x2={w} y1={height - 28 - (height - 52) * t} y2={height - 28 - (height - 52) * t} stroke="#eee" />)}
        {data.map((d, i) => {
          const x = slot * i + (slot - bw) / 2;
          const h = ((height - 52) * (d.value || 0)) / m;
          return (
            <g key={d.label} onClick={onBarClick ? () => onBarClick(d) : undefined} style={{ cursor: onBarClick ? 'pointer' : 'default' }}>
              <rect className="chart-bar" style={{ '--d': `${i * 45}ms` }} x={x} y={height - 28 - h} width={bw} height={Math.max(h, 1)} rx="4" fill={d.color || (highlight && highlight(d) ? '#d01858' : color)}><title>{`${d.label}: ${d.value}${unit}`}</title></rect>
              <text x={x + bw / 2} y={height - 33 - h} textAnchor="middle" fontSize="12" fontWeight="700" fill="#3f3f46">{d.value}{unit}</text>
              <text x={x + bw / 2} y={height - 9} textAnchor="middle" fontSize="12" fill="#52525b">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function LineChart({ series, height = 190, unit = '%', min, max }) {
  const [ref, W] = useWidth();
  const pts = series[0]?.data || [];
  if (!pts.length) return <EmptyState title="No data yet" />;
  const all = series.flatMap((s) => s.data.map((d) => d.value).filter((v) => v != null));
  const lo = min ?? Math.floor(Math.min(...all) - 4);
  const hi = max ?? Math.ceil(Math.max(...all) + 3);
  const padX = 44;
  const shortLabel = (l) => (String(l).length > 12 ? `${String(l).slice(0, 11)}\u2026` : l);
  const x = (i) => padX + ((W - padX - 14) * i) / Math.max(1, pts.length - 1);
  const y = (v) => 14 + (height - 44) * (1 - (v - lo) / (hi - lo || 1));
  const every = Math.max(1, Math.ceil(pts.length / Math.max(2, Math.floor((W - padX) / 64))));
  return (
    <div ref={ref}>
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} className="block" role="img" aria-label="Line chart">
        {[0, 0.5, 1].map((t) => <g key={t}><line x1={padX} x2={W - 8} y1={14 + (height - 44) * t} y2={14 + (height - 44) * t} stroke="#eee" /><text x="0" y={18 + (height - 44) * t} fontSize="12" fill="#71717a">{Math.round(hi - (hi - lo) * t)}{unit}</text></g>)}
        {series.map((s) => {
          const line = s.data.map((d, i) => (d.value == null ? null : `${x(i)},${y(d.value)}`)).filter(Boolean).join(' ');
          const pts2 = s.data.map((d, i) => (d.value == null ? null : [x(i), y(d.value)])).filter(Boolean);
          const base = 14 + (height - 44);
          return (
            <g key={s.name}>
              {pts2.length > 1 && <polygon className="chart-area" points={`${pts2[0][0]},${base} ${line} ${pts2[pts2.length - 1][0]},${base}`} fill={s.color} fillOpacity="0.09" />}
              <polyline className="chart-line" pathLength="1" points={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {s.data.map((d, i) => d.value != null && <circle className="chart-dot" key={i} cx={x(i)} cy={y(d.value)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2"><title>{`${d.label}: ${d.value}${unit}`}</title></circle>)}
            </g>
          );
        })}
        {pts.map((d, i) => i % every === 0 && <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'} fontSize="12" fill="#52525b">{shortLabel(d.label)}</text>)}
      </svg>
      {series.length > 1 && <div className="flex gap-4 text-xs text-gray-600 mt-1">{series.map((s) => <span key={s.name} className="inline-flex items-center gap-1.5"><i className="w-3 h-1 rounded" style={{ background: s.color }} />{s.name}</span>)}</div>}
    </div>
  );
}
export function Donut({ value, size = 110, color = '#0072e5', label, sub }) {
  const r = 42, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90" role="img" aria-label={`${label || ''} ${v}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f0f0f2" strokeWidth="10" />
        <circle className="chart-donut" cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(c * v) / 100} ${c}`} style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="absolute text-center leading-tight"><div className="text-xl font-extrabold text-gray-900 tabular-nums">{Math.round(v)}%</div>{sub && <div className="text-[10px] text-gray-500">{sub}</div>}</div>
    </div>
  );
}
export function HBars({ rows, unit = '%', max = 100 }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-gray-800">{r.label}</span><span className="tabular-nums text-gray-600">{r.value}{unit}{r.note ? ` · ${r.note}` : ''}</span></div>
          <ProgressBar value={(r.value / max) * 100} tone={r.tone || toneForPct(r.value)} label={r.label} />
        </li>
      ))}
    </ul>
  );
}
export function Avatar({ name, size = 36, color }) {
  const ini = name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className="rounded-full grid place-items-center font-bold text-white shrink-0" style={{ width: size, height: size, fontSize: size * 0.38, background: color || '#0e1c30' }} aria-hidden="true">{ini}</span>;
}
