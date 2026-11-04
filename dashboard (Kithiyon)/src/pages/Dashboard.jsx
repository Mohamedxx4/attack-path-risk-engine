import { useDashboard } from '../hooks/useDashboard';
import Header from '../components/Header';
import SummaryCards from '../components/SummaryCards';
import SearchBar from '../components/SearchBar';
import RankedAttackPaths from '../components/RankedAttackPaths';
import PathGraphView from '../components/PathGraphView';
import RecommendationCard from '../components/RecommendationCard';
import Footer from '../components/Footer';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#060f1e',
  },
  wrapper: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '0 28px 32px',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 18,
    marginTop: 6,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  // ── Loading skeleton ──────────────────────────────────────────────────
  skeletonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    marginTop: 20,
  },
  skeletonCard: {
    background: '#111f35',
    border: '1px solid rgba(99,179,237,0.08)',
    borderRadius: 14,
    height: 100,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonBar: (w, mt) => ({
    background: 'rgba(99,179,237,0.06)',
    borderRadius: 6,
    width: w,
    height: 12,
    marginTop: mt || 0,
  }),

  // ── Error state ───────────────────────────────────────────────────────
  errorBox: {
    margin: '40px auto',
    maxWidth: 480,
    background: 'rgba(245,101,101,0.08)',
    border: '1px solid rgba(245,101,101,0.22)',
    borderRadius: 14,
    padding: '32px 28px',
    textAlign: 'center',
  },
};

// Shimmer animation applied inline via a <style> tag
const ShimmerStyle = () => (
  <style>{`
    @keyframes shimmer {
      from { transform: translateX(-100%); }
      to   { transform: translateX(100%);  }
    }
    .skeleton-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(99,179,237,0.06) 50%, transparent 100%);
      animation: shimmer 1.6s ease infinite;
    }
  `}</style>
);

function SkeletonCards() {
  return (
    <>
      <ShimmerStyle />
      <div style={styles.skeletonGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={styles.skeletonCard} className="skeleton-shimmer">
            <div style={{ padding: '20px 22px' }}>
              <div style={styles.skeletonBar('40%')} />
              <div style={{ ...styles.skeletonBar('55%'), height: 36, marginTop: 14, borderRadius: 8 }} />
              <div style={styles.skeletonBar('60%', 10)} />
            </div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 18,
        marginTop: 24,
      }}>
        <div style={{ ...styles.skeletonCard, height: 500 }} className="skeleton-shimmer" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...styles.skeletonCard, height: 260 }} className="skeleton-shimmer" />
          <div style={{ ...styles.skeletonCard, height: 220 }} className="skeleton-shimmer" />
        </div>
      </div>
    </>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={styles.errorBox}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f56565', marginBottom: 8 }}>
        Failed to load dashboard
      </div>
      <div style={{ fontSize: 13, color: '#8fa5c0', lineHeight: 1.6, marginBottom: 20 }}>
        {message}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '9px 24px',
          background: 'rgba(245,101,101,0.12)',
          border: '1px solid rgba(245,101,101,0.30)',
          borderRadius: 8,
          color: '#f56565',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,101,101,0.20)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,101,101,0.12)'}
      >
        Retry
      </button>
    </div>
  );
}

export default function Dashboard() {
  const {
    stats,
    filteredPaths,
    selectedPath,
    recommendation,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    selectedPathId,
    setSelectedPathId,
    loading,
    recLoading,
    error,
    lastUpdated,
    refresh,
  } = useDashboard();

  return (
    <div style={styles.page}>
      <Header lastUpdated={lastUpdated || '—'} onRefresh={refresh} />
      <div style={styles.wrapper}>

        {/* ── Loading ── */}
        {loading && <SkeletonCards />}

        {/* ── Error ── */}
        {!loading && error && (
          <ErrorState message={error} onRetry={refresh} />
        )}

        {/* ── Data loaded ── */}
        {!loading && !error && (
          <>
            {stats && <SummaryCards stats={stats} />}

            <SearchBar
              filters={filters}
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
            />

            <div style={styles.mainContent}>
              <RankedAttackPaths
                paths={filteredPaths}
                selectedPathId={selectedPathId}
                onSelectPath={setSelectedPathId}
              />
              <div style={styles.rightColumn}>
                <PathGraphView path={selectedPath} />
                <RecommendationCard
                  recommendation={recommendation}
                  loading={recLoading}
                />
              </div>
            </div>

            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
