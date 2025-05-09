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
  echo "  -s, --sentry-release <tag> Sentry release tag (default: same as Docker tag)"
  echo "  --sentry                   Create and finalize Sentry release"
  echo ""
  exit 1
}

# Get the current git commit hash
GIT_COMMIT_HASH=$(git rev-parse HEAD)

# Default values
ACTION="apply"
ENVIRONMENT=""
DOCKER_TAG="$GIT_COMMIT_HASH"
SENTRY_RELEASE=""
BUILD_DOCKER=false
CREATE_SENTRY_RELEASE=false

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
    -s|--sentry-release)
      SENTRY_RELEASE="$2"
      shift
      shift
      ;;
    --sentry)
      CREATE_SENTRY_RELEASE=true
      shift
      ;;
    *)
      ENVIRONMENT="$1"
      shift
      ;;
  esac
done

# Set Sentry release to Docker tag if not specified
if [ -z "$SENTRY_RELEASE" ]; then
  SENTRY_RELEASE="$DOCKER_TAG"
fi

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

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Create Sentry release if requested
if [ "$CREATE_SENTRY_RELEASE" = true ]; then
  echo "Creating Sentry release: $SENTRY_RELEASE..."
  export SENTRY_RELEASE="$SENTRY_RELEASE"
  pnpm sentry:release
  
  # Only run this step if we're building the Docker image
  if [ "$BUILD_DOCKER" = true ]; then
    echo "Preparing for sourcemaps upload..."
    pnpm build
    pnpm sentry:sourcemaps
  fi
fi

# Function to get ECR repository URL
get_ecr_repo_url() {
  aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" --query 'repositories[0].repositoryUri' --output text
}

# Build and push Docker image
if [ "$BUILD_DOCKER" = true ]; then
  echo "Building and pushing Docker image for $ENVIRONMENT environment with tag: $DOCKER_TAG..."
  
  # Get ECR login
  aws ecr get-login-password | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query 'Account' --output text).dkr.ecr.$(aws configure get region).amazonaws.com"
  
  # Build image with Sentry release
  docker build --platform linux/amd64 \
    --build-arg SENTRY_RELEASE="$SENTRY_RELEASE" \
    -t "$ECR_REPO_NAME:$DOCKER_TAG" .
  
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
    terraform apply -var="commit_hash=$DOCKER_TAG"
    ;;
esac

# Finalize Sentry release and create deployment if needed
if [ "$CREATE_SENTRY_RELEASE" = true ]; then
  echo "Finalizing Sentry release: $SENTRY_RELEASE..."
  export SENTRY_RELEASE="$SENTRY_RELEASE"
  export NODE_ENV="$ENVIRONMENT"
  pnpm sentry:finalize
  pnpm sentry:deploy
fi

echo "Tagging commit with $ENVIRONMENT and pushing to origin..."
git tag -f "$ENVIRONMENT" "$GIT_COMMIT_HASH"
git push origin "$ENVIRONMENT" --force

echo "Deployment to $ENVIRONMENT environment completed successfully!" 