const severityConfig = {
  HIGH:   { color: '#f56565', bg: 'rgba(245,101,101,0.12)', glow: 'rgba(245,101,101,0.22)', topLine: '#f56565', icon: '🔴' },
  MEDIUM: { color: '#ed8936', bg: 'rgba(237,137,54,0.12)',  glow: 'rgba(237,137,54,0.22)',  topLine: '#ed8936', icon: '🟠' },
  LOW:    { color: '#48bb78', bg: 'rgba(72,187,120,0.12)',  glow: 'rgba(72,187,120,0.22)',  topLine: '#48bb78', icon: '🟢' },
  TOTAL:  { color: '#63b3ed', bg: 'rgba(99,179,237,0.10)',  glow: 'rgba(99,179,237,0.22)',  topLine: '#63b3ed', icon: '📊' },
};

const cards = [
  { label: 'Paths Found', key: 'totalPaths',  sev: 'TOTAL',  desc: 'Total identified' },
  { label: 'High Risk',   key: 'highCount',   sev: 'HIGH',   desc: 'Immediate action' },
  { label: 'Medium Risk', key: 'mediumCount', sev: 'MEDIUM', desc: 'Monitor closely'  },
  { label: 'Low Risk',    key: 'lowCount',    sev: 'LOW',    desc: 'Informational'    },
];

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    marginTop: 20,
  },
};

export default function SummaryCards({ stats }) {
  return (
    <div style={S.grid}>
      {cards.map((card) => {
        const cfg = severityConfig[card.sev];
        const value = stats[card.key];
        return (
          <div
            key={card.key}
            className="anim-fade-in"
            style={{
              background: '#111f35',
              border: `1px solid rgba(99,179,237,0.10)`,
              borderTop: `3px solid ${cfg.topLine}`,
              borderRadius: 14,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'default',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#152540';
              e.currentTarget.style.borderColor = `rgba(99,179,237,0.20)`;
              e.currentTarget.style.borderTopColor = cfg.topLine;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.35), 0 0 20px ${cfg.glow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111f35';
              e.currentTarget.style.borderColor = 'rgba(99,179,237,0.10)';
              e.currentTarget.style.borderTopColor = cfg.topLine;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Background glow blob */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: cfg.glow,
              filter: 'blur(24px)',
              pointerEvents: 'none',
            }} />

            <div style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#4d6278',
              marginBottom: 10,
            }}>
              {card.label}
            </div>

            <div style={{
              fontSize: 42,
              fontWeight: 900,
              color: cfg.color,
              lineHeight: 1,
              marginBottom: 6,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {value}
            </div>

            <div style={{
              fontSize: 11,
              color: '#4d6278',
              fontWeight: 500,
            }}>
              {card.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}
