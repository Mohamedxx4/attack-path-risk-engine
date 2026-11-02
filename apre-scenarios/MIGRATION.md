# APRE Migration Runbook — moving to a fresh AWS account

The sandbox AWS account closes after **6 months or when its credits run out,
whichever comes first**. When it closes you lose access to everything in it.
This runbook rebuilds the entire scenario setup on a new account from the repo,
with no console clicking beyond one bootstrap step.

It also covers the Neo4j side, which expires on a *different* and *shorter*
clock than AWS.

---

## The two expiry clocks

| Thing | Lasts | What happens at the end | Grace period |
|-------|-------|-------------------------|--------------|
| AWS free plan | 6 months OR until credits used up | Account closes automatically; you lose access to all resources and data | Content kept **90 days**; upgrade to pay-as-you-go within that window to keep access |
| Neo4j Aura **Free** instance | pauses after **72h** of inactivity | stays paused | **deleted after 30 days paused** — all data lost |

**Practical consequences:**
1. **Neo4j will bite first.** If you stop touching the project for ~5 weeks over a
   break, the graph is gone even though AWS is still fine. Log in and resume the
   Aura instance at least every few weeks, and keep a graph snapshot (below).
2. **Set an AWS calendar reminder** for ~5 months after account creation, so the
   rebuild is deliberate and not a scramble during the Phase II crunch.
3. **Don't rely on the AWS account for your demo evidence.** Keep screenshots and
   a graph snapshot in the repo so Phase I results stand on their own.

---

## What is tied to the specific account (and what isn't)

Almost nothing is account-specific. The whole point of doing this as code.

| Tied to the account | Portable (just reuse) |
|---------------------|------------------------|
| The 12-digit account ID (`expected_account_id` in tfvars) | Every `.tf` scenario file |
| The `apre-admin` access key | `ground_truth.json`, `verify.cypher` |
| The `cartography-readonly` access key | The Cartography sync command |
| The S3 bucket name suffix (regenerated automatically) | Resource names, policies, trust relationships |

So "cloning the expired account onto a new one" = point the same code at a new
account ID with a new admin key, apply, re-sync. The graph comes out identical.

---

## Migration procedure

### Before the old account closes

1. **Snapshot the graph.** In the Aura Query tab, run the EXPORT query in
   `snapshot_graph.cypher`, save the result as `evidence/apre_graph_snapshot.json`,
   and commit it. This is your results-survive-anything backup.
2. **Save evidence.** Make sure the V0–V7 screenshots and the Cartography sync log
   are committed under `evidence/`.
3. **Optional, tear down.** You don't have to `terraform destroy` the old account
   (it's closing anyway), but doing so is tidy and confirms the destroy path works.
4. **Decide on Neo4j.** You can keep the *same* Aura instance across AWS accounts —
   it isn't tied to AWS at all. Only create a new one if the old was deleted.

### On the fresh AWS account

1. **Bootstrap the admin identity** (the one manual step). In the new account's
   AWS CloudShell:
   ```bash
   bash bootstrap/bootstrap_admin.sh
   ```
   Then on your machine:
   ```powershell
   aws configure --profile apre-admin      # paste the printed key/secret
   aws sts get-caller-identity --profile apre-admin   # copy the new Account id
   ```
2. **Recreate the read-only scanner.** Either repeat the manual steps from the main
   README section 2, or apply `bootstrap/readonly_user.tf` as code (move it beside
   the scenario files so the account guard covers it), then:
   ```powershell
   # grab the generated key for the sync
   terraform output -raw cartography_readonly_secret
   aws configure --profile cartography-readonly
   ```
3. **Update config:**
   ```powershell
   notepad terraform.tfvars   # set expected_account_id to the NEW account id
   ```
4. **Recreate the scenarios:**
   ```powershell
   terraform init
   terraform plan -out apre.tfplan     # expect 28 to add, 0 change, 0 destroy
   terraform apply apre.tfplan
   ```
5. **Re-sync Cartography** into your Aura instance (same command as README section 5,
   using the new `cartography-readonly` key). Reminder: `--neo4j-user` is the Aura
   **instance ID** from the credentials file, and you need both `--aws-requested-syncs`
   and `--permission-relationships-file` or the sync hangs / skips the S3 edge.
6. **Re-verify.** Run `verify.cypher` V0–V7. New screenshots, new sync log, into
   `evidence/`.

The graph on the new account is identical to the old one except for the account
ID and the S3 bucket suffix. Your discovery module and `ground_truth.json` need
no changes.

---

## Why this is safe to hand to a panel

- The one non-code step (`bootstrap_admin.sh`) is read-and-run, under 20 lines,
  and prints exactly what it does before it does it.
- The account guard (`guard.tf`) means the scenarios can never accidentally be
  created in the wrong account, old or new.
- No scenario identity ever gets a login or key, so the vulnerable paths exist
  only inside the graph, never as something reachable from the internet.

---

## Keep in the repo (so nothing depends on a live account)

```
evidence/
  apre_graph_snapshot.json     # exported subgraph
  v0_principals.png ...        # verification screenshots
  cartography_sync_<date>.log  # sync output
```

Commit these every time you re-verify. They are the proof the pipeline ran,
independent of whether the AWS account or the Aura instance still exists.
