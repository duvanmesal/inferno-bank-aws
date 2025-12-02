variable "aws_region" {
  type        = string
  description = "AWS region for resources"
  default     = "us-east-1"
}

variable "aws_profile" {
  type        = string
  description = "AWS profile to use"
  default     = "inferno-bank"
}

variable "env" {
  type        = string
  description = "Environment (dev, stage, prod)"
  default     = "dev"
}

variable "jwt_secret_key" {
  type        = string
  description = "JWT secret key for token signing"
  sensitive   = true
}

variable "password_bcrypt_rounds" {
  type        = number
  description = "BCrypt rounds for password hashing"
  default     = 10
}

variable "project_name" {
  type        = string
  description = "Project name"
  default     = "inferno-bank"
}
