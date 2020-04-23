variable "AWS_REGION" {
  default = "us-east-1"
}

# ---------------------------------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "environment" {
  description = "Environment for the terraform"
  default = "development"
}

variable "prefix" {
  description = "Prefix resources with this string.."
  default = "upgrade"
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
  default = "1.0.0"
}

variable "repository_name"{
  description = "Name of the code commit repository"
  default = "educational-experiment-service"
}

variable "branch_name"{
  description = "Branch name of the repo to build and deploy source from"
  default = "master"
}
