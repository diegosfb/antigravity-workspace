# AWS App Runner Terraform

This stack provisions:
- ECR repository
- App Runner service
- IAM role for App Runner to pull images

It reads region and target architecture from `config/Infrastructure/aws.yaml`.

## Usage

```bash
cd config/Infrastructure/terraform/aws
terraform init
terraform apply -var="image_identifier=<account>.dkr.ecr.<region>.amazonaws.com/battletris-server:tag"
```

Notes:
- You must build/push the image to ECR before App Runner can deploy it.
- Target architecture is informational here; use it when building images.
