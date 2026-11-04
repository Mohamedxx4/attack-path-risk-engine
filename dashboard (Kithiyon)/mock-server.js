/**
 * mock-server.js — Local API for the APRE dashboard.
 *
 * Serves the scoring module's real output (contract v1.0) unchanged, so the
 * dashboard always shows what the pipeline actually produced:
 *
 *   path-discovery/discover.py  →  risk-scoring/score.py  →  scored_paths.json  →  this server
 *
 * The file is re-read on every request, so re-running score.py and pressing
 * Refresh in the dashboard is enough to see new results.
 *
 * Run:  npm run api        (then `npm run dev` in another terminal)
 * Override the file with:  APRE_SCORED_PATHS=<path to scored_paths.json>
 *
 * Endpoints:
 *   GET /api/paths    → the scored contract document, exactly as score.py wrote it
 *   GET /api/health   → { ok, file }
 */

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT) || 8000;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCORED_PATHS = path.resolve(
  process.env.APRE_SCORED_PATHS || path.join(HERE, '..', 'risk-scoring', 'scored_paths.json'),
);

function sendJSON(res, statusCode, body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(text);
}

async function readScoredPaths() {
  const text = await readFile(SCORED_PATHS, 'utf-8');
  JSON.parse(text); // fail loudly on a half-written or corrupt file
  return text;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`[apre-api] ${req.method} ${pathname}`);

  if (pathname === '/api/health') {
    return sendJSON(res, 200, { ok: true, file: SCORED_PATHS });
  }

  if (pathname === '/api/paths') {
    try {
      return sendJSON(res, 200, await readScoredPaths());
    } catch (err) {
      const message = err.code === 'ENOENT'
        ? `No scored paths at ${SCORED_PATHS}. Run risk-scoring/score.py first.`
        : `Could not read ${SCORED_PATHS}: ${err.message}`;
      return sendJSON(res, 500, { error: message });
    }
  }

  sendJSON(res, 404, { error: `Route not found: ${pathname}` });
});

server.listen(PORT, () => {
  console.log(`APRE API listening on http://localhost:${PORT}`);
  console.log(`Serving ${SCORED_PATHS}`);
  console.log('  GET /api/paths   GET /api/health');
});
