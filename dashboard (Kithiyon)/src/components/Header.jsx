export default function Header({ lastUpdated, accountId, onRefresh, refreshing = false }) {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand__mark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
            <circle cx="9" cy="9" r="2.2" fill="white" />
          </svg>
        </div>
        <div className="brand__text">
          <span className="brand__title">Attack Path Risk Engine</span>
          <span className="brand__sub">Threat Intelligence Dashboard</span>
        </div>
        <div className="brand__divider" aria-hidden="true" />
        <span className="live">
          <span className="live__dot" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="header__actions">
        <time className="header__time">{lastUpdated}</time>

        <button type="button" className="btn hide-xs" title="AWS account the paths were scored against">
          ☁ AWS {accountId || 'Sandbox'}
        </button>

        <button type="button" className="btn hide-md" title="Path contract version">
          ⛓ Contract v1.0
        </button>

        <button
          type="button"
          className="btn btn--accent"
          onClick={onRefresh}
          aria-busy={refreshing}
          aria-label="Refresh scored paths"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M6 1.5L8.5 0L8.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="btn-label">Refresh</span>
        </button>
      </div>
    </header>
  );
}
