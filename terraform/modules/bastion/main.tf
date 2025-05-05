data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "bastion" {
  name        = "${var.prefix}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from allowed IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-bastion-sg"
    }
  )
}

# Allow bastion to access RDS
resource "aws_security_group_rule" "bastion_to_rds" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.rds_security_group_id
  source_security_group_id = aws_security_group.bastion.id
  description              = "Allow PostgreSQL access from bastion host"
}

# Create SSH key
resource "tls_private_key" "bastion" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Save private key to local file
resource "local_file" "private_key" {
  content         = tls_private_key.bastion.private_key_pem
  filename        = "${path.root}/../../generated/${var.prefix}-bastion-key.pem"
  file_permission = "0600"
}

# Create SSH script for easy access
resource "local_file" "ssh_script" {
  content         = <<-EOT
#!/bin/bash
ssh -i "${path.root}/../../generated/${var.prefix}-bastion-key.pem" ec2-user@${aws_instance.bastion.public_ip} "$@"
EOT
  filename        = "${path.root}/../../generated/ssh_bastion.sh"
  file_permission = "0755"
}

# Create key pair in AWS
resource "aws_key_pair" "bastion" {
  key_name   = "${var.prefix}-bastion-key"
  public_key = tls_private_key.bastion.public_key_openssh
  tags       = var.tags
}

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  key_name               = aws_key_pair.bastion.key_name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    delete_on_termination = true
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.prefix}-bastion"
    }
  )

  lifecycle {
    ignore_changes = [key_name]
  }
}
