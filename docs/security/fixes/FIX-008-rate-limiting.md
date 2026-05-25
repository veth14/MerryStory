# FIX-008 Public endpoint rate limiting

- Date: 2026-05-25
- Status: Completed
- Risk: Medium

## Summary
Added per-IP rate limiting for public and sensitive endpoints.

## Files Changed
- src/lib/rate-limit.ts
- src/app/api/auth/password-reset/route.ts
- src/app/api/contact/route.ts
- src/app/api/contacts/inquiry/route.ts
- src/app/api/rsvp/route.ts
- src/app/api/rsvp/validate/route.ts
- src/app/api/contracts/review/[token]/verify/route.ts

## Diff Summary
- Added in-memory rate limiter with 429 + Retry-After headers.
- Applied to password reset, contact, RSVP, and contract verification flows.

## Validation
- Not run
