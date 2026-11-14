/**
 * Placeholder product dashboard, drawn in code at the original screenshot's
 * 1600x865 aspect ratio. All figures are invented sample data.
 */
const PALETTES = {
  academy: { rail: '#0e2a4a', accent: '#0f5aa8', soft: '#dbe9fb', bar: '#2f7de1' },
  preschool: { rail: '#3a1030', accent: '#8e2155', soft: '#f6dce8', bar: '#c4467f' },
};

function Rail({ p }) {
  return (
    <g>
      <rect x="0" y="0" width="64" height="865" fill={p.rail} />
      <rect x="14" y="20" width="36" height="36" rx="8" fill="#ffffff" opacity=".9" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="20" y={88 + i * 52} width="24" height="24" rx="6" fill="#ffffff" opacity={i === 0 ? 0.55 : 0.18} />
      ))}
    </g>
  );
}

function StatCard({ x, y, label, value, note, p }) {
  return (
    <g>
      <rect x={x} y={y} width="340" height="150" rx="10" fill="#fff" stroke="#e4e4e7" />
      <text x={x + 18} y={y + 32} fontSize="12" fontWeight="700" letterSpacing="1.2" fill="#71717a">{label}</text>
      <text x={x + 18} y={y + 84} fontSize="36" fontWeight="800" fill="#18181b">{value}</text>
      <text x={x + 18} y={y + 112} fontSize="13" fill="#71717a">{note}</text>
      <rect x={x + 262} y={y + 104} width="22" height="28" fill={p.soft} />
      <rect x={x + 292} y={y + 90} width="22" height="42" fill={p.bar} />
    </g>
  );
}

export default function DashboardMock({ variant = 'academy', className = '' }) {
  const p = PALETTES[variant];
  const isAcademy = variant === 'academy';
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const heights = isAcademy ? [60, 8, 60, 8, 24, 8, 8] : [48, 48, 36, 48, 24, 8, 8];
  const rows = isAcademy
    ? [['Beginner Piano', 'Mon 4:00 PM', '8/10'], ['Junior Ballet', 'Tue 5:30 PM', '6/12'], ['Swim Level 2', 'Wed 4:30 PM', '9/10'], ['Chess Club', 'Fri 3:30 PM', '5/8']]
    : [['Sunbeams (3-4y)', 'Mon-Fri 8:00 AM', '14/16'], ['Butterflies (4-5y)', 'Mon-Fri 8:00 AM', '18/20'], ['Toddlers (2-3y)', 'Mon-Fri 8:30 AM', '9/10'], ['After-care', 'Mon-Fri 3:00 PM', '11/15']];

  return (
    <svg
      viewBox="0 0 1600 865"
      width="1600"
      height="865"
      className={className}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif', background: '#f6f7f9' }}
    >
      <rect width="1600" height="865" fill="#f6f7f9" />
      <Rail p={p} />
      <rect x="64" y="0" width="1536" height="64" fill="#fff" stroke="#e4e4e7" />
      <rect x="92" y="20" width="150" height="24" rx="12" fill="#f0f1f3" />
      <rect x="1230" y="16" width="190" height="32" rx="8" fill={p.accent} />
      <circle cx="1470" cy="32" r="16" fill={p.soft} />
      <rect x="1494" y="22" width="70" height="8" rx="4" fill="#d4d4d8" />
      <rect x="1494" y="36" width="44" height="6" rx="3" fill="#e4e4e7" />

      <text x="92" y="118" fontSize="22" fontWeight="800" fill="#18181b">Good morning</text>
      <text x="92" y="142" fontSize="13" fill="#71717a">Here is what is happening today</text>

      <StatCard x={92} y={170} label="MONEY · THIS MONTH" value="$4,820" note="12 invoices open" p={p} />
      <StatCard x={452} y={170} label={isAcademy ? 'ACTIVE STUDENTS' : 'CHILDREN ENROLLED'} value={isAcademy ? '128' : '52'} note="across all classes" p={p} />
      <StatCard x={812} y={170} label="ATTENDANCE · 7 DAYS" value="94%" note="steady week" p={p} />
      <StatCard x={1172} y={170} label="PIPELINE" value="17" note="new leads this month" p={p} />

      <rect x="92" y="352" width="720" height="470" rx="10" fill="#fff" stroke="#e4e4e7" />
      <text x="116" y="386" fontSize="12" fontWeight="700" letterSpacing="1.2" fill="#71717a">WEEK AHEAD</text>
      {days.map((d, i) => (
        <g key={d}>
          <text x={150 + i * 90} y="430" fontSize="12" fontWeight="700" fill="#a1a1aa" textAnchor="middle">{d}</text>
          <rect x={138 + i * 90} y={500 - heights[i]} width="24" height={heights[i]} rx="3" fill={p.soft} />
        </g>
      ))}
      {rows.map((r, i) => (
        <g key={r[0]}>
          <rect x="116" y={540 + i * 62} width="672" height="48" rx="8" fill="#fafafa" stroke="#f0f0f2" />
          <text x="136" y={570 + i * 62} fontSize="15" fontWeight="700" fill="#18181b">{r[0]}</text>
          <text x="420" y={570 + i * 62} fontSize="14" fill="#71717a">{r[1]}</text>
          <text x="740" y={570 + i * 62} fontSize="14" fontWeight="700" fill={p.accent} textAnchor="end">{r[2]}</text>
        </g>
      ))}

      <rect x="836" y="352" width="672" height="470" rx="10" fill="#fff" stroke="#e4e4e7" />
      <text x="860" y="386" fontSize="12" fontWeight="700" letterSpacing="1.2" fill="#71717a">QUICK STATS</text>
      {['Classes today', 'Expected', 'Staff on duty', 'Revenue today'].map((l, i) => (
        <g key={l}>
          <text x="860" y={436 + i * 48} fontSize="14" fill="#52525b">{l}</text>
          <text x="1484" y={436 + i * 48} fontSize="14" fontWeight="700" fill="#18181b" textAnchor="end">{['6', '48', '9', '$0'][i]}</text>
          <line x1="860" x2="1484" y1={450 + i * 48} y2={450 + i * 48} stroke="#f0f0f2" />
        </g>
      ))}
      <rect x="860" y="640" width="624" height="150" rx="8" fill={p.soft} opacity=".55" />
      <text x="880" y="676" fontSize="13" fontWeight="700" fill={p.accent}>Today&apos;s schedule</text>
      <rect x="880" y="696" width="420" height="10" rx="5" fill={p.bar} opacity=".5" />
      <rect x="880" y="722" width="300" height="10" rx="5" fill={p.bar} opacity=".35" />
      <rect x="880" y="748" width="360" height="10" rx="5" fill={p.bar} opacity=".25" />
    </svg>
  );
}
