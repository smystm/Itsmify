# Employee & IT-Asset Management — Implementation Report

Date: 2026-10-22

## 1. Scope

This change adds employee administration and IT asset management to the existing
ITSMIFY application without replacing authentication or importing spreadsheet
data. The source workbooks were used as field references only. Existing PostgreSQL
rows and the existing username/password flow are preserved.

Delivered areas:

1. Organizational employee profiles alongside the existing account identity.
2. Employee directory, create/edit, profile, role/status, password reset and
   soft-delete workflows.
3. Hardware, software and network asset registration and editing.
4. Assignment and return with built-in history and concurrency protection.
5. Asset detail view with technical specifications, parent/components,
   assignment history and maintenance/operation/inspection records.
6. Real role-aware dashboard metrics and shortcuts.
7. Self-service organizational profile and assigned-assets view.
8. Persian labels, RTL layout, responsive tables/cards, loading/empty/success/
   validation/error states, and Jalali date presentation.

## 2. Architecture

### Identity and employees

- `User` remains the authentication identity. Names, username, phone, role,
  status and credentials are not duplicated.
- `EmployeeProfile` is a 1:1 extension containing personnel code, national ID,
  job title, employment type, hire date, notes, organizational unit and location.
- Existing users were backfilled with one profile row by an additive migration.
- Employee creation is administrator-only. There is no public registration.
- Deletion is a soft delete. It is rejected while the employee has open asset
  assignments; sessions are revoked and an audit row is written.

### Assets

- `Asset` holds common fields: code, name, category, type, brand, model, serial,
  status, organization/location, parent asset and notes.
- Details are split by category:

| Table | Fields represented |
| --- | --- |
| `ComputerDetail` | system type, motherboard, CPU, RAM, storage, GPU, case, PSU, DVD/speaker flags, monitor info, OS, Office, system/automation usernames |
| `MonitorDetail` | size, panel type, resolution |
| `PeripheralDetail` | connection type, printer type, cartridge, speaker type |
| `NetworkDetail` | IP, NetBox title, hostname, MAC, network type, port |
| `SoftwareDetail` | vendor, version, edition, license type, seat count, expiry, install date |

- `AssetAssignment` is append-only. `returnedAt IS NULL` means the assignment is
  open. A partial unique index enforces at most one open assignment per asset.
- `AssetMaintenance`, `AssetOperation` and `AssetInspection` are additive
  foundations for future maintenance and visit workflows.
- Asset codes use a PostgreSQL sequence (`AST-00001` style). Serial numbers are
  indexed but not unique because the reference data repeats serial values.

## 3. Migrations

Applied additive migrations:

1. `prisma/migrations/20261022073541_employees_assets`
   - Employee/organization tables and enums.
   - Asset, category-detail, assignment, maintenance, operation and inspection
     tables.
   - Asset code sequence and defaults.
   - Partial unique index for open assignments.
   - Backfill of `EmployeeProfile` rows for existing users.
2. `prisma/migrations/20261022120000_assignment_return_note`
   - Separate `returnNote` column for return notes.

No table was dropped or reset. Existing baseline after verification: 5 users,
5 employee profiles, 0 assets, 9 audit rows.

## 4. API surface

All routes authenticate on the server and check the required action:

| Method and route | Capability |
| --- | --- |
| `GET /api/admin/overview` | `admin.users.read` or `equipment.read` |
| `GET /api/admin/users` | `admin.users.read` |
| `POST /api/admin/users` | `admin.users.create` |
| `GET /api/admin/users/[id]` | `admin.users.read` |
| `PATCH /api/admin/users/[id]` | `admin.users.update` |
| `DELETE /api/admin/users/[id]` | `admin.users.delete` |
| `POST /api/admin/users/[id]/password` | `admin.users.password` |
| `POST /api/admin/users/[id]/status` | `admin.users.update` |
| `GET /api/admin/employees/lookup` | `equipment.read` |
| `GET /api/admin/employees/options` | `admin.users.read` or `equipment.read` |
| `GET /api/admin/assets` | `equipment.read` |
| `POST /api/admin/assets` | `equipment.write` |
| `GET /api/admin/assets/[id]` | `equipment.read` |
| `PATCH /api/admin/assets/[id]` | `equipment.write` |
| `DELETE /api/admin/assets/[id]` | `equipment.delete` |
| `POST /api/admin/assets/[id]/assign` | `equipment.write` |
| `POST /api/admin/assets/[id]/return` | `equipment.write` |
| `GET /api/admin/assets/options` | `equipment.read` |

