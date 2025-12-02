output "api_url" {
  description = "API Gateway URL"
  value       = module.apigw.api_url
}

output "user_table_name" {
  description = "DynamoDB User Table Name"
  value       = module.dynamodb.user_table_name
}

output "card_table_name" {
  description = "DynamoDB Card Table Name"
  value       = module.dynamodb.card_table_name
}

output "transaction_table_name" {
  description = "DynamoDB Transaction Table Name"
  value       = module.dynamodb.transaction_table_name
}

output "avatars_bucket_name" {
  description = "S3 Avatars Bucket Name"
  value       = module.s3.avatars_bucket_name
}

output "reports_bucket_name" {
  description = "S3 Reports Bucket Name"
  value       = module.s3.reports_bucket_name
}

output "create_request_card_queue_url" {
  description = "Create Request Card SQS Queue URL"
  value       = module.sqs.create_request_card_queue_url
}

output "notification_email_queue_url" {
  description = "Notification Email SQS Queue URL"
  value       = module.sqs.notification_email_queue_url
}
