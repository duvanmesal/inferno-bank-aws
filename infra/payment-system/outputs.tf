output "payment_api_base_url" {
  description = "Base URL del API Gateway del sistema de pagos"
  value       = "${aws_api_gateway_deployment.payment_api_deployment.invoke_url}${aws_api_gateway_stage.payment_api_stage.stage_name}/"
}

output "payment_table_name" {
  value = aws_dynamodb_table.payment.name
}

output "catalog_bucket_name" {
  value = aws_s3_bucket.catalog.bucket
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].port
}

output "start_payment_queue_url" {
  value = aws_sqs_queue.start_payment.url
}

output "check_balance_queue_url" {
  value = aws_sqs_queue.check_balance.url
}

output "transaction_queue_url" {
  value = aws_sqs_queue.transaction.url
}

output "lambda_execution_role_arn" {
  value = aws_iam_role.payment_lambda_role.arn
}
