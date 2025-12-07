variable "env" {
  type        = string
  description = "Environment name"
}

variable "register_user_invoke_arn" {
  type = string
}

variable "login_user_invoke_arn" {
  type = string
}

variable "update_user_invoke_arn" {
  type = string
}

variable "upload_avatar_user_invoke_arn" {
  type = string
}

variable "get_profile_user_invoke_arn" {
  type = string
}

variable "card_activate_invoke_arn" {
  type = string
}

variable "card_purchase_invoke_arn" {
  type = string
}

variable "card_transaction_save_invoke_arn" {
  type = string
}

variable "card_paid_credit_card_invoke_arn" {
  type = string
}

variable "card_get_report_invoke_arn" {
  type = string
}

variable "register_user_function_name" {
  type = string
}

variable "login_user_function_name" {
  type = string
}

variable "update_user_function_name" {
  type = string
}

variable "upload_avatar_user_function_name" {
  type = string
}

variable "get_profile_user_function_name" {
  type = string
}

variable "card_activate_function_name" {
  type = string
}

variable "card_purchase_function_name" {
  type = string
}

variable "card_transaction_save_function_name" {
  type = string
}

variable "card_paid_credit_card_function_name" {
  type = string
}

variable "card_get_report_function_name" {
  type = string
}

variable "card_get_invoke_arn" {
  type = string
}

variable "card_get_function_name" {
  type = string
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

variable "card_get_by_user_invoke_arn" {
  type = string
}

variable "card_get_by_user_function_name" {
  type = string
}

variable "security_pin_set_invoke_arn" {
  type        = string
  description = "Invoke ARN for security-pin-set lambda"
}

variable "security_pin_set_function_name" {
  type        = string
  description = "Function name for security-pin-set lambda"
}

variable "security_pin_verify_cvv_invoke_arn" {
  type        = string
  description = "Invoke ARN for security-pin-verify-cvv lambda"
}

variable "security_pin_verify_cvv_function_name" {
  type        = string
  description = "Function name for security-pin-verify-cvv lambda"
}

variable "card_get_by_number_invoke_arn" {
  type        = string
  description = "Invoke ARN for card-get-by-number lambda"
}

variable "card_get_by_number_function_name" {
  type        = string
  description = "Function name for card-get-by-number lambda"
}

variable "user_transactions_get_invoke_arn" {
  type        = string
  description = "Invoke ARN for user-transactions-get lambda"
}

variable "user_transactions_get_function_name" {
  type        = string
  description = "Function name for user-transactions-get lambda"
}
