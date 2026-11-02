# APRE — Findings & Operational Notes

Captured during the Phase I infrastructure build and verification
(Cartography 0.144.0, Neo4j AuraDB, AWS account 451513982258, 2026-11-01).

---

## Finding #1 — Cartography's assume-role edges are incomplete

**Observation.** Cartography derives `STS_ASSUMEROLE_ALLOW` edges from role *trust
policies*. In our graph it created the role→role hop (`apre-ci-role → apre-data-role`)
but **not** the user→role hop (`apre-intern → apre-ci-role`), even though:

- the trust exists — `apre-ci-role` `TRUSTS_AWS_PRINCIPAL` `apre-intern` (verified, V2), and
- the identity-side permission exists — the `apre-interns` group policy allows
  `sts:AssumeRole` on `apre-ci-role` (verified, V6).

So the intern genuinely can assume the ci-role in AWS, but that capability is **absent
from Cartography's pre-built edges**.

**Why it matters.** An attack-path engine that trusted `STS_ASSUMEROLE_ALLOW` alone
would miss the entry hop of scenario S1 and never discover the full path
`intern → ci-role → data-role → sensitive bucket`. This is the concrete justification
for APRE's approach: *catalog-independent discovery that reconstructs assume-role
capability from primary data rather than relying on a tool's derived relationships.*

**Design consequence.** The discovery module must establish an assume-role capability
A → R by combining two facts, not by reading `STS_ASSUMEROLE_ALLOW`:
1. R's trust policy allows A  → `(R)-[:TRUSTS_AWS_PRINCIPAL]->(A)`, and
2. A (directly, or via a group it belongs to) has an `Allow` policy statement with
   action `sts:AssumeRole` (or `sts:*` / `*`) whose resource matches R's ARN.

**Paper-ready sentence.**
> Relying on the graph tool's precomputed assume-role relationships misses valid
> escalation paths: in our controlled environment Cartography omitted a user-to-role
> assumption edge whose underlying trust and permission both existed. APRE therefore
> derives assume-role reachability directly from trust policies and identity
> permissions, which is what lets it recover paths a relationship-catalog approach drops.

*(Root cause not pinned down — Cartography bug vs. deliberate modelling choice. The
conclusion holds either way. Worth a short dig in Phase II if the panel asks.)*

---

## Operational gotchas (fold these into any rebuild)

1. **Neo4j username = Aura instance ID**, not `neo4j`, for this instance
   (`--neo4j-user 2276c01d`). Always read `NEO4J_USERNAME` from the downloaded
   Aura credentials file; a new instance will have a new ID.

2. **Scope the AWS sync** with `--aws-requested-syncs ec2:instance,s3,iam,permission_relationships`.
   An unscoped sync tries every service in every region; Redshift in an opted-out
   region returns `OptInRequired`, which Cartography retries with exponential backoff
   for ~20 minutes and then fails the whole AWS stage.

3. **Pass `--permission-relationships-file`** explicitly
   (`<venv>\Lib\site-packages\cartography\data\permission_relationships.yaml`).
   Without it the permission-relationships stage is skipped with only a warning, and
   the S3 `CAN_READ` edge (check V4) and `CAN_PASS_ROLE` edges never get created.

4. **Resume the Aura instance before syncing.** A paused Free instance fails DNS
   resolution (`getaddrinfo failed`); wait ~60s after resume. Free instances pause
   after 72h idle and are deleted after 30 days paused.

5. **Schema labels** in this Cartography version: S3 buckets are `AWSS3Bucket`
   (not `S3Bucket`); principals carry stacked labels (e.g. `[AWSPrincipal, AWSUser,
   UserAccount]`). Group membership appears under two edge types
   (`MEMBER_AWS_GROUP` and `MEMBER_OF`).

6. **Python version:** Cartography 0.144.0 warns it is tested on 3.13+ only; it ran
   correctly on 3.12.10 here. If a future sync throws an unexplained Python error,
   rebuild the venv on 3.13 before chasing anything else.

7. **Graph noise to filter in the engine:** `apre-admin` (Terraform's admin user) and
   `apre-lambda-admin-role` both hold AdministratorAccess, so they legitimately show
   broad access (e.g. `CAN_READ`/`CAN_WRITE` on the bucket). Exclude `apre-admin` from
   discovery results — it is infrastructure, not a scenario.
