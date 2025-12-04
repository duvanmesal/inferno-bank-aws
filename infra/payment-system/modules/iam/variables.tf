variable "env" {
  type        = string
  description = "Environment name"
}

variable "user_table_arn" {
  type        = string
  description = "User table ARN"
}

variable "card_table_arn" {
  type        = string
  description = "Card table ARN"
}

variable "transaction_table_arn" {
  type        = string
  description = "Transaction table ARN"
}

variable "card_error_table_arn" {
  type        = string
  description = "Card error table ARN"
}

variable "notification_table_arn" {
  type        = string
  description = "Notification table ARN"
}

variable "notification_error_table_arn" {
  type        = string
  description = "Notification error table ARN"
}

variable "avatars_bucket_arn" {
  type        = string
  description = "Avatars bucket ARN"
}

variable "reports_bucket_arn" {
  type        = string
  description = "Reports bucket ARN"
}

variable "templates_bucket_arn" {
  type        = string
  description = "Templates bucket ARN"
}

variable "create_request_card_arn" {
  type        = string
  description = "Create request card queue ARN"
}

variable "notification_email_arn" {
  type        = string
  description = "Notification email queue ARN"
}

variable "create_request_card_dlq_arn" {
  type        = string
  description = "Create request card DLQ ARN"
}

variable "notification_email_dlq_arn" {
  type        = string
  description = "Notification email DLQ ARN"
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
