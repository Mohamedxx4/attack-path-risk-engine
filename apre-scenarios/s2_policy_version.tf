# ===========================================================================
# S2 - Self-escalation via iam:CreatePolicyVersion
#
#   apre-support (user)
#     --[attached managed policy]--> apre-support-policy
#     which allows iam:CreatePolicyVersion ON ITSELF
#
# Why it matters: the user can publish a new default version of their own
# policy containing "Action: *, Resource: *" and instantly become an
# administrator. The permission looks like routine policy maintenance.
# Documented technique: Rhino Security Labs IAM privesc method #1;
# pathfinding.cloud reference IAM-001.
#
# Edges exercised: POLICY/STATEMENT only. There is no ready-made "can
# escalate" edge in the graph; the discovery module must recognise the
# dangerous action AND that the statement's resource is a policy attached
# to the same principal (a self-loop).
# ===========================================================================

resource "aws_iam_user" "support" {
  name = "${local.name}-support"
  tags = { Scenario = "S2", Role = "entry-point" }

  depends_on = [terraform_data.account_guard]
}

locals {
  # Built as a string so the policy can reference its own ARN without a
  # Terraform dependency cycle.
  support_policy_name = "${local.name}-support-policy"
  support_policy_arn  = "arn:aws:iam::${local.account_id}:policy/${local.support_policy_name}"
}

resource "aws_iam_policy" "support" {
  name        = local.support_policy_name
  description = "APRE S2: deliberately allows editing itself (privilege escalation fixture)"
  tags        = { Scenario = "S2" }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "LooksHarmlessReadOnly"
        Effect   = "Allow"
        Action   = ["iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListPolicyVersions"]
        Resource = local.support_policy_arn
      },
      {
        Sid      = "DangerousSelfEdit"
        Effect   = "Allow"
        Action   = "iam:CreatePolicyVersion"
        Resource = local.support_policy_arn
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "support" {
  user       = aws_iam_user.support.name
  policy_arn = aws_iam_policy.support.arn
}
