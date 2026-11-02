# ===========================================================================
# S3 - Privilege escalation via iam:PassRole + Lambda
#
#   apre-deployer (user)
#     has iam:PassRole on apre-lambda-admin-role
#     has lambda:CreateFunction + lambda:InvokeFunction
#   apre-lambda-admin-role
#     trusts lambda.amazonaws.com
#     has AdministratorAccess
#
# Why it matters: the deployer cannot act as admin directly, but can create
# a Lambda function, hand it the admin role, and invoke it. The function's
# code then runs with admin rights.
# Documented technique: Rhino Security Labs IAM privesc method #15.
#
# NOTE: no Lambda function is created here. The danger is the combination of
# permissions, which exists in the graph without spending anything.
#
# Edges exercised: POLICY/STATEMENT, TRUSTS_AWS_PRINCIPAL to a service
# principal. Detection needs THREE conditions together (PassRole on the role,
# the role trusts lambda, and the user can create + invoke functions).
# ===========================================================================

resource "aws_iam_user" "deployer" {
  name = "${local.name}-deployer"
  tags = { Scenario = "S3", Role = "entry-point" }

  depends_on = [terraform_data.account_guard]
}

resource "aws_iam_role" "lambda_admin" {
  name = "${local.name}-lambda-admin-role"
  tags = { Scenario = "S3", Role = "privileged-target" }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "TrustLambdaService"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_admin" {
  role       = aws_iam_role.lambda_admin.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_user_policy" "deployer" {
  name = "${local.name}-deployer-policy"
  user = aws_iam_user.deployer.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "PassAdminRoleToLambda"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.lambda_admin.arn
      },
      {
        Sid      = "ManageFunctions"
        Effect   = "Allow"
        Action   = ["lambda:CreateFunction", "lambda:InvokeFunction"]
        Resource = "*"
      }
    ]
  })
}
