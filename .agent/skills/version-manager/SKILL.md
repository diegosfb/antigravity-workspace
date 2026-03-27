---
name: version-manager
description: Automates version incrementing and build date updates before every commit or deployment.
---

# Version Manager Skill

## When to use this skill
- **MANDATORY**: Before every `git commit`.
- **MANDATORY**: Before every deployment (`aws-deploy`, `gcp-deploy`, `render-deploy`).
- When specifically requested to increment the version.

## How to use it
1.  **Run the bump script**: Execute `npx tsx scripts/bump-version.ts`.
2.  **Verify updates**: 
    - Check `package.json` for the incremented version.
    - Check `src/App.tsx` for the updated version and build date.
3.  **Commit the changes**: Stage and commit the updated files alongside your code changes.

## Operational Guardrails
- **Sync required**: Always ensure `package.json` and `src/App.tsx` are in sync.
- **Pre-commit**: This skill must be invoked *before* staging files to ensure the version bump is part of the atomic commit.
- **Non-interactive**: The script runs non-interactively to maintain workflow speed.
