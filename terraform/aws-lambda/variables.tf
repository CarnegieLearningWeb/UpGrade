# ---------------------------------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "environment" {}
variable "prefix" {}
variable "app_version" {}

# ---------------------------------------------------------------------------------------------------------------------
# IAM SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "lambda_iam_role_name" {
  description = "Role name for lambda IAM"
  default     = "schedular-lambda-iam"
}

# ---------------------------------------------------------------------------------------------------------------------
# LAMBDA SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "s3_bucket" {
  description = "s3 bucket to store lambda zip"
  default     = "schedular"
}

variable "lambda_zip" {
  description = "Name of the compressed lambda zip file."
  default     = "schedular.zip"
}

variable "lambda_path" {
  description = "Relative path to the folder where lamda function is.. "
}

variable "output_path" {
  description = "output path for lambda zip"
}


variable "function_name" {
  description = "Lambda function name "
  default     = "Schedule"
}

variable "function_handler" {
  description = "Lambda function handler "
  default     = "schedule.schedule"
}

variable "runtime" {
  description = "Lambda function runtime"
  default     = "nodejs10.x"
}