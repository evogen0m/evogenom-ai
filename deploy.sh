#!/bin/bash
set -e

# Usage info
show_help() {
  echo "Usage: $0 [options] <environment>"
  echo "  environment: The environment to deploy to (dev, staging, prod)"
  echo ""
  echo "Options:"
  echo "  -h, --help                 Show this help message and exit"
  echo "  -i, --init                 Initialize Terraform for the environment"
  echo "  -b, --build                Build and push Docker image"
  echo "  -p, --plan                 Run Terraform plan only (don't apply)"
  echo "  -a, --apply                Apply Terraform plan (default)"
  echo "  -t, --tag <tag>            Docker image tag to use (default: git commit hash)"
  echo ""
  exit 1
}

# Get the current git commit hash
GIT_COMMIT_HASH=$(git rev-parse HEAD)

# Default values
ACTION="apply"
ENVIRONMENT=""
DOCKER_TAG="$GIT_COMMIT_HASH"
BUILD_DOCKER=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -h|--help)
      show_help
      ;;
    -i|--init)
      ACTION="init"
      shift
      ;;
    -b|--build)
      BUILD_DOCKER=true
      shift
      ;;
    -p|--plan)
      ACTION="plan"
      shift
      ;;
    -a|--apply)
      ACTION="apply"
      shift
      ;;
    -t|--tag)
      DOCKER_TAG="$2"
      shift
      shift
      ;;
    *)
      ENVIRONMENT="$1"
      shift
      ;;
  esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
  echo "Error: Invalid environment. Must be one of: dev, staging, prod"
  show_help
fi

# Set AWS profile if needed
export AWS_PROFILE=evogenom-$ENVIRONMENT

# Environment-specific variables
TERRAFORM_DIR="terraform/environments/$ENVIRONMENT"
ECR_REPO_NAME="evogenom-$ENVIRONMENT-app"

# Function to get ECR repository URL
get_ecr_repo_url() {
  aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --query 'repositories[0].repositoryUri' --output text
}

# Build and push Docker image
if [ "$BUILD_DOCKER" = true ]; then
  echo "Building and pushing Docker image for $ENVIRONMENT environment with tag: $DOCKER_TAG..."
  
  # Get ECR login
  aws ecr get-login-password | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.$(aws configure get region).amazonaws.com"
  
  # Build image
  docker build --platform linux/amd64 -t "$ECR_REPO_NAME:$DOCKER_TAG" .
  
  # Tag and push
  REPO_URL=$(get_ecr_repo_url)
  docker tag "$ECR_REPO_NAME:$DOCKER_TAG" "$REPO_URL:$DOCKER_TAG"
  docker push "$REPO_URL:$DOCKER_TAG"
  
  echo "Docker image pushed to $REPO_URL:$DOCKER_TAG"
fi

# Terraform operations
cd "$TERRAFORM_DIR"

case $ACTION in
  init)
    echo "Initializing Terraform for $ENVIRONMENT environment..."
    terraform init
    ;;
  plan)
    echo "Planning Terraform changes for $ENVIRONMENT environment..."
    terraform plan -var="commit_hash=$DOCKER_TAG"
    ;;
  apply)
    echo "Applying Terraform changes for $ENVIRONMENT environment..."
    terraform apply -auto-approve -var="commit_hash=$DOCKER_TAG"
    ;;
esac

echo "Deployment to $ENVIRONMENT environment completed successfully!" 