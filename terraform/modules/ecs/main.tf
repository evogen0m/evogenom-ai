data "aws_caller_identity" "current" {}

resource "aws_ecs_cluster" "main" {
  name = "${var.prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-cluster"
    }
  )
}



resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = var.use_fargate_spot ? "FARGATE_SPOT" : "FARGATE"
    weight            = 1
  }
}

resource "aws_cloudwatch_log_group" "main" {
  name              = "/ecs/${var.prefix}-task"
  retention_in_days = var.log_retention_days

  tags = var.tags
}

# IAM roles
resource "aws_iam_role" "execution_role" {
  name = "${var.prefix}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_role_policy" {
  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task_role" {
  name = "${var.prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Policy to allow access to RDS credentials in Secrets Manager
resource "aws_iam_policy" "secrets_access" {
  count = 1

  name        = "${var.prefix}-secrets-access"
  description = "Allow access to RDS credentials in Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Effect   = "Allow"
        Resource = var.db_credentials_secret_arn
      },
      {
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Effect   = "Allow"
        Resource = aws_secretsmanager_secret.app_env_variables.arn
      },
      {
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Effect   = "Allow"
        Resource = var.firebase_service_account_ssm_path != "" ? "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter${var.firebase_service_account_ssm_path}" : "*"
      }
    ]
  })
}

# Secrets added manually to the ECS task definition
resource "aws_secretsmanager_secret" "app_env_variables" {
  name        = "${var.prefix}-app-env-variables"
  description = "Application environment variables"
  tags        = var.tags
  lifecycle {
    prevent_destroy = true
  }
}

# Get the current version of the app environment variables secret
data "aws_secretsmanager_secret_version" "app_env_variables" {
  secret_id = aws_secretsmanager_secret.app_env_variables.id
}

locals {

  # Parse the JSON string from the secret version
  app_env_variables = jsondecode(
    data.aws_secretsmanager_secret_version.app_env_variables.secret_string != "" ?
    data.aws_secretsmanager_secret_version.app_env_variables.secret_string :
    "{}"
  )

  # Extract keys from the app environment variables
  app_env_keys = keys(local.app_env_variables)
}



resource "aws_iam_role_policy_attachment" "secrets_access" {
  count      = 1
  role       = aws_iam_role.execution_role.name
  policy_arn = aws_iam_policy.secrets_access[0].arn
}


# Get Firebase service account from SSM if path is provided
data "aws_ssm_parameter" "firebase_service_account" {
  count = var.firebase_service_account_ssm_path != "" ? 1 : 0
  name  = var.firebase_service_account_ssm_path
}

locals {
  container_definition = {
    name      = "backend"
    image     = var.container_image
    essential = true

    portMappings = [
      {
        containerPort = var.container_port
        hostPort      = var.container_port
        protocol      = "tcp"
      }
    ]

    environment = concat(
      [
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        { name = "HOST", value = "0.0.0.0" },
        { name = "NODE_ENV", value = "production" },
        { name = "DATABASE_USE_SSL", value = "true" },
        { name = "SAMPLE_EVENTS_SQS_URL", value = aws_sqs_queue.sample_events.url },
        { name = "ORDER_EVENTS_SQS_URL", value = aws_sqs_queue.order_events.url }
      ],
      [
        for k, v in var.environment_variables : {
          name  = k
          value = v
        }
      ]
    )

    secrets = concat(
      var.db_credentials_secret_arn != "" ? [

        {
          name      = "DATABASE_URL"
          valueFrom = "${var.db_credentials_secret_arn}:connection_string::"
        }
      ] : [],
      [
        for key in local.app_env_keys : {
          name      = key
          valueFrom = "${aws_secretsmanager_secret.app_env_variables.arn}:${key}::"
        }
      ],
      var.firebase_service_account_ssm_path != "" ? [
        {
          name      = "FIREBASE_SERVICE_ACCOUNT"
          valueFrom = data.aws_ssm_parameter.firebase_service_account[0].arn
        }
      ] : []
    )

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.main.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }
}

resource "aws_ecs_task_definition" "main" {
  family                   = "${var.prefix}-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution_role.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([local.container_definition])

  tags = var.tags

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }
}

resource "aws_ecs_service" "main" {
  name            = "${var.prefix}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = var.assign_public_ip
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "backend"
    container_port   = var.container_port
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [var.alb_listener_arn]
}

# Auto Scaling
resource "aws_appautoscaling_target" "main" {
  count              = var.enable_autoscaling ? 1 : 0
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu_tracking" {
  count              = var.enable_autoscaling ? 1 : 0
  name               = "${var.prefix}-cpu-tracking"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.cpu_target_tracking_value
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "memory_tracking" {
  count              = var.enable_autoscaling ? 1 : 0
  name               = "${var.prefix}-memory-tracking"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main[0].resource_id
  scalable_dimension = aws_appautoscaling_target.main[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.main[0].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = var.memory_target_tracking_value
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# SQS Queues for sample events
resource "aws_sqs_queue" "sample_events" {
  name                       = "${var.prefix}-sampleEvents"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-sampleEvents"
    }
  )
}

# SQS Queue for order events
resource "aws_sqs_queue" "order_events" {
  name                       = "${var.prefix}-orderEvents"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600 # 4 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 30

  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-orderEvents"
    }
  )
}

# Policy to allow access to SQS queues
resource "aws_iam_policy" "sqs_access" {
  name        = "${var.prefix}-sqs-access"
  description = "Allow access to SQS queues"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Effect = "Allow"
        Resource = [
          aws_sqs_queue.sample_events.arn,
          aws_sqs_queue.order_events.arn
        ]
      }
    ]
  })
}

# Attach SQS policy to task role
resource "aws_iam_role_policy_attachment" "sqs_access" {
  role       = aws_iam_role.task_role.name
  policy_arn = aws_iam_policy.sqs_access.arn
}
