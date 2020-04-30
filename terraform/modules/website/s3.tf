
resource "aws_s3_bucket" "source" {
  count = length(var.environment)
  bucket        = "${var.environment[count.index]}-${var.prefix}-code-pipeline"
  acl           = "private"
  force_destroy = true
}

resource "aws_s3_bucket" "bucket_site" {
    count = length(var.environment)
    bucket = "${var.environment[count.index]}-${var.prefix}-${var.repository_branch[count.index]}"
    acl    = "public-read"
    force_destroy = true
    
    cors_rule {
        allowed_headers = ["*"]
        allowed_methods = ["PUT", "POST", "GET", "DELETE"]
        allowed_origins = ["*"]
        expose_headers  = ["ETag"]
        max_age_seconds = 3000
    }

    website {
        index_document = "index.html"
        error_document = "index.html"
    }
}

resource "aws_s3_bucket_policy" "bucket_site_policy" {
    count = length(var.environment)
    bucket = aws_s3_bucket.bucket_site[count.index].id

    policy = <<POLICY
{
        "Version": "2008-10-17",
        "Id": "Allow-Public-Access-${var.environment[count.index]}-${var.prefix}",
        "Statement": [
            {
                "Sid": "Allow-Public-Access-${var.environment[count.index]}-${var.prefix}",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "${aws_s3_bucket.bucket_site[count.index].arn}/*"
            }
        ]
    }
    POLICY

}