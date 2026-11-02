# APRE Seeded Attack Scenarios

Deliberately vulnerable AWS IAM setups, created as code, so APRE has known
attack paths to find and known decoys to ignore.

> **Sandbox account only.** These create real privilege-escalation paths.
> `guard.tf` refuses to run against any account other than the one you set in
> `terraform.tfvars`.

## What gets created

| ID | Type | Entry point | Path | Should APRE report it? |
|----|------|-------------|------|------------------------|
| S1 | Attack | `apre-intern` | intern → (group) → `apre-ci-role` → `apre-data-role` → sensitive S3 bucket | Yes |
| S2 | Attack | `apre-support` | edits its own policy with `iam:CreatePolicyVersion` → admin | Yes |
| S3 | Attack | `apre-deployer` | `iam:PassRole` + create/invoke Lambda → runs as `apre-lambda-admin-role` | Yes |
| C1 | Decoy | `apre-auditor` | PassRole, but nothing to pass the role to | No |
| C2 | Decoy | `apre-contractor` | wants to assume data role, but the role doesn't trust it | No |
| C3 | Decoy | `apre-analyst` | can edit a policy attached to nobody | No |

Full answer key: `ground_truth.json`.

**Safety by design**
- No access keys or passwords are created for any scenario user. Nobody can
  log in as them, so the paths exist in the graph but can't be used from outside.
- No Lambda functions, EC2 instances or other compute are created.
- The bucket is private, encrypted, has public access blocked, and holds one
  fake CSV.
- Everything is tagged `Project=APRE`, `Purpose=intentionally-vulnerable-test-fixture`.

**Cost:** IAM is free. One tiny S3 object costs effectively nothing.

## Files

| File | What it is |
|------|-----------|
| `providers.tf` | Terraform + AWS provider setup, default tags |
| `variables.tf` | Region, admin profile, sandbox account ID |
| `guard.tf` | Stops apply if pointed at the wrong account |
| `s0_shared_target.tf` | Sensitive S3 bucket (target for S1) |
| `s1_role_chain.tf` | Scenario S1 |
| `s2_policy_version.tf` | Scenario S2 |
| `s3_passrole_lambda.tf` | Scenario S3 |
| `s4_controls.tf` | Decoys C1–C3 |
| `outputs.tf` | ARNs to look for after the sync |
| `ground_truth.json` | Answer key for evaluation |
| `verify.cypher` | Neo4j checks that the graph contains the scenarios |
| `snapshot_graph.cypher` | Export/restore the APRE subgraph (survives account/instance loss) |
| `bootstrap/bootstrap_admin.sh` | One-time admin setup on a fresh account |
| `bootstrap/readonly_user.tf` | The cartography-readonly identity as code |
| `MIGRATION.md` | How to rebuild everything on a new AWS account when this one expires |

> **This account expires.** The AWS free plan lasts ~6 months and the Neo4j Aura
> Free instance is deleted after 30 days paused. Read `MIGRATION.md` early, not
> at month 6. The whole setup is code precisely so the rebuild is a re-run.

---

## Runbook (Windows, PowerShell)

### 1. Install Terraform

```powershell
winget install Hashicorp.Terraform
# close and reopen PowerShell, then:
terraform -version
```

### 2. Set up an admin profile for the sandbox

`cartography-readonly` can't create anything, which is correct. You need a
separate admin identity in the **sandbox account** to create the scenarios.

1. Sign in to the sandbox account console.
2. IAM → Users → Create user `apre-admin` (no console access needed).
3. Attach the `AdministratorAccess` policy.
4. Security credentials → Create access key → "Command Line Interface".
5. Configure it locally:

```powershell
aws configure --profile apre-admin
# Access key / secret: from step 4
# Default region: ap-south-1
# Output: json

aws sts get-caller-identity --profile apre-admin
# Note the "Account" value: that's your expected_account_id
```

> Long-lived admin keys are a risk. When you aren't actively changing scenarios,
> **deactivate** the key in IAM (you can reactivate it later).

### 3. Configure

