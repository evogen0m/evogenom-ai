variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs where the DB will be deployed"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the database"
  type        = string
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "postgres"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "postgres"
}

variable "instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB for autoscaling"
  type        = number
  default     = 100
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "Whether to skip final snapshot when the instance is deleted"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether to enable deletion protection for the instance"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
} 