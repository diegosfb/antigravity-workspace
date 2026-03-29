# AWS App Runner Terraform (Dev)

This stack provisions:
- ECR repository
- App Runner service
- IAM role for App Runner to pull images

It reads region, service name, image tag, and target architecture from `config/Infrastructure/aws-dev.yaml`.

## Usage

```bash
cd config/Infrastructure/terraform/aws-dev
terraform init
terraform apply -auto-approve
```
