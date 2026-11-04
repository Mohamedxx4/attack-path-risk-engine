# APRE Dashboard (layer 3)

Owner: Kithiyon

Renders the scored attack paths produced by the pipeline:

```
path-discovery/discover.py → risk-scoring/score.py → risk-scoring/scored_paths.json → dashboard
```

The dashboard reads the shared path contract (`apre-contract/`, v1.0) as-is. It never
reshapes another module's data; `src/services/adapter.js` only derives display fields
(graph nodes, severity colour, chips, and a remediation per technique).

## Run

```powershell
npm install
npm run api     # serves ../risk-scoring/scored_paths.json on http://localhost:8000
npm run dev     # in a second terminal; Vite proxies /api → :8000
```

The API re-reads the file on every request, so after re-running `score.py` just press
**Refresh**. To serve a different file:

```powershell
$env:APRE_SCORED_PATHS = 'C:\path\to\scored_paths.json'; npm run api
```

If the file has unscored paths (e.g. you pointed it at `discovered_paths.json`), the
dashboard says so instead of showing empty scores.

## API

| Endpoint | Returns |
|----------|---------|
| `GET /api/paths` | The scored contract document, unchanged |
| `GET /api/health` | `{ ok, file }` |

## What's shown

- Summary cards for all four contract severity bands (critical / high / medium / low).
- Ranked list: `risk_score`, impact × likelihood, technique and AWS actions.
- Path graph: every principal/resource on the path with the AWS action on each step;
  hover a step for the discovery module's plain-language `mechanism`.
- Recommendation: a fix derived from the path's technique and hops, plus the scoring
  engine's `rationale` ("why this score").

## Files

| File | Purpose |
|------|---------|
| `mock-server.js` | Local API serving `scored_paths.json` |
| `src/services/api.js` | Fetches `/api/paths` |
| `src/services/adapter.js` | Contract → view model, recommendations |
| `src/hooks/useDashboard.js` | Loading, filter, sort, search, selection |
| `src/components/*` | UI |
