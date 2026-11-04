import { useDashboard } from '../hooks/useDashboard';
import { useTheme } from '../hooks/useTheme';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import SearchBar from '../components/SearchBar';
import RankedAttackPaths from '../components/RankedAttackPaths';
import PathGraphView from '../components/PathGraphView';
import RecommendationCard from '../components/RecommendationCard';
import Footer from '../components/Footer';
import CursorField from '../components/CursorField';

// ── Loading skeleton ────────────────────────────────────────────────────
function SkeletonCards() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" role="status">
      <div className="stats">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skel skel--stat enter" style={{ '--i': i }}>
            <div className="skel-bar" style={{ width: '40%' }} />
            <div className="skel-bar skel-bar--value" style={{ width: '55%' }} />
            <div className="skel-bar" style={{ width: '60%', marginTop: 10 }} />
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="skel-bar" style={{ flex: 1, height: 44, borderRadius: 999 }} />
      </div>

      <div className="main" style={{ marginTop: 12 }}>
        <div className="skel skel--list" />
        <div className="side">
          <div className="skel" style={{ height: 260 }} />
          <div className="skel" style={{ height: 220 }} />
        </div>
      </div>
    </div>
  );
}

// ── Error state ─────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="error" role="alert">
      <div className="error__icon" aria-hidden="true">⚠️</div>
      <div className="error__title">Failed to load dashboard</div>
      <div className="error__msg">{message}</div>
      <button type="button" className="pill pill--danger" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export default function Dashboard() {
  const {
    meta,
    stats,
    filteredPaths,
    selectedPath,
    recommendation,
    filters,
    setFilters,
    setSearchQuery,
    selectedPathId,
    setSelectedPathId,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useDashboard();

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="page">
      <CursorField />
      <Header
        lastUpdated={lastUpdated ? `Scored ${lastUpdated}` : '—'}
        accountId={meta?.accountId}
        onRefresh={refresh}
        refreshing={loading}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="wrap">
        <section className="hero enter" style={{ '--i': 0 }}>
          <h1 className="hero__title">Attack paths, ranked by&nbsp;risk</h1>
          <p className="hero__lede">
            {stats
              ? `${stats.totalPaths} path${stats.totalPaths === 1 ? '' : 's'} scored against the contract. Pick one to see how it works and what to fix first.`
              : 'Scored attack paths from the risk pipeline.'}
          </p>
        </section>

        {loading && <SkeletonCards />}

        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (
          <>
            {stats && <SummaryCards stats={stats} />}

            <SearchBar
              filters={filters}
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
            />

            <div className="main">
              <RankedAttackPaths
                paths={filteredPaths}
                selectedPathId={selectedPathId}
                onSelectPath={setSelectedPathId}
              />
              <div className="side">
                {/* Keyed by path so the graph re-runs its entrance for each new path. */}
                <PathGraphView key={selectedPath?.id ?? 'none'} path={selectedPath} />
                <RecommendationCard
                  recommendation={recommendation}
                  rationale={selectedPath?.rationale}
                />
              </div>
            </div>

            <Footer />
          </>
        )}
      </main>
    </div>
  );
}
