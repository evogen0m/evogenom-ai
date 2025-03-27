terraform {
  backend "s3" {
    bucket         = "evogenom-terraform-state"
    key            = "staging/terraform.tfstate"
    dynamodb_table = "evogenom-terraform-locks"
    region         = "eu-west-1"
    encrypt        = true
  }
} 