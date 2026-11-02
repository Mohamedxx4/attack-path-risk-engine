variable "aws_region" {
  description = "Region for regional resources (S3). IAM is global."
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile with admin rights in the SANDBOX account. Never the cartography-readonly profile."
  type        = string
  default     = "apre-admin"
}

variable "expected_account_id" {
  description = "The sandbox account ID. Apply refuses to run against any other account."
  type        = string
}
