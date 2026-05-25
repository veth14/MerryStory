# FIX-002 Admin API RBAC enforcement

- Date: 2026-05-25
- Status: Completed
- Risk: Critical

## Summary
Enforced admin-only access on key admin API routes.

## Files Changed
- src/app/api/admin/vendors/route.ts
- src/app/api/admin/contracts/route.ts
- src/app/api/admin/contracts/[id]/route.ts
- src/app/api/admin/contracts/pipeline/route.ts
- src/app/api/admin/documents/route.ts
- src/app/api/admin/documents/[id]/pdf/route.ts
- src/app/api/admin/event-day/route.ts

## Diff Summary
- Replaced `requireAuthenticatedUser` with `requireRole(['admin'])`.

## Validation
- Not run
