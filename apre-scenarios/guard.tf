# Safety guard: stop the run if the credentials point at the wrong AWS account.
# These scenarios create real privilege-escalation paths; they must only ever
# exist in the dedicated sandbox account.
check "sandbox_account_only" {
  assert {
    condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
    error_message = "Credentials are for account ${data.aws_caller_identity.current.account_id}, not the sandbox (${var.expected_account_id}). Aborting."
  }
}

# A `check` block only warns. This precondition makes plan/apply actually fail.
resource "terraform_data" "account_guard" {
  lifecycle {
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
      error_message = "Wrong AWS account. These deliberately vulnerable resources may only be created in the sandbox account."
    }
  }
}
