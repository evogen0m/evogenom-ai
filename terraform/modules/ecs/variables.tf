variable "prefix" {
  description = "Prefix to use for resource names"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "container_image" {
  description = "Docker image to run in the ECS cluster"
  type        = string
}

variable "container_port" {
  description = "Port the container will be listening on"
  type        = number
  default     = 8000
}

variable "cpu" {
  description = "CPU units for the task (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the task in MiB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of instances of the task to run"
  type        = number
  default     = 1
}

variable "subnet_ids" {
  description = "Subnet IDs for the ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for the ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of the target group to attach the service to"
  type        = string
}

variable "alb_listener_arn" {
  description = "ARN of the ALB listener to ensure it exists before creating the service"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain logs in CloudWatch"
  type        = number
  default     = 7
}

variable "assign_public_ip" {
  description = "Whether to assign a public IP to the task"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Environment variables to pass to the container"
  type        = map(string)
  default     = {}
}

variable "db_credentials_secret_arn" {
  description = "ARN of the secret containing the DB credentials"
  type        = string
  default     = ""
}

variable "enable_autoscaling" {
  description = "Whether to enable auto scaling for the service"
  type        = bool
  default     = false
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto scaling"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto scaling"
  type        = number
  default     = 5
}

variable "cpu_target_tracking_value" {
  description = "Target CPU utilization for auto scaling (%)"
  type        = number
  default     = 70
}

variable "memory_target_tracking_value" {
  description = "Target memory utilization for auto scaling (%)"
  type        = number
  default     = 70
}

variable "use_fargate_spot" {
  description = "Whether to use Fargate Spot capacity provider"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "firebase_service_account_ssm_path" {
  description = "SSM parameter path for Firebase admin SDK service account"
  type        = string
  default     = ""
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito user pool to grant access to"
  type        = string
  default     = ""
}
