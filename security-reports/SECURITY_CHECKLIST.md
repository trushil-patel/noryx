# NoryX Security Audit

## Critical
- [ ] No critical vulnerabilities

## Authentication and authorization
- [ ] Protected APIs verify the user
- [ ] Users cannot read another user's data
- [ ] Users cannot modify another user's data
- [ ] Admin operations are server-only

## Secrets
- [ ] No secrets committed to Git
- [ ] Service-role key is server-only
- [ ] Exposed keys rotated

## Database
- [ ] RLS enabled on every public table
- [ ] SELECT policies tested
- [ ] INSERT policies tested
- [ ] UPDATE policies tested
- [ ] DELETE policies tested

## APIs
- [ ] Input validation
- [ ] Rate limiting
- [ ] Safe error responses
- [ ] Safe URL fetching
- [ ] CORS restricted

## Frontend
- [ ] Security headers
- [ ] CSP reviewed
- [ ] No unsafe HTML rendering
- [ ] No secrets in NEXT_PUBLIC variables

## Automated scans
- [ ] npm audit
- [ ] pip-audit
- [ ] Semgrep
- [ ] Gitleaks
- [ ] CodeQL
- [ ] OWASP ZAP

## Final
- [ ] Production build passes
- [ ] Tests pass
- [ ] Critical/high findings resolved
