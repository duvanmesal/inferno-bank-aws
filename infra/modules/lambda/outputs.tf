#############################
# Invoke ARNs
#############################

output "register_user_invoke_arn" {
  value = aws_lambda_function.register_user.invoke_arn
}

output "login_user_invoke_arn" {
  value = aws_lambda_function.login_user.invoke_arn
}

output "update_user_invoke_arn" {
  value = aws_lambda_function.update_user.invoke_arn
}

output "upload_avatar_user_invoke_arn" {
  value = aws_lambda_function.upload_avatar_user.invoke_arn
}

output "get_profile_user_invoke_arn" {
  value = aws_lambda_function.get_profile_user.invoke_arn
}

output "card_activate_invoke_arn" {
  value = aws_lambda_function.card_activate.invoke_arn
}

output "card_purchase_invoke_arn" {
  value = aws_lambda_function.card_purchase.invoke_arn
}

output "card_transaction_save_invoke_arn" {
  value = aws_lambda_function.card_transaction_save.invoke_arn
}

output "card_paid_credit_card_invoke_arn" {
  value = aws_lambda_function.card_paid_credit_card.invoke_arn
}

output "card_get_report_invoke_arn" {
  value = aws_lambda_function.card_get_report.invoke_arn
}

# 🔥 nuevo: getter de tarjeta
output "card_get_invoke_arn" {
  value = aws_lambda_function.card_get.invoke_arn
}

#############################
# Function names
#############################

output "register_user_function_name" {
  value = aws_lambda_function.register_user.function_name
}

output "login_user_function_name" {
  value = aws_lambda_function.login_user.function_name
}

output "update_user_function_name" {
  value = aws_lambda_function.update_user.function_name
}

output "upload_avatar_user_function_name" {
  value = aws_lambda_function.upload_avatar_user.function_name
}

output "get_profile_user_function_name" {
  value = aws_lambda_function.get_profile_user.function_name
}

output "card_activate_function_name" {
  value = aws_lambda_function.card_activate.function_name
}

output "card_purchase_function_name" {
  value = aws_lambda_function.card_purchase.function_name
}

output "card_transaction_save_function_name" {
  value = aws_lambda_function.card_transaction_save.function_name
}

output "card_paid_credit_card_function_name" {
  value = aws_lambda_function.card_paid_credit_card.function_name
}

output "card_get_report_function_name" {
  value = aws_lambda_function.card_get_report.function_name
}

output "card_get_function_name" {
  value = aws_lambda_function.card_get.function_name
}

output "card_get_by_user_invoke_arn" {
  value = aws_lambda_function.card_get_by_user.invoke_arn
}

output "card_get_by_user_function_name" {
  value = aws_lambda_function.card_get_by_user.function_name
}

output "security_pin_set_invoke_arn" {
  value = aws_lambda_function.security_pin_set.invoke_arn
}

output "security_pin_set_function_name" {
  value = aws_lambda_function.security_pin_set.function_name
}

output "security_pin_verify_cvv_invoke_arn" {
  value = aws_lambda_function.security_pin_verify_cvv.invoke_arn
}

output "security_pin_verify_cvv_function_name" {
  value = aws_lambda_function.security_pin_verify_cvv.function_name
}

output "card_get_by_number_invoke_arn" {
  value = aws_lambda_function.card_get_by_number.invoke_arn
}

output "card_get_by_number_function_name" {
  value = aws_lambda_function.card_get_by_number.function_name
}

output "user_transactions_get_invoke_arn" {
  value = aws_lambda_function.user_transactions_get.invoke_arn
}

output "user_transactions_get_function_name" {
  value = aws_lambda_function.user_transactions_get.function_name
}
