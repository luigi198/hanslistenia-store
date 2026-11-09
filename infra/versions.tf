# State is local (terraform.tfstate, gitignored). It holds the app's access
# key, so keep it private like .env.local.
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region              = var.region
  profile             = var.aws_profile
  allowed_account_ids = [var.account_id] # refuse to run against any other account

  default_tags {
    tags = {
      Project   = "hanslistenia"
      ManagedBy = "terraform"
      Stack     = "storage"
    }
  }
}