Validation is performed by shared Yup schemas on the server. Multi-record
employee creation, asset creation/editing, assignment replacement and return all
run in transactions. Assignment/return first locks the asset row with
`SELECT ... FOR UPDATE` and then checks the open assignment.

## 5. UI routes

- `/admin` — real metrics, recent employees/assets, distribution bars and quick
  actions. IT roles only see the asset section.
- `/admin/employees` — list/search/filter/sort/pagination, actions.
- `/admin/employees/new`, `/admin/employees/[id]/edit` — employee form.
- `/admin/employees/[id]` — account, organizational, assets, audit and actions.
- `/admin/assets` — responsive inventory table/cards, filters and actions.
- `/admin/assets/new`, `/admin/assets/[id]/edit` — category-aware asset form.
- `/admin/assets/[id]` — specifications, current assignee, components, history,
  maintenance/operations/inspections.
- `/panel/profile` — identity, organization, assigned assets, phone and security.
- `/admin/users` redirects to `/admin/employees` for compatibility.

Navigation is permission-aware. The admin layout admits roles with employee or
asset access; each route still enforces its own capability.

## 6. Field mapping from reference workbooks

The workbooks were not imported. The mapping below records how their columns were
interpreted for the schema and forms.

### `darai.xlsx` — asset register

| Source concept | Destination |
| --- | --- |
| Asset code / identifier | `Asset.assetCode` (generated when missing) |
| Name, category, type, brand, model, serial | `Asset` common columns |
| Room / organizational text | `OrgUnit` and `Location` |
| Assigned person | `AssetAssignment` to `EmployeeProfile` |
| Computer hardware columns | `ComputerDetail` |
| Monitor columns | `MonitorDetail` or a child monitor `Asset` |
| Printer/scanner/keyboard/mouse/speaker columns | `PeripheralDetail` |
| IP, hostname, MAC, port, NetBox title | `NetworkDetail` |
| Software name, vendor, version, license, seats, dates | `SoftwareDetail` |
| System/automation passwords (source columns AX/BF) | Deliberately not stored; future encrypted vault |
| Parent device / peripheral relationship | `Asset.parentAssetId` |

Wide source rows that combine a computer with a monitor or peripherals are
represented as a parent computer plus child assets where appropriate.

### `export (4).xlsx` — visit log

This workbook is a visit/inspection log, not an employee export. Its concepts map
to `AssetInspection`: visit date, visit type, health percentage, days of
operation, temperature and description, linked to the visited asset. The
technician/employee reference maps to `EmployeeProfile` where available.

### `amaliyatHaye Fard.xlsx` — operations

Operation records map to `AssetOperation`: operation type, performed-at date,
description and optional employee. These are foundations; no automatic import
was performed.

## 7. Verification record

Executed and passed:

```text
npm run typecheck          PASS
npm run lint               PASS
npm run build              PASS (30 routes generated)
npx prisma validate        PASS
npx prisma migrate status  PASS (4 migrations, up to date)
```

API smoke test: **27 assertions passed, 0 failed**, including:

- admin overview and filtered employee search;
- employee creation and duplicate-username rejection;
- assigned-asset creation, detail specs and history;
- duplicate asset-code rejection;
- employee deletion blocked while an asset is assigned;
- asset deletion blocked while assigned;
- return, reassignment, second return, then deletion;
- employee sign-in, forced password change and self-service profile rendering
  with organizational data and the assigned asset;
- deleted employee sign-in rejection;
- IT specialist denied employee-directory access, allowed asset read/write and
  denied asset deletion;
- IT specialist overview returns only the asset section.

The smoke-test accounts, assets, assignments and temporary organizational rows
were removed. Baseline counts were restored to 5 users, 5 profiles, 0 assets, 9
audit rows and 0 assignments.

## 8. Known limitations and follow-ups

- Date inputs remain native Gregorian inputs for unambiguous ISO submission.
  Display dates use the Persian/Jalali calendar explicitly.
- Maintenance, operation and inspection data are visible on the asset detail
  page and have database foundations, but dedicated create/edit forms are future
  work.
- Source plaintext system/automation passwords were intentionally excluded. An
  encrypted credential vault and a reviewed import workflow should be designed
  separately.
- A bulk Excel importer was intentionally not built; data should be reviewed and
  mapped through an explicit import flow in a future task.
