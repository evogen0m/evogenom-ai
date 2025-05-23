provider "aws" {
  region = local.region

  default_tags {
    tags = {
      Environment = "dev"
      Project     = "EvogenomAI"
      Terraform   = "true"
    }
  }
}

locals {
  prefix = "evogenom-dev"
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
  enable_deletion_protection = false
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

  # Development-specific settings
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 1

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
  environment_variables             = local.env_variables
  firebase_service_account_ssm_path = local.firebase_service_account_ssm_path

  # Autoscaling configuration
  enable_autoscaling           = true
  min_capacity                 = 1
  max_capacity                 = 3
  cpu_target_tracking_value    = 70
  memory_target_tracking_value = 70

  # Use spot instances for dev to save costs
  use_fargate_spot = true

  cognito_user_pool_id = local.cognito_user_pool_id

  tags = local.tags
}

# GitHub OIDC Provider for CI
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# CI Role for GitHub Actions
resource "aws_iam_role" "ci_role" {
  name = "${local.prefix}-ci-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          },
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:evogen0m/evogenom-ai:*"
          }
        }
      }
    ]
  })

  tags = merge(
    local.tags,
    {
      Name = "${local.prefix}-ci-role"
    }
  )
}

# Policy for ECR push access
resource "aws_iam_policy" "ci_ecr_policy" {
  name        = "${local.prefix}-ci-ecr-policy"
  description = "Policy to allow pushing images to ECR for CI"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:CreateRepository",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages",
          "ecr:ListImages"
        ]
        Resource = [
          "arn:aws:ecr:${local.region}:*:repository/${local.prefix}-app"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken"
        ],
        Resource = "*" # Required for GetAuthorizationToken which doesn't support resource-level permissions
      }
    ]
  })
}

# Policy for ECS task definition updates
resource "aws_iam_policy" "ci_ecs_policy" {
  name        = "${local.prefix}-ci-ecs-policy"
  description = "Policy to allow updating ECS task definitions for CI"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*" # Task definitions don't support resource-level permissions
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ]
        Resource = "arn:aws:ecs:${local.region}:*:service/${module.ecs.cluster_name}/${module.ecs.service_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          module.ecs.execution_role_arn,
          module.ecs.task_role_arn
        ]
      }
    ]
  })
}

# Attach policies to the CI role
resource "aws_iam_role_policy_attachment" "ci_ecr_policy_attachment" {
  role       = aws_iam_role.ci_role.name
  policy_arn = aws_iam_policy.ci_ecr_policy.arn
}

resource "aws_iam_role_policy_attachment" "ci_ecs_policy_attachment" {
  role       = aws_iam_role.ci_role.name
  policy_arn = aws_iam_policy.ci_ecs_policy.arn
}
