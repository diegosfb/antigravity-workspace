---
name: config-manager
description: Securely manages and retrieves environment variables, AWS ARNs, GCP Project IDs, and other sensitive deployment configurations without hardcoding them into the codebase.
---

# Config Manager Skill

## When to use this skill
- Before running `@aws-deploy` or `@gcp-deploy` to fetch required IDs.
- When setting up a new local environment (`.env` files).
- To prevent leaking sensitive resource names or account IDs in logs/chat.

## How to use it
1.  **Retrieve Secret**: Pull values from a local `.env.enc` (encrypted) or a cloud provider (AWS Secrets Manager / GCP Secret Manager).
    - *Example*: `aws secretsmanager get-secret-value --secret-id BattleTrisConfig`
2.  **Inject Variables**: Map retrieved values to the active shell environment so subsequent skills (like `@aws-deploy`) can use them as `$APP_RUNNER_ARN` or `$AWS_ACCOUNT_ID`.
3.  **Validate Config**: Ensure all required keys for a specific environment (Dev/Prod) are present before proceeding with a deployment.
4.  **Audit**: List keys currently "in-memory" for the agent without displaying their actual values (e.g., "AWS_ACCOUNT_ID: [LOADED]").

## Security Guardrails
- **MASKING**: Always redact sensitive values in the chat output.
- **NO HARDCODING**: If a value is missing, prompt the user to provide it via a secure input rather than guessing or saving it in plain text.
- **CLEANUP**: Unset sensitive environment variables once the deployment task is completed.
