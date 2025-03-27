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
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_access" {
  count      = 1
  role       = aws_iam_role.execution_role.name
  policy_arn = aws_iam_policy.secrets_access[0].arn
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
    
    environment = [
      for k, v in var.environment_variables : {
        name  = k
        value = v
      }
    ]
    
    secrets = var.db_credentials_secret_arn != "" ? [
      {
        name      = "DATABASE_URL"
        valueFrom = "${var.db_credentials_secret_arn}:connection_string::"
      }
    ] : []
    
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
    target_value       = var.cpu_target_tracking_value
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
    target_value       = var.memory_target_tracking_value
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
} 