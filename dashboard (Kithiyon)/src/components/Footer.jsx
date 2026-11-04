export default function Footer() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginTop: 20,
      padding: '14px 0 8px',
      borderTop: '1px solid rgba(99,179,237,0.07)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(99,179,237,0.07)',
        border: '1px solid rgba(99,179,237,0.14)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="rgba(99,179,237,0.35)" strokeWidth="1.3" fill="none" />
          <path d="M4.5 8L7 10.5L11.5 5.5" stroke="rgba(99,179,237,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <div style={{
          color: 'rgba(255,255,255,0.28)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}>
          AMET University
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.14)',
          fontSize: 10,
          marginTop: 1,
          letterSpacing: '0.02em',
        }}>
          Cybersecurity Capstone Project · 2024
        </div>
      </div>

      {/* Right side filler */}
      <div style={{ flex: 1 }} />
      <div style={{
        color: 'rgba(255,255,255,0.10)',
        fontSize: 10,
        letterSpacing: '0.04em',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        v1.0.0
      </div>
    </div>
  );
}
