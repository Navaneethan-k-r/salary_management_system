---
title: 'Story 1.3: Organization Profile Setup'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The system has no mechanism to configure or persist the managing organization's profile details (organization name, code, contact email, currency), preventing payroll and employee management from associating with an identified organization entity.

**Approach:** Implement the organization profile setup screen at `/admin/organization` with Material UI form validation and strict INR currency enforcement, supported by Redux client state management, direct REST endpoints in `service-employee`, and persistent MySQL database storage adhering to AD-1 and AD-2.

## Boundaries & Constraints

**Always:**
- Persist organization profile in shared MySQL database under `organizations` table per AD-1.
- Restrict currency strictly to `'INR'` with symbol `₹` per ARCHITECTURE-SPINE consistency conventions and PRD 3.3.
- Secure all organization setup endpoints with session token verification (`Authorization: Bearer <token>`) checking Redis session store per AD-3.
- Enforce DESIGN.md aesthetics: 24px container padding, `#f4f6f8` background, `#1976d2` primary color, flat elevation cards (`border: 1px solid #e5e7eb`, `border-radius: 12px`), and Inter/Roboto typography.
- Use MUI Skeleton loader during profile fetch and MUI Snackbar toast for save feedback.
- Render within the `AdminLayout` with `/admin/organization` added to the sidebar navigation.

**Never:**
- Do not support multi-currency or multi-tenant switching (strict single organization per PRD 3.3).
- Do not route requests through an API Gateway (violates AD-2: direct microservice invocation).
- Do not introduce heavy drop shadows or colored card elevations (violates flat design rules).
- Do not allow empty organization name, invalid email format, or non-alphanumeric organization code.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Initial Setup (Unconfigured) | HR Admin navigates to `/admin/organization` with no existing record | Form displays blank inputs with INR locked; helper prompt indicates initial setup required | Gracefully handles 404/null profile from API without crashing |
| Save Valid Profile | HR Admin enters valid Name, Code, and Email; clicks "Save Profile" | Dispatches save request, persists in MySQL, updates Redux store, displays success Snackbar "Organization profile saved successfully" | Disables submit button while loading to prevent duplicate submissions |
| Validation Errors | HR Admin submits form with empty Name, invalid Email, or empty Code | Form blocks submission, highlights erroneous fields with helper text (e.g., "Organization name is required", "Enter a valid email address") | Focuses first invalid field |
| Load Existing Profile | HR Admin navigates to `/admin/organization` after previous configuration | Form pre-populates existing Organization Name, Code, Contact Email, and displays last updated timestamp | Renders MUI Skeleton during fetch |
| Unauthorized Access | Unauthenticated user navigates to `/admin/organization` | ProtectedRoute intercepts request and redirects to `/login` | Retains redirect destination for post-login |
| Network / Server Failure | Backend fails or database connection drops during save | Inline error alert displayed on form: "Failed to save organization profile. Please try again." | Form inputs preserved for retry |

</frozen-after-approval>

## Code Map

