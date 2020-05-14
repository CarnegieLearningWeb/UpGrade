
resource "aws_s3_bucket" "codebuild_cache" {
  
  bucket = "${var.environment}-${var.prefix}-backend-codebuild-cache-${random_string.random.result}"
  acl    = "private"
}

resource "aws_s3_bucket" "artifacts" {
  
  bucket = "${var.environment}-${var.prefix}-backend-artifacts-${random_string.random.result}"
  acl    = "private"
  force_destroy = true

  lifecycle_rule {
    id      = "clean-up"
    enabled = "true"

    expiration {
      days = 30
    }
  }
}

resource "random_string" "random" {
  length  = 8
  special = false
  upper   = false
}