variable "aws_region" {
    description = "AWS Region"
}

variable "environment" {
    description = "Environment"
}

variable "prefix" {
    description = "previx to be used before all instances"
}

variable "app_version" {
    description = "Instance version"
}


# RDS related details
variable "allocated_storage" {
    description = "Allocated storage for RDS"
}

variable "engine_version" {
    description = "Postgres version"
}

variable "identifier" {
    description = "Database identifier"
}

variable "instance_class" {
    description = "Database instance type"
}

variable "storage_type" {
    description = "gp2"
}
            
variable "multi_az" {
    description = "Multizone availabilty"
}

# EBS instance details
variable "app_instance_type" {
    description="EC2 instance type inside EBS"
}

variable "autoscaling_min_size" {
    description = "Minimum size of autoscaling group"
}

variable "autoscaling_max_size" {
    description = "Maximum size of autoscaling group"
}

# APP environment variables
variable "GOOGLE_CLIENT_ID"{
    description = "Google client id"
}
variable "MONITOR_PASSWORD"{
    description = "Monitoring password"
}
variable "SWAGGER_PASSWORD"{
    description = "Swagger password"
}

# CICD variables
variable "repository_name" {
    description = "Name of the repository"
}

variable "branch_name" {
    description = "Name of the branch for building"
}

variable "build_image" {
    description = "Instance to be used for building"
}

variable "build_compute_type" {
    description = "Compute size for build image"
}

variable "privileged_mode" {
    description = "Privileged mode for docker build"
}