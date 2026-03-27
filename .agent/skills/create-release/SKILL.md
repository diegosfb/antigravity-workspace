---
name: create-release
description: Orchestrates a full production release: runs tests, increments minor version, commits, tags, and deploys to GCP, AWS, and Render.
---

# Create Release Skill

## When to use this skill
- Use this when a new significant set of features or a stable milestone is reached.
- When the user specifically requests a "release".

## How to use it

### Phase 1: Verification
1.  **Run Quality Checks**: Execute `npm run lint`.
2.  **Run Tests**: (If tests are available).

### Phase 2: Versioning & Documentation
3.  **Perform Minor Bump**: Execute `npx tsx scripts/bump-version.ts minor`.
    - This will increment the middle version (e.g., 2.1.1 -> 2.2.0) and update the build date.
4.  **Confirm Changes**: Verify `package.json` and `src/App.tsx`.

### Phase 3: Git Operations
5.  **Commit Release**: Stage and commit with the prefix `[RELEASE]`:
    ```bash
    git add .
    git commit -m "[RELEASE] v<version>: <summary of changes>"
    ```
6.  **Tag Version**: Create a git tag:
    ```bash
    git tag -a v<version> -m "Release v<version>"
    ```
7.  **Push**: `git push origin <branch> --tags`.

### Phase 4: Multi-Cloud Deployment
8.  **Deploy to GCP**: Invoke `@gcp-deploy`.
9.  **Deploy to AWS**: Invoke `@aws-deploy`.
10. **Deploy to Render**:
    - Ensure code is pushed (Step 7). Render auto-deploys on push.
    - Confirm the deployment status on the Render dashboard.

## Operational Guardrails
- **Atomic Release**: All steps must be successfully completed for a "successful" release.
- **Tag Matching**: Ensure the git tag exactly matches the version in `package.json`.
- **Architecture Check**: Remember to build with `--platform linux/amd64` for AWS/GCP if building locally.
