terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  # Every resource gets these tags so it is obvious (in the console and in the
  # Neo4j graph) that it is a deliberately vulnerable APRE test fixture.
  default_tags {
    tags = {
      Project   = "APRE"
      Purpose   = "intentionally-vulnerable-test-fixture"
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# Short random suffix so the S3 bucket name is globally unique.
resource "random_id" "suffix" {
  byte_length = 3
}

locals {
  account_id = data.aws_caller_identity.current.account_id
  suffix     = random_id.suffix.hex
  name       = "apre"
}
