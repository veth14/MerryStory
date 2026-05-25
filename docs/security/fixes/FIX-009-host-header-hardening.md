# FIX-009 Host header injection hardening

- Date: 2026-05-25
- Status: Completed
- Risk: Medium

## Summary
Generated absolute RSVP links using configured base URL instead of request headers.

## Files Changed
- src/app/api/rsvp/rsvpFlow.ts

## Diff Summary
- Replaced host header usage with `PUBLIC_BASE_URL` requirement.

## Validation
- Not run
