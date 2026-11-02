# ---------------------------------------------------------------------------
# The cartography-readonly identity, as code.
#
# On the first account you created this by hand. On the NEW account, applying
# this (together with the scenario files) recreates it identically, so the
# Cartography sync command does not change between accounts.
#
# This lives in bootstrap/ so you can choose to apply it or keep doing it by
# hand. If you apply it here, run it from the SAME Terraform as the scenarios
# (move it up one folder) so the account guard applies. Access key is created
# so you can run the sync; treat it like the admin key and deactivate when idle.
# ---------------------------------------------------------------------------

resource "aws_iam_user" "cartography_readonly" {
  name = "cartography-readonly"
  tags = { Project = "APRE", Role = "scanner" }
}

# Cartography only reads. SecurityAudit + ViewOnlyAccess together cover what it
# needs to enumerate IAM, S3, EC2, Lambda, etc. without any write permission.
resource "aws_iam_user_policy_attachment" "ro_securityaudit" {
  user       = aws_iam_user.cartography_readonly.name
  policy_arn = "arn:aws:iam::aws:policy/SecurityAudit"
}

resource "aws_iam_user_policy_attachment" "ro_viewonly" {
  user       = aws_iam_user.cartography_readonly.name
  policy_arn = "arn:aws:iam::aws:policy/job-function/ViewOnlyAccess"
}

resource "aws_iam_access_key" "cartography_readonly" {
  user = aws_iam_user.cartography_readonly.name
}

output "cartography_readonly_access_key_id" {
  value = aws_iam_access_key.cartography_readonly.id
}

output "cartography_readonly_secret" {
  value     = aws_iam_access_key.cartography_readonly.secret
  sensitive = true # read with: terraform output -raw cartography_readonly_secret
}
