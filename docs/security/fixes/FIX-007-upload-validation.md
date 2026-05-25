# FIX-007 Upload validation and size limits

- Date: 2026-05-25
- Status: Completed
- Risk: High

## Summary
Added MIME and extension allowlists with size limits for uploads.

## Files Changed
- src/lib/upload-validation.ts
- src/app/api/admin/documents/route.ts
- src/app/api/admin/contracts/route.ts
- src/app/api/admin/contracts/[id]/route.ts
- src/app/api/users/profile/avatar/route.ts
- src/app/api/events/route.ts

## Diff Summary
- Added `validateUpload` helper with allowlists and size caps.
- Applied validation to document, contract, avatar, and event cover uploads.

## Validation
- Not run
