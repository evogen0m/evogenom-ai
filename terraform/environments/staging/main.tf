provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = "staging"
      Project     = "EvogenomAI"
      Terraform   = "true"
    }
  }
}

locals {
  prefix = "evogenom-staging"
}

module "networking" {
  source = "../../modules/networking"

  prefix             = local.prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  container_port     = var.container_port
  tags               = var.tags
}

module "ecr" {
  source = "../../modules/ecr"

  prefix = local.prefix
  tags   = var.tags
}

module "alb" {
  source = "../../modules/alb"

  prefix                     = local.prefix
  vpc_id                     = module.networking.vpc_id
  subnet_ids                 = module.networking.public_subnet_ids
  security_group_id          = module.networking.alb_security_group_id
  domain_name                = var.domain_name
  target_port                = var.container_port
  enable_deletion_protection = false
  tags                       = var.tags
}

module "rds" {
  source = "../../modules/rds"

  prefix            = local.prefix
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id
  db_name           = var.db_name
  db_username       = var.db_username
  instance_class    = var.db_instance_class

  # Staging-specific settings
  skip_final_snapshot     = true
  deletion_protection     = true
  backup_retention_period = 7

  tags = var.tags
}

module "ecs" {
  source = "../../modules/ecs"

  prefix            = local.prefix
  region            = var.region
  container_image   = "${module.ecr.repository_url}:${var.commit_hash}"
  container_port    = var.container_port
  cpu               = var.cpu
  memory            = var.memory
  desired_count     = var.desired_count
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.ecs_security_group_id
  target_group_arn  = module.alb.target_group_arn
  alb_listener_arn  = module.alb.https_listener_arn

  # Service discovery and environment variables
  db_credentials_secret_arn = module.rds.db_credentials_secret_arn
  environment_variables = {
    APP_NAME          = "EvogenomAI"
    DEBUG             = "false"
    HOST              = "0.0.0.0"
    PORT              = tostring(var.container_port)
    OPENID_CONFIG_URL = var.openid_config_url
  }

  # Autoscaling configuration
  enable_autoscaling           = true
  min_capacity                 = 2
  max_capacity                 = 4
  cpu_target_tracking_value    = 70
  memory_target_tracking_value = 70

  # Don't use spot instances for staging
  use_fargate_spot = false

  tags = var.tags
}
