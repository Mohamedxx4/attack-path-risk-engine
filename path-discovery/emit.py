"""Builders that shape discovery results into the APRE path contract (v1.0).

Discovery fills every field EXCEPT `scoring`, which is left null for the scoring
engine to populate. Scale note: the project uses a 0-100 risk score, but that is
the scoring engine's concern - discovery only emits nulls here.
"""
from datetime import datetime, timezone

SCHEMA_VERSION = "1.0"


def principal_ref(name, ptype, arn=None):
    ref = {"name": name, "type": ptype}
    if arn:
        ref["arn"] = arn
    return ref


def resource_ref(name, rtype, arn=None, description=None, data_sensitivity=None):
    ref = {"name": name, "type": rtype}
    if arn:
        ref["arn"] = arn
    if description:
        ref["description"] = description
    if data_sensitivity is not None:
        ref["data_sensitivity"] = data_sensitivity
    return ref


def hop(step, frm, to, action, mechanism, evidence_edges):
    return {
        "step": step,
        "from": frm,
        "to": to,
        "action": action,
        "mechanism": mechanism,
        "evidence_edges": evidence_edges,
    }


def path_object(pid, technique, title, entry_point, target, hops, signals):
    return {
        "id": pid,
        "technique": technique,
        "title": title,
        "entry_point": entry_point,
        "target": target,
        "hops": hops,
        "hop_count": len(hops),
        "signals": signals,
        # Left for the scoring engine to fill.
        "scoring": {
            "impact": None,
            "likelihood": None,
            "risk_score": None,
            "severity": None,
            "rationale": None,
        },
    }


def document(paths, account_id, neo4j_database):
    return {
        "schema_version": SCHEMA_VERSION,
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "account_id": account_id,
            "source": "apre-discovery",
            "neo4j_database": neo4j_database,
            "path_count": len(paths),
        },
        "paths": paths,
    }
