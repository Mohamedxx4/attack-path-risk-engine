// =====================================================================
// APRE scenario verification queries  (verified against Cartography 0.144.0
// + Neo4j AuraDB, 2026-11-01). Run each in the Aura Query tab, one at a time.
//
// NOTE on labels: this Cartography version uses AWSS3Bucket (not S3Bucket).
// Principals carry multiple labels, e.g. [AWSPrincipal, AWSUser, UserAccount].
//
// All 8 checks passed on the reference run. Expected results are noted inline.
// =====================================================================


// ---------------------------------------------------------------------
// V0. All APRE principals present.
// EXPECT 11 rows: 9 scenario principals (6 users + 3 roles)
//                 + apre-admin  (the Terraform admin user, shares the prefix)
//                 + apre-interns (the group — groups are principals too)
// ---------------------------------------------------------------------
MATCH (p:AWSPrincipal)
WHERE p.name STARTS WITH 'apre-'
RETURN labels(p) AS labels, p.name AS name, p.arn AS arn
ORDER BY name;


// ---------------------------------------------------------------------
// V1. Cartography's pre-built assume-role edges.
// EXPECT exactly 1 row: apre-ci-role -> apre-data-role.
//   * apre-intern -> apre-ci-role is ABSENT  (Cartography only derived the
//     role->role hop, not the user->role hop — see FINDINGS.md, Finding #1).
//     The capability is real in AWS; the engine must reconstruct it from
//     TRUSTS_AWS_PRINCIPAL (V2) + the identity sts:AssumeRole permission (V6).
//   * apre-contractor -> apre-data-role is ABSENT (decoy C2, correct).
// ---------------------------------------------------------------------
MATCH (src:AWSPrincipal)-[:STS_ASSUMEROLE_ALLOW]->(dst:AWSRole)
WHERE dst.name STARTS WITH 'apre-'
RETURN src.name AS from_principal, dst.name AS can_assume
ORDER BY from_principal;


// ---------------------------------------------------------------------
// V2. Trust relationships (the raw data behind assume-role).
// EXPECT 3 rows:
//   apre-ci-role           trusts apre-intern            (AWSUser)
//   apre-data-role         trusts apre-ci-role           (AWSRole)
//   apre-lambda-admin-role trusts lambda.amazonaws.com   (AWSServicePrincipal)
// The first row proves the intern trust exists even though V1 omitted its edge.
// ---------------------------------------------------------------------
MATCH (r:AWSRole)-[:TRUSTS_AWS_PRINCIPAL]->(t)
WHERE r.name STARTS WITH 'apre-'
RETURN r.name AS role, labels(t) AS trusted_labels, t.arn AS trusts
ORDER BY role;


// ---------------------------------------------------------------------
// V3. Group membership (S1 entry).
// EXPECT 2 rows (same membership, two edge types): apre-intern in apre-interns
// via MEMBER_AWS_GROUP and MEMBER_OF. Use MEMBER_AWS_GROUP in the engine.
// ---------------------------------------------------------------------
MATCH (u:AWSUser {name: 'apre-intern'})-[rel]-(g:AWSGroup)
RETURN u.name AS user, type(rel) AS relationship, g.name AS group;


// ---------------------------------------------------------------------
// V4. S1 final hop: principals with a permission edge to the sensitive bucket.
// EXPECT apre-data-role with CAN_READ (the scenario edge). Also expect
// apre-admin and apre-lambda-admin-role with CAN_READ/CAN_WRITE — both hold
// AdministratorAccess, so that is correct, just infra noise.
// Requires the sync to have run with --permission-relationships-file.
// ---------------------------------------------------------------------
MATCH (p:AWSPrincipal)-[rel]->(b:AWSS3Bucket)
WHERE b.name CONTAINS 'apre-sensitive-data' OR b.id CONTAINS 'apre-sensitive-data'
RETURN p.name AS principal, type(rel) AS permission_edge, b.name AS bucket
ORDER BY principal;


// ---------------------------------------------------------------------
// V5. Dangerous actions for S2, S3, and their decoys.
// EXPECT the real/decoy pairs, distinguished only by CONTEXT:
//   apre-support  : iam:CreatePolicyVersion on apre-support-policy (its OWN)   = S2 real
//   apre-analyst  : iam:CreatePolicyVersion on apre-unattached-policy (nobody) = C3 decoy
//   apre-deployer : iam:PassRole + lambda:CreateFunction/InvokeFunction        = S3 real
//   apre-auditor  : iam:PassRole + lambda:ListFunctions/GetFunction (no exec)  = C1 decoy
// ---------------------------------------------------------------------
MATCH (p:AWSPrincipal)-[:POLICY]->(pol)-[:STATEMENT]->(s:AWSPolicyStatement)
WHERE p.name IN ['apre-support','apre-deployer','apre-auditor','apre-analyst']
RETURN p.name AS principal, pol.name AS policy,
       s.effect AS effect, s.action AS actions, s.resource AS resources
ORDER BY principal;


// ---------------------------------------------------------------------
// V6. S1 identity-side permission (lives on the GROUP, not the user).
// EXPECT 1 row: apre-interns / apre-interns-assume-ci / sts:AssumeRole on ci-role.
// ---------------------------------------------------------------------
MATCH (g:AWSGroup {name: 'apre-interns'})-[:POLICY]->(pol)-[:STATEMENT]->(s:AWSPolicyStatement)
RETURN g.name AS group, pol.name AS policy,
       s.effect AS effect, s.action AS actions, s.resource AS resources;


// ---------------------------------------------------------------------
// V7. The S1 attack path as a connected graph. Run, then switch the result
// view to GRAPH. EXPECT 5 nodes (intern, group, ci-role, data-role, bucket)
// wired into one chain. This is the panel headline screenshot.
// ---------------------------------------------------------------------
MATCH (intern:AWSUser {name:'apre-intern'}),
      (grp:AWSGroup {name:'apre-interns'}),
      (ci:AWSRole {name:'apre-ci-role'}),
      (data:AWSRole {name:'apre-data-role'}),
      (bucket:AWSS3Bucket)
WHERE bucket.name CONTAINS 'apre-sensitive-data'
OPTIONAL MATCH a = (intern)-[:MEMBER_AWS_GROUP]->(grp)
OPTIONAL MATCH b = (ci)-[:TRUSTS_AWS_PRINCIPAL]->(intern)
OPTIONAL MATCH c = (data)-[:TRUSTS_AWS_PRINCIPAL]->(ci)
OPTIONAL MATCH d = (ci)-[:STS_ASSUMEROLE_ALLOW]->(data)
OPTIONAL MATCH e = (data)-[:CAN_READ]->(bucket)
RETURN a, b, c, d, e;


// ---------------------------------------------------------------------
// BONUS. S3 PassRole scenario check (not one of the 8, but useful):
// CAN_PASS_ROLE edges created by permission_relationships.
// EXPECT apre-deployer AND apre-auditor both -> apre-lambda-admin-role.
// They look identical here; the difference (deployer can also create+invoke
// Lambda, auditor cannot) is what V5 shows and what the engine keys on.
// ---------------------------------------------------------------------
MATCH (p:AWSPrincipal)-[:CAN_PASS_ROLE]->(r:AWSRole)
WHERE r.name STARTS WITH 'apre-'
RETURN p.name AS principal, r.name AS can_pass_role
ORDER BY principal;
