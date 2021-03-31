terraform {
  backend "s3"{
      bucket = "upgrade-terraform-tfstate"
      key  =  "terraform/bsnl"
      region = "us-east-1"
      profile = "playpower"
  }
}