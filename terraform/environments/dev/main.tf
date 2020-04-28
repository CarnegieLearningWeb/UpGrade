provider "aws" {
  region = var.aws_region
  profile = "playpower"
}

data "aws_caller_identity" "current" {}


module "production" {
  source                        = "../../modules/website"
  environment                   = var.environment
  prefix                        = var.prefix
  aws_region                    = var.aws_region
  repository_name               = var.repository_name
  repository_branch             = var.repository_branch
  account_id                    = "${data.aws_caller_identity.current.account_id}"
}
