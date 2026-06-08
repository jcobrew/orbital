import { useState } from 'react';
import { initials, logoSources } from '../lib/logo';

interface Props {
  name: string;
  domain?: string;
  /** px size of the square logo. */
  size?: number;
  className?: string;
}

/**
 * Logo with the multi-source fallback (Clearbit → DuckDuckGo → Google favicon)
 * and a graceful initials fallback. Adds a subtle loaded fade the old
 * string-templated version couldn't do.
 */
export default function Logo({ name, domain, size = 38, className = '' }: Props) {
  const sources = logoSources(domain);
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const failed = idx >= sources.length;

  const box: React.CSSProperties = {
    width: size,
    height: size,
    flex: `0 0 ${size}px`,
    borderRadius: Math.round(size * 0.26),
    overflow: 'hidden',
    background: '#0a0e1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--line2)',
  };

  if (failed) {
    return (
      <span style={box} className={className} aria-hidden="true">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: Math.round(size * 0.34),
            color: '#fff',
            background: 'var(--grad)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initials(name)}
        </span>
      </span>
    );
  }

  return (
    <span style={box} className={className}>
      <img
        src={sources[idx]}
        alt={`${name} logo`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setIdx((i) => i + 1);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#fff',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </span>
  );
}
