"""Evaluate discovered_paths.json against the ground-truth answer key.

Treats each seeded attack scenario as a positive and each decoy as a negative,
then prints a confusion matrix (TP / FP / FN / TN) and precision / recall / F1.

Usage:
    python evaluate.py [discovered_paths.json] [path/to/ground_truth.json]

Defaults: discovered_paths.json in this folder, and ../apre-scenarios/ground_truth.json.
"""
import json
import os
import sys


def load(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        print("ERROR: file not found: %s" % path, file=sys.stderr)
        print("Pass paths explicitly: python evaluate.py <discovered_paths.json> <ground_truth.json>",
              file=sys.stderr)
        sys.exit(1)


def main():
    disc_path = sys.argv[1] if len(sys.argv) > 1 else "discovered_paths.json"
    gt_path = sys.argv[2] if len(sys.argv) > 2 else os.environ.get(
        "GROUND_TRUTH", os.path.join("..", "apre-scenarios", "ground_truth.json"))

    disc = load(disc_path)
    gt = load(gt_path)

    expected = {p["entry_point"] for p in gt.get("expected_paths", [])}
    decoys = {d["principal"] for d in gt.get("decoys", [])}
    found = {p["entry_point"]["name"] for p in disc.get("paths", [])}

    tp = sorted(n for n in found if n in expected)
    fp = sorted((n if n in decoys else n + " (unexpected)")
                for n in found if n not in expected)
    fn = sorted(n for n in expected if n not in found)
    tn = sorted(n for n in decoys if n not in found)

    n_tp, n_fp, n_fn, n_tn = len(tp), len(fp), len(fn), len(tn)
    precision = n_tp / (n_tp + n_fp) if (n_tp + n_fp) else 1.0
    recall = n_tp / (n_tp + n_fn) if (n_tp + n_fn) else 1.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    print("APRE discovery evaluation")
    print("=" * 42)
    print("Attack scenarios (positives): %d" % len(expected))
    print("Decoys (negatives):           %d" % len(decoys))
    print("Paths reported by discovery:  %d" % len(found))
    print()
    print("  True positives  (real, found):      %d  %s" % (n_tp, tp))
    print("  False positives (wrong, found):     %d  %s" % (n_fp, fp))
    print("  False negatives (real, missed):     %d  %s" % (n_fn, fn))
    print("  True negatives  (decoys, skipped):  %d  %s" % (n_tn, tn))
    print()
    print("  Precision: %.3f" % precision)
    print("  Recall:    %.3f" % recall)
    print("  F1 score:  %.3f" % f1)
    print()
    if n_fp == 0 and n_fn == 0:
        print("RESULT: perfect - every scenario found, every decoy rejected.")
    else:
        print("RESULT: mismatch - inspect the false positives/negatives above.")
    # Non-zero exit on mismatch, so this can double as a CI/test check.
    sys.exit(0 if (n_fp == 0 and n_fn == 0) else 1)


if __name__ == "__main__":
    main()
