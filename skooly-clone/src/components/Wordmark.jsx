import { wordmarkSrc } from '../assets';

/** Skooly wordmark. Redrawn in code; the original PNG is not used. */
export default function Wordmark({ className = '', ...rest }) {
  return (
    <img
      alt="Skooly"
      width="109"
      height="47"
      decoding="async"
      className={className}
      style={{ color: 'transparent' }}
      src={wordmarkSrc}
      {...rest}
    />
  );
}
