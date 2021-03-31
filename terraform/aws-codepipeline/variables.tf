# ---------------------------------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------
variable "environment" {}
variable "prefix" {}
variable "aws_region" {}

# ---------------------------------------------------------------------------------------------------------------------
# CODE COMMIT SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------
variable "repository_name"{}
variable "branch_name"{}

# ---------------------------------------------------------------------------------------------------------------------
# CODE BUILD ENV SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "build_image" {default = "aws/codebuild/standard:1.0"}
variable "build_compute_type"{default = "BUILD_GENERAL1_LARGE"}
variable "privileged_mode"{default = true}

variable "ebs_app_name"{}
variable "ebs_env_name"{}
