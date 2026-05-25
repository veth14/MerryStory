# FIX-010 HTML email output escaping

- Date: 2026-05-25
- Status: Completed
- Risk: Medium

## Summary
Escaped user-controlled values in contact and RSVP HTML emails.

## Files Changed
- src/lib/sanitize.ts
- src/app/api/contacts/contactInquiry.ts
- src/app/api/contact/route.ts
- src/app/api/rsvp/rsvpFlow.ts
- src/app/api/rsvp/route.ts

## Diff Summary
- Added HTML escaping helpers and applied them to email templates.

## Validation
- Not run
