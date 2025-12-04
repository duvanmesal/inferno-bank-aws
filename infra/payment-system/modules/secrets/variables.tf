variable "env" {
  type        = string
  description = "Environment name"
}

variable "project_name" {
  type        = string
  description = "Project name"
  default     = "inferno-bank"
}

variable "jwt_secret_key" {
  type        = string
  description = "JWT secret key"
  sensitive   = true
}

variable "password_bcrypt_rounds" {
  type        = number
  description = "BCrypt rounds for password hashing"
  default     = 10
}

variable "tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}
