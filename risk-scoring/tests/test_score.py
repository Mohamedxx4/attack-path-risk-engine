"""
Run:  python tests/test_score.py      (or: pytest tests/)
Checks the scorer against the 8 synthetic scenarios, the ordering of the real
seeded paths, and that all output validates against the contract schema.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.dirname(HERE))

from score import score_document  # noqa: E402

SCHEMA = os.path.join(ROOT, "apre-contract", "schema", "discovered_paths.schema.json")
REAL = os.path.join(ROOT, "path-discovery", "discovered_paths.json")


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def validate(doc):
    try:
        import jsonschema
    except ImportError:
        print("  (jsonschema not installed — schema check skipped)")
        return
    jsonschema.validate(doc, load(SCHEMA))


def test_synthetic_scenarios():
    scored = score_document(load(os.path.join(HERE, "test_scenarios.json")))
    expected = load(os.path.join(HERE, "expected_scores.json"))
    for p in scored["paths"]:
        got = {k: p["scoring"][k] for k in ("impact", "likelihood", "risk_score", "severity")}
        assert got == expected[p["id"]], f"{p['id']}: got {got}, expected {expected[p['id']]}"
    validate(scored)


def test_real_paths_order_and_schema():
    scored = score_document(load(REAL))
    ids = [p["id"] for p in scored["paths"]]
    # Self-escalation (no preconditions) > PassRole+Lambda (needs 2 more perms)
    # > 3-hop chain to data (lower impact than admin).
    assert ids == ["apre-path-002", "apre-path-003", "apre-path-001"], ids
    for p in scored["paths"]:
        assert 1 <= p["scoring"]["risk_score"] <= 100
    validate(scored)


def test_input_not_mutated():
    doc = load(REAL)
    before = json.dumps(doc, sort_keys=True)
    score_document(doc)
    assert json.dumps(doc, sort_keys=True) == before


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"PASS {name}")
