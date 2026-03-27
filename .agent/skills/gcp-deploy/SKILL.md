---
name: gcp-deploy
description: Automates the deployment of the 'battletris-server' to Google Cloud Run, ensuring the environment is authenticated and the correct project is targeted.
---

# GCP Deploy Skill

## When to use this skill
- After passing all local tests and `@security-auditor` checks.
- When the code is ready for staging or production on Google Cloud Platform.
- To refresh the active deployment of the `battletris-server`.

## How to use it
1.  **Preparation**: Ensure the current working directory is `/Users/diego.brihuega/Documents/Projects/BattleTris/BetterTris-v2`.
2.  **Authentication**: 
    - Check if authenticated: `gcloud auth list`.
    - If not authenticated, run: `gcloud auth login`.
3.  **Project Context**:
    - Set the active project: `gcloud config set project bettertris`.
4.  **Deployment Execution**:
    - Run the primary deployment command:
      `gcloud run deploy battletris-server --source . --region us-central1 --allow-unauthenticated`
5.  **Verification**: 
    - Monitor the output for the Service URL.
    - Confirm the service is "Ready" and traffic is routed 100% to the new revision.

## Operational Guardrails
- **Pre-check**: Verify the existence of a `Dockerfile` or valid buildpack source before initiating `gcloud run deploy`.
- **Environment**: Ensure the agent is running in a shell environment where the `gcloud` SDK is installed and accessible.
- **Port Matching**: Cloud Run injects a `PORT` environment variable (default `8080`). Ensure `server.ts` reads `process.env.PORT` — it already does.
- **Platform Architecture**: If building a local Docker image to push to Artifact Registry (instead of `--source .`), always use `--platform linux/amd64`. With `--source .`, Cloud Build handles this automatically.
