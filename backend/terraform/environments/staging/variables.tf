# General variables
variable "current_directory"{}
variable "aws_region"{}
variable "environment"{}
variable "prefix"{}
variable "app_version"{}

# RDS related details 
variable "allocated_storage"{}
variable "engine_version"{}
variable "identifier"{}
variable "instance_class"{}
variable "storage_type"{}
variable "multi_az"{}
variable "replica_names" {}

# EBS instance details
variable "app_instance_type"{}
variable "ebs_app_name"{}
variable "autoscaling_min_size"{}
variable "autoscaling_max_size"{}
variable "ssl_certificate_id" {}

# Lambda variables
variable "s3_lambda_bucket" {}
variable "s3_lambda_key" {}

# APP environment variables
variable "ADMIN_USERS"{}
variable "AUTH_CHECK"{}
variable "CLIENT_API_KEY"{}
variable "CLIENT_API_SECRET"{}
variable "CONTEXT_METADATA"{}
variable "DOMAIN_NAME"{default = ""}
variable "EMAIL_EXPIRE_AFTER_SECONDS" {}
variable "EMAIL_FROM" {}
variable "GOOGLE_CLIENT_ID"{}
variable "MONITOR_PASSWORD"{}
variable "NEW_RELIC_APP_NAME" {}
variable "NEW_RELIC_LICENSE_KEY" {}
variable "RDS_PASSWORD"{}
variable "SWAGGER_PASSWORD"{}
variable "TOKEN_SECRET_KEY"{}
variable "TYPEORM_SYNCHRONIZE"{}
variable "TYPEORM_MAX_QUERY_EXECUTION_TIME" {}

# CICD variables
variable "repository_name"{}
variable "branch_name"{}
variable "build_image"{}
variable "build_compute_type"{}
variable "privileged_mode"{}
