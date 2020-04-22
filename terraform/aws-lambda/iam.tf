# ---------------------------------------------------------------------------------------------------------------------
# CREATE IAM ROLES
# ---------------------------------------------------------------------------------------------------------------------
resource "aws_iam_role" "iam_for_lambda" {
  name = "${var.environment}-${var.prefix}-${var.lambda_iam_role_name}"

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

# resource "aws_iam_role_policy_attachment" "iam-policy-attach" {
#   role       = "${aws_iam_role.iam_for_lambda.name}"
#   policy_arn = "${aws_iam_policy.iam_policy.arn}"
# }


# resource "aws_iam_policy" "iam_policy" {
#   name = "lambda_access-policy"
#   description = "IAM Policy"
# policy = <<EOF
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#             "Effect": "Allow",
#             "Action": [
#                 "s3:ListAllMyBuckets",
#                 "s3:GetBucketLocation"
#             ],
#             "Resource": "*"
#         },
#         {
#             "Effect": "Allow",
#             "Action": "s3:*",
#             "Resource": [
#                 "arn:aws:s3:::${var.s3_bucket}",
#                 "arn:aws:s3:::${var.s3_bucket}/*"
#             ]
#         },
#         {
#           "Action": [
#             "autoscaling:Describe*",
#             "cloudwatch:*",
#             "logs:*",
#             "sns:*"
#           ],
#           "Effect": "Allow",
#           "Resource": "*"
#         }
#   ]
# }
#   EOF
# }