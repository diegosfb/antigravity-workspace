# CI Workflows

This folder contains GitHub Actions workflows used to validate and secure the project on every push and pull request.

## Why this exists
- **Consistency**: Ensure linting and builds run the same way for every change.
- **Security**: Catch dependency vulnerabilities and accidental secret leaks early.
- **Stability**: Prevent breaking changes from landing in `main` without validation.

## What it does
The `ci.yml` workflow runs four jobs:

1. **Lint and Build**
   - Installs dependencies, runs TypeScript lint checks, and builds the project.
2. **Dependency Audit**
   - Runs `npm audit --production` to flag known vulnerabilities.
3. **Secret Scan**
   - Uses TruffleHog to detect potential secrets in the repo history and the current commit.
4. **Dependency Review** (PRs only)
   - Uses GitHub’s dependency review action to detect risky dependency changes.

## How to use it
- **Automatic**: The workflow runs on every push to `main` and every pull request targeting `main`.
- **Manual trigger**: You can also re-run a workflow from the GitHub Actions UI:
  1. Go to the repository on GitHub
  2. Click the **Actions** tab
  3. Select **CI**
  4. Click **Re-run jobs**

## Notes
- If the secret scan finds a leak, treat it as a real incident: revoke the key and rotate credentials.
- If `npm audit` fails on a false positive, document it and consider suppressing it explicitly with a policy tool.
