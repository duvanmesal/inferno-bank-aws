variable "env" {
  type        = string
  description = "Environment name"
}

variable "user_service_role_arn" {
  type        = string
  description = "User service IAM role ARN"
}

variable "card_service_role_arn" {
  type        = string
  description = "Card service IAM role ARN"
}

variable "notification_service_role_arn" {
  type        = string
  description = "Notification service IAM role ARN"
}

variable "user_table_name" {
  type        = string
  description = "User table name"
}

variable "card_table_name" {
  type        = string
  description = "Card table name"
}

variable "transaction_table_name" {
  type        = string
  description = "Transaction table name"
}

variable "card_error_table_name" {
  type        = string
  description = "Card error table name"
}

variable "notification_table_name" {
  type        = string
  description = "Notification table name"
}

variable "notification_error_table_name" {
  type        = string
  description = "Notification error table name"
}

variable "avatars_bucket_name" {
  type        = string
  description = "Avatars bucket name"
}

variable "reports_bucket_name" {
  type        = string
  description = "Reports bucket name"
}

variable "templates_bucket_name" {
  type        = string
  description = "Templates bucket name"
}

variable "create_request_card_queue_url" {
  type        = string
  description = "Create request card queue URL"
}

variable "notification_email_queue_url" {
  type        = string
  description = "Notification email queue URL"
}

variable "create_request_card_queue_arn" {
  type        = string
  description = "Create request card queue ARN"
}

variable "notification_email_queue_arn" {
  type        = string
  description = "Notification email queue ARN"
}

variable "jwt_secret_arn" {
  type        = string
  description = "JWT secret ARN"
}

variable "password_secret_arn" {
  type        = string
  description = "Password secret ARN"
}

variable "tags" {
  type        = map(string)
  description = "Common tags"
  default     = {}
}

variable "cvv_unlock_jwt_secret" {
  type        = string
  description = "Secret used to sign CVV unlock JWT tokens"
}
