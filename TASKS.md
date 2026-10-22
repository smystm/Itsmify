# ITSMIFY — Employee & Asset Management Implementation Tracker

> This file is the resume point if the work is interrupted.
> Status values: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked.

Last updated: 2026-10-22

## Current phase

Phase 5 complete — employee/asset UI, authorization, dashboard, self-service
profile, Jalali display, documentation and verification are implemented.

## Completed

- [x] Inspected the existing authentication, Prisma schema, migrations, routes, UI and design tokens.
- [x] Inspected `export (4).xlsx`, `darai.xlsx`, `amaliyatHaye Fard.xlsx` and dashboard screenshots.
- [x] Confirmed `export (4).xlsx` is a visit log, not an employee export.
- [x] Preserved PostgreSQL, existing authentication, roles and existing data.
- [x] Agreed schema direction: User = auth identity; EmployeeProfile = 1:1 organizational profile; common Asset + category detail tables; assignment history; maintenance/operation/inspection foundations.

## Phase 2 — Database

- [x] Add employee/asset enums and models to `prisma/schema.prisma`.
- [x] Add relations to `User` and all indexes/unique constraints.
- [x] Create additive migration (no destructive changes).
- [x] Add asset-code sequence and partial unique index for one open assignment per asset.
- [x] Backfill `EmployeeProfile` for existing users.
- [x] Apply migrations and verify existing data counts are unchanged.
- [x] Run `prisma validate` and `prisma generate`.
- [x] Add additive `returnNote` column to assignment history (`20261022120000_assignment_return_note`).

Migrations: `prisma/migrations/20261022073541_employees_assets`, `prisma/migrations/20261022120000_assignment_return_note`.
Verified: 5 users, 5 profiles, 0 assets, 9 audit rows, 0 assignments; partial unique index present.

## Phase 3 — Employee management

- [x] Add employee validation schemas.
- [x] Add employee service layer (list/detail/create/update/delete/status, transactions, audit, guards).
- [x] Extend admin user APIs to include employee profile data.
- [x] Add employee lookup and shared option APIs for asset assignment.
- [x] Add admin employees list page with search/filter/sort/pagination.
- [x] Add employee create form with logical sections.
- [x] Add employee edit form.
- [x] Add employee profile page with account, organizational, assets and history sections.
- [x] Add account actions: reset password, suspend/activate, soft delete with guards.
- [x] Add `/admin/employees` pages and redirect `/admin/users`.
- [x] Add permission-aware navigation and broaden the admin layout gate.
- [x] Extend self-service `/panel/profile` with organizational data and assigned assets.

## Phase 4 — Asset management

- [x] Add asset validation schemas and shared option maps.
- [x] Add asset service layer (list/detail/create/update/delete/assign/return/stats/options).
- [x] Add asset CRUD APIs.
- [x] Add assignment/return APIs with row locking and one-open-assignment index.
- [x] Add asset list panel with search/filter/sort/pagination and assignment/return dialogs.
- [x] Add `/admin/assets` list route and server gate.
- [x] Add category-aware asset form (computer, monitor, peripheral, software, network).
- [x] Add asset create/edit pages.
- [x] Add asset detail page with assignee, technical specs, components and assignment history.
- [x] Add permission-aware admin navigation and route gates for IT roles.
- [x] Add maintenance/operation/inspection sections to asset detail.
- [x] Add parent/child asset support to the form and detail view.

## Phase 5 — Dashboard, polish and verification

- [x] Add real employee/asset metrics endpoint (`/api/admin/overview`).
- [x] Replace admin overview UI with real metrics and shortcuts.
- [x] Add loading, empty, success and error states to employee and asset screens.
- [x] Add responsive table/card behavior for employee and asset lists.
- [x] Add Persian translations for implemented employee/asset UI.
- [x] Add Jalali/Persian date presentation with explicit calendar formatting.
- [x] Run `prisma validate` and `prisma migrate status`.
- [x] Run `npm run typecheck`, `npm run lint`, `npm run build`.
- [x] Smoke-test authorization, duplicate prevention, assignment and return.
- [x] Update README with migration/startup commands.
- [x] Write final implementation report and field-mapping summary (`IMPLEMENTATION_REPORT.md`).

## Phase 6 — Focused UI polish pass

- [x] Fix password visibility-toggle overlap with LTR padding/direction.
- [x] Make wrapped labels align inputs consistently and move hints/errors below controls.
- [x] Distinguish employee panel and admin workspace with tone ribbons, tinted headers, sidebar accents and workspace chips.
- [x] Add subtle public-sector polish (auth ribbon, hero underline accent, form-card hover).
- [x] Run typecheck, lint and build after the polish pass.

## Verification summary

```text
npm run typecheck          PASS
npm run lint               PASS
npm run build              PASS
npx prisma validate        PASS
npx prisma migrate status  PASS (up to date)
API smoke test             27 passed, 0 failed
```

Smoke coverage included admin/IT/employee authorization boundaries,
duplicate username and asset-code rejection, assigned-asset deletion guards,
return/reassign/return flows, soft deletion, forced password change, and the
self-service profile with assigned assets. Test data was removed; baseline data
counts are restored.

## Remaining optional follow-ups

- [ ] Build dedicated create/edit forms for maintenance, operations and inspections.
- [ ] Design an explicit, reviewed Excel import workflow (still no automatic import).
- [ ] Add an encrypted credential vault for secrets that were plaintext in the source.
- [ ] Consider a Persian/Jalali date picker while keeping ISO values on the wire.
- [ ] Add automated regression tests for the service layer and API routes.

## Decisions / notes

- Keep username/password authentication. Phone stays optional and OTP-verified for phone changes only.
- Do not store source plaintext system/automation passwords from `darai.xlsx`.
- Serial numbers are indexed but not unique because the reference repeats the same serial across devices.
- Asset codes are generated by a PostgreSQL sequence (`AST-00001` style).
- Employee deletion is blocked while assets are actively assigned.
- IT_SPECIALIST/IT_MANAGER get the asset module via existing `equipment.*` permissions; employee/account management stays SYS_ADMIN-only.
- Do not import Excel rows automatically.
- Dates are stored as ISO/Gregorian; display uses `fa-IR-u-ca-persian`.

## Resume instructions

1. Read this file and `IMPLEMENTATION_REPORT.md`.
2. The core feature set is complete; continue with the optional follow-ups above.
3. Before stopping, update this file with completed items and the next exact step.
