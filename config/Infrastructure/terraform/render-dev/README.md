# Render Terraform (Dev)

This stack provisions a Render web service using values from `config/Infrastructure/render-dev.yaml`.

## Usage

```bash
cd config/Infrastructure/terraform/render-dev
terraform init
terraform apply -var="render_api_key=..."
```
