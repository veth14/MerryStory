# FIX-005 Security headers and CSP

- Date: 2026-05-25
- Status: Completed
- Risk: Medium

## Summary
Added baseline security headers and CSP across all routes, with HSTS in production.

## Files Changed
- next.config.mjs

## Diff Summary
- Added CSP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy.
- Added HSTS in production only.

## Validation
- Not run
