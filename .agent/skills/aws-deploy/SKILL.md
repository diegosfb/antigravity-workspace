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
      1. Authenticate Docker: `aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com`
      2. **Build for AMD64**: `docker build --platform linux/amd64 -t battletris-server .`
      3. Tag: `docker tag battletris-server:latest <ECR_URL>:latest`
      4. Push: `docker push <ECR_URL>:latest`
4.  **Verification**: 
    - Run `aws apprunner list-operations` or `aws ecs describe-services` to confirm the rollout status.
    - Check application logs in CloudWatch if the deployment fails.

## Operational Guardrails
- **Platform Architecture**: **CRITICAL**: Always build for `linux/amd64` when deploying to AWS App Runner or ECS, especially if building from an Apple Silicon Mac. Use the `--platform linux/amd64` flag.
- **Port Matching**: Ensure the application listens on the port configured in App Runner (default 8080). Update `server.ts` or set the `PORT` env var explicitly.
- **Pre-check**: Ensure the `AWS CLI` and `Docker` are installed and running.
- **IAM Roles**: App Runner requires an Access Role with ECR pull permissions (e.g., `AppRunnerECRAccessRole`).
- **Cost Warning**: Alert the user if the deployment triggers a new expensive resource (e.g., a Load Balancer or NAT Gateway).
- **Secrets**: Use `AWS Secrets Manager` or `Parameter Store` instead of hardcoding variables in the task.

## Operational Guardrails
- **Pre-check**: Ensure the `AWS CLI` and `Docker` are installed and running.
- **Cost Warning**: Alert the user if the deployment triggers a new expensive resource (e.g., a Load Balancer or NAT Gateway).
- **Secrets**: Use `AWS Secrets Manager` or `Parameter Store` instead of hardcoding variables in the task.
