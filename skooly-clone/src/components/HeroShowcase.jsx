import { useState } from 'react';
import { academyDashSrc, preschoolDashSrc } from '../assets';

const SHOTS = {
  academy: { label: 'Academy', src: academyDashSrc },
  preschool: { label: 'Preschool', src: preschoolDashSrc },
};

const FRONT = 'z-20 translate-x-0 translate-y-0 cursor-default';
const BACK = 'z-10 -translate-y-10 translate-x-5 sm:translate-x-7 scale-[0.985] cursor-pointer';
const SHADOW_FRONT = 'shadow-[0_1px_2px_rgb(9_30_66/0.06),0_32px_64px_-16px_rgb(9_30_66/0.22)]';
const SHADOW_BACK = 'shadow-[0_1px_2px_rgb(9_30_66/0.05),0_16px_32px_-16px_rgb(9_30_66/0.18)]';

/** Two stacked product windows; clicking the one behind brings it to the front. */
export default function HeroShowcase() {
  const [active, setActive] = useState('academy');

  return (
    <div className="relative max-w-4xl mx-auto mt-14 lg:mt-20">
      <div
        className="absolute -inset-x-4 sm:-inset-x-8 top-2 -bottom-4 sm:-bottom-8 rounded-3xl bg-gradient-to-br from-primary-50 via-white to-gray-50 rotate-1"
        aria-hidden="true"
      />
      <div className="relative">
        <div className="invisible pt-10" aria-hidden="true">
          <div className="h-8" />
          <img
            alt=""
            loading="lazy"
            width="1440"
            height="900"
            decoding="async"
            className="w-full h-auto"
            style={{ color: 'transparent' }}
            src={academyDashSrc}
          />
        </div>
        {Object.entries(SHOTS).map(([key, shot]) => {
          const isFront = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isFront}
              aria-label={shot.label}
              onClick={() => setActive(key)}
              className={`absolute top-10 inset-x-0 block w-full text-start p-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isFront ? FRONT : BACK
              }`}
            >
              <span
                className={`block rounded-2xl overflow-hidden bg-white ring-1 ring-gray-900/10 ${
                  isFront ? SHADOW_FRONT : SHADOW_BACK
                }`}
              >
                <span className={`flex h-8 items-center px-3.5 gap-1.5 transition-colors ${isFront ? 'bg-ink' : 'bg-ink/80 hover:bg-ink'}`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className={`ms-3 text-[10px] font-semibold tracking-wide ${isFront ? 'text-white/60' : 'text-white/80'}`}>
                    {shot.label}
                  </span>
                </span>
                <img
                  alt={shot.label}
                  loading={key === 'academy' ? undefined : 'lazy'}
                  width="1440"
                  height="900"
                  decoding="async"
                  className="w-full h-auto"
                  style={{ color: 'transparent' }}
                  src={shot.src}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
