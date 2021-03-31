terraform {
  backend "s3"{
      bucket = "cli-terraform-artifacts-bucket"
      key  =  "upgrade.frontend.staging.backend.tfstate"
      region = "us-east-1"
      profile = "upgrade-terraform"
  }
}