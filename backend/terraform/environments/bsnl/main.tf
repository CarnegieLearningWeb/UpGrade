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
  profile = var.aws_profile
}


# ------------------------------------------------------------------------------
# START RUNNING MODULES 
# ------------------------------------------------------------------------------

module "aws_lambda_function" {

  source                =  "../../aws-lambda"

  environment           = var.environment 
  prefix                = var.prefix 
  app_version           = var.app_version 
  lambda_path           = "../../packages/Scheduler"  
  output_path           = "../environments/${var.current_directory}/.terraform" 
  function_name         = "Schedule" 
  function_handler      = "schedule.schedule"
  runtime               =  "nodejs18.x"
}

output "lambda"{
  value = module.aws_lambda_function.lambda-arn
}


module "aws-state-machine" {

  source                = "../../aws-step-fn"

  environment           = var.environment 
  prefix                = var.prefix 
  app_version           = var.app_version 
  aws_region            = var.aws_region
  lambda_arn            = module.aws_lambda_function.lambda-arn[0] 
}


module "aws-ebs-app" {

  source                = "../../aws-ebs-with-rds"

  environment           = var.environment
  prefix                = var.prefix 

  /*RDS*/
  allocated_storage     = 100
  engine_version        = var.engine_version    // "11.5"
  identifier            = var.identifier
  instance_class        = var.instance_class
  storage_type          = var.storage_type
  multi_az = "false"
  
  /*EBS config*/
  app_instance_type     = var.app_instance_type
  ebs_app_name          = var.ebs_app_name
  autoscaling_min_size  = var.autoscaling_min_size
  autoscaling_max_size  = var.autoscaling_max_size

  /* APP env config*/
  GOOGLE_CLIENT_ID      = var.GOOGLE_CLIENT_ID
  MONITOR_PASSWORD      = var.MONITOR_PASSWORD  
  SWAGGER_PASSWORD      = var.SWAGGER_PASSWORD 
  AUTH_CHECK            = var.AUTH_CHECK
  TOKEN_SECRET_KEY      = var.TOKEN_SECRET_KEY 
  TYPEORM_SYNCHRONIZE   = var.TYPEORM_SYNCHRONIZE
  TYPEORM_MAX_QUERY_EXECUTION_TIME = var.TYPEORM_MAX_QUERY_EXECUTION_TIME

  SCHEDULER_STEP_FUNCTION = module.aws-state-machine.step_function_arn
  PATH_TO_PRIVATE_KEY     = "~/.ssh/id_rsa"
  PATH_TO_PUBLIC_KEY      = "~/.ssh/id_rsa.pub"
  DOMAIN_NAME             = var.DOMAIN_NAME
}

resource "null_resource" "update-ebs-env" { 
  depends_on= [module.aws-ebs-app.ebs-cname]

  triggers = {
    always_run = "${timestamp()}"
  }
  
  provisioner "local-exec" {
    command = "export AWS_PROFILE=${var.aws_profile} && aws elasticbeanstalk update-environment --region ${var.aws_region} --environment-name ${module.aws-ebs-app.ebs-env} --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=HOST_URL,Value=http://${module.aws-ebs-app.ebs-cname}/api"
  }
}

module "aws_cloudwatch_event" {
    source                =  "../../aws-cloudwatch-event"

    lambda_arn            = module.aws_lambda_function.lambda-arn[0] 
    host_url              = module.aws-ebs-app.ebs-cname
    environment           = var.environment 
}

module "aws-code-pipeline"{

  source = "../../aws-codepipeline"

  environment           = var.environment 
  prefix                = var.prefix 
  aws_region            = var.aws_region

  /* CODE COMMIT variables*/
  repository_name       = var.repository_name
  branch_name           = var.branch_name

  /* CODE BUILD variables*/
  build_image           = var.build_image
  build_compute_type    = var.build_compute_type
  privileged_mode       = var.privileged_mode

  ebs_app_name          = module.aws-ebs-app.application 
  ebs_env_name          = module.aws-ebs-app.ebs-env
}

output "ebs-cname" {
  value = module.aws-ebs-app.ebs-cname
}
output "step_function" {
  value = module.aws-state-machine.step_function_arn
}