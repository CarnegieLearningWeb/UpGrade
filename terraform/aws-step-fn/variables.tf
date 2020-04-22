# ---------------------------------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "environment" {
  description = "Environment for the terraform"
}

variable "prefix" {
  description = "Prefix resources with this string.."
}

variable "aws_region" {
  description = "The AWS region to create things in."
  default     = "us-east-1"
}
# ---------------------------------------------------------------------------------------------------------------------
# APP SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "app_version" {
  description = "version of the application"
}

# ---------------------------------------------------------------------------------------------------------------------
# SFN SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "aws_sfn_state_machine_name" {
  description = "Name of the step function"
  default     = "experiment-schedular"
}

variable "lambda_arn" {
  description = "Arn of the schedular lambda function"
}

# ---------------------------------------------------------------------------------------------------------------------
# STEP FUNCTION IAM ROLE SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "sfn_iam_role_name" {
  description = "Name of the IAM role for step function"
  default     = "iam_for_sfn"
}