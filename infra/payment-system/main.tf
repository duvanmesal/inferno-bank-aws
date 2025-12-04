# Payment System Infrastructure Module
# This module provisions the 2nd cut payment system with catalog management,
# async payment processing, and payment state tracking.

locals {
  common_tags = {
    Project     = "${var.project_name}-payment-system"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Component   = "PaymentSystem"
  }
}

# Placeholder for sub-module includes
# Each resource category will be organized into separate .tf files:
# - network.tf: VPC, subnets, security groups
# - s3.tf: Catalog bucket
# - dynamodb.tf: Payment state table
# - redis.tf: Redis cluster for catalog sync
# - sqs.tf: Async payment processing queues
# - iam.tf: Lambda execution roles and policies
# - lambda_catalog.tf: Catalog upload/retrieval functions
# - lambda_payment.tf: Payment API and worker functions
# - apigw.tf: REST API Gateway for payment system

# Note: These files will be created incrementally following the technical order
