variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to use"
  type        = list(string)
  default     = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
}

variable "container_port" {
  description = "Port the container will be listening on"
  type        = number
  default     = 8000
}

variable "domain_name" {
  description = "Domain name for the ALB"
  type        = string
  default     = "api.evogenomapp.com"
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "evogenom"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "evogenom"
}

variable "db_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t4g.medium"
}

variable "cpu" {
  description = "CPU units for the task (1 vCPU = 1024 CPU units)"
  type        = number
  default     = 1024
}

variable "memory" {
  description = "Memory for the task in MiB"
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Number of instances of the task to run"
  type        = number
  default     = 1
}

variable "env_variables" {
  description = "Environment variables for the task"
  type        = map(string)
  default = {
    APP_NAME          = "EvogenomAI (prod)"
    DEBUG             = "true"
    OPENID_CONFIG_URL = "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_ccL74j0HP/.well-known/openid-configuration"
    #TODO create prod endpoint, remember to update secret
    AZURE_OPENAI_ENDPOINT    = "https://evogenom-dev.openai.azure.com/"
    AZURE_OPENAI_API_VERSION = "2025-01-01-preview"
    CONTENTFUL_SPACE_ID      = "nslj8lsfnbof"
    # evogenom-main
    EVOGENOM_API_URL = "https://on5w2opsozd6ddgewx26drt3d4.appsync-api.eu-west-1.amazonaws.com/graphql"
    LANGFUSE_BASEURL = "https://cloud.langfuse.com"
  }
}


variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "commit_hash" {
  description = "Git commit hash to use for container image tag"
  type        = string
}

variable "firebase_service_account_ssm_path" {
  description = "SSM parameter path for Firebase admin SDK service account"
  type        = string
  default     = "/amplify/ds7n2bdw9vehe/main/AMPLIFY_evogenomApi_FIREBASE__ADMIN_SDK_SERVICE_ACCOUNT"
}
