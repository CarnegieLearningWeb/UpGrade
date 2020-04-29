# ----------------------------------------------------------------------------------------------------------------------
# REQUIRE A SPECIFIC TERRAFORM VERSION OR HIGHER
# This module has been updated with 0.12 syntax, which means it is no longer compatible with any versions below 0.12.
# ----------------------------------------------------------------------------------------------------------------------

terraform {
  required_version = ">= 0.12"
}

# ------------------------------------------------------------------------------
# CONFIGURE OUR AWS CONNECTION
# ------------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region
  profile = "playpower"
}

# ------------------------------------------------------------------------------
# CONFIGURE OUR AWS CONNECTION
# ------------------------------------------------------------------------------

module "aws_lambda_function" {

  source = "../../aws-lambda"

  environment          = var.environment
  prefix               = var.prefix
  app_version          = var.app_version
  lambda_iam_role_name = "schedular-lambda-iam" // will be prefixed by environment-prefix-
  s3_bucket            = "schedular" // will be prefixed by environment-prefix
  lambda_zip           = "schedular.zip"
  lambda_path          = "../../packages/Schedular" //Path of the lambda function folder
  output_path          = "../environments/dev/.terraform"
  function_name        = "Schedule" // will be prefixed by environment-prefix
  function_handler     = "schedule.schedule"
  runtime              = "nodejs10.x"
}


module "aws-state-machine" {

  source = "../../aws-step-fn"

  environment                = var.environment
  prefix                     = var.prefix
  app_version                = var.app_version
  aws_sfn_state_machine_name = "experiment-schedular" // will be prefixed by environment-prefix
  lambda_arn                 = module.aws_lambda_function.lambda-arn[0]
  sfn_iam_role_name          = "iam_for_sfn" // will be prefixed by environment-prefix
}



output "step" {
  value = module.aws-state-machine.step_function_arn
}


module "aws-ebs-app" {

  source = "../../aws-ebs-with-rds"

  environment                = var.environment
  prefix                     = var.prefix
  allocated_storage          = var.allocated_storage
  GOOGLE_CLIENT_ID            = var.GOOGLE_CLIENT_ID
  MONITOR_PASSWORD            = var.MONITOR_PASSWORD
  SWAGGER_PASSWORD            = var.SWAGGER_PASSWORD
  identifier                 = var.identifier
  instance_class             = var.instance_class
  storage_type               = var.storage_type
  app_instance_type          = var.app_instance_type
  autoscaling_min_size       =  var.autoscaling_min_size  // Min nunber instances running
  autoscaling_max_size       =  var.autoscaling_max_size  // Max number of instances that ASG can create
  SCHEDULER_STEP_FUNCTION = module.aws-state-machine.step_function_arn
  PATH_TO_PRIVATE_KEY     = "~/.ssh/id_rsa"
  PATH_TO_PUBLIC_KEY      = "~/.ssh/id_rsa.pub"
}

output "eb" {
  value = module.aws-ebs-app.ebs
}
