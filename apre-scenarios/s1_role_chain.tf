# ===========================================================================
# S1 - Multi-hop role chaining to sensitive data
#
#   apre-intern (user)
#     --[member of]-->            apre-interns (group)
#     --[group policy allows sts:AssumeRole]--> apre-ci-role
#     --[ci-role allows sts:AssumeRole]-->      apre-data-role
#     --[data-role allows s3:GetObject]-->      sensitive bucket
#
# Why it matters: no single policy looks dangerous. The intern can only
# assume a CI role; the CI role can only assume a data role. The risk only
# appears when the hops are joined, which is what graph traversal finds and
# a one-policy-at-a-time checklist tends to miss.
#
# Edges exercised: MEMBER_AWS_GROUP, POLICY/STATEMENT, STS_ASSUMEROLE_ALLOW,
#                  TRUSTS_AWS_PRINCIPAL, S3 permission relationship.
# ===========================================================================

resource "aws_iam_user" "intern" {
  name = "${local.name}-intern"
  tags = { Scenario = "S1", Role = "entry-point" }

  depends_on = [terraform_data.account_guard]
}

resource "aws_iam_group" "interns" {
  name = "${local.name}-interns"
}

resource "aws_iam_group_membership" "interns" {
  name  = "${local.name}-interns-membership"
  group = aws_iam_group.interns.name
  users = [aws_iam_user.intern.name]
}

# Hop 1: CI role. Trusts the intern directly by ARN.
resource "aws_iam_role" "ci" {
  name = "${local.name}-ci-role"
  tags = { Scenario = "S1", Role = "hop-1" }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "TrustIntern"
      Effect    = "Allow"
      Principal = { AWS = aws_iam_user.intern.arn }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Group grants the identity-side permission to assume the CI role.
resource "aws_iam_group_policy" "interns_assume_ci" {
  name  = "${local.name}-interns-assume-ci"
  group = aws_iam_group.interns.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "AssumeCiRole"
      Effect   = "Allow"
      Action   = "sts:AssumeRole"
      Resource = aws_iam_role.ci.arn
    }]
  })
}

# Hop 2: data role. Trusts the CI role.
resource "aws_iam_role" "data" {
  name = "${local.name}-data-role"
  tags = { Scenario = "S1", Role = "hop-2" }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "TrustCiRole"
      Effect    = "Allow"
      Principal = { AWS = aws_iam_role.ci.arn }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "ci_assume_data" {
  name = "${local.name}-ci-assume-data"
  role = aws_iam_role.ci.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "AssumeDataRole"
      Effect   = "Allow"
      Action   = "sts:AssumeRole"
      Resource = aws_iam_role.data.arn
    }]
  })
}

# Target access: data role can read the sensitive bucket.
resource "aws_iam_role_policy" "data_read_bucket" {
  name = "${local.name}-data-read-sensitive"
  role = aws_iam_role.data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListSensitiveBucket"
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.sensitive.arn
      },
      {
        Sid      = "ReadSensitiveObjects"
        Effect   = "Allow"
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.sensitive.arn}/*"
      }
    ]
  })
}
