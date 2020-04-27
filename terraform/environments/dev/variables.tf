# General variables
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

# EBS instance details
variable "app_instance_type"{}
variable "autoscaling_min_size"{}
variable "autoscaling_max_size"{}

# APP environment variables
variable "GOOGLE_CLIENT_ID"{}
variable "MONITOR_PASSWORD"{}
variable "SWAGGER_PASSWORD"{}

# CICD variables
variable "repository_name"{}
variable "branch_name"{}
variable "build_image"{}
variable "build_compute_type"{}
variable "privileged_mode"{}
