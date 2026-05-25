# FIX-011 Local secrets handling

- Date: 2026-05-25
- Status: Completed
- Risk: Critical

## Summary
Moved local secrets into a local-only env file and added a safe template.

## Files Changed
- .env.local
- .env.example

## Diff Summary
- Moved `.env` to `.env.local` for local development.
- Added `.env.example` with placeholder values.

## Validation
- `npm run build` (success)
