
# ----------------------------------------------------------------------------------------------------------------------
# REQUIRE A SPECIFIC TERRAFORM VERSION OR HIGHER
# ----------------------------------------------------------------------------------------------------------------------

terraform {
  required_version = ">= 0.12"
}

# ----------------------------------------------------------------------------------------------------------------------
#   CREATE A STATE MACHINE
# ----------------------------------------------------------------------------------------------------------------------

resource "aws_sfn_state_machine" "upgrade-experimentSchedular-sfn" {
  count = length(var.environment)
  name     = "${var.environment[count.index]}-${var.prefix}-${var.aws_sfn_state_machine_name}"
  role_arn = aws_iam_role.iam_for_sfn[count.index].arn

  definition = <<EOF
  {
  "Comment": "Experiment schedular ${var.environment[count.index]} mode",
  "StartAt": "InitialState",
  "States": {
    "InitialState": {
      "Type": "Wait",
      "TimestampPath": "$.timeStamp",
      "Next": "FinalState"
    },
    "FinalState": {
      "Type": "Task",
      "Resource": "${var.lambda_arn[count.index]}",
      "End": true
    }
  }
}
EOF
}