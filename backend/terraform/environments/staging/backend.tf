terraform {
  backend "s3"{
    bucket = "cli-terraform-artifacts-bucket"
      key  =  "upgrade.staging.tfstate"
      region = "us-east-1"
  }
}