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
  lambda_path           = "../../packages/Schedular"  
  output_path           = "../environments/lambda" 
  function_name         = "Schedule" 
  function_handler      = "schedule.schedule"
  runtime               =  "nodejs10.x"
}

output "lambda"{
  value = module.aws_lambda_function.lambda-arn
}

module "aws_cloudwatch_event" {
    source                =  "../../aws-cloudwatch-rule"
}

output "cloudwatch" {
    value = module.aws_cloudwatch_event
}

resource "aws_cloudwatch_event_target" "clear_logs_after_twelve_hours" {
    rule = module.aws_cloudwatch_event.rule-name
    target_id = "test-checking-schedular"
    arn = module.aws_lambda_function.lambda-arn[0]
    input_transformer {
        input_paths = {"host-url"="$.module.aws_cloudwatch_event.rule-name"}

        input_template = <<INPUT_TEMPLATE_EOF
        {
            "name": "abc"
        }
        INPUT_TEMPLATE_EOF
  }
}

