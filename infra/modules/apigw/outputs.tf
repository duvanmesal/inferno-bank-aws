output "api_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "API Gateway invoke URL"
}

output "api_id" {
  value = aws_apigatewayv2_api.http_api.id
}
