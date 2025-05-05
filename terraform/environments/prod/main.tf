provider "aws" {
  region = local.region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "EvogenomAI"
      Terraform   = "true"
    }
  }
}

locals {
  prefix = "evogenom-prod"
}

module "networking" {
  source = "../../modules/networking"

  prefix             = local.prefix
  vpc_cidr           = local.vpc_cidr
  availability_zones = local.availability_zones
  container_port     = local.container_port
  tags               = local.tags
}

module "ecr" {
  source = "../../modules/ecr"

  prefix = local.prefix
  tags   = local.tags
}

module "alb" {
  source = "../../modules/alb"

  prefix                     = local.prefix
  vpc_id                     = module.networking.vpc_id
  subnet_ids                 = module.networking.public_subnet_ids
  security_group_id          = module.networking.alb_security_group_id
  domain_name                = local.domain_name
  target_port                = local.container_port
  enable_deletion_protection = true
  tags                       = local.tags
}

module "rds" {
  source = "../../modules/rds"

  prefix            = local.prefix
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.rds_security_group_id
  db_name           = local.db_name
  db_username       = local.db_username
  instance_class    = local.db_instance_class

  # Production-specific settings
  skip_final_snapshot     = false
  deletion_protection     = true
  backup_retention_period = 30
  max_allocated_storage   = 500

  tags = local.tags
}

module "bastion" {
  source = "../../modules/bastion"

  prefix                = local.prefix
  vpc_id                = module.networking.vpc_id
  subnet_id             = module.networking.public_subnet_ids[0]
  instance_type         = "t4g.nano"
  rds_security_group_id = module.networking.rds_security_group_id
  tags                  = local.tags
}

module "ecs" {
  source = "../../modules/ecs"

  prefix            = local.prefix
  region            = local.region
  container_image   = "${module.ecr.repository_url}:${var.commit_hash}"
  container_port    = local.container_port
  cpu               = local.cpu
  memory            = local.memory
  desired_count     = local.desired_count
  subnet_ids        = module.networking.private_subnet_ids
  security_group_id = module.networking.ecs_security_group_id
  target_group_arn  = module.alb.target_group_arn
  alb_listener_arn  = module.alb.https_listener_arn

  # Service discovery and environment variables
  db_credentials_secret_arn         = module.rds.db_credentials_secret_arn
  firebase_service_account_ssm_path = local.firebase_service_account_ssm_path
  environment_variables = merge(local.env_variables, {
    # These are dynamically set and override any potential values in var.env_variables
    HOST = "0.0.0.0"
    PORT = tostring(local.container_port)
  })

  # Autoscaling configuration
  enable_autoscaling           = true
  min_capacity                 = 1
  max_capacity                 = 10
  cpu_target_tracking_value    = 60
  memory_target_tracking_value = 60

  # Don't use spot instances for production
  use_fargate_spot = false

  cognito_user_pool_id = local.cognito_user_pool_id

  tags = local.tags
}
