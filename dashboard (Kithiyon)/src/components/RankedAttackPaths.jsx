import { severityStyles as sev } from '../data/mockData';

function hopLabel(hops) {
  return `${hops} hop${hops !== 1 ? 's' : ''}`;
}

export default function RankedAttackPaths({ paths, selectedPathId, onSelectPath }) {
  return (
    <div style={{
      background: '#111f35',
      border: '1px solid rgba(99,179,237,0.10)',
      borderRadius: 14,
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 22px 14px',
        borderBottom: '1px solid rgba(99,179,237,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#8fa5c0',
        }}>
          Ranked Attack Paths
        </div>
        {paths && (
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#4d6278',
            background: 'rgba(99,179,237,0.07)',
            border: '1px solid rgba(99,179,237,0.12)',
            padding: '2px 10px',
            borderRadius: 99,
          }}>
            {paths.length} result{paths.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!paths || paths.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#4d6278',
            fontSize: 13,
          }}>
            <div style={{ marginBottom: 8, fontSize: 28 }}>🔍</div>
            No attack paths match the current filters.
          </div>
        ) : (
          paths.map((path, idx) => {
            const selected = selectedPathId === path.id;
            const cfg = sev[path.severity] || sev.LOW;
            return (
              <div
                key={path.id}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  padding: '14px 22px',
                  cursor: 'pointer',
                  transition: 'background 0.14s ease',
                  background: selected ? cfg.bg : 'transparent',
                  borderLeft: `3px solid ${selected ? cfg.color : 'transparent'}`,
                  borderBottom: '1px solid rgba(99,179,237,0.06)',
                  position: 'relative',
                }}
                onClick={() => onSelectPath(path.id)}
                onMouseEnter={(e) => {
                  if (!selected) e.currentTarget.style.background = 'rgba(99,179,237,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!selected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: 28,
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 1,
                }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: selected ? cfg.color : '#4d6278',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Score */}
                <div style={{
                  minWidth: 54,
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 0,
                }}>
                  <span style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: cfg.color,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: selected ? `0 0 14px ${cfg.color}80` : 'none',
                    transition: 'text-shadow 0.2s',
                  }}>
                    {path.riskScore}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, paddingLeft: 14, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: selected ? '#e2eaf4' : '#c0cfe0',
                    lineHeight: 1.4,
                    marginBottom: 7,
                    transition: 'color 0.14s',
                  }}>
                    {path.title}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{
                      fontSize: 10,
                      color: '#4d6278',
                      background: 'rgba(99,179,237,0.07)',
                      border: '1px solid rgba(99,179,237,0.12)',
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {hopLabel(path.hops)}
                    </span>
                    {path.techniques.map((t, i) => (
                      <span key={i} style={{
                        fontSize: 10,
                        color: '#4d6278',
                        background: 'rgba(99,179,237,0.05)',
                        border: '1px solid rgba(99,179,237,0.09)',
                        padding: '2px 8px',
                        borderRadius: 5,
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: 'nowrap',
                      }}>
                        {t}
                      </span>
                    ))}
                    <span style={{
                      fontSize: 10,
                      color: '#4d6278',
                      background: 'rgba(99,179,237,0.05)',
                      border: '1px solid rgba(99,179,237,0.09)',
                      padding: '2px 8px',
                      borderRadius: 5,
                    }}>
                      I {path.impact} × L {path.likelihood}
                    </span>
                  </div>
                </div>

                {/* Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 2,
                  paddingLeft: 12,
                }}>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    padding: '3px 10px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                  }}>
                    {path.severity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
