# APRE Path Contract (v1.0)

The single JSON shape that passes between the three APRE modules. Agreeing on
this up front lets all three of us build in parallel against example data.

```
discovery (Mohamed)  →  scoring (Rahsheetha)  →  dashboard (Kithiyon)
  emits paths,            fills the `scoring`      reads the finished
  `scoring` = null        block from `signals`     objects, renders them
```

Everyone uses the **same** path object. Discovery emits it with the scoring
fields null; scoring fills them in; the dashboard consumes the result. No
module reshapes another module's data.

## Files

| File | What it is |
|------|-----------|
| `schema/discovered_paths.schema.json` | JSON Schema (draft 2020-12). Validate your input/output against it. |
| `examples/discovered_paths.example.json` | What **discovery** emits — the 3 scenarios, `scoring` null. |
| `examples/scored_paths.example.json` | What **scoring** emits — same paths, `scoring` filled (illustrative numbers). The dashboard builds against this. |

Validate anything against the schema with:
```bash
pip install jsonschema
python -c "import json,jsonschema; jsonschema.validate(json.load(open('examples/scored_paths.example.json')), json.load(open('schema/discovered_paths.schema.json')))"
```

## Top-level shape

```json
{
  "schema_version": "1.0",
  "metadata": { "generated_at": "...", "account_id": "...", "source": "apre-discovery", "neo4j_database": "...", "path_count": 3 },
  "paths": [ PathObject, ... ]
}
```

Only **exploitable** paths appear in `paths`. Decoys (the C1–C3 controls) must
NOT appear — they are measured separately against `ground_truth.json` to score
false positives.

## PathObject — field reference

| Field | Who fills | Meaning |
|-------|-----------|---------|
| `id` | discovery | Stable ID, e.g. `apre-path-001`. Same path keeps the same id across runs. |
| `technique` | discovery | Enum: `role_chaining`, `policy_self_escalation`, `passrole_lambda` (extendable). |
| `title` | discovery | One human-readable sentence. Shown as the dashboard row title. |
| `entry_point` | discovery | `PrincipalRef` — where the attacker starts. |
| `target` | discovery | `ResourceRef` — what they reach. |
| `hops[]` | discovery | Ordered steps from entry to target (see HopObject). |
| `hop_count` | discovery | `hops.length`, included for convenience. |
| `signals` | discovery | Structural facts used by scoring (see SignalsObject). Discovery assigns NO numbers. |
| `scoring` | **scoring** | `impact`, `likelihood`, `risk_score`, `severity`, `rationale`. Null until the scoring engine runs. |

### PrincipalRef / ResourceRef
```json
{ "name": "apre-intern", "arn": "arn:aws:iam::...:user/apre-intern", "type": "AWSUser" }
```
`type` is the Cartography node label (`AWSUser`, `AWSRole`, `AWSGroup`, `AWSS3Bucket`, …).
`target` may add `"description"` (plain-language, for the panel) and, for data
targets, `"data_sensitivity"`.

### HopObject
```json
{
  "step": 1,
  "from": { "name": "apre-intern", "type": "AWSUser" },
  "to":   { "name": "apre-ci-role", "type": "AWSRole" },
  "action": "sts:AssumeRole",
  "mechanism": "Plain-language why this hop is possible.",
  "evidence_edges": ["MEMBER_AWS_GROUP", "TRUSTS_AWS_PRINCIPAL"]
}
```
`mechanism` is written for a non-technical reader (it goes on the dashboard /
into the panel demo). `evidence_edges` lists the Neo4j relationships that prove
the hop — useful for debugging and for the "show your working" slide.

### SignalsObject  (discovery fills; inputs for scoring)
| Signal | Type | Use |
|--------|------|-----|
| `reaches_admin` | bool | Path ends in effective administrator rights. |
| `target_category` | enum | `admin_privileges` \| `sensitive_data` \| `other`. |
| `data_sensitivity` | enum/null | `high` \| `medium` \| `low` \| null (only for data targets). |
| `entry_point_privilege` | enum | `low` \| `medium` \| `high` — how privileged the starting principal already is. |
| `required_preconditions` | string[] | Extra permissions/conditions the attacker needs (e.g. `["lambda:CreateFunction"]`). More preconditions → harder → lower likelihood. |
| `single_dangerous_permission` | bool | Does any ONE permission in the path look obviously dangerous? `false` = stealthier, the APRE differentiator. |
| `notes` | string | Free text for anything scoring or the panel should know. |

### ScoringObject  (scoring fills; null from discovery)
| Field | Type | Meaning |
|-------|------|---------|
| `impact` | int 1–10 | How bad if exploited. |
| `likelihood` | int 1–10 | How easy to exploit. |
| `risk_score` | int | `impact × likelihood` (range 1–100). The documented APRE formula (0–100 scale). |
| `severity` | enum | `critical` \| `high` \| `medium` \| `low` — a band derived from `risk_score`, for colour-coding the dashboard. |
| `rationale` | string | One line explaining the score, for the panel. |

## Two things the team must sign off

1. **Rahsheetha — are these the right `signals`?** They're my proposal for what
   your Impact/Likelihood formula needs as input. If you need other facts
   (e.g. blast radius, number of resources reachable), tell me and discovery
   will emit them. You own what the numbers mean; I own supplying the facts.

2. **Kithiyon — is the `scoring` block enough to render?** You get `risk_score`,
   `severity` (for colour), `title`, the `hops` (for an expandable path view),
   and `rationale`. If you want anything else surfaced, say so now while it's cheap.

## Severity bands (proposed, Rahsheetha to confirm)

| `risk_score` | `severity` |
|--------------|-----------|
| 70–100 | critical |
| 40–69 | high |
| 15–39 | medium |
| < 15 | low |

## Versioning

`schema_version` is `"1.0"`. Any breaking change bumps it so no module
silently misreads another's output.
