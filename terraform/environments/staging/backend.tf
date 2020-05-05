terraform {
  backend "s3"{
      bucket = "upgrade-frontend-terraform-tfstate"
      key  =  "frontend/staging"
      region = "us-east-1"
      profile = "playpower"
  }
}
