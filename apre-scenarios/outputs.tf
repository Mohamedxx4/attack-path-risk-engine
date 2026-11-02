output "account_id" {
  value = local.account_id
}

output "sensitive_bucket" {
  value = aws_s3_bucket.sensitive.bucket
}

output "scenario_principals" {
  description = "ARNs to look for in Neo4j after the Cartography sync"
  value = {
    S1_entry      = aws_iam_user.intern.arn
    S1_hop1       = aws_iam_role.ci.arn
    S1_hop2       = aws_iam_role.data.arn
    S2_entry      = aws_iam_user.support.arn
    S2_policy     = aws_iam_policy.support.arn
    S3_entry      = aws_iam_user.deployer.arn
    S3_admin_role = aws_iam_role.lambda_admin.arn
    C1_decoy      = aws_iam_user.auditor.arn
    C2_decoy      = aws_iam_user.contractor.arn
    C3_decoy      = aws_iam_user.analyst.arn
  }
}
