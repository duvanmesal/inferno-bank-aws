terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  profile = "inferno-bank"
  region  = var.aws_region
}

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Component   = "PaymentSystem"
  }
}
