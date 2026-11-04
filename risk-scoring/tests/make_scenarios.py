"""
Generates tests/test_scenarios.json: 8 synthetic, contract-shaped paths that
exercise every scoring rule. They are NOT real AWS data — they let us check
the scorer's behaviour on cases our seeded account doesn't contain.

Expected scores are written to a sibling file (expected_scores.json) so the
scenario file itself stays 100% schema-valid.
"""
import json
import os

ACCT = "000000000000"
HERE = os.path.dirname(os.path.abspath(__file__))


def mk(i, title, technique, n_hops, target_type, category, sensitivity,
       entry_priv, preconds, dangerous, reaches_admin):
    names = [f"t{i}-user"] + [f"t{i}-role-{k}" for k in range(1, n_hops)] + [f"t{i}-target"]
    hops = []
    for k in range(n_hops):
        hops.append({
            "step": k + 1,
            "from": {"name": names[k], "type": "AWSUser" if k == 0 else "AWSRole"},
            "to": {"name": names[k + 1],
                   "type": target_type if k == n_hops - 1 else "AWSRole"},
            "action": "sts:AssumeRole" if k < n_hops - 1 else "synthetic:Access",
            "mechanism": "Synthetic test hop.",
            "evidence_edges": [],
        })
    target = {"name": names[-1], "arn": f"arn:aws:synthetic::{ACCT}:{names[-1]}",
              "type": target_type, "description": "Synthetic test target."}
    if category == "sensitive_data":
        target["data_sensitivity"] = sensitivity
    return {
        "id": f"apre-path-{900 + i}",
        "technique": technique,
        "title": title,
        "entry_point": {"name": names[0], "arn": f"arn:aws:iam::{ACCT}:user/{names[0]}",
                        "type": "AWSUser"},
        "target": target,
        "hops": hops,
        "hop_count": n_hops,
        "signals": {
            "reaches_admin": reaches_admin,
            "target_category": category,
            "data_sensitivity": sensitivity if category == "sensitive_data" else None,
            "entry_point_privilege": entry_priv,
            "required_preconditions": preconds,
            "single_dangerous_permission": dangerous,
            "notes": "Synthetic scenario for scorer testing.",
        },
        "scoring": {"impact": None, "likelihood": None, "risk_score": None,
                    "severity": None, "rationale": None},
    }


# (path, expected impact, likelihood, risk, severity)
CASES = [
    (mk(1, "One-step takeover by a low-privilege user", "policy_self_escalation",
        1, "AWSAccount", "admin_privileges", None, "low", [], False, True),
     10, 10, 100, "critical"),          # worst case: clamps at 10
    (mk(2, "Three-hop chain to highly sensitive data", "role_chaining",
        3, "AWSS3Bucket", "sensitive_data", "high", "low", [], False, False),
     8, 8, 64, "high"),
    (mk(3, "Long five-hop chain to highly sensitive data", "role_chaining",
        5, "AWSS3Bucket", "sensitive_data", "high", "low", [], False, False),
     8, 6, 48, "high"),                 # length lowers likelihood
    (mk(4, "Admin via three combined permissions", "passrole_lambda",
        1, "AWSRole", "admin_privileges", None, "medium",
        ["iam:PassRole", "lambda:CreateFunction", "lambda:InvokeFunction"], False, True),
     10, 6, 60, "high"),                # preconditions lower likelihood
    (mk(5, "Already-privileged user with one dangerous permission", "policy_self_escalation",
        1, "AWSAccount", "admin_privileges", None, "high", [], True, True),
     10, 7, 70, "critical"),            # exactly on critical boundary
    (mk(6, "Two hops to low-sensitivity data", "role_chaining",
        2, "AWSS3Bucket", "sensitive_data", "low", "medium", [], False, False),
     4, 8, 32, "medium"),
    (mk(7, "Hard path to a non-critical resource", "role_chaining",
        4, "AWSRole", "other", None, "high", ["a:X", "b:Y"], False, False),
     3, 3, 9, "low"),
    (mk(8, "Very long, heavily preconditioned chain", "role_chaining",
        8, "AWSS3Bucket", "sensitive_data", "medium", "high",
        ["a:1", "b:2", "c:3", "d:4", "e:5"], True, False),
     6, 1, 6, "low"),                   # clamps at 1
]

if __name__ == "__main__":
    doc = {
        "schema_version": "1.0",
        "metadata": {"generated_at": "2026-11-03T00:00:00+00:00", "account_id": ACCT,
                     "source": "apre-synthetic-tests", "path_count": len(CASES)},
        "paths": [c[0] for c in CASES],
    }
    expected = {c[0]["id"]: {"impact": c[1], "likelihood": c[2],
                             "risk_score": c[3], "severity": c[4]} for c in CASES}
    with open(os.path.join(HERE, "test_scenarios.json"), "w") as f:
        json.dump(doc, f, indent=2)
    with open(os.path.join(HERE, "expected_scores.json"), "w") as f:
        json.dump(expected, f, indent=2)
    print(f"wrote {len(CASES)} scenarios")
