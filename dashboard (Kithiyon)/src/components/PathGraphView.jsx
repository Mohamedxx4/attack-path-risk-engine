import { nodeTypeLabels } from '../data/mockData';

const nodeColors = {
  entry:     { color: '#f56565', bg: 'rgba(245,101,101,0.14)', border: 'rgba(245,101,101,0.35)', glow: 'rgba(245,101,101,0.20)' },
  resource:  { color: '#63b3ed', bg: 'rgba(99,179,237,0.14)',  border: 'rgba(99,179,237,0.35)',  glow: 'rgba(99,179,237,0.18)' },
  identity:  { color: '#ed8936', bg: 'rgba(237,137,54,0.14)',  border: 'rgba(237,137,54,0.35)',  glow: 'rgba(237,137,54,0.18)' },
  sensitive: { color: '#9f7aea', bg: 'rgba(159,122,234,0.14)', border: 'rgba(159,122,234,0.35)', glow: 'rgba(159,122,234,0.18)' },
};

const nodeIcons = {
  entry: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <path d="M9 2V5M9 13V16M2 9H5M13 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  resource: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 8H12M6 11H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  identity: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M3 16C3 12.686 5.686 10 9 10C12.314 10 15 12.686 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  sensitive: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="4" y="8" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 8V5C6 3.343 7.343 2 9 2C10.657 2 12 3.343 12 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};

export default function PathGraphView({ path }) {
  const isEmpty = !path;

  return (
    <div style={{
      background: '#111f35',
      border: '1px solid rgba(99,179,237,0.10)',
      borderRadius: 14,
      overflow: 'hidden',
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
          Path Graph View
        </div>
        {path && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#4d6278',
            background: 'rgba(99,179,237,0.07)',
            border: '1px solid rgba(99,179,237,0.12)',
            padding: '2px 10px',
            borderRadius: 99,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {path.nodes.length} nodes
          </span>
        )}
      </div>

      {isEmpty ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#4d6278',
          fontSize: 12,
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
            <circle cx="18" cy="9" r="4" stroke="rgba(99,179,237,0.25)" strokeWidth="1.5" fill="none" />
            <circle cx="18" cy="27" r="4" stroke="rgba(99,179,237,0.25)" strokeWidth="1.5" fill="none" />
            <path d="M18 13V23" stroke="rgba(99,179,237,0.20)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
          </svg>
          Select an attack path to view its graph
        </div>
      ) : (
        <>
          <div style={{
            padding: '24px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}>
            {path.nodes.map((node, i) => {
              const cfg = nodeColors[node.type] || nodeColors.resource;
              return (
                <div key={node.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  {/* Node circle */}
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cfg.color,
                    boxShadow: `0 0 18px ${cfg.glow}`,
                    transition: 'box-shadow 0.2s',
                    cursor: 'default',
                  }}>
                    {nodeIcons[node.type]}
                  </div>

                  {/* Node label */}
                  <div
                    title={node.arn || undefined}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#c0cfe0',
                      textAlign: 'center',
                      marginTop: 8,
                      maxWidth: 220,
                      lineHeight: 1.3,
                      overflowWrap: 'anywhere',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {node.label}
                  </div>
                  {node.kind && (
                    <div style={{ fontSize: 9, color: '#4d6278', marginTop: 2 }}>
                      {node.kind}
                    </div>
                  )}

                  {/* Type badge */}
                  <div style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    padding: '2px 8px',
                    borderRadius: 4,
                    marginTop: 4,
                  }}>
                    {nodeTypeLabels[node.type]}
                  </div>

                  {/* Connector */}
                  {i < path.nodes.length - 1 && (
                    <div
                      title={path.nodes[i + 1].mechanism || undefined}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        margin: '6px 0',
                        gap: 1,
                        cursor: path.nodes[i + 1].mechanism ? 'help' : 'default',
                      }}
                    >
                      {[0, 1].map((d) => (
                        <div key={d} style={{
                          width: 2,
                          height: 5,
                          borderRadius: 1,
                          background: `rgba(99,179,237,${0.35 - d * 0.06})`,
                        }} />
                      ))}
                      {path.nodes[i + 1].action && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#63b3ed',
                          background: 'rgba(99,179,237,0.08)',
                          border: '1px solid rgba(99,179,237,0.18)',
                          padding: '1px 8px',
                          borderRadius: 4,
                          margin: '3px 0',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {path.nodes[i + 1].action}
                        </span>
                      )}
                      {[2, 3].map((d) => (
                        <div key={d} style={{
                          width: 2,
                          height: 5,
                          borderRadius: 1,
                          background: `rgba(99,179,237,${0.35 - d * 0.06})`,
                        }} />
                      ))}
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginTop: 1 }}>
                        <path d="M1 1L5 5L9 1" stroke="rgba(99,179,237,0.30)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            padding: '10px 20px 16px',
            fontSize: 10,
            color: '#4d6278',
            textAlign: 'center',
            borderTop: '1px solid rgba(99,179,237,0.07)',
            lineHeight: 1.6,
            letterSpacing: '0.01em',
          }}>
            {path.hops} hop{path.hops !== 1 ? 's' : ''} · hover a step to see why it works
          </div>
        </>
      )}
    </div>
  );
}
