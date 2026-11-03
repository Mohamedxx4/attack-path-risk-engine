# APRE Path Discovery

Reads the Cartography/Neo4j graph, finds attack paths, and writes
`discovered_paths.json` in the shared path-contract shape (`contract/`).

## What it does

For each technique it runs graph queries and assembles paths:

| Technique | Status |
|-----------|--------|
| `role_chaining` (S1) | ✅ implemented |
| `policy_self_escalation` (S2) | ✅ implemented |
| `passrole_lambda` (S3) | ✅ implemented |

The role-chaining detector is the important one: it **reconstructs** the
"A can assume R" relationship from the role's trust policy plus the identity's
permission, instead of trusting Cartography's `STS_ASSUMEROLE_ALLOW` edges —
because Cartography does not create all of them (Finding #1). This is also why
decoy C2 is correctly *not* reported: the contractor has the permission but the
role does not trust it, so the reconstructed capability never forms.

## Setup (Windows PowerShell)

```powershell
cd D:\attack-path-risk-engine\path-discovery      # or wherever this folder lives
python -m venv discovery-venv
.\discovery-venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If activation is blocked: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`, then activate again.

## Configure

```powershell
$env:NEO4J_PASSWORD = 'your-aura-password'     # single quotes
# Optional overrides (defaults target the shared APRE instance):
# $env:NEO4J_URI  = 'neo4j+s://2276c01d.databases.neo4j.io'
# $env:NEO4J_USER = '2276c01d'                 # username is the instance id, NOT 'neo4j'
```

Resume the Aura instance first if it is paused (a paused instance fails DNS/connect).

## Run

```powershell
python discover.py
```

Writes `discovered_paths.json` and prints a one-line summary per path. Expected
for the current graph: **three** paths and **zero decoys** —
- `role_chaining` (S1): apre-intern → apre-ci-role → apre-data-role → sensitive bucket (reconstructed hop)
- `policy_self_escalation` (S2): apre-support rewrites its own policy → admin
- `passrole_lambda` (S3): apre-deployer passes the admin role to Lambda

Decoys C1/C2/C3 must NOT appear. Cross-check against `apre-scenarios/ground_truth.json`.

## Files

| File | Purpose |
|------|---------|
| `discover.py` | Entry point: connect, run detectors, write JSON. |
| `config.py` | Neo4j connection + excluded (infra) principals. |
| `emit.py` | Builds contract-shaped objects; leaves `scoring` null. |
| `queries/role_chaining.py` | S1 detector (reconstruction + DFS). |
| `queries/policy_self_escalation.py` | S2 detector (self-editable policy). |
| `queries/passrole_lambda.py` | S3 detector (PassRole + Lambda, 3 conditions). |
| `requirements.txt` | `neo4j` driver. |
