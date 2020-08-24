terraform {
  backend "s3"{
      bucket = "cli-terraform-artifacts-bucket"
      key  =  "upgrade.core.tfstate"
      region = "us-east-1"
  }
}