variable "project_name" {
  type        = string
  description = "Project name (should match parent project)"
  default     = "inferno-bank"
}

variable "environment" {
  type        = string
  description = "Environment (dev, stage, prod)"
  validation {
    condition     = contains(["dev", "stage", "prod"], var.environment)
    error_message = "Environment must be dev, stage, or prod."
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region for payment system resources"
  default     = "us-east-1"
}

variable "aws_profile" {
  type        = string
  description = "AWS profile to use"
  default     = "inferno-bank"
}

variable "core_bank_base_url" {
  type        = string
  description = "Base URL of the core bank API (e.g., https://api.inferno-bank.com)"
  example     = "https://api.inferno-bank.com"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for payment system VPC"
  default     = "10.1.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR block for public subnet"
  default     = "10.1.1.0/24"
}

variable "private_subnet_cidr" {
  type        = string
  description = "CIDR block for private subnet (Redis)"
  default     = "10.1.2.0/24"
}

variable "redis_node_type" {
  type        = string
  description = "ElastiCache Redis node type"
  default     = "cache.t3.micro"
}

variable "sqs_visibility_timeout" {
  type        = number
  description = "SQS message visibility timeout in seconds"
  default     = 300
}

variable "lambda_memory_size" {
  type        = number
  description = "Default memory allocation for Lambda functions (MB)"
  default     = 512
}

variable "lambda_timeout" {
  type        = number
  description = "Default timeout for Lambda functions (seconds)"
  default     = 60
}

variable "enable_dlq" {
  type        = bool
  description = "Enable Dead Letter Queues for SQS"
  default     = true
}
