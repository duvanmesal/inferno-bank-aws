output "user_table_name" {
  value = aws_dynamodb_table.user_table.name
}

output "user_table_arn" {
  value = aws_dynamodb_table.user_table.arn
}

output "card_table_name" {
  value = aws_dynamodb_table.card_table.name
}

output "card_table_arn" {
  value = aws_dynamodb_table.card_table.arn
}

output "transaction_table_name" {
  value = aws_dynamodb_table.transaction_table.name
}

output "transaction_table_arn" {
  value = aws_dynamodb_table.transaction_table.arn
}

output "card_error_table_name" {
  value = aws_dynamodb_table.card_error_table.name
}

output "card_error_table_arn" {
  value = aws_dynamodb_table.card_error_table.arn
}

output "notification_table_name" {
  value = aws_dynamodb_table.notification_table.name
}

output "notification_table_arn" {
  value = aws_dynamodb_table.notification_table.arn
}

output "notification_error_table_name" {
  value = aws_dynamodb_table.notification_error_table.name
}

output "notification_error_table_arn" {
  value = aws_dynamodb_table.notification_error_table.arn
}
