// Small shared helpers: dates, ids, seeded random, CSV.

const pad = (n) => String(n).padStart(2, '0');
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const isWeekend = (iso) => [0, 6].includes(fromISO(iso).getDay());
/** Latest weekday on or before `date` (the "school day" used as today in the demo). */
export function latestSchoolDay(date = new Date()) {
  let iso = toISO(date);
  while (isWeekend(iso)) iso = addDays(iso, -1);
  return iso;
}
export const todayISO = () => latestSchoolDay(new Date());
export const today = todayISO;
export const schoolDaysBack = (fromIso, count) => {
  const out = [];
  let d = fromIso;
  while (out.length < count) {
    if (!isWeekend(d)) out.push(d);
    d = addDays(d, -1);
  }
  return out.reverse();
};
export const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Intl.DateTimeFormat('en-IN', opts).format(fromISO(iso.slice(0, 10))) : '';
export const fmtShort = (iso) => fmtDate(iso, { day: 'numeric', month: 'short' });
export const fmtDateTime = (iso) =>
  iso ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '';
export const weekdayShort = (iso) => new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(fromISO(iso));
export const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const pct = (a, b, digits = 0) => (b ? Number(((a / b) * 100).toFixed(digits)) : 0);
export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const initials = (name = '') =>
  name
    .replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/** Deterministic PRNG (mulberry32) so the demo dataset is identical on every reset. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => Math.floor(next() * (hi - lo + 1)) + lo;
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  next.normal = (mean = 0, sd = 1) => {
    const u = 1 - next();
    const v = next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return next;
}

let counter = 0;
export const uid = (prefix) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

export function toCSV(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(',')).join('\n');
  return `${head}\n${body}`;
}
export function downloadFile(name, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const cx = (...c) => c.filter(Boolean).join(' ');
