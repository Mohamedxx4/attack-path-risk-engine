"""APRE path discovery - entry point.

Connects to the Cartography/Neo4j graph, runs the attack-path detectors, and
writes discovered_paths.json in the shared path-contract shape.

Usage (with the Aura instance running and NEO4J_PASSWORD set):
    python discover.py
"""
import json
import sys

from neo4j import GraphDatabase

import config
import emit
from queries import role_chaining, policy_self_escalation, passrole_lambda

OUTPUT_FILE = "discovered_paths.json"


def main():
    if not config.NEO4J_PASSWORD:
        print("ERROR: set the NEO4J_PASSWORD environment variable first.", file=sys.stderr)
        print("  PowerShell:  $env:NEO4J_PASSWORD = 'your-aura-password'", file=sys.stderr)
        sys.exit(1)

    driver = GraphDatabase.driver(
        config.NEO4J_URI, auth=(config.NEO4J_USER, config.NEO4J_PASSWORD)
    )
    try:
        driver.verify_connectivity()
    except Exception as exc:  # noqa: BLE001
        print("ERROR: could not connect to Neo4j (%s)." % exc, file=sys.stderr)
        print("  - Is the Aura instance resumed? (paused instances fail to connect)", file=sys.stderr)
        print("  - Check NEO4J_URI / NEO4J_USER (username is the instance id, not 'neo4j').", file=sys.stderr)
        driver.close()
        sys.exit(1)

    paths = []
    try:
        with driver.session() as session:
            paths += role_chaining.detect(session, id_start=len(paths) + 1)
            paths += policy_self_escalation.detect(session, id_start=len(paths) + 1)
            paths += passrole_lambda.detect(session, id_start=len(paths) + 1)
    finally:
        driver.close()

    doc = emit.document(paths, account_id=config.ACCOUNT_ID, neo4j_database=config.NEO4J_USER)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2)

    print("Wrote %s with %d path(s):" % (OUTPUT_FILE, len(paths)))
    for p in paths:
        recon = " [reconstructed hop]" if "Reconstructed" in p["signals"]["notes"] else ""
        print("  [%s] %s - %s%s" % (p["id"], p["technique"], p["title"], recon))
    if not paths:
        print("  (no paths found - if you expected S1, check that the graph is populated"
              " and that CAN_READ edges exist: see verify.cypher V4.)")


if __name__ == "__main__":
    main()
