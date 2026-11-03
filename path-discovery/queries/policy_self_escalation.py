"""S2 - Policy self-escalation.

A principal can publish a new version of a managed policy that is attached to
itself (iam:CreatePolicyVersion). It rewrites that policy to allow everything and
becomes an administrator in one step.

The policy it edits must be ATTACHED TO ITSELF - that is what separates the real
escalation (S2) from decoy C3, where the editable policy is attached to no one and
editing it grants nothing.
"""
import config
import emit

QUERY = """
MATCH (p:AWSPrincipal)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(s:AWSPolicyStatement)
WHERE s.effect = 'Allow'
  AND any(a IN s.action WHERE toLower(a) IN ['iam:createpolicyversion', 'iam:*', '*'])
// the policy it is allowed to edit must be one attached to itself
MATCH (p)-[:POLICY]->(editable:AWSPolicy)
WHERE any(r IN s.resource WHERE r = editable.arn OR r = '*')
RETURN DISTINCT
  p.name AS p_name, p.arn AS p_arn,
  [l IN labels(p) WHERE l IN ['AWSUser','AWSRole','AWSGroup']][0] AS p_type,
  editable.name AS pol_name, editable.arn AS pol_arn
"""

# Which principals already hold full admin (Allow '*' on '*'). They cannot
# "escalate to admin" because they are already there, so they are not entry points.
ADMIN_QUERY = """
MATCH (p:AWSPrincipal)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(s:AWSPolicyStatement)
WHERE s.effect = 'Allow'
  AND any(a IN s.action WHERE a = '*')
  AND any(r IN s.resource WHERE r = '*')
RETURN DISTINCT p.arn AS arn
"""


def detect(session, id_start=1):
    rows = [r.data() for r in session.run(QUERY)]
    admins = {r["arn"] for r in session.run(ADMIN_QUERY)}
    paths = []
    n = id_start - 1
    seen = set()
    for row in rows:
        if row["p_name"] in config.EXCLUDED_PRINCIPALS:
            continue
        if row["p_arn"] in admins:  # already an administrator; not an escalation entry point
            continue
        if row["p_arn"] in seen:
            continue
        seen.add(row["p_arn"])
        n += 1
        paths.append(_build(n, row))
    return paths


def _build(n, row):
    pid = "apre-path-%03d" % n
    ptype = row["p_type"] or "AWSUser"
    entry = emit.principal_ref(row["p_name"], ptype, row["p_arn"])
    target = emit.resource_ref(
        "account-administrator", "AWSAccount",
        arn="arn:aws:iam::%s:root" % config.ACCOUNT_ID,
        description="Effective full administrator over the AWS account",
    )
    hop = emit.hop(
        1,
        emit.principal_ref(row["p_name"], ptype, row["p_arn"]),
        emit.principal_ref(row["pol_name"], "AWSPolicy", row["pol_arn"]),
        "iam:CreatePolicyVersion",
        ("%s can publish a new default version of its own attached policy (%s). "
         "By writing a version that allows every action, it makes itself an administrator."
         % (row["p_name"], row["pol_name"])),
        ["POLICY", "STATEMENT"],
    )
    signals = {
        "reaches_admin": True,
        "target_category": "admin_privileges",
        "data_sensitivity": None,
        "entry_point_privilege": "low",
        "required_preconditions": [],
        "single_dangerous_permission": True,
        "notes": ("iam:CreatePolicyVersion on the principal's OWN attached policy. "
                  "(Decoy C3 has the same action on a policy attached to no one and is "
                  "correctly not reported.)"),
    }
    title = "%s can escalate to administrator by rewriting its own policy" % row["p_name"]
    return emit.path_object(pid, "policy_self_escalation", title, entry, target, [hop], signals)
