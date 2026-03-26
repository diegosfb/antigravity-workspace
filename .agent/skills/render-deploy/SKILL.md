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
1.  **Repository Sync**: Ensure all local changes are pushed to the GitHub repository connected to Render.
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
