# -------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# -------------------------------------------------------------------------------------------
variable "environment" {}
variable "prefix" {}
variable "aws_region" {}

# -------------------------------------------------------------------------------------------
# APP SPECIFIC VARIABLES
# -------------------------------------------------------------------------------------------
variable "app_version" {}

# -------------------------------------------------------------------------------------------
# SFN SPECIFIC VARIABLES
# -------------------------------------------------------------------------------------------
variable "aws_sfn_state_machine_name" {
  default     = "experiment-scheduler"
}

variable "lambda_arn" {
  description = "Arn of the scheduler lambda function"
}

# -------------------------------------------------------------------------------------------
# STEP FUNCTION IAM ROLE SPECIFIC VARIABLES
# -------------------------------------------------------------------------------------------
variable "sfn_iam_role_name" {
  description = "Name of the IAM role for step function"
  default     = "iam_for_sfn"
}