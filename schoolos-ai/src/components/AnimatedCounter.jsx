import { useEffect, useRef, useState } from 'react';

// "10+" -> { prefix: '', target: 10, suffix: '+' }; "$0" -> { prefix: '$', target: 0 }
function parse(value) {
  const m = value.match(/^([^\d]*?)([\d,]+(?:\.\d+)?)(.*?)$/);
  if (!m) return { prefix: '', target: 0, suffix: value, hasCommas: false };
  return { prefix: m[1], target: parseFloat(m[2].replace(/,/g, '')), suffix: m[3], hasCommas: m[2].includes(',') };
}

/**
 * Counts from 0 to the number inside `value` once 30% of it is visible.
 * Duration 2000ms with ease-out-cubic (both measured on the live site).
 * Values whose number is 0 are shown as-is.
 */
export default function AnimatedCounter({ value, className = '' }) {
  const ref = useRef(null);
  const [text, setText] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { prefix, target, suffix, hasCommas } = parse(value);
    if (target === 0) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        io.unobserve(el);
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / 2000, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const n = Math.round(eased * target);
          setText(`${prefix}${hasCommas ? n.toLocaleString('en-US') : n}${suffix}`);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );
    setText(`${prefix}0${suffix}`);
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
