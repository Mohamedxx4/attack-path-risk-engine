"""
APRE risk scoring (Layer 2) — contract v1.0.

Reads the path JSON emitted by discovery, fills each path's `scoring` block,
and writes the result for the dashboard. It uses ONLY fields the locked
contract carries (`signals`, `hop_count`, `target`) — no extra data needed.

    Risk score = Impact (1-10) x Likelihood (1-10)      -> 1..100

All point values below are initial expert-assigned weights, chosen to be
simple and explainable. They are NOT research-calibrated; treat the output as
a relative risk priority score for ranking paths, not a probability.

Usage:
    python score.py <discovered_paths.json> [scored_paths.json]
"""

import json
import sys
from datetime import datetime, timezone

# ---------------------------------------------------------------- weights ---
# IMPACT: how bad it is if the attacker reaches the target.
IMPACT_ADMIN = 10                       # full account takeover
IMPACT_DATA = {"high": 8, "medium": 6, "low": 4, None: 6}  # None = unknown -> middle
IMPACT_OTHER = 3

# LIKELIHOOD: how easy / realistic the path is to walk. Start at a base
# and adjust; the result is clamped to 1..10.
LIKELIHOOD_BASE = 9
PER_EXTRA_HOP = -1                      # each hop after the first
PER_PRECONDITION = -1                   # each extra permission the attacker needs
ENTRY_PRIVILEGE = {"low": +1, "medium": 0, "high": -1}
# Low-privilege identities are numerous and lightly watched -> easier to obtain.
SINGLE_DANGEROUS_PERMISSION = -1
# One obviously dangerous permission is what existing tools/alerts flag.
# A path built only from harmless-looking permissions is stealthier.

# SEVERITY bands on risk_score (contract proposal).
BANDS = [(70, "critical"), (40, "high"), (15, "medium"), (0, "low")]


def clamp(value, lo=1, hi=10):
    return max(lo, min(hi, value))


def impact_of(path):
    s = path["signals"]
    if s.get("reaches_admin") or s.get("target_category") == "admin_privileges":
        return IMPACT_ADMIN, "full administrator control"
    if s.get("target_category") == "sensitive_data":
        sens = s.get("data_sensitivity", path["target"].get("data_sensitivity"))
        label = f"{sens}-sensitivity data" if sens else "data of unknown sensitivity"
        return IMPACT_DATA.get(sens, IMPACT_DATA[None]), label
    return IMPACT_OTHER, "a non-critical resource"


def likelihood_of(path):
    s = path["signals"]
    hops = path.get("hop_count", len(path["hops"]))
    preconds = len(s.get("required_preconditions") or [])
    entry = s.get("entry_point_privilege", "medium")
    dangerous = bool(s.get("single_dangerous_permission"))

    raw = (LIKELIHOOD_BASE
           + PER_EXTRA_HOP * max(0, hops - 1)
           + PER_PRECONDITION * preconds
           + ENTRY_PRIVILEGE.get(entry, 0)
           + (SINGLE_DANGEROUS_PERMISSION if dangerous else 0))

    reasons = [f"{hops} hop{'s' if hops != 1 else ''}"]
    if preconds:
        reasons.append(f"{preconds} extra permission{'s' if preconds != 1 else ''} needed")
    else:
        reasons.append("no extra permissions needed")
    reasons.append(f"{entry}-privilege starting identity")
    reasons.append("one obviously dangerous permission (easier to spot)" if dangerous
                   else "no single permission looks dangerous (stealthy)")
    return clamp(raw), reasons


def severity_of(score):
    for cutoff, name in BANDS:
        if score >= cutoff:
            return name
    return "low"


def score_path(path):
    impact, impact_reason = impact_of(path)
    likelihood, why = likelihood_of(path)
    risk = impact * likelihood
    return {
        "impact": impact,
        "likelihood": likelihood,
        "risk_score": risk,
        "severity": severity_of(risk),
        "rationale": (f"Impact {impact}/10: reaches {impact_reason}. "
                      f"Likelihood {likelihood}/10: {', '.join(why)}."),
    }


def score_document(doc):
    out = json.loads(json.dumps(doc))  # deep copy; never mutate discovery's data
    for path in out["paths"]:
        path["scoring"] = score_path(path)
    out["paths"].sort(key=lambda p: p["scoring"]["risk_score"], reverse=True)
    out["metadata"]["source"] = "apre-scoring"
    out["metadata"]["scored_at"] = datetime.now(timezone.utc).isoformat()
    out["metadata"]["path_count"] = len(out["paths"])
    return out


def main(argv):
    if len(argv) < 2:
        sys.exit(__doc__)
    src = argv[1]
    dst = argv[2] if len(argv) > 2 else "scored_paths.json"
    with open(src, encoding="utf-8") as f:
        doc = json.load(f)
    scored = score_document(doc)
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(scored, f, indent=2)
    for p in scored["paths"]:
        sc = p["scoring"]
        print(f"{p['id']:<14} {p['technique']:<24} I={sc['impact']:>2} "
              f"L={sc['likelihood']:>2}  score={sc['risk_score']:>3}  {sc['severity']}")
    print(f"-> wrote {dst}")


if __name__ == "__main__":
    main(sys.argv)
