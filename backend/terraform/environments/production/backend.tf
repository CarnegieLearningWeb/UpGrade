terraform {
  backend "s3"{
    bucket = "cli-terraform-artifacts-bucket"
      key  =  "upgrade.production.tfstate"
      region = "us-east-1"
  }
}