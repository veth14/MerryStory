# FIX-001 Seed endpoint protection

- Date: 2026-05-25
- Status: Completed
- Risk: Critical

## Summary
Restricted the seed endpoint to prevent unauthenticated admin overwrites and removed debug data exposure.

## Files Changed
- src/app/api/seed/route.ts

## Diff Summary
- Added `ALLOW_SEED` gate to disable the endpoint by default.
- Added `requireRole(['admin'])` to restrict access.
- Removed user dump from response.

## Validation
- Not run
