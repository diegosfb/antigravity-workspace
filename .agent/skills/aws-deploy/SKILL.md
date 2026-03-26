---
name: aws-deploy
description: Automates deployment to AWS using the CLI. It handles authentication, project configuration, and triggers a containerized deployment to Amazon ECS or App Runner.
---

# AWS Deploy Skill

## When to use this skill
- After successful `@security-auditor` and `@test-driven-development` cycles.
- When pushing updates to the AWS cloud environment.
- To sync local builds with an Amazon Elastic Container Registry (ECR).

## How to use it
1.  **Authentication**: 
    - Check current identity: `aws sts get-caller-identity`.
    - If needed, run: `aws configure` or `export AWS_PROFILE=battletris`.
2.  **Project Context**:
    - Set the default region: `aws configure set region us-east-1`.
3.  **Deployment Execution (App Runner Example)**:
    - If using AWS App Runner (similar to Cloud Run):
      `aws apprunner start-deployment --service-arn <YOUR_SERVICE_ARN>`
    - If using ECR/ECS:
      1. Authenticate Docker: `aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com`
      2. Build & Push: `docker build -t battletris-server . && docker tag battletris-server:latest <ECR_URL>:latest && docker push <ECR_URL>:latest`
4.  **Verification**: 
    - Run `aws apprunner list-operations` or `aws ecs describe-services` to confirm the rollout status.

## Operational Guardrails
- **Pre-check**: Ensure the `AWS CLI` and `Docker` are installed and running.
- **Cost Warning**: Alert the user if the deployment triggers a new expensive resource (e.g., a Load Balancer or NAT Gateway).
- **Secrets**: Use `AWS Secrets Manager` or `Parameter Store` instead of hardcoding variables in the task.
