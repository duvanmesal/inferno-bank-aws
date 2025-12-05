variable "project_name" {
  description = "Nombre base del proyecto (ej: inferno-bank)"
  type        = string
  default     = "inferno-bank"
}

variable "environment" {
  description = "Ambiente de despliegue (dev, qa, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Región AWS"
  type        = string
  default     = "us-east-1"
}

variable "core_bank_base_url" {
  description = "Base URL del API Gateway del core bancario (1er corte)"
  type        = string
}

# Red
variable "vpc_cidr" {
  description = "CIDR block para la VPC del payment system"
  type        = string
  default     = "10.40.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR para la subnet pública"
  type        = string
  default     = "10.40.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR para la subnet privada"
  type        = string
  default     = "10.40.2.0/24"
}

# Opcionales por si quieres sobreescribir
variable "payment_table_name" {
  description = "Nombre de la tabla DynamoDB de pagos (opcional)"
  type        = string
  default     = ""
}

variable "catalog_bucket_name" {
  description = "Nombre del bucket S3 para el catálogo (opcional)"
  type        = string
  default     = ""
}
