output "s3-bucket" {
  value = "${aws_s3_bucket.email_export.bucket}"
}
