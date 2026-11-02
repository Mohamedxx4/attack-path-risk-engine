# ===========================================================================
# S4 - Negative controls (decoys). APRE must NOT report these.
#
# These look risky at a glance but are not exploitable. They exist so that
# the evaluation can measure false positives, not just true positives.
# ===========================================================================

# ---------------------------------------------------------------------------
# C1 - PassRole without a way to use it
#   apre-auditor can pass the Lambda admin role, but cannot create or invoke
#   functions (or launch anything else). PassRole alone is harmless.
#   A naive "flag every PassRole on an admin role" rule would wrongly report it.
# ---------------------------------------------------------------------------
resource "aws_iam_user" "auditor" {
  name = "${local.name}-auditor"
  tags = { Scenario = "S4-C1", Role = "decoy" }

  depends_on = [terraform_data.account_guard]
}

resource "aws_iam_user_policy" "auditor" {
  name = "${local.name}-auditor-policy"
  user = aws_iam_user.auditor.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PassRoleButNothingToPassItTo"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.lambda_admin.arn
      },
      {
        Sid      = "ReadOnlyLambda"
        Effect   = "Allow"
        Action   = ["lambda:ListFunctions", "lambda:GetFunction"]
        Resource = "*"
      }
    ]
  })
}

# ---------------------------------------------------------------------------
# C2 - One-sided assume-role
#   apre-contractor's own policy says it may assume apre-data-role, but the
#   data role's trust policy does not trust the contractor. AWS requires BOTH
#   sides, so this path does not exist. A tool that reads only the identity
#   policy would wrongly report contractor -> data-role -> sensitive bucket.
# ---------------------------------------------------------------------------
resource "aws_iam_user" "contractor" {
  name = "${local.name}-contractor"
  tags = { Scenario = "S4-C2", Role = "decoy" }

  depends_on = [terraform_data.account_guard]
}

resource "aws_iam_user_policy" "contractor" {
  name = "${local.name}-contractor-policy"
  user = aws_iam_user.contractor.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "WantsDataRoleButIsNotTrusted"
      Effect   = "Allow"
      Action   = "sts:AssumeRole"
      Resource = aws_iam_role.data.arn
    }]
  })
}

# ---------------------------------------------------------------------------
# C3 - CreatePolicyVersion on someone else's unattached policy
#   apre-analyst can edit a policy that is attached to nobody. Editing it gives
#   nothing. Contrast with S2, where the edited policy is the user's own.
# ---------------------------------------------------------------------------
resource "aws_iam_user" "analyst" {
  name = "${local.name}-analyst"
  tags = { Scenario = "S4-C3", Role = "decoy" }

  depends_on = [terraform_data.account_guard]
}

resource "aws_iam_policy" "unattached" {
  name        = "${local.name}-unattached-policy"
  description = "APRE C3: attached to no principal"
  tags        = { Scenario = "S4-C3" }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "Placeholder"
      Effect   = "Allow"
      Action   = "s3:ListAllMyBuckets"
      Resource = "*"
    }]
  })
}

resource "aws_iam_user_policy" "analyst" {
  name = "${local.name}-analyst-policy"
  user = aws_iam_user.analyst.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "EditsAPolicyNobodyUses"
      Effect   = "Allow"
      Action   = "iam:CreatePolicyVersion"
      Resource = aws_iam_policy.unattached.arn
    }]
  })
}
