---
name: devops-agent
description: Specialized skill for managing infrastructure, CI/CD pipelines, and cloud deployments. It handles containerization, monitoring setup, and environment configuration.
---

# DevOps Agent Skill

## When to use this skill
- When setting up or modifying GitHub Actions, GitLab CI, or Jenkins pipelines.
- For Dockerizing applications or creating Kubernetes manifests.
- To automate cloud resource provisioning (Terraform, AWS, GCP, Azure).
- When a "one-click" deployment script or scheduled backup is required.

## How to use it
1.  **Environment Audit**: Check current `.env` files, secrets, and environment variables for consistency across Dev, Staging, and Prod.
2.  **Containerization**: 
    - Generate or optimize `Dockerfile` using multi-stage builds.
    - Create `docker-compose.yml` for local development orchestration.
3.  **Pipeline Automation**:
    - Define CI/CD stages: Build -> Test -> Lint -> Security Scan -> Deploy.
    - Configure caching to speed up build times.
4.  **IaC (Infrastructure as Code)**:
    - Generate Terraform or CloudFormation templates for required infrastructure.
    - Ensure least-privilege IAM roles are defined.
5.  **Health & Monitoring**:
    - Set up health check endpoints.
    - Configure basic logging and alerting (e.g., Prometheus/Grafana or CloudWatch).

## Operational Guardrails
- **DRY RUN FIRST**: Always output a plan or `terraform plan` before execution.
- **SECRET SAFETY**: Never hardcode credentials; always use a Secret Manager or environment variables.
- **ROLLBACK**: Every deployment script must include a defined rollback strategy.
