variable "env" {
  type        = string
  description = "Environment name"
}

variable "tags" {
  type        = map(string)
  description = "Common tags for all resources"
  default     = {}
}
