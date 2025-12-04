variable "env" {
  type        = string
  description = "Environment name"
}

variable "project_name" {
  type        = string
  description = "Project name"
  default     = "inferno-bank"
}

variable "tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}
