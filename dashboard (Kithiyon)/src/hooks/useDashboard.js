/**
 * useDashboard.js — Custom hook that manages all dashboard data fetching,
 * filtering, sorting, and recommendation loading.
 *
 * Usage:
 *   const { stats, filteredPaths, selectedPath, recommendation,
 *           filters, setFilters, searchQuery, setSearchQuery,
 *           selectedPathId, setSelectedPathId,
 *           loading, error, refresh, lastUpdated } = useDashboard();
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchDashboardData, fetchRecommendation } from '../services/api';

export function useDashboard() {
  // ── Raw data from backend ───────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [paths, setPaths] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [filters, setFilters] = useState({ severity: 'ALL', sortBy: 'riskScore' });
  const [searchQuery, setSearchQuery] = useState('');

  // ── Loading / error ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Recommendation cache ─────────────────────────────────────────────────
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const recCacheRef = useRef({}); // { [pathId]: recommendation }

  // ── Fetch main dashboard data ────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { stats: s, paths: p } = await fetchDashboardData();
      setStats(s);
      setPaths(Array.isArray(p) ? p : []);
      setLastUpdated(
        new Date().toLocaleString('en-US', {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      );
      // Auto-select first path
      if (Array.isArray(p) && p.length > 0) {
        setSelectedPathId((prev) => prev || p[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Fetch recommendation when selection changes ──────────────────────────
  useEffect(() => {
    if (!selectedPathId) return;

    // Use cache if available
    if (recCacheRef.current[selectedPathId]) {
      setRecommendation(recCacheRef.current[selectedPathId]);
      return;
    }

    setRecLoading(true);
    setRecommendation(null);
    fetchRecommendation(selectedPathId)
      .then((rec) => {
        recCacheRef.current[selectedPathId] = rec;
        setRecommendation(rec);
      })
      .catch(() => {
        setRecommendation(null);
      })
      .finally(() => setRecLoading(false));
  }, [selectedPathId]);

  // ── Client-side filter + sort ────────────────────────────────────────────
  const filteredPaths = useMemo(() => {
    let result = [...paths];

    if (filters.severity !== 'ALL') {
      result = result.filter((p) => p.severity === filters.severity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (Array.isArray(p.techniques) && p.techniques.some((t) => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) =>
      filters.sortBy === 'riskScore'
        ? b.riskScore - a.riskScore
        : b.impact - a.impact
    );

    return result;
  }, [paths, filters, searchQuery]);

  // ── Selected path object ─────────────────────────────────────────────────
  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) || null,
    [paths, selectedPathId]
  );

  return {
    // Data
    stats,
    filteredPaths,
    selectedPath,
    recommendation,

    // UI controls
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    selectedPathId,
    setSelectedPathId,

    // Status
    loading,
    recLoading,
    error,
    lastUpdated,

    // Actions
    refresh: loadDashboard,
  };
}
