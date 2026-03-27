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

### Phase 3: Integration (Merge to Main)
5.  **Merge to Main**: Before tagging and deploying, ensure the branch is merged into `main`:
    ```bash
    git checkout main
    git pull origin main --rebase
    git merge <feature-branch>
    git push origin main
    ```

### Phase 4: Git Tagging
6.  **Tag Version**: Create a git tag on the `main` branch:
    ```bash
    git tag -a v<version> -m "Release v<version>"
    git push origin main --tags
    ```

### Phase 5: Multi-Cloud Deployment
7.  **Deploy to GCP**: Invoke `@gcp-deploy` (Ensure you are on `main`).
8.  **Deploy to AWS**: Invoke `@aws-deploy` (Ensure you are on `main`).
9.  **Deploy to Render**:
    - Ensure code is pushed to `main`. Render auto-deploys from `main`.
    - Confirm the deployment status on the Render dashboard for `battletris-server`.
    - Production URL: `https://battletris-server.onrender.com/`

## Operational Guardrails
- **Atomic Release**: All steps must be successfully completed for a "successful" release.
- **Tag Matching**: Ensure the git tag exactly matches the version in `package.json`.
- **Architecture Check**: Remember to build with `--platform linux/amd64` for AWS/GCP if building locally.
