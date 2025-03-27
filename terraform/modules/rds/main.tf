resource "aws_db_subnet_group" "main" {
  name       = "${var.prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-db-subnet-group"
    }
  )
}

resource "aws_db_parameter_group" "main" {
  name   = "${var.prefix}-db-parameter-group"
  family = "postgres17"
  
  parameter {
    name  = "log_connections"
    value = "1"
  }
  
  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-db-parameter-group"
    }
  )
}

resource "random_password" "db_password" {
  length  = 16
  special = false
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.prefix}-evogenom-db-credentials"
  description = "Database credentials for ${var.prefix} application"
  
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    connection_string = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}"
  })
}

resource "aws_db_instance" "main" {
  identifier             = "${var.prefix}-db"
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = var.max_allocated_storage
  storage_type           = "gp3"
  storage_encrypted      = true
  
  db_name                = var.db_name
  username               = var.db_username
  password               = random_password.db_password.result
  port                   = 5432
  
  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name
  
  publicly_accessible    = false
  skip_final_snapshot    = var.skip_final_snapshot
  deletion_protection    = var.deletion_protection
  
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  
  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-db"
    }
  )
} 