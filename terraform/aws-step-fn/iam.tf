resource "aws_iam_role" "iam_for_sfn" {
  count              = length(var.environment)
  name               = "${var.environment[count.index]}-${var.prefix}-${var.sfn_iam_role_name}"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume_role_policy_document.json
}

data "aws_iam_policy_document" "sfn_assume_role_policy_document" {
  statement {
    actions = [
      "sts:AssumeRole"
    ]

    principals {
      type = "Service"
      identifiers = [
        "states.us-east-1.amazonaws.com",
        "events.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role_policy" "upgrade-lambda-execution" {
  count              = length(var.environment)
  name = "${var.environment[count.index]}-${var.prefix}-lambda-execution"
  role = aws_iam_role.iam_for_sfn[count.index].id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "lambda:InvokeFunction",
        "states:StartExecution"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}
