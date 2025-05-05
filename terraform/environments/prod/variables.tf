variable "commit_hash" {
  description = "Git commit hash to use for container image tag"
  type        = string
}

locals {
  region             = "eu-west-1"
  vpc_cidr           = "10.2.0.0/16"
  availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  container_port     = 8000
  domain_name        = "api.evogenomapp.com"
  db_name            = "evogenom"
  db_username        = "evogenom"
  db_instance_class  = "db.t4g.medium"
  cpu                = 1024
  memory             = 2048
  desired_count      = 1
  env_variables = {
    APP_NAME          = "EvogenomAI (prod)"
    DEBUG             = "true"
    OPENID_CONFIG_URL = "https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_ccL74j0HP/.well-known/openid-configuration"
    #TODO create prod endpoint, remember to update secret
    AZURE_OPENAI_ENDPOINT    = "https://evogenom-dev.openai.azure.com/"
    AZURE_OPENAI_API_VERSION = "2025-01-01-preview"
    CONTENTFUL_SPACE_ID      = "nslj8lsfnbof"
    # evogenom-main
    EVOGENOM_API_URL     = "https://on5w2opsozd6ddgewx26drt3d4.appsync-api.eu-west-1.amazonaws.com/graphql"
    LANGFUSE_BASEURL     = "https://cloud.langfuse.com"
    COGNITO_USER_POOL_ID = local.cognito_user_pool_id
    AWS_REGION           = "eu-west-1"
  }
  tags                              = {}
  firebase_service_account_ssm_path = "/amplify/ds7n2bdw9vehe/main/AMPLIFY_evogenomApi_FIREBASE__ADMIN_SDK_SERVICE_ACCOUNT"
  cognito_user_pool_id              = "eu-west-1_ccL74j0HP"
}
