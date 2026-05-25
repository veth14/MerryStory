# FIX-006 Core API RBAC enforcement

- Date: 2026-05-25
- Status: Completed
- Risk: High

## Summary
Restricted core domain APIs to `admin` and `coordinator` roles.

## Files Changed
- src/app/api/events/route.ts
- src/app/api/tasks/route.ts
- src/app/api/vendors/route.ts
- src/app/api/vendors/[id]/route.ts
- src/app/api/staffs/route.ts

## Diff Summary
- Replaced `requireAuthenticatedUser` with `requireRole(['admin', 'coordinator'])`.

## Validation
- Not run
