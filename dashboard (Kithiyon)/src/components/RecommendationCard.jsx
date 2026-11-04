import { severityStyles as sev } from '../data/mockData';

export default function RecommendationCard({ recommendation, rationale, loading = false }) {
  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: '#111f35',
        border: '1px solid rgba(99,179,237,0.10)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 22px 14px',
          borderBottom: '1px solid rgba(99,179,237,0.08)',
        }}>
          <div style={{ width: 100, height: 10, background: 'rgba(99,179,237,0.07)', borderRadius: 5 }} />
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[80, 60, 90, 50, 70].map((w, i) => (
            <div key={i} style={{
              width: `${w}%`, height: 11,
              background: 'rgba(99,179,237,0.06)',
              borderRadius: 5,
            }} />
          ))}
        </div>
      </div>
    );
  }

  return <RecommendationCardInner recommendation={recommendation} rationale={rationale} />;
}

function RecommendationCardInner({ recommendation, rationale }) {
  const isEmpty = !recommendation;


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
        gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L8.8 5.2L13.3 5.6L10.1 8.4L11.1 13L7 10.5L2.9 13L3.9 8.4L0.7 5.6L5.2 5.2L7 1Z"
            fill="rgba(99,179,237,0.20)" stroke="rgba(99,179,237,0.45)" strokeWidth="1" strokeLinejoin="round" />
        </svg>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: '#8fa5c0',
        }}>
          Recommendation
        </div>
      </div>

      {isEmpty ? (
        <div style={{
          padding: '32px 20px',
          textAlign: 'center',
          color: '#4d6278',
          fontSize: 12,
        }}>
          <div style={{ marginBottom: 8, fontSize: 24 }}>💡</div>
          Select an attack path to view the recommendation
        </div>
      ) : (
        <div style={{ padding: '18px 22px' }}>
          {recommendation.title && (
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#e2eaf4',
              marginBottom: 8,
              lineHeight: 1.4,
            }}>
              {recommendation.title}
            </div>
          )}
          {/* Description */}
          <p style={{
            fontSize: 13,
            color: '#c0cfe0',
            lineHeight: 1.7,
            marginBottom: 18,
          }}>
            {recommendation.description}
          </p>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Severity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#4d6278',
                minWidth: 110,
                flexShrink: 0,
              }}>
                Severity
              </span>
              {(() => {
                const cfg = sev[recommendation.severity] || sev.LOW;
                return (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    padding: '3px 11px',
                    borderRadius: 6,
                  }}>
                    {recommendation.severity}
                  </span>
                );
              })()}
            </div>

            {/* Affected Resource */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#4d6278',
                minWidth: 110,
                flexShrink: 0,
                paddingTop: 2,
              }}>
                Affected Resource
              </span>
              <span style={{
                fontSize: 12,
                color: '#8fa5c0',
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {recommendation.affectedResource}
              </span>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(99,179,237,0.05)',
            border: '1px solid rgba(99,179,237,0.14)',
            borderLeft: '3px solid rgba(99,179,237,0.45)',
            borderRadius: 8,
          }}>
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#63b3ed',
              marginBottom: 6,
            }}>
              Recommended Action
            </div>
            <div style={{
              fontSize: 12,
              color: '#c0cfe0',
              lineHeight: 1.6,
            }}>
              {recommendation.action}
            </div>
          </div>

          {rationale && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#4d6278',
                marginBottom: 6,
              }}>
                Why this score
              </div>
              <div style={{ fontSize: 12, color: '#8fa5c0', lineHeight: 1.6 }}>
                {rationale}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
