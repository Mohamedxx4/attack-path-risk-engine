"""S3 - Privilege escalation via iam:PassRole + Lambda.

A principal can hand a privileged role to a new Lambda function (it can create and
invoke functions). The function's code then runs with that role's rights.

THREE conditions must hold together - which is what separates the real path (S3)
from decoy C1, where the principal can pass the role but cannot create or invoke a
function to use it:
  1. principal can pass the role        (CAN_PASS_ROLE)
  2. the role is assumable by Lambda     (role TRUSTS lambda.amazonaws.com)
  3. principal can create AND invoke functions (lambda:CreateFunction + InvokeFunction)
"""
import config
import emit

QUERY = """
MATCH (p:AWSPrincipal)-[:CAN_PASS_ROLE]->(r:AWSRole)
      -[:TRUSTS_AWS_PRINCIPAL]->(:AWSServicePrincipal {arn: 'lambda.amazonaws.com'})
WHERE EXISTS {
    MATCH (p)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(s:AWSPolicyStatement)
    WHERE s.effect = 'Allow'
      AND any(a IN s.action WHERE toLower(a) IN ['lambda:createfunction', 'lambda:*', '*'])
  }
  AND EXISTS {
    MATCH (p)-[:POLICY]->(:AWSPolicy)-[:STATEMENT]->(s:AWSPolicyStatement)
    WHERE s.effect = 'Allow'
      AND any(a IN s.action WHERE toLower(a) IN ['lambda:invokefunction', 'lambda:*', '*'])
  }
RETURN DISTINCT
  p.name AS p_name, p.arn AS p_arn,
  [l IN labels(p) WHERE l IN ['AWSUser','AWSRole','AWSGroup']][0] AS p_type,
  r.name AS r_name, r.arn AS r_arn
"""

# Which roles are effectively admin (Allow '*' on '*').
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
        key = (row["p_arn"], row["r_arn"])
        if key in seen:
            continue
        seen.add(key)
        n += 1
        paths.append(_build(n, row, admins))
    return paths


def _build(n, row, admins):
    pid = "apre-path-%03d" % n
    ptype = row["p_type"] or "AWSUser"
    entry = emit.principal_ref(row["p_name"], ptype, row["p_arn"])
    reaches_admin = row["r_arn"] in admins
    target = emit.resource_ref(
        row["r_name"], "AWSRole", row["r_arn"],
        description=("Role with administrator access" if reaches_admin else "Privileged role"),
    )
    hop = emit.hop(
        1,
        emit.principal_ref(row["p_name"], ptype, row["p_arn"]),
        emit.principal_ref(row["r_name"], "AWSRole", row["r_arn"]),
        "iam:PassRole",
        ("%s can hand %s to a new Lambda function it creates and invokes; the function's "
         "code then runs with that role's permissions." % (row["p_name"], row["r_name"])),
        ["CAN_PASS_ROLE", "POLICY", "STATEMENT", "TRUSTS_AWS_PRINCIPAL"],
    )
    signals = {
        "reaches_admin": reaches_admin,
        "target_category": "admin_privileges" if reaches_admin else "other",
        "data_sensitivity": None,
        "entry_point_privilege": "low",
        "required_preconditions": ["lambda:CreateFunction", "lambda:InvokeFunction"],
        "single_dangerous_permission": False,
        "notes": ("Needs three permissions together (PassRole + CreateFunction + InvokeFunction). "
                  "(Decoy C1 can pass the role but cannot create/invoke a function, and is "
                  "correctly not reported.)"),
    }
    title = "%s can run code as %s via PassRole + Lambda" % (row["p_name"], row["r_name"])
    return emit.path_object(pid, "passrole_lambda", title, entry, target, [hop], signals)
