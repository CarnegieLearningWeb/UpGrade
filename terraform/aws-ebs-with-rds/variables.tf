# ---------------------------------------------------------------------------------------------------------------------
# ENV AND PREFIX SPECIFIC VARIABLES
# ---------------------------------------------------------------------------------------------------------------------

variable "environment" {}
variable "prefix" {}


# ---------------------------------------------------------------------------------------------------------------------
# POSTGRESS SPECIFIC VARIABLES 
# ---------------------------------------------------------------------------------------------------------------------

variable "rds_family" {
  description = "DB family for RDS params group"
  default     = "postgres11"
}

variable "allocated_storage" {
  description = "DB instance storage capacity"
}

variable "engine" {
  description = "DB engine"
  default     = "postgres"
}

variable "engine_version" {
  description = "DB engine version"
  default     = "11.5"
}

variable "instance_class" {
  description = "DB instance class"
}

variable "identifier" {
  description = "DB identifier"
}

variable "multi_az" {
  description = "Availability zones.. set to true to have high availability"
  default     = "false"
}

variable "storage_type" {
  description = "Instance storage type"
}

# ---------------------------------------------------------------------------------------------------------------------
# POSTGRESS SECURITY SPECIFIC VARIABLES 
# ---------------------------------------------------------------------------------------------------------------------

variable "RDS_DB_NAME" {
  default = "postgres"
}

variable "RDS_USERNAME" {
  default = "postgres"
}

variable "RDS_PASSWORD" {
  default = "postgres"
}

# ---------------------------------------------------------------------------------------------------------------------
# BEANSTACK APP SPECIFIC VARIABLES 
# ---------------------------------------------------------------------------------------------------------------------
variable "app_instance_type" {}
variable "ebs_app_name"{}
variable "autoscaling_min_size" {}
variable "autoscaling_max_size" {}


# ---------------------------------------------------------------------------------------------------------------------
# BEANSTACK ENV SPECIFIC VARIABLES 
# ---------------------------------------------------------------------------------------------------------------------
variable "APP_BANNER" { default = true }
variable "APP_HOST" { default = "localhost" }
variable "APP_NAME" { default = "A/B Testing Backend" }
variable "APP_PORT" { default = 3030 }
variable "APP_ROUTE_PREFIX" { default = "/api" }
variable "APP_SCHEMA" { default = "http" }
variable "AUTH_CHECK" {}
variable "AWS_REGION" { default = "us-east-1" }
variable "CONTROLLERS" { default = "src/api/controllers/**/*Controller.ts" }
variable "GOOGLE_CLIENT_ID" { }
variable "DOMAIN_NAME" { default = null }
variable "HOST_URL" { default = "http://upgrade-development.us-east-1.elasticbeanstalk.com/api" }
variable "INTERCEPTORS" { default = "src/api/interceptors/**/*Interceptor.ts" }
variable "LOG_LEVEL" { default = "debug" }
variable "LOG_OUTPUT" { default = "dev" }
variable "MIDDLEWARES" { default = "src/api/middlewares/**/*Middleware.ts" }
variable "MONITOR_ENABLED" { default = true }
variable "MONITOR_PASSWORD" {}
variable "MONITOR_ROUTE" { default = "/monitor" }
variable "MONITOR_USERNAME" { default = "admin" }
variable "SWAGGER_API" { default = "src/api/controllers/*.ts" }
variable "SWAGGER_ENABLED" { default = true }
variable "SWAGGER_FILE" { default = "api/swagger.json" }
variable "SWAGGER_PASSWORD" {}
variable "SWAGGER_ROUTE" { default = "/swagger" }
variable "SWAGGER_USERNAME" { default = "admin" }
variable "TOKEN_SECRET_KEY" { }
variable "TYPEORM_CONNECTION" { default = "postgres" }
variable "TYPEORM_ENTITIES" { default = "src/api/models/**/*.ts" }
variable "TYPEORM_ENTITIES_DIR" { default = "src/api/models" }
variable "TYPEORM_FACTORY" { default = "src/database/factories/**/*.factory.ts" }
variable "TYPEORM_LOGGER" { default = "advanced-console" }
variable "TYPEORM_LOGGING" { default = "all" }
variable "TYPEORM_MIGRATIONS" { default = "src/database/migrations/**/*.ts" }
variable "TYPEORM_MIGRATIONS_DIR" { default = "src/database/migrations" }
variable "TYPEORM_SEED" { default = "src/database/seeds/**/*.seed.ts" }
variable "TYPEORM_SYNCHRONIZE" {}


variable "SCHEDULER_STEP_FUNCTION" {}

variable "PATH_TO_PRIVATE_KEY" {}
variable "PATH_TO_PUBLIC_KEY" {}