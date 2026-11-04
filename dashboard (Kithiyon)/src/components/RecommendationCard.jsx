import { severityOf } from '../data/mockData';

export default function RecommendationCard({ recommendation, rationale }) {
  return (
    <section className="panel">
      <header className="panel__head panel__head--icon">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1L8.8 5.2L13.3 5.6L10.1 8.4L11.1 13L7 10.5L2.9 13L3.9 8.4L0.7 5.6L5.2 5.2L7 1Z"
            fill="rgba(99,179,237,0.20)" stroke="rgba(99,179,237,0.45)" strokeWidth="1" strokeLinejoin="round"
          />
        </svg>
        <h2 className="panel__title">Recommendation</h2>
      </header>

      {!recommendation ? (
        <div className="empty">
          <div className="empty__icon" aria-hidden="true">💡</div>
          Select an attack path to view the recommendation
        </div>
      ) : (
        <div className="rec">
          {recommendation.title && <h3 className="rec__title">{recommendation.title}</h3>}

          <p className="rec__desc">{recommendation.description}</p>

          <div className="rec__rows">
            <div className="rec__row">
              <span className="label-xs">Severity</span>
              <span className="sev-badge" data-sev={severityOf(recommendation.severity)}>
                {severityOf(recommendation.severity)}
              </span>
            </div>

            <div className="rec__row">
              <span className="label-xs">Affected resource</span>
              <span className="rec__mono">{recommendation.affectedResource}</span>
            </div>
          </div>

          <div className="rec__action">
            <div className="label-xs">Recommended action</div>
            <div className="rec__action-text">{recommendation.action}</div>
          </div>

          {rationale && (
            <div className="rec__why">
              <div className="label-xs">Why this score</div>
              <p>{rationale}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
