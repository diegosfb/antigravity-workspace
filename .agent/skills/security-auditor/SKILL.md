---
name: security-auditor
description: A specialized skill for performing security-focused reviews. It scans for vulnerabilities, secret leaks, and insecure patterns before code is merged.
---

# Security Auditor Skill

## When to use this skill
- During the development of features handling sensitive data (PII, Auth, Payments).
- As a mandatory pre-check before using `@create-pr`.
- When integrating new third-party libraries or APIs.

## How to use it
1.  **Secret Scanning**: Scan all changed files for hardcoded API keys, tokens, or passwords (e.g., using `trufflehog` or `gitleaks` patterns).
2.  **Vulnerability Check**: Run dependency audits (e.g., `npm audit`, `pip-audit`, or `cargo audit`) to find known CVEs in new packages.
3.  **Static Analysis (SAST)**: Analyze the code for common CWEs:
    - **Injection**: SQL, Command, or NoSQL injection risks.
    - **Broken Auth**: Insecure session handling or weak hashing.
    - **XSS**: Improper sanitization of user input in the UI.
    - **IDOR**: Lack of object-level authorization checks.
4.  **Reporting**: Generate a "Security Status" table:
    - **Severity**: (Low/Medium/High/Critical)
    - **Issue**: Short description of the risk.
    - **Remediation**: Specific code change to fix it.

## Mandatory Guardrails
- **NEVER** log or output actual discovered secrets to the console/chat.
- **ALWAYS** fail the check if a high-severity vulnerability is found without a documented mitigation.
