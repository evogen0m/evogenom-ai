# GitHub Actions Workflows for EvogenomAI

This directory contains GitHub Actions workflows for continuous integration and deployment of the EvogenomAI application.

## Workflows

### 1. Tests (`test.yml`)

Runs automated tests whenever code is pushed to main or a pull request is created against main.

### 2. Deploy to Dev (`deploy-dev.yml`)

Automatically deploys the application to the dev environment when changes are pushed to the main branch, or manually when triggered through the GitHub Actions interface.

## Setup Instructions

### Prerequisites

Before you can use these workflows, you need to set up the following:

1. Deploy the infrastructure in AWS using Terraform. The `terraform/environments/dev` directory contains the necessary configuration.

2. Ensure the CI role ARN is correctly set in the workflow environment variables:

   ```yaml
   env:
     CI_ROLE_ARN: arn:aws:iam::787152464465:role/evogenom-dev-ci-role
   ```

   The CI role ARN is available as an output when you apply the Terraform configuration.

### OIDC Authentication

The workflows use OIDC (OpenID Connect) to authenticate with AWS. This allows GitHub Actions to assume the IAM role without storing long-lived AWS credentials.

When you applied the Terraform configuration, it created:

1. An OIDC provider in AWS
2. An IAM role that can be assumed by GitHub Actions
3. Policies that grant the minimum required permissions

#### Required Permissions

The GitHub workflow requires specific permissions to use OIDC authentication:

```yaml
permissions:
  id-token: write # Required for OIDC authentication
  contents: read # Required to checkout the repository
```

These permissions are already configured in the workflow files. If you're creating a new workflow that needs to authenticate with AWS, make sure to include these permissions.

### Update the GitHub Repository Name in Terraform

For the OIDC authentication to work correctly, make sure to update the `sub` field in the role's trust policy in `terraform/environments/dev/main.tf` to match your actual GitHub repository:

```terraform
StringLike = {
  "token.actions.githubusercontent.com:sub" = "repo:your-organization/evogenom-ai:*"
}
```

Replace `your-organization/evogenom-ai` with your actual GitHub repository name.

## Manual Deployment

You can manually deploy a specific commit to the dev environment:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Dev" workflow
3. Click "Run workflow"
4. (Optional) Enter a specific commit hash to deploy, or leave blank to use the latest commit on the selected branch
5. Click "Run workflow"

## Environment Variables

The `deploy-dev.yml` workflow uses the following environment variables:

- `AWS_REGION`: The AWS region where your infrastructure is deployed
- `ECR_REPOSITORY`: The name of the ECR repository for the dev environment
- `ECS_CLUSTER`: The name of the ECS cluster
- `ECS_SERVICE`: The name of the ECS service
- `TASK_DEFINITION`: The name of the ECS task definition

If you need to modify these values, you can update them directly in the workflow file.
