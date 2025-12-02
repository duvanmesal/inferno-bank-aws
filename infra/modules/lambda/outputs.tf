# User Service Outputs
output "register_user_invoke_arn" {
  value = aws_lambda_function.register_user.invoke_arn
}

output "register_user_function_name" {
  value = aws_lambda_function.register_user.function_name
}

output "login_user_invoke_arn" {
  value = aws_lambda_function.login_user.invoke_arn
}

output "login_user_function_name" {
  value = aws_lambda_function.login_user.function_name
}

output "update_user_invoke_arn" {
  value = aws_lambda_function.update_user.invoke_arn
}

output "update_user_function_name" {
  value = aws_lambda_function.update_user.function_name
}

output "upload_avatar_user_invoke_arn" {
  value = aws_lambda_function.upload_avatar_user.invoke_arn
}

output "upload_avatar_user_function_name" {
  value = aws_lambda_function.upload_avatar_user.function_name
}

output "get_profile_user_invoke_arn" {
  value = aws_lambda_function.get_profile_user.invoke_arn
}

output "get_profile_user_function_name" {
  value = aws_lambda_function.get_profile_user.function_name
}

# Card Service Outputs
output "card_activate_invoke_arn" {
  value = aws_lambda_function.card_activate.invoke_arn
}

output "card_activate_function_name" {
  value = aws_lambda_function.card_activate.function_name
}

output "card_purchase_invoke_arn" {
  value = aws_lambda_function.card_purchase.invoke_arn
}

output "card_purchase_function_name" {
  value = aws_lambda_function.card_purchase.function_name
}

output "card_transaction_save_invoke_arn" {
  value = aws_lambda_function.card_transaction_save.invoke_arn
}

output "card_transaction_save_function_name" {
  value = aws_lambda_function.card_transaction_save.function_name
}

output "card_paid_credit_card_invoke_arn" {
  value = aws_lambda_function.card_paid_credit_card.invoke_arn
}

output "card_paid_credit_card_function_name" {
  value = aws_lambda_function.card_paid_credit_card.function_name
}

output "card_get_report_invoke_arn" {
  value = aws_lambda_function.card_get_report.invoke_arn
}

output "card_get_report_function_name" {
  value = aws_lambda_function.card_get_report.function_name
}
