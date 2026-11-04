/**
 * api.js — Centralized API service for Attack Path Risk Engine
 *
 * Base URL is read from the env variable VITE_API_BASE_URL.
 * During development, Vite proxies /api → backend (see vite.config.js).
 *
 * Expected backend contract
 * ─────────────────────────
 * GET /api/dashboard/stats
 *   Response: { totalPaths, highCount, mediumCount, lowCount }
 *
 * GET /api/attack-paths
 *   Query params: severity (ALL|HIGH|MEDIUM|LOW), sortBy (riskScore|impact), q (search string)
 *   Response: AttackPath[]
 *     AttackPath: {
 *       id, riskScore, severity, title, hops, techniques, impact,
 *       nodes: [{ id, label, type }]   // type: entry | resource | identity | sensitive
 *     }
 *
 * GET /api/attack-paths/:id/recommendation
 *   Response: {
 *     severity, title, description, affectedResource, action
 *   }
 *
 * If your backend returns everything in one call, swap out the individual
 * fetch functions below and adjust the hook accordingly.
 */

import axios from 'axios';

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor (attach auth token if needed) ────────────────────
api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_API_TOKEN;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor (normalise errors) ──────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Unexpected error';
    return Promise.reject(new Error(msg));
  }
);

// ── API functions ─────────────────────────────────────────────────────────

/**
 * Fetch summary stats: total paths, high/medium/low counts.
 * @returns {Promise<{ totalPaths: number, highCount: number, mediumCount: number, lowCount: number }>}
 */
export async function fetchDashboardStats() {
  return api.get('/dashboard/stats');
}

/**
 * Fetch all attack paths (filtering & sorting can be done server-side or client-side).
 * @returns {Promise<AttackPath[]>}
 */
export async function fetchAttackPaths() {
  return api.get('/attack-paths');
}

/**
 * Fetch the recommendation for a specific attack path.
 * @param {string} pathId
 * @returns {Promise<Recommendation>}
 */
export async function fetchRecommendation(pathId) {
  return api.get(`/attack-paths/${pathId}/recommendation`);
}

/**
 * Convenience: fetch everything needed for the dashboard in parallel.
 * @returns {Promise<{ stats, paths }>}
 */
export async function fetchDashboardData() {
  const [stats, paths] = await Promise.all([
    fetchDashboardStats(),
    fetchAttackPaths(),
  ]);
  return { stats, paths };
}

export default api;
