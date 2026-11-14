import { ArrowRight } from 'lucide-react';

const BASE =
  'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]';
const PRIMARY =
  'bg-cta text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.1),0_4px_14px_-4px_rgb(208_24_88/0.5)] hover:bg-cta-dark hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_2px_4px_rgb(0_0_0/0.1),0_8px_20px_-4px_rgb(208_24_88/0.55)] hover:-translate-y-px active:translate-y-0 active:shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]';
const SECONDARY =
  'bg-white text-gray-900 border border-gray-300 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:border-cta hover:text-cta hover:shadow-[0_2px_8px_rgb(0_0_0/0.08)] hover:-translate-y-px active:translate-y-0';
const SIZE = 'px-8 py-4 text-base';

export function PrimaryButton({ href, children, arrow = false }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${BASE} ${PRIMARY} ${SIZE} `}>
      {children}
      {arrow && (
        <svg className="w-4 h-4 ms-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )}
    </a>
  );
}

export function SecondaryButton({ href, children }) {
  return (
    <a className={`${BASE} ${SECONDARY} ${SIZE} `} href={href}>
      {children}
    </a>
  );
}

export function ArrowIcon({ className }) {
  return <ArrowRight className={className} aria-hidden="true" />;
}
