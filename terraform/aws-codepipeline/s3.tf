
resource "aws_s3_bucket" "codebuild_cache" {
  bucket = "${var.environment}-${var.prefix}-backend-codebuild-cache"
  acl    = "private"
}

resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.environment}-${var.prefix}-backend-artifacts"
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
