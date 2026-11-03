"""S1 - Role-chaining detection.

An attacker holding a low-privilege identity assumes a role, that role assumes
another role, and the final role can read a sensitive resource. No single
permission looks dangerous; the risk is the chain.

KEY IDEA (APRE's differentiator): we do NOT rely on Cartography's pre-built
STS_ASSUMEROLE_ALLOW edges, because Cartography does not create all of them (it
omitted the user->role hop in our test data - Finding #1). Instead we RECONSTRUCT
an "A can assume R" capability from first principles:

    R's trust policy trusts A          (R)-[:TRUSTS_AWS_PRINCIPAL]->(A)
    AND
    A (or a group A belongs to) has an identity policy allowing sts:AssumeRole on R

Both halves must hold - which is also why decoy C2 (contractor has the identity
permission but the role does not trust it) is correctly NOT reported.
"""
import config
import emit


# Reconstructed assume-role capabilities. Returns one row per (src, role) pair
# where BOTH the trust side and the identity-permission side hold.
CAPABILITY_QUERY = """
MATCH (target:AWSRole)-[:TRUSTS_AWS_PRINCIPAL]->(src:AWSPrincipal)
WHERE NOT src:AWSServicePrincipal AND NOT src:AWSRootPrincipal
MATCH (holder:AWSPrincipal)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(stmt:AWSPolicyStatement)
WHERE (holder = src OR (src)-[:MEMBER_AWS_GROUP]->(holder))
  AND stmt.effect = 'Allow'
  AND any(a IN stmt.action   WHERE toLower(a) IN ['sts:assumerole', 'sts:*', '*'])
  AND any(r IN stmt.resource WHERE r = target.arn OR r = '*')
OPTIONAL MATCH (src)-[existing:STS_ASSUMEROLE_ALLOW]->(target)
RETURN DISTINCT
  src.name  AS src_name,  src.arn  AS src_arn,
  [l IN labels(src) WHERE l IN ['AWSUser','AWSRole','AWSGroup']][0] AS src_type,
  target.name AS tgt_name, target.arn AS tgt_arn,
  (holder <> src) AS via_group,
  (existing IS NOT NULL) AS cartography_edge_exists
"""

# Final hop: a role that can read an S3 bucket (Cartography permission edge).
TERMINAL_READ_QUERY = """
MATCH (r:AWSRole)-[:CAN_READ]->(b:AWSS3Bucket)
RETURN r.arn AS role_arn, b.name AS bucket_name, b.arn AS bucket_arn
"""

# Entry-point candidates.
USERS_QUERY = """
MATCH (u:AWSUser) RETURN u.name AS name, u.arn AS arn
"""

# Principals that already hold full admin (Allow action '*' on resource '*').
ADMIN_QUERY = """
MATCH (p:AWSPrincipal)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(s:AWSPolicyStatement)
WHERE s.effect = 'Allow'
  AND any(a IN s.action   WHERE a = '*')
  AND any(r IN s.resource WHERE r = '*')
RETURN DISTINCT p.arn AS arn
"""


def _rows(session, query):
    return [r.data() for r in session.run(query)]


def detect(session, id_start=1):
    """Return a list of role_chaining path objects. `id_start` lets the caller
    keep path ids unique across detectors."""
    cap_rows = _rows(session, CAPABILITY_QUERY)
    terminals = _rows(session, TERMINAL_READ_QUERY)
    users = _rows(session, USERS_QUERY)
    admins = {r["arn"] for r in _rows(session, ADMIN_QUERY)}

    # Dedupe capability edges by (src_arn, tgt_arn); remember names/types.
    caps = {}
    name = {}
    ntype = {}
    for row in cap_rows:
        key = (row["src_arn"], row["tgt_arn"])
        if key in caps:
            caps[key]["via_group"] = caps[key]["via_group"] or row["via_group"]
            caps[key]["cartography_edge_exists"] = (
                caps[key]["cartography_edge_exists"] or row["cartography_edge_exists"]
            )
        else:
            caps[key] = dict(row)
        name[row["src_arn"]] = row["src_name"]
        ntype[row["src_arn"]] = row["src_type"]
        name[row["tgt_arn"]] = row["tgt_name"]
        ntype[row["tgt_arn"]] = "AWSRole"

    # Adjacency over capability edges.
    adj = {}
    for (src_arn, tgt_arn), row in caps.items():
        adj.setdefault(src_arn, []).append((tgt_arn, row))

    # Terminal reads: role_arn -> list of bucket rows.
    reads = {}
    for t in terminals:
        reads.setdefault(t["role_arn"], []).append(t)

    counter = [id_start - 1]
    paths = []

    for u in users:
        if u["name"] in config.EXCLUDED_PRINCIPALS:
            continue
        if u["arn"] in admins:  # already an administrator; not an escalation entry point
            continue
        start = u["arn"]
        name[start] = u["name"]
        ntype[start] = "AWSUser"
        # Depth-first walk over capability edges from this user.
        stack = [(start, [start], [])]
        while stack:
            cur, nodes, edges = stack.pop()
            # If we've taken at least one hop and this role can read a bucket, emit.
            if len(nodes) > 1 and cur in reads:
                for bucket in reads[cur]:
                    counter[0] += 1
                    paths.append(
                        _build_path(counter[0], nodes, edges, bucket, name, ntype, admins)
                    )
            for nxt, edge in adj.get(cur, []):
                if nxt in nodes:  # no cycles
                    continue
                stack.append((nxt, nodes + [nxt], edges + [edge]))

    return paths


