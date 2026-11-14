import { cx } from '../lib/util';

/**
 * Decorative geometry (rings, dot grids, triangles, plus marks, glass tiles) that fills empty
 * side areas of a section. Purely visual: not focusable, hidden from assistive tech, and the
 * motion is slow and switched off for visitors who prefer reduced motion.
 *
 * Variants: hero (rich), side (light sections), dark (navy sections), banner (dashboard
 * welcome banner), app (fixed, very faint, behind app pages).
 */
const Ring = ({ className, spin }) => <div className={cx('absolute rounded-full border', spin, className)} />;
const Dots = ({ className }) => (
  <div className={cx('absolute', className)} style={{ backgroundImage: 'radial-gradient(currentColor 1.6px, transparent 1.7px)', backgroundSize: '18px 18px' }} />
);
const Square = ({ className, spin }) => <div className={cx('absolute border-2 rounded-xl', spin, className)} />;
const Dot = ({ className }) => <div className={cx('absolute rounded-full', className)} />;
const Triangle = ({ className }) => (
  <svg viewBox="0 0 100 100" className={cx('absolute', className)} fill="none">
    <polygon points="50,10 92,86 8,86" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);
const Plus = ({ className }) => (
  <svg viewBox="0 0 24 24" className={cx('absolute', className)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <path d="M12 4v16M4 12h16" />
  </svg>
);
const Tile = ({ className }) => <div className={cx('absolute rounded-3xl bg-gradient-to-br from-primary/25 to-cta/25 ring-1 ring-white/70 backdrop-blur-sm', className)} />;

const LAYOUTS = {
  hero: (
    <>
      {/* left */}
      <Ring className="size-[520px] -start-[250px] top-12 border-dashed border-primary/25" spin="geo-spin" />
      <Ring className="size-[360px] -start-[160px] top-[130px] border-primary/15" />
      <Dots className="hidden lg:block w-44 h-44 start-[4%] top-[340px] text-primary/30" />
      <Square className="hidden lg:block size-14 start-[12%] top-36 border-cta/35 rotate-12" spin="geo-spin" />
      <Plus className="hidden lg:block size-6 start-[8%] top-[250px] text-primary/50" />
      <Triangle className="hidden lg:block size-14 start-[17%] top-[450px] text-cta/40 floaty" />
      <Dot className="hidden md:block size-3 start-[20%] top-28 bg-primary/50" />
      <Tile className="hidden xl:block size-20 start-[6%] top-[520px] -rotate-12 floaty-b" />
      {/* right */}
      <Ring className="size-[560px] -end-[270px] top-6 border-dashed border-cta/25" spin="geo-spin-rev" />
      <Ring className="size-[380px] -end-[170px] top-[120px] border-cta/15" />
      <Tile className="hidden lg:block size-24 end-[6%] top-20 rotate-12 floaty-b" />
      <Triangle className="hidden lg:block size-14 end-[12%] top-[290px] text-primary/45 floaty" />
      <Dots className="hidden lg:block w-40 h-40 end-[4%] top-[420px] text-cta/30" />
      <Plus className="hidden lg:block size-6 end-[16%] top-[190px] text-cta/50" />
      <Square className="hidden xl:block size-10 end-[9%] top-[520px] border-primary/35 -rotate-6" spin="geo-spin-rev" />
      <Dot className="hidden md:block size-2.5 end-[22%] top-[340px] bg-cta/50" />
    </>
  ),
  side: (
    <>
      <Ring className="size-[360px] -start-[200px] top-16 border-dashed border-primary/20" spin="geo-spin" />
      <Dots className="hidden lg:block w-32 h-32 start-[3%] bottom-14 text-primary/25" />
      <Square className="hidden lg:block size-10 start-[6%] top-1/2 border-cta/30 rotate-12" spin="geo-spin" />
      <Ring className="size-[300px] -end-[160px] bottom-8 border-cta/20" />
      <Triangle className="hidden lg:block size-10 end-[5%] top-24 text-primary/35 floaty" />
      <Plus className="hidden lg:block size-5 end-[8%] bottom-1/3 text-cta/45" />
    </>
  ),
  dark: (
    <>
      <Dot className="size-80 -end-28 -top-20 bg-primary/20 blur-3xl" />
      <Dot className="size-72 -start-24 bottom-0 bg-cta/15 blur-3xl" />
      <Ring className="size-[420px] -start-[210px] top-10 border-dashed border-white/15" spin="geo-spin" />
      <Dots className="hidden lg:block w-36 h-36 start-[3%] bottom-12 text-white/15" />
      <Square className="hidden lg:block size-10 start-[7%] top-1/3 border-cta-soft/35 rotate-12" spin="geo-spin" />
      <Ring className="size-[340px] -end-[170px] bottom-6 border-white/10" />
      <Triangle className="hidden lg:block size-12 end-[5%] top-20 text-cta-soft/40 floaty" />
      <Plus className="hidden lg:block size-5 end-[9%] bottom-1/3 text-white/35" />
    </>
  ),
  banner: (
    <>
      <Ring className="size-72 -end-16 -top-28 border-dashed border-white/20" spin="geo-spin" />
      <Ring className="size-44 end-10 -bottom-24 border-white/15" />
      <Dots className="hidden sm:block w-28 h-20 end-[22%] top-3 text-white/25" />
      <Square className="hidden sm:block size-8 end-[10%] top-8 border-white/30 rotate-12" spin="geo-spin-rev" />
      <Triangle className="hidden md:block size-7 end-[32%] bottom-4 text-cta-soft/60 floaty" />
    </>
  ),
  app: (
    <>
      <Ring className="size-[620px] -end-[270px] -top-[230px] border-dashed border-primary/10" spin="geo-spin" />
      <Ring className="size-[420px] -end-[170px] -top-[130px] border-primary/[0.07]" />
      <Ring className="size-[480px] -start-[260px] -bottom-[220px] border-dashed border-cta/10" spin="geo-spin-rev" />
      <Dots className="hidden xl:block w-48 h-48 end-8 bottom-10 text-primary/15" />
    </>
  ),
};

export default function GeoBackground({ variant = 'hero', className }) {
  const fixed = variant === 'app';
  return (
    <div
      aria-hidden="true"
      className={cx(
        'pointer-events-none inset-0 overflow-hidden z-0',
        fixed ? 'fixed lg:start-64' : 'absolute',
        variant === 'hero' && '[mask-image:linear-gradient(to_bottom,black_72%,transparent)]',
        className,
      )}
    >
      {LAYOUTS[variant]}
    </div>
  );
}
