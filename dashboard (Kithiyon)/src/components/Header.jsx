import { useState } from 'react';

const S = {
  header: {
    background: 'rgba(10, 22, 40, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    borderBottom: '1px solid rgba(99,179,237,0.10)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 24px rgba(0,0,0,0.45)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 16px rgba(245,101,101,0.35)',
    flexShrink: 0,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  title: {
    color: '#e2eaf4',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.01em',
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#4d6278',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 28,
    background: 'rgba(99,179,237,0.10)',
    margin: '0 6px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  liveWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 99,
    background: 'rgba(72,187,120,0.08)',
    border: '1px solid rgba(72,187,120,0.20)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#48bb78',
    animation: 'pulse-ring 1.8s ease-out infinite',
  },
  liveText: {
    color: '#48bb78',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  timestamp: {
    color: '#4d6278',
    fontSize: 10,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    fontFamily: "'JetBrains Mono', monospace",
  },
  pill: {
    background: 'rgba(99,179,237,0.07)',
    color: '#8fa5c0',
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 13px',
    borderRadius: 99,
    border: '1px solid rgba(99,179,237,0.12)',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
  refreshBtn: {
    background: 'rgba(99,179,237,0.09)',
    color: '#63b3ed',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 13px',
    borderRadius: 99,
    border: '1px solid rgba(99,179,237,0.20)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.18s ease',
    letterSpacing: '0.01em',
  },
};

export default function Header({ lastUpdated, onRefresh }) {
  const [hovered, setHovered] = useState(null);

  return (
    <header style={S.header}>
      {/* ── Left ── */}
      <div style={S.left}>
        <div style={S.logoWrap}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            <circle cx="9" cy="9" r="2.2" fill="white" />
          </svg>
        </div>
        <div style={S.titleBlock}>
          <span style={S.title}>Attack Path Risk Engine</span>
          <span style={S.subtitle}>Threat Intelligence Dashboard</span>
        </div>
        <div style={S.divider} />
        <div style={S.liveWrap}>
          <div style={S.liveDot} />
          <span style={S.liveText}>Live</span>
        </div>
      </div>

      {/* ── Right ── */}
      <div style={S.right}>
        <span style={S.timestamp}>{lastUpdated}</span>

        <button
          style={{
            ...S.pill,
            background: hovered === 'aws' ? 'rgba(99,179,237,0.14)' : S.pill.background,
            color:      hovered === 'aws' ? '#e2eaf4' : S.pill.color,
            borderColor: hovered === 'aws' ? 'rgba(99,179,237,0.28)' : undefined,
          }}
          onMouseEnter={() => setHovered('aws')}
          onMouseLeave={() => setHovered(null)}
        >
          ☁ AWS Sandbox
        </button>

        <button
          style={{
            ...S.pill,
            background: hovered === 'hops' ? 'rgba(99,179,237,0.14)' : S.pill.background,
            color:      hovered === 'hops' ? '#e2eaf4' : S.pill.color,
            borderColor: hovered === 'hops' ? 'rgba(99,179,237,0.28)' : undefined,
          }}
          onMouseEnter={() => setHovered('hops')}
          onMouseLeave={() => setHovered(null)}
        >
          ⛓ Max 5 hops
        </button>

        <button
          style={{
            ...S.refreshBtn,
            background: hovered === 'refresh' ? 'rgba(99,179,237,0.18)' : S.refreshBtn.background,
            boxShadow:  hovered === 'refresh' ? '0 0 16px rgba(99,179,237,0.20)' : 'none',
          }}
          onMouseEnter={() => setHovered('refresh')}
          onMouseLeave={() => setHovered(null)}
          onClick={onRefresh}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M6 1.5L8.5 0L8.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Refresh
        </button>
      </div>
    </header>
  );
}
