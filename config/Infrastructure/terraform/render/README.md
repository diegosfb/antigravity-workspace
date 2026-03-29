# Render Terraform

This stack provisions a Render web service.

It reads defaults from `config/Infrastructure/render.yaml` (service name, build/start commands) and expects repo/branch via variables.

## Usage

```bash
cd config/Infrastructure/terraform/render
terraform init
terraform apply -var="render_api_key=..." -var="repo=https://github.com/your-org/your-repo"
```
