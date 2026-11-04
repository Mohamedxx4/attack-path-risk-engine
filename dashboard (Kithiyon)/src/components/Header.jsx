function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.4 3.4L4.5 4.5M11.5 11.5L12.6 12.6M3.4 12.6L4.5 11.5M11.5 4.5L12.6 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Brand mark: a tri-colour arrow in Google's palette, after Antigravity's logo. */
function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="apre-mark" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1a73e8" />
          <stop offset="0.5" stopColor="#ea4335" />
          <stop offset="1" stopColor="#fbbc04" />
        </linearGradient>
      </defs>
      <path d="M12 2.5C13.2 6.6 16.4 9.8 21.5 11.4C16.4 13 13.2 16.2 12 21.5C10.8 16.2 7.6 13 2.5 11.4C7.6 9.8 10.8 6.6 12 2.5Z" fill="url(#apre-mark)" />
    </svg>
  );
}

export default function Header({ lastUpdated, accountId, onRefresh, refreshing = false, theme, onToggleTheme }) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="header">
      <div className="brand">
        <BrandMark />
        <div className="brand__text">
          <span className="brand__title">Attack Path Risk Engine</span>
          <span className="brand__sub">Threat intelligence</span>
        </div>
        <span className="live">
          <span className="live__dot" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="header__actions">
        <time className="header__time">{lastUpdated}</time>

        <button type="button" className="pill hide-xs" title="AWS account the paths were scored against">
          AWS {accountId || 'Sandbox'}
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <button
          type="button"
          className="pill pill--primary"
          onClick={onRefresh}
          aria-busy={refreshing}
          aria-label="Refresh scored paths"
        >
          <span className="pill__label">Refresh</span>
          <span className="pill__chip" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10.5 6A4.5 4.5 0 1 1 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 1.5L8.5 0L8.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
    </header>
  );
}
