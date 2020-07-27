resource "aws_s3_bucket" "email_export" {
  
  bucket = "elasticbeanstalk-${var.environment}-${var.prefix}-upgrade-csv-upload"
  acl    = "private"
}