#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# APRE bootstrap: create the admin identity Terraform needs, from code.
#
# This is the ONE manual step that can't be Terraform (you need admin before
# Terraform can run as admin). Run it ONCE on a fresh sandbox account, using
# the root user's temporary CLI access or CloudShell in the AWS console.
#
# Usage (in AWS CloudShell, which is already authenticated as the account):
#   bash bootstrap_admin.sh
#
# It prints an access key. Put that into a local CLI profile named apre-admin.
# ---------------------------------------------------------------------------
set -euo pipefail

ADMIN_USER="apre-admin"

echo "Account: $(aws sts get-caller-identity --query Account --output text)"
read -r -p "Create admin bootstrap user in THIS account? (yes/no) " ok
[ "$ok" = "yes" ] || { echo "Aborted."; exit 1; }

aws iam create-user --user-name "$ADMIN_USER" >/dev/null 2>&1 || echo "User exists, continuing."
aws iam attach-user-policy \
  --user-name "$ADMIN_USER" \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

echo "--- Access key (store in the apre-admin profile, shown once) ---"
aws iam create-access-key --user-name "$ADMIN_USER" \
  --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text

cat <<'NEXT'

Next, on your own machine:
  aws configure --profile apre-admin   # paste the key/secret above
  aws sts get-caller-identity --profile apre-admin   # copy the Account id
Then set expected_account_id in terraform.tfvars and run the Terraform steps.

When you're done creating scenarios, deactivate this key in IAM.
NEXT
