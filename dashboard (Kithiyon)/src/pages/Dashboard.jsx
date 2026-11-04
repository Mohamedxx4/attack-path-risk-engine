import { useDashboard } from '../hooks/useDashboard';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import SearchBar from '../components/SearchBar';
import RankedAttackPaths from '../components/RankedAttackPaths';
import PathGraphView from '../components/PathGraphView';
import RecommendationCard from '../components/RecommendationCard';
import Footer from '../components/Footer';

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
        <div className="skel-bar" style={{ flex: 1, height: 38, borderRadius: 11 }} />
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
      <button type="button" className="btn btn--danger" onClick={onRetry}>
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

  return (
    <div className="page">
      <Header
        lastUpdated={lastUpdated ? `Scored ${lastUpdated}` : '—'}
        accountId={meta?.accountId}
        onRefresh={refresh}
        refreshing={loading}
      />

      <main className="wrap">
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
