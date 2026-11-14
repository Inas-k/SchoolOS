/** SchoolOS AI logo: a simple original mark (a book with a spark) plus wordmark. */
export function LogoMark({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#0e1c30" />
      <path d="M9 13.5c3.8-1.2 7.4-.9 11 1.4v14.2c-3.6-2.3-7.2-2.6-11-1.4z" fill="#fff" />
      <path d="M31 13.5c-3.8-1.2-7.4-.9-11 1.4v14.2c3.6-2.3 7.2-2.6 11-1.4z" fill="#f3adc8" />
      <path d="M30.5 5.5l1.1 2.6 2.6 1.1-2.6 1.1-1.1 2.6-1.1-2.6-2.6-1.1 2.6-1.1z" fill="#d01858" />
    </svg>
  );
}
export default function Logo({ className = '', light = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`font-sans text-[19px] font-extrabold tracking-[-0.03em] ${light ? 'text-white' : 'text-gray-900'}`}>
        School<span className="text-cta">OS</span> <span className={light ? 'text-white/70' : 'text-primary'}>AI</span>
      </span>
    </span>
  );
}
