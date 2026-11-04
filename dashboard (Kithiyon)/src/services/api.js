/**
 * api.js — Fetches the scored attack paths for the dashboard.
 *
 * GET /api/paths returns the APRE path contract (v1.0) exactly as
 * risk-scoring/score.py wrote it (see mock-server.js). adapter.js turns it
 * into what the components render.
 *
 * Base URL comes from VITE_API_BASE_URL; in development Vite proxies
 * /api → http://localhost:8000 (see vite.config.js).
 */

import axios from 'axios';
import { adaptDocument } from './adapter';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_API_TOKEN;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      // The Vite proxy answers 500/502/504 with no body when the API is down.
      (status >= 500 && !err?.response?.data ? 'API not reachable. Start it with `npm run api`.' : null) ||
      err?.message ||
      'Unexpected error';
    return Promise.reject(new Error(msg));
  },
);

/** Raw scored contract document. */
export async function fetchScoredPaths() {
  return api.get('/paths');
}

/**
 * Everything the dashboard needs.
 * @returns {Promise<{ meta, stats, paths }>}
 */
export async function fetchDashboardData() {
  return adaptDocument(await fetchScoredPaths());
}

export default api;
