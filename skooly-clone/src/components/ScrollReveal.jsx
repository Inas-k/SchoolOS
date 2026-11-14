import { useEffect, useRef } from 'react';

const ANIMATION_CLASS = {
  'fade-up': 'animate-fade-up',
  'fade-in': 'animate-fade-in',
  'slide-left': 'animate-slide-left',
  'slide-right': 'animate-slide-right',
  'scale-in': 'animate-scale-in',
};

/**
 * Reveals its child when 5% of it enters the viewport (IntersectionObserver
 * threshold .05, measured on the live site). Adds `is-visible` plus the
 * animation class, and applies an optional stagger delay in ms.
 */
export default function ScrollReveal({ children, animation = 'fade-up', delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.remove('scroll-reveal');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add('is-visible', ANIMATION_CLASS[animation]);
        if (delay) el.style.animationDelay = `${delay}ms`;
        io.unobserve(el);
      },
      { threshold: 0.05, rootMargin: '0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animation, delay]);

  return (
    <Tag ref={ref} className={`scroll-reveal ${className}`}>
      {children}
    </Tag>
  );
}