def _build_path(n, nodes, edges, bucket, name, ntype, admins):
    pid = "apre-path-%03d" % n
    hops = []
    reconstructed = []

    for i, edge in enumerate(edges, start=1):
        src_arn, dst_arn = nodes[i - 1], nodes[i]
        frm = emit.principal_ref(name[src_arn], ntype.get(src_arn, "AWSPrincipal"), src_arn)
        to = emit.principal_ref(name[dst_arn], "AWSRole", dst_arn)
        via = " (the permission comes through a group it belongs to)" if edge.get("via_group") else ""
        is_recon = not edge.get("cartography_edge_exists", True)
        recon_txt = (
            " This hop was reconstructed from the role's trust policy and the identity's "
            "permission, because Cartography did not create the assume-role edge."
            if is_recon else ""
        )
        mech = ("%s trusts %s, and %s is allowed to assume it%s.%s"
                % (name[dst_arn], name[src_arn], name[src_arn], via, recon_txt))
        ev = ["TRUSTS_AWS_PRINCIPAL", "POLICY", "STATEMENT"]
        if edge.get("via_group"):
            ev.append("MEMBER_AWS_GROUP")
        if not is_recon:
            ev.append("STS_ASSUMEROLE_ALLOW")
        hops.append(emit.hop(i, frm, to, "sts:AssumeRole", mech, ev))
        if is_recon:
            reconstructed.append("hop %d (%s->%s)" % (i, name[src_arn], name[dst_arn]))

    # Final read hop.
    final_arn = nodes[-1]
    frm = emit.principal_ref(name[final_arn], "AWSRole", final_arn)
    to = emit.resource_ref(bucket["bucket_name"], "AWSS3Bucket", bucket["bucket_arn"])
    hops.append(emit.hop(len(hops) + 1, frm, to, "s3:GetObject",
                         "%s is allowed to read objects in %s." % (name[final_arn], bucket["bucket_name"]),
                         ["CAN_READ"]))

    sensitive = "sensitive" in bucket["bucket_name"].lower()
    target = emit.resource_ref(
        bucket["bucket_name"], "AWSS3Bucket", bucket["bucket_arn"],
        description="Amazon S3 bucket" + (" holding sensitive data" if sensitive else ""),
        data_sensitivity="high" if sensitive else None,
    )
    entry = emit.principal_ref(name[nodes[0]], "AWSUser", nodes[0])

    notes = "No single permission in the chain is dangerous on its own; the risk comes from the combination."
    if reconstructed:
        notes += " Reconstructed (absent from Cartography's edges): " + ", ".join(reconstructed) + " [Finding #1]."

    signals = {
        "reaches_admin": final_arn in admins,
        "target_category": "sensitive_data",
        "data_sensitivity": "high" if sensitive else None,
        "entry_point_privilege": "high" if nodes[0] in admins else "low",
        "required_preconditions": [],
        "single_dangerous_permission": False,
        "notes": notes,
    }
    n_assume = len(edges)
    title = ("%s can reach %s through a %d-role assume-role chain"
             % (name[nodes[0]], bucket["bucket_name"], n_assume))
    return emit.path_object(pid, "role_chaining", title, entry, target, hops, signals)
