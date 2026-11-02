# ---------------------------------------------------------------------------
# Shared target: a private S3 bucket holding a fake "sensitive" file.
# This is the crown jewel that scenario S1 reaches.
# Private, encrypted, public access fully blocked. Contains dummy data only.
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "sensitive" {
  bucket        = "${local.name}-sensitive-data-${local.suffix}"
  force_destroy = true # lets `terraform destroy` remove it even with the object inside

  tags = {
    Scenario    = "S1"
    Sensitivity = "high"
  }

  depends_on = [terraform_data.account_guard]
}

resource "aws_s3_bucket_public_access_block" "sensitive" {
  bucket                  = aws_s3_bucket.sensitive.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sensitive" {
  bucket = aws_s3_bucket.sensitive.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_object" "fake_customer_data" {
  bucket       = aws_s3_bucket.sensitive.id
  key          = "customers/customer_records.csv"
  content      = "id,name,email\n1,Test User,test.user@example.com\n2,Dummy Person,dummy@example.com\n"
  content_type = "text/csv"
}
