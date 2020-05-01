# ---------------------------------------------------------------------------------------------------------------------
# CREATE IAM ROLES
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_iam_role" "iam_for_lambda" {
  count = length(var.environment)
  //name  = var.environment[count.index]
  name = "${var.environment[count.index]}-${var.prefix}-${var.lambda_iam_role_name}"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}