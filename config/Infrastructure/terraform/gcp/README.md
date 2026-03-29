# GCP Cloud Run Terraform

This stack provisions:
- Artifact Registry repository
- Cloud Run service

It reads project, region, and target architecture from `config/Infrastructure/gcp.yaml`.

## Usage

```bash
cd config/Infrastructure/terraform/gcp
terraform init
terraform apply -var="image_uri=us-central1-docker.pkg.dev/bettertris/cloud-run-source-deploy/battletris-server:tag"
```

Notes:
- Build and push the image to Artifact Registry before applying.
- Target architecture is informational here; use it during image builds.
