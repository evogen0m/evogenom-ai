# EvogenomAI AWS Infrastructure

This directory contains the Terraform configuration for deploying the EvogenomAI application to AWS Fargate.

## Architecture

The infrastructure is deployed using a modular approach with the following components:

- **Networking**: VPC, subnets, security groups, and NAT gateways
- **ECR**: Container registry for Docker images
- **RDS**: PostgreSQL database
- **ALB**: Application Load Balancer
- **ECS**: Fargate cluster, service, and task definitions

The application is deployed in a highly available architecture across multiple availability zones with auto-scaling capabilities.

## Directory Structure

```
terraform/
├── modules/               # Reusable modules
│   ├── networking/        # VPC, subnets, security groups
│   ├── ecr/               # Container registry
│   ├── rds/               # PostgreSQL database
│   ├── alb/               # Application Load Balancer
│   └── ecs/               # Fargate cluster and service
├── environments/          # Environment-specific configurations
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── prod/              # Production environment
├── backend.tf             # Remote state configuration
└── versions.tf            # Terraform and provider versions
```

## Prerequisites

- [Terraform](https://www.terraform.io/) v1.0.0+
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An S3 bucket for storing Terraform state
- A DynamoDB table for state locking

## Usage

### Remote State Configuration

Before initializing Terraform, create an S3 bucket and DynamoDB table for remote state:

```bash
aws s3 mb s3://evogenom-terraform-state --region eu-west-1

aws dynamodb create-table \
  --table-name evogenom-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1
```

### Deployment

Use the provided deployment script:

```bash
# Initialize Terraform for an environment
./deploy.sh --init dev

# Plan changes
./deploy.sh --plan dev

# Build and push Docker image
./deploy.sh --build dev

# Apply changes
./deploy.sh dev

# Deploy with a specific image tag
./deploy.sh --build --tag v1.0.0 dev
```

## Environment Configurations

### Development (dev)

- Minimal resources for cost-effectiveness
- Uses Fargate Spot for lower costs
- Basic monitoring and logging
- No deletion protection

### Staging (staging)

- More resources than dev for testing
- Standard Fargate (not spot) for stability
- Enhanced monitoring and logging
- Some deletion protection

### Production (prod)

- High-availability across 3 AZs
- Maximum resources for performance
- Advanced monitoring and alerting
- Full deletion protection
- Regular database backups

## Security

- Private subnets for ECS tasks and RDS
- Public subnets only for ALB
- Security groups for fine-grained access control
- Secrets stored in AWS Secrets Manager
- HTTPS encryption for public endpoints

## Customization

Each environment can be customized by modifying the variables in the respective environment directory.

## Maintenance

- Database backups are managed automatically based on environment settings
- Container image lifecycle policies clean up old images automatically
- Auto-scaling manages resource utilization effectively
