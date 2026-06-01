# Security Policy

## Supported versions

Only the latest version on `main` is actively supported.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues by email to **scruzzimattia@gmail.com**. Include:

- A description of the vulnerability and its potential impact
- Steps to reproduce
- Any suggested fixes or mitigations

You can expect an acknowledgement within 48 hours and a fix or timeline within 7 days for confirmed issues.

## Scope

This is a client-side web app. Relevant areas include:

- Credential handling (Jellyfin tokens stored in `localStorage`)
- CORS configuration
- Dockerfile / image security
- Dependency vulnerabilities (please also open a Dependabot alert if applicable)

Out of scope: issues with Jellyfin or Tracearr themselves — report those to their respective projects.
