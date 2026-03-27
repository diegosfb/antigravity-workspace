---
name: render-deploy
description: Automates the setup and deployment process for Render.com using Blueprint (Infrastructure-as-Code) logic. It ensures the repository is correctly linked to a `render.yaml` configuration.
---

# Render Deploy Skill

## When to use this skill
- When you need a quick, managed HTTPS deployment via GitHub integration.
- After updating the `render.yaml` file in the root directory.
- To set up a new environment (Staging/Prod) using Render Blueprints.

## How to use it
- **Render**:
    - Ensure code is pushed. Render auto-deploys on push to the linked branch.
    - Confirm the deployment status on the Render dashboard for `battletris-server`.
    - Production URL: `https://battletris-server.onrender.com/`
2.  **Blueprint Verification**: 
    - Check for the existence of `render.yaml` in the root folder.
    - Validate that the `services` and `envVars` in the YAML match the project needs.
3.  **Deployment Workflow**:
    - **Step 1**: Direct the user to [dashboard.render.com](https://dashboard.render.com).
    - **Step 2**: Instruct the user to select **"New" > "Blueprint"**.
    - **Step 3**: Connect the `BetterTris-v2` repository.
    - **Step 4**: Set the Blueprint Name to `BattleTris-Server`.
    - **Step 5**: Confirm the Blueprint path is set to `./render.yaml`.
4.  **Verification**: 
    - Monitor the Render Dashboard for the build logs.
    - Capture the generated `onrender.com` URL once the service status is "Live".

## Operational Guardrails
- **Sync First**: Always remind the user to run `git push` before triggering the Blueprint, as Render pulls directly from the remote branch.
- **YAML Validation**: If `render.yaml` is missing, offer to generate a standard one for a Node.js/Web Service before directing the user to the dashboard.
- **Port Matching**: Render injects a `PORT` environment variable at runtime. Ensure `server.ts` reads `process.env.PORT` (it already does). Do NOT hardcode a port in `render.yaml`.
- **Architecture**: No local build step needed — Render builds from source on its own `linux/amd64` infrastructure, so the ARM64 issue does not apply here.
