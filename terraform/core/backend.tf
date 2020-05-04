terraform {
  backend "s3"{
      bucket = "upgrade-frontend-terraform-tfstate"
      key  =  "core"
      region = "us-east-1"
      profile = "playpower"
  }
}