variable "environment" {
  description = "Website environment name"
}

variable "prefix" {
  description = "Prfix to attach to all resources"
}

variable "aws_region" {
  description = "AWS Region for the VPC"
  default     = "us-east-1"
}

variable "aws_profile" {}

variable "repository_name" {
  description = "Code commit repository name to setup CICD => s3 static website CDN"
}

variable "repository_branch" {
  description = "Code commit repository branch name to setup CICD => s3 static website CDN"
}
