# Core Infrastructure Outputs

output "api_gateway_url" {
  description = "Base URL of the Payment System API Gateway"
  value       = "arn:aws:apigateway:${var.aws_region}::/restapis/{api-id}/stages/prod"
  # Will be updated once API Gateway is created
}

# DynamoDB Outputs

output "payment_table_name" {
  description = "DynamoDB table name for payment state tracking (keyed by traceId)"
  value       = "aws_dynamodb_table.payment.name"
}

output "payment_table_arn" {
  description = "DynamoDB payment table ARN"
  value       = "aws_dynamodb_table.payment.arn"
}

# Redis/ElastiCache Outputs

output "redis_endpoint" {
  description = "Redis cluster endpoint for catalog synchronization"
  value       = "redis_cluster_address"
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

# S3 Outputs

output "catalog_bucket_name" {
  description = "S3 bucket name for catalog CSV uploads"
  value       = "aws_s3_bucket.catalog.id"
}

# SQS Queue Outputs

output "start_payment_queue_url" {
  description = "Start Payment SQS queue URL"
  value       = "aws_sqs_queue.start_payment.url"
}

output "start_payment_queue_arn" {
  description = "Start Payment SQS queue ARN"
  value       = "aws_sqs_queue.start_payment.arn"
}

output "check_balance_queue_url" {
  description = "Check Balance SQS queue URL"
  value       = "aws_sqs_queue.check_balance.url"
}

output "check_balance_queue_arn" {
  description = "Check Balance SQS queue ARN"
  value       = "aws_sqs_queue.check_balance.arn"
}

output "transaction_queue_url" {
  description = "Transaction SQS queue URL"
  value       = "aws_sqs_queue.transaction.url"
}

output "transaction_queue_arn" {
  description = "Transaction SQS queue ARN"
  value       = "aws_sqs_queue.transaction.arn"
}

# Lambda IAM Role Outputs

output "lambda_execution_role_arn" {
  description = "IAM role ARN for Lambda functions"
  value       = "aws_iam_role.lambda_execution.arn"
}

output "lambda_execution_role_name" {
  description = "IAM role name for Lambda functions"
  value       = "aws_iam_role.lambda_execution.name"
}

# VPC/Network Outputs

output "vpc_id" {
  description = "Payment System VPC ID"
  value       = "aws_vpc.payment_system.id"
}

output "public_subnet_id" {
  description = "Public subnet ID for Lambda functions"
  value       = "aws_subnet.public.id"
}

output "private_subnet_id" {
  description = "Private subnet ID for Redis"
  value       = "aws_subnet.private.id"
}

output "lambda_security_group_id" {
  description = "Security group ID for Lambda functions"
  value       = "aws_security_group.lambda.id"
}

output "redis_security_group_id" {
  description = "Security group ID for Redis"
  value       = "aws_security_group.redis.id"
}
