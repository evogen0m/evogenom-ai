locals {
  cognito_user_pool_id = "eu-west-1_UDFBUcuNF"

  # AWS region
  region = "eu-west-1"

  # CIDR block for the VPC
  vpc_cidr = "10.0.0.0/16"

  # List of availability zones to use
  availability_zones = ["eu-west-1a", "eu-west-1b"]

  # Port the container will be listening on
  container_port = 8000

  # Domain name for the ALB
  domain_name = "api.dev.evogenomapp.com"

  # Name of the database to create
  db_name = "postgres"

  # Username for the database
  db_username = "postgres"

  # Instance class for the RDS instance
  db_instance_class = "db.t4g.micro"

  # CPU units for the task (1 vCPU = 1024 CPU units)
  cpu = 512

  # Memory for the task in MiB
  memory = 1024

  # Number of instances of the task to run
  desired_count = 1

  # Environment variables for the task
  env_variables = {
    APP_NAME                 = "EvogenomAI (dev)"
    DEBUG                    = "true"
    OPENID_CONFIG_URL        = "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_UDFBUcuNF/.well-known/openid-configuration"
    AZURE_OPENAI_ENDPOINT    = "https://evogenom-dev.openai.azure.com/"
    AZURE_OPENAI_API_VERSION = "2025-01-01-preview"
    CONTENTFUL_SPACE_ID      = "nslj8lsfnbof"
    EVOGENOM_API_URL         = "https://vv2rx5jsf5girm2argm3qz2ts4.appsync-api.eu-west-1.amazonaws.com/graphql"
    LANGFUSE_BASEURL         = "https://cloud.langfuse.com"
    AWS_REGION               = "eu-west-1"
    COGNITO_USER_POOL_ID     = local.cognito_user_pool_id
  }

  # Tags to apply to all resources
  tags = {}

  # SSM parameter path for Firebase admin SDK service account
  firebase_service_account_ssm_path = "/amplify/ds7n2bdw9vehe/main/AMPLIFY_evogenomApi_FIREBASE__ADMIN_SDK_SERVICE_ACCOUNT"
}

variable "commit_hash" {
  description = "Git commit hash to use for container image tag"
  type        = string
}

