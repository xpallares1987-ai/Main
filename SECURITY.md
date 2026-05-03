# Security Policy

## Supported Versions

Currently, only the latest version of the Control Tower monorepo is supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| Main    | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a potential security vulnerability, please report it privately by contacting the repository owner at `x.pallares1987@gmail.com`. You can expect an initial response within 48 hours.

## Data Anonymization Mandate (Privacy First)

This project follows a strict **Brand Anonymization Policy**. 
- Automated masking is implemented in `@repo/shared` to prevent the exposure of third-party brand names (e.g., SAICA, EL BURGO).
- Our **Gemini AI Auditor** is trained to reject any Pull Request containing raw brand references.
- If you find unmasked sensitive data, please report it as a high-priority security issue.

## Security Audits

The codebase undergoes automated audits via:
1. **GitHub CodeQL:** For static analysis and pattern matching.
2. **Gemini Intelligence Audit:** For semantic analysis of anonymization and logic flaws.
3. **Dependabot:** For supply chain vulnerability monitoring.
