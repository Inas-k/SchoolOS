import { useEffect, useRef, useState } from 'react';

const SEEN_KEY = 'skooly-clone:widget-seen';
const FIELD =
  'w-full mt-1 px-2.5 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20';
const LABEL = 'block text-[13px] font-semibold text-gray-700 mb-2.5';

const COUNTRY_CODES = [
  ['SG', '+65'], ['MY', '+60'], ['ID', '+62'], ['TH', '+66'], ['PH', '+63'], ['VN', '+84'], ['IN', '+91'], ['AE', '+971'],
  ['SA', '+966'], ['HK', '+852'], ['AU', '+61'], ['NZ', '+64'], ['GB', '+44'], ['US', '+1'], ['CA', '+1'], ['DE', '+49'],
  ['FR', '+33'], ['NL', '+31'], ['ES', '+34'], ['ZA', '+27'],
];

const BANDS = [
  ['', 'Just starting out'],
  ['1-50', 'Under 50'],
  ['51-100', '50 - 200'],
  ['201-500', '200 - 500'],
  ['501-1000', '500+'],
];

/**
 * Floating "Questions? Chat with us" button + contact panel.
 * Auto-opens once per browser (measured rules): after 25s of visible time,
 * at 55% scroll depth, or when the pointer leaves through the top edge.
 * Skipped on touch devices. `?widgetdebug` shortens the timer to 2s.
 * The form is front-end only: the clone has no backend, nothing is sent.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const userToggled = useRef(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const debug = new URLSearchParams(window.location.search).has('widgetdebug');
    let seen = false;
    try {
      seen = !debug && localStorage.getItem(SEEN_KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    if (seen) return;

    let fired = false;
    const fire = () => {
      if (fired || userToggled.current) return;
      fired = true;
      try {
        localStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* storage unavailable */
      }
      cleanup();
      setOpen(true);
    };
    const onMouseOut = (e) => {
      if (!e.relatedTarget && e.clientY <= 2) fire();
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 200 && window.scrollY / max >= 0.55) fire();
    };
    let visibleMs = 0;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      if (!document.hidden) visibleMs += now - last;
      last = now;
      if (visibleMs >= (debug ? 2000 : 25000)) fire();
    }, 1000);
    function cleanup() {
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', onScroll);
      window.clearInterval(timer);
    }
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    return cleanup;
  }, []);

  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setSent(true);
  };

  return (
    <div className="fixed end-5 z-50" style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
      {open && (
        <div
          role="dialog"
          aria-label="Talk to sales"
          className="absolute end-0 bottom-16 w-[340px] max-w-[calc(100vw-40px)] max-h-[calc(100dvh-96px)] overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-2xl shadow-black/25 p-5 text-start"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-base font-bold text-gray-900 mb-1">Ask us anything</p>
              <p className="text-sm text-gray-600 leading-snug">
                Leave your details and your question — we&apos;ll get back to you soon, or chat instantly on WhatsApp.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                userToggled.current = true;
                setOpen(false);
              }}
              className="text-2xl leading-none text-gray-400 hover:text-gray-600 px-0.5"
            >
              ×
            </button>
          </div>
          {sent ? (
            <p className="text-sm text-gray-700 leading-snug py-6" role="status">
              Thanks. This demo form is not connected to a backend, so nothing was sent.
            </p>
          ) : (
            <form noValidate onSubmit={onSubmit}>
              <label className={LABEL}>
                Your name
                <input ref={nameRef} required autoComplete="name" placeholder="Jane Tan" className={FIELD} type="text" name="name" />
              </label>
              <label className={LABEL}>
                Email
                <input required autoComplete="email" dir="ltr" placeholder="name@company.com" className={FIELD} type="email" name="email" />
              </label>
              <label className={LABEL}>
                Mobile number
                <div className="flex gap-1.5" dir="ltr">
                  <select
                    name="country_code"
                    aria-label="Country code"
                    defaultValue="IN"
                    className="mt-1 px-2.5 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 w-[108px] flex-none"
                  >
                    {[...COUNTRY_CODES, ['IN', '+91']].filter((c, i, a) => a.findIndex((x) => x[0] === c[0]) === i).map(([c, d]) => (
                      <option key={c} value={c}>
                        {c} {d}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    autoComplete="tel-national"
                    placeholder="9123 4567"
                    className="mt-1 px-2.5 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 flex-1 min-w-0"
                    type="tel"
                    name="mobile"
                  />
                </div>
              </label>
              <label className={LABEL}>
                Academy / preschool name <span className="font-normal text-gray-400">(optional)</span>
                <input autoComplete="organization" placeholder="Sunshine Swim Academy or Little Stars Preschool" className={FIELD} type="text" name="company" />
              </label>
              <label className={LABEL}>
                Number of students
                <select name="student_band" defaultValue="" className={FIELD}>
                  {BANDS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={LABEL}>
                What are you looking for? <span className="font-normal text-gray-400">(optional)</span>
                <textarea
                  name="message"
                  rows={2}
                  placeholder="e.g. online bookings and payments, replacing spreadsheets, a website for my academy"
                  className={`${FIELD} resize-y`}
                />
              </label>
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute w-px h-px opacity-0 pointer-events-none"
                type="text"
                name="website"
              />
              <button
                type="submit"
                className="w-full bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-60 text-white text-[15px] font-semibold py-3 rounded-xl transition-colors"
              >
                Contact me
              </button>
              <p className="text-[11px] text-gray-500 leading-snug mt-2.5">
                We&apos;ll only use this to contact you about Skooly. Support for existing customers is in your Skooly dashboard and app.
              </p>
              <p className="text-[11px] text-gray-400 leading-snug mt-1.5">
                Demo form: nothing is sent or stored. <a href="/privacy/" className="underline">Privacy</a> &amp;{' '}
                <a href="/terms/" className="underline">Terms</a>.
              </p>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        aria-label="Questions? Chat with us"
        onClick={() => {
          userToggled.current = true;
          setOpen((o) => !o);
        }}
        className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white text-[15px] font-semibold px-5 py-3.5 rounded-full shadow-lg shadow-black/20 transition-colors"
      >
        <svg
          className="w-[22px] h-[22px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        Questions? Chat with us
      </button>
    </div>
  );
}
