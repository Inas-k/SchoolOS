import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const BASE = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]';
const PRIMARY = 'bg-cta text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.1),0_4px_14px_-4px_rgb(208_24_88/0.5)] hover:bg-cta-dark hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_2px_4px_rgb(0_0_0/0.1),0_8px_20px_-4px_rgb(208_24_88/0.55)] hover:-translate-y-px active:translate-y-0';
const SECONDARY = 'bg-white text-gray-900 border border-gray-300 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:border-cta hover:text-cta hover:shadow-[0_2px_8px_rgb(0_0_0/0.08)] hover:-translate-y-px active:translate-y-0';
const SIZE = 'px-8 py-4 text-base';

export function PrimaryButton({ to, children, arrow = false }) {
  return (
    <Link to={to} className={`${BASE} ${PRIMARY} ${SIZE}`}>
      {children}
      {arrow && <ArrowRight className="w-4 h-4 ms-2" aria-hidden="true" />}
    </Link>
  );
}
export function SecondaryButton({ to, children }) {
  return <Link className={`${BASE} ${SECONDARY} ${SIZE}`} to={to}>{children}</Link>;
}
export const ArrowIcon = ({ className }) => <ArrowRight className={className} aria-hidden="true" />;
