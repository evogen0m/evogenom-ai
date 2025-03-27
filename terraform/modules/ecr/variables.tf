variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 