- `libs/shared-types/src/index.ts` -- Shared DTO interfaces (`CreateOrganizationProfileDto`, `UpdateOrganizationProfileDto`).
- `apps/service-employee/src/database/schema.sql` -- MySQL schema definition and migration for `organizations` table.
- `apps/service-employee/src/organization/organization.dto.ts` -- Request validation DTOs for organization profile endpoints.
- `apps/service-employee/src/organization/organization.controller.ts` -- REST API controller exposing `GET /api/organization` and `PUT /api/organization`.
- `apps/service-employee/src/organization/organization.service.ts` -- Business logic and MySQL database persistence for organization profile.
- `apps/service-employee/src/organization/organization.service.spec.ts` -- Unit tests validating organization retrieval, validation, and persistence.
- `apps/frontend-web/src/services/organizationService.ts` -- Client API service for fetching and saving organization profile with mock and REST adapters.
- `apps/frontend-web/src/store/slices/organizationSlice.ts` -- Redux Toolkit slice managing organization state (profile, loading, error, save status).
- `apps/frontend-web/src/pages/OrganizationProfilePage.tsx` -- Material UI form view with inputs for Name, Code, Contact Email, fixed INR currency, and feedback toasts.
- `apps/frontend-web/src/pages/OrganizationProfilePage.spec.tsx` -- Unit tests verifying initial render, validation, save flow, and feedback alerts.
- `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Update navigation menu items to include `/admin/organization`.
- `apps/frontend-web/src/app/App.tsx` -- Register `/admin/organization` route within `AdminLayout`.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/index.ts` -- Add `CreateOrganizationProfileDto` and `UpdateOrganizationProfileDto` interfaces -- Establishes typed contract between frontend and backend.
- [ ] `apps/service-employee/src/database/schema.sql` -- Create MySQL table definition for `organizations` with constraints and indexes -- Implements AD-1 database persistence.
- [ ] `apps/service-employee/src/organization/organization.service.ts` & `apps/service-employee/src/organization/organization.controller.ts` -- Implement NestJS controller and service for `GET /api/organization` and `PUT /api/organization` -- Provides REST endpoints per CAP-1.
- [ ] `apps/service-employee/src/organization/organization.service.spec.ts` -- Unit tests verifying organization profile creation, update, and database retrieval -- Validates backend business logic and validation rules.
- [ ] `apps/frontend-web/src/services/organizationService.ts` -- Implement client organization service with mock and HTTP adapters -- Connects UI to backend API.
- [ ] `apps/frontend-web/src/store/slices/organizationSlice.ts` & `apps/frontend-web/src/store/index.ts` -- Implement Redux Toolkit slice and attach to store -- Manages organization profile state.
- [ ] `apps/frontend-web/src/pages/OrganizationProfilePage.tsx` -- Build organization setup page with MUI form controls, INR badge, Skeleton loader, and Snackbar notification -- Delivers HR organization profile UI.
- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` & `apps/frontend-web/src/app/App.tsx` -- Add Organization navigation link and configure `/admin/organization` route -- Integrates view into admin navigation shell.
- [ ] `apps/frontend-web/src/pages/OrganizationProfilePage.spec.tsx` -- Implement unit tests for organization setup form, validation, loading skeletons, and save feedback -- Verifies all I/O scenarios.

**Acceptance Criteria:**
- Given a logged-in HR Administrator navigating to `/admin/organization`, when the page loads, then existing organization profile data is fetched and populated, or an empty form with locked INR currency is displayed if unconfigured.
- Given an HR Administrator filling in Organization Name, Code, and Contact Email, when clicking "Save Organization Profile", then the payload is validated, stored in MySQL, and a success Snackbar is displayed.
- Given an HR Administrator submitting the form with invalid inputs (empty name, non-alphanumeric code, or malformed email), when submission is attempted, then validation errors are shown on the corresponding fields and no network call is dispatched.
- Given the organization profile is saved, when refreshing the page or re-navigating to `/admin/organization`, then the persisted organization details are displayed accurately.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

- Organization Profile page follows `DESIGN.md`:
  - Main container padding: `24px` with background `#f4f6f8`.
  - Form card: elevation `0`, border `1px solid #e5e7eb`, border radius `12px`, padding `32px`.
  - Form inputs: Outlined `TextField` components with `size="medium"`, 8px border radius.
  - Currency field: Disabled/Read-only outlined field displaying "INR (₹) - Indian Rupee", enforcing consistency conventions.
  - Action button: Primary `#1976d2`, flat elevation, 8px border radius.
- MySQL Schema (`organizations`):
  - `id` (VARCHAR(36), PK)
  - `name` (VARCHAR(255), NOT NULL)
  - `code` (VARCHAR(32), NOT NULL, UNIQUE)
  - `contact_email` (VARCHAR(255), NOT NULL)
  - `currency` (VARCHAR(3), NOT NULL DEFAULT 'INR')
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
  - `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

## Verification

**Commands:**
- `npm test` -- expected: All unit tests across `frontend-web` and `service-employee` pass.
- `npm run build` -- expected: Clean TypeScript build across all workspace projects.

**Manual checks (if no CLI):**
- Verify `/admin/organization` route loads inside `AdminLayout` with active link highlight in sidebar.
- Verify validation triggers on empty/invalid inputs.
- Verify saving displays success snackbar and persists data.
