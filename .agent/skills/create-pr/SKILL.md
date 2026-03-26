---
name: create-pr
description: Automates the process of packaging completed work into a professional, well-documented Pull Request. It summarizes changes, links issues, and ensures all quality checks pass.
---

# Create PR Skill

## When to use this skill
- After a feature, bug fix, or refactor is complete and verified.
- When the code is ready for human or peer-agent review.
- To maintain a high-quality, searchable git history.

## How to use it
1.  **Analyze Diffs**: Run `git diff` against the base branch (usually `main` or `develop`) to identify all changed files and logic.
2.  **Verify Quality**: Ensure `@lint-and-validate` and relevant test suites have passed.
3.  **Generate Metadata**:
    - **Title**: Create a concise, conventional commit style title (e.g., `feat: add oauth2 provider`).
    - **Description**: Summarize *what* changed and *why*.
    - **Type of Change**: Label as Breaking, Feature, Fix, or Docs.
4.  **Draft PR Body**: Use a structured template:
    - **Summary**: High-level overview.
    - **Technical Details**: Specific logic changes or new dependencies.
    - **Testing**: List of tests run and their outcomes.
    - **Screenshots/Logs**: (If applicable) Evidence of the fix/feature working.
5.  **Execution**: Use the `gh` CLI or git commands to push the branch and open the PR.

## PR Template Configuration
Always default to the project's `.github/PULL_REQUEST_TEMPLATE.md` if it exists.