```powershell
copy terraform.tfvars.example terraform.tfvars
notepad terraform.tfvars   # set expected_account_id to the sandbox account ID
```

### 4. Create the scenarios

```powershell
terraform init
terraform plan -out apre.tfplan
```

Read the plan. Expect **28 resources to add, 0 to change, 0 to destroy**.
If it wants to change or destroy anything you didn't create, stop.

```powershell
terraform apply apre.tfplan
terraform output
```

### 5. Re-sync Cartography

Use the **read-only** profile. Three things are non-obvious and were learned the hard
way (see `FINDINGS.md`):

- **Username = the Aura instance ID** (e.g. `2276c01d`), NOT `neo4j`, for this instance.
  Check `NEO4J_USERNAME` in your downloaded Aura credentials file.
- **`--aws-requested-syncs` is mandatory.** Without scoping, the sync hangs ~20 min
  retrying Redshift in an opted-out region (`OptInRequired`) and then fails the whole run.
- **`--permission-relationships-file` is mandatory.** Without it, the S3 `CAN_READ`
  edge (check V4) is never created and that stage is silently skipped.

Resume the Aura instance first if it's paused — DNS won't resolve for ~60s after resume.

```powershell
$env:AWS_PROFILE = "cartography-readonly"
$env:NEO4J_PASSWORD = 'your-aura-password'   # single quotes guard special chars
cartography --neo4j-uri "neo4j+s://<instance>.databases.neo4j.io" `
            --neo4j-user "<instance-id>" `
            --neo4j-password-env-var NEO4J_PASSWORD `
            --selected-modules aws `
            --aws-requested-syncs ec2:instance,s3,iam,permission_relationships `
            --permission-relationships-file "<venv>\Lib\site-packages\cartography\data\permission_relationships.yaml"
```

Keep the sync log (`... 2>&1 | Tee-Object -FilePath evidence\cartography_sync_<date>.log`).
A clean run ends with `Finishing sync` and no red traceback. `WARNING ... label does
not exist` lines for DynamoDB/Redshift/RDS/etc. are normal — those services aren't synced.

### 6. Verify the graph

Open the Aura instance → Query, and run each query in `verify.cypher` one at a time.

| Check | Pass condition |
|-------|----------------|
| V0 | **11** `apre-*` principals: 9 scenario (6 users, 3 roles) + `apre-admin` (infra user) + `apre-interns` (group) |
| V1 | ci-role → data-role present. **intern → ci-role absent** (Cartography gap, see `FINDINGS.md`). **No** contractor → data-role |
| V2 | ci-role trusts intern, data-role trusts ci-role, lambda-admin-role trusts `lambda.amazonaws.com` |
| V3 | intern linked to `apre-interns` (two edge types: `MEMBER_AWS_GROUP`, `MEMBER_OF`) |
| V4 | data-role → bucket via `CAN_READ`. Bucket label is **`AWSS3Bucket`** (not `S3Bucket`) |
| V5 | dangerous actions visible for support, deployer, auditor, analyst |
| V6 | group policy allowing `sts:AssumeRole` on ci-role |
| V7 | S1 chain renders as a connected graph |

Screenshot each passing check for the Phase I report.

**Step 1 is done only when all eight checks pass.**

### 7. Teardown (end of project, or to reset)

```powershell
terraform destroy
```

Then re-run the Cartography sync so the graph drops the deleted nodes.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|-------------------|
| `Wrong AWS account` on plan | Wrong profile or wrong `expected_account_id`. Fix tfvars. |
| `MalformedPolicyDocument: Invalid principal` on apply | IAM hadn't finished creating the user yet. Run `terraform apply` again. |
| `BucketAlreadyExists` | Name clash (rare). `terraform apply -replace="random_id.suffix"`. |
| V0 shows fewer than 9 | Sync used a different account/profile, or IAM sync step errored. Check the log. |
| V4 returns nothing | Permission mapping didn't produce an S3 edge. Check that the sync's S3 step ran; the discovery module can also read the statements directly (V5 style). |
| V1 shows contractor → data-role | Note it down: that would mean Cartography draws assume-role edges from identity policies alone, and the discovery module must check trust itself. |
