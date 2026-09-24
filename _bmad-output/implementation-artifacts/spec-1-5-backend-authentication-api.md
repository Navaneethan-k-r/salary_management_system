---
title: 'Story 1.5: Backend Authentication API'
type: 'feature'
created: '2026-09-24'
status: 'done'
baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The frontend HR Admin interface has been built and requires a secure, functioning backend to verify user credentials and establish a session. Currently, it relies on a frontend mock adapter. Additionally, there is no signup page for HR admins, so a seeded admin account is needed.

**Approach:** Initialize the `service-employee` NestJS backend application if it doesn't exist. Implement the REST API auth controller to handle POST `/api/auth/login`. Verify HR admin credentials against the MySQL database. Insert seeded HR admin data (email: admin@salarymgmt.com, password: admin123) via database migration. Use the `shared-auth` library to generate opaque tokens and store sessions in Redis.

## Boundaries & Constraints

**Always:**
- Must be implemented as a NestJS REST API backend application.
- Must use the existing `shared-auth` library for token generation and Redis session storage.
- Must seed initial HR admin data (email: admin@salarymgmt.com, password: admin123) in a database migration.

**Never:**
- No user registration endpoint is built in this story.
- No frontend changes are made other than updating the mock adapter to `false`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful Login | POST `/api/auth/login` with correct seeded credentials | Returns `{ token: "opaque-token" }`, stores session in Redis | N/A |
| Invalid Credentials | POST `/api/auth/login` with wrong password | Returns 401 Unauthorized | Return generic "Invalid credentials" |
| Non-existent User | POST `/api/auth/login` with unknown email | Returns 401 Unauthorized | Return generic "Invalid credentials" |
| Validation Error | POST `/api/auth/login` missing email or password | Returns 400 Bad Request | Return validation error details |

**Decisions:**
- ORM Choice: TypeORM will be used for database access and migrations.
- Backend Initialization: The `service-employee` NestJS backend application will be generated as part of this story.

</frozen-after-approval>

## Code Map

- `package.json` -- Needs updates to install `@nx/nest`, ORM packages (e.g. `typeorm`, `mysql2` or `prisma`), and redis packages (`ioredis`).
- `apps/service-employee/` -- The NestJS application to be generated.
- `apps/service-employee/src/auth/` -- Auth module, controller, and service.
- `apps/frontend-web/src/services/authService.ts` -- Needs to have mock adapter updated to `false`.
- `libs/shared-auth/src/session-store.ts` -- Reused for Redis storage types/interfaces.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- Install NestJS Nx plugin, ORM, and Redis dependencies.
- [x] `workspace` -- Generate `service-employee` NestJS application using Nx.
- [x] `apps/service-employee/src/database/` -- Setup ORM connection and HR Admin entity/schema.
- [x] `apps/service-employee/migrations/` -- Create migration to create HR Admin table and insert seeded data.
- [x] `apps/service-employee/src/auth/` -- Implement `AuthController` for login and `AuthService` for credential verification and token generation using `shared-auth`.
- [x] `apps/frontend-web/src/services/authService.ts` -- Update `USE_MOCK_AUTH` to `false` (or equivalent config) to connect to real backend.

**Acceptance Criteria:**
- Given the system is running, when a local POST request is made to `/api/auth/login` with `admin@salarymgmt.com`/`admin123`, then an opaque token is returned and successfully resolves to an active session in the Redis store.
- Given the database is migrated, the HR admin table exists and contains the seeded admin record.

## Implementation Notes

- Nx generator for `@nx/nest` was getting stuck fetching packages, so the `service-employee` basic structure (project configs, tsconfigs, main.ts, modules) was scaffolded manually.
- Installed `typeorm`, `mysql2`, `@nestjs/typeorm`, `ioredis`, `@nestjs-modules/ioredis`.
- Created TypeORM database module and `HrAdmin` entity.
- Created `1700000000000-SeedHrAdmin.ts` migration to insert seeded data.
- Created AuthController and AuthService. AuthService compares credentials and generates a token utilizing `crypto` and `RedisSessionStore` from `@salary-mgmt/shared-auth`.
- Updated `authService.ts` on the frontend to disable the mock adapter. Also adjusted it to return the API response directly since our backend returns `{ token }` rather than `{ data: { token } }`.
- Added a Vite proxy configuration to route `/api` to `http://localhost:3333` (the backend NestJS server).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence | Route |
|---------|---------|----------|-------|
| `auth.module.ts` and `auth.controller.ts` Cannot find module './auth.service' | false | Both `auth.service.ts` and the importing files exist in the same directory, and the import uses standard TypeScript resolution. Likely a transient IDE sync issue. | patch (rejected) |
| `auth.service.ts` missing properties on `UserSession` | high | `UserSession` interface strictly requires `token`, `createdAt`, and `expiresAt` which were omitted, breaking TS compilation. | patch |
| `1700000000000-SeedHrAdmin.ts` Cannot find module 'uuid' | high | The migration imports `uuid` but the package and its types are not installed in `package.json`. | patch |

## Verification

**Commands:**
- `nx serve service-employee` -- expected: API starts successfully.
- `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@salarymgmt.com","password":"admin123"}'` -- expected: Returns 200 OK with token.
