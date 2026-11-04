# APRE Risk Scoring (layer 2)

Owner: Rahsheetha

Reads discovery's `discovered_paths.json`, fills each path's `scoring` block
(contract v1.0, `apre-contract/`), and writes `scored_paths.json` for the dashboard.

```
python score.py ../path-discovery/discovered_paths.json scored_paths.json
python tests/test_score.py
```
Optional: `pip install jsonschema` so the tests also validate against the contract schema.

## Model

**Risk score = Impact (1–10) × Likelihood (1–10)** → 1–100.
Uses only fields the contract already carries — no extra data from discovery.

**Impact** — what the attacker ends up holding

| Target | Impact |
|---|---|
| Admin privileges (`reaches_admin`) | 10 |
| Sensitive data — high / medium / low / unknown | 8 / 6 / 4 / 6 |
| Anything else | 3 |

**Likelihood** — start at 9, adjust, clamp to 1–10

| Factor (contract field) | Adjustment |
|---|---|
| Each hop after the first (`hop_count`) | −1 |
| Each extra permission needed (`required_preconditions`) | −1 |
| Starting identity privilege low / medium / high (`entry_point_privilege`) | +1 / 0 / −1 |
| One obviously dangerous permission (`single_dangerous_permission`) | −1 (easier for existing tools to spot) |

**Severity bands:** 70–100 critical · 40–69 high · 15–39 medium · <15 low

All weights are initial expert-assigned values, to be calibrated by sensitivity
analysis. The output is a *relative risk priority score* for ranking paths, not a probability.

## Results on the seeded scenarios

| Path | Technique | I × L | Score | Severity |
|---|---|---|---|---|
| apre-path-002 | policy self-escalation | 10 × 9 | 90 | critical |
| apre-path-003 | PassRole + Lambda | 10 × 8 | 80 | critical |
| apre-path-001 | 3-hop role chain → S3 | 8 × 8 | 64 | high |

Decoys C1–C3 never reach this module (discovery excludes them).

## Tests

`tests/test_scenarios.json` holds 8 synthetic paths in contract shape covering
all four bands and both clamp limits; `expected_scores.json` is the answer key.
`make_scenarios.py` regenerates them.

## Phase II (not backed by data yet)
MFA on a step, network reachability (open security groups), access-key staleness,
known CVEs, per-hop edge difficulty — need new contract fields and new seeded scenarios.
