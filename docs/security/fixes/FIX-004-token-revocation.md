# FIX-004 Token revocation enforcement

- Date: 2026-05-25
- Status: Completed
- Risk: Low

## Summary
Enabled Firebase token revocation checks during authentication.

## Files Changed
- src/lib/auth/guards.ts

## Diff Summary
- `verifyIdToken` now called with `checkRevoked = true`.

## Validation
- Not run
