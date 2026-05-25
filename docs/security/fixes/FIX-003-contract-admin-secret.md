# FIX-003 Contract admin access secret isolation

- Date: 2026-05-25
- Status: Completed
- Risk: High

## Summary
Removed email password fallback for admin contract access tokens.

## Files Changed
- src/lib/contract-review-access.ts

## Diff Summary
- Removed fallback to `EMAIL_PASS`.
- Enforced dedicated `CONTRACT_ADMIN_ACCESS_SECRET`.

## Validation
- Not run
