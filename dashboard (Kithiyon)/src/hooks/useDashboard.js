/**
 * useDashboard.js — Loads the scored attack paths and manages filtering,
 * sorting, search, and selection for the dashboard.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDashboardData } from '../services/api';

function formatTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function useDashboard() {
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [paths, setPaths] = useState([]);

  const [selectedPathId, setSelectedPathId] = useState(null);
  const [filters, setFilters] = useState({ severity: 'ALL', sortBy: 'riskScore' });
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData();
      setMeta(data.meta);
      setStats(data.stats);
      setPaths(data.paths);
      // Keep the current selection if it still exists, else pick the top path.
      setSelectedPathId((prev) =>
        data.paths.some((p) => p.id === prev) ? prev : data.paths[0]?.id ?? null,
      );
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredPaths = useMemo(() => {
    let result = [...paths];

    if (filters.severity !== 'ALL') {
      result = result.filter((p) => p.severity === filters.severity);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.entryPoint.name.toLowerCase().includes(q) ||
          p.target.name.toLowerCase().includes(q) ||
          p.techniques.some((t) => t.toLowerCase().includes(q)),
      );
    }

    const key = filters.sortBy === 'impact' ? 'impact' : 'riskScore';
    result.sort((a, b) => b[key] - a[key] || b.riskScore - a.riskScore);
    return result;
  }, [paths, filters, searchQuery]);

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) || null,
    [paths, selectedPathId],
  );

  return {
    meta,
    stats,
    filteredPaths,
    selectedPath,
    recommendation: selectedPath?.recommendation ?? null,

    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    selectedPathId,
    setSelectedPathId,

    loading,
    error,
    lastUpdated: meta ? formatTime(meta.scoredAt || meta.generatedAt) : null,

    refresh: loadDashboard,
  };
}
