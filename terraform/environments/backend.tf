provider aws {
    region = "us-east-1"
}
terraform {
  backend "s3"{
      bucket = "upgrade-terraform-tfstate"
      key  =  "terraform"
      region = "us-east-1"
      profile = "playpower"
  }
}