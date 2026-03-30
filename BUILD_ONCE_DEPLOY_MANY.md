# Build Once, Deploy Many

This project uses a **build-once, deploy-many** artifact strategy to improve provenance, rollback, and reproducibility across environments.

## Why
Building from source during deployment can produce inconsistent artifacts and makes rollback harder. Building **once** and deploying **the same image tag** to every environment provides:

- **Deterministic releases** (same bits everywhere)
- **Fast rollbacks** (redeploy previous tag)
- **Clear provenance** (environment → exact tag)

## How It Works

1. **Build once** on release tags
   - On every git tag like `v2.7.15`, CI builds the Docker image **once** and pushes it to:
     - AWS ECR
     - GCP Artifact Registry

2. **Deploy by tag**
   - Deploy workflows only **reference the tag**; they do not rebuild.
   - This keeps all environments aligned on the same artifact.

3. **Rollback by redeploying a tag**
   - If a deployment fails, redeploy the previous tag.

## Required Secrets (CI)
The build workflow expects these GitHub secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `GCP_SERVICE_ACCOUNT_JSON` (service account key with Artifact Registry access)

## Process (Recommended)

1. **Release**
   - Run the build-version flow (or tag manually).
   - Tag example: `v2.7.15`

2. **Build artifacts** (CI)
   - The workflow `.github/workflows/build-artifacts.yml` runs on tag pushes.
   - It builds and pushes Docker images with the same tag.

3. **Deploy**
   - Run the `Deploy` workflow and pass `version_tag` (or let it default to latest tag).

4. **Rollback**
   - Re-run deploy with the previous tag.

## Local Build (Optional)
You can build and push artifacts locally (same as CI):

```bash
./scripts/build-artifacts.sh v2.7.15
```

## Notes
- Cloud Run deployments now use `--image` (not `--source`).
- App Runner deployments update the service to the specified image tag.
