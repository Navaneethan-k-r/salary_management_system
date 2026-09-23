---
title: 'Story 2.6: Employee Portal Login'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Employees have set up their passwords (via Story 2.5) but have no login portal to authenticate into the system to view their personal information and payslips.

**Approach:** Implement a dedicated employee login page (`/employee/login`) and a backend endpoint (`POST /api/employee/auth/login`). This will validate employee credentials, generate an opaque session token stored in Redis, and persist the employee's authenticated state on the client to allow access to the employee portal.

## Boundaries & Constraints

**Always:**
- Use the shared Redis session store and opaque token generator (<12 chars) implemented in Story 1.2 for employee sessions.
- Maintain a separate client-side authentication state for employees (e.g., `employeeAuthSlice`) to prevent session collision with HR Admin sessions.
- Show standard, non-specific error messages for failed login attempts (e.g., "Invalid email or password") to prevent email enumeration.
- Redirect successfully authenticated employees to their portal dashboard placeholder (`/employee/dashboard`).

**Never:**
- Do not allow HR Administrators to log in through the employee portal, and vice versa.
- Do not store session tokens directly in the MySQL database.
- Do not expose whether an employee email exists in the system upon failed login.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid Login | Employee submits valid email and password | Authenticates, generates session token, updates employee Redux state, redirects to `/employee/dashboard` | N/A |
| Invalid Credentials | User enters incorrect email or password | Login rejected (401), displays inline error message | "Invalid email or password" displayed cleanly |
| Unauthenticated Access | Anonymous user visits `/employee/dashboard` | Redirected to `/employee/login` | Preserves intended destination for post-login redirect |
| Authenticated Access | Active Employee navigates to `/employee/login` | Immediately redirects to `/employee/dashboard` | N/A |

- **Decision Record:** SESSION COLLISION - EXCLUSIVE (Logging into the Employee portal clears any active HR Admin session and vice versa, simpler state management).

</frozen-after-approval>

## Code Map

- `apps/frontend-web/src/pages/employee/EmployeeLoginPage.tsx` -- Material UI login screen specifically for employees.
- `apps/frontend-web/src/pages/employee/EmployeeDashboardPlaceholder.tsx` -- Placeholder for the employee portal dashboard to verify successful redirect.
- `apps/frontend-web/src/app/App.tsx` -- Register `/employee/login` and `/employee/*` routes.
- `apps/frontend-web/src/store/slices/employeeAuthSlice.ts` -- Redux slice to manage employee authentication state separate from HR Admin.
- `apps/frontend-web/src/services/employeeAuthService.ts` -- Client service for employee authentication.
- `apps/service-employee/src/auth/auth.controller.ts` -- Add `POST /api/employee/auth/login` endpoint.
- `apps/service-employee/src/auth/auth.service.ts` -- Logic to verify employee credentials and generate Redis session token.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/service-employee/src/auth/auth.controller.ts` & `apps/service-employee/src/auth/auth.service.ts` -- Implement employee login endpoint and credential verification -- Fulfills backend authentication requirement.
- [ ] `apps/frontend-web/src/store/slices/employeeAuthSlice.ts` -- Implement Redux slice for employee auth -- Isolates employee session state from HR Admin.
- [ ] `apps/frontend-web/src/services/employeeAuthService.ts` -- Implement client authentication service for employees -- Connects frontend to the backend endpoint.
- [ ] `apps/frontend-web/src/pages/employee/EmployeeLoginPage.tsx` -- Build the employee login UI with validation and error handling -- Provides the interface for employees to log in.
- [ ] `apps/frontend-web/src/pages/employee/EmployeeDashboardPlaceholder.tsx` -- Create a simple placeholder for the employee portal dashboard -- Verifies successful post-login redirection.
- [ ] `apps/frontend-web/src/app/App.tsx` -- Register employee portal routes and guard `/employee/dashboard` -- Enforces access control and connects views.

**Acceptance Criteria:**
- Given an employee with valid credentials, when submitting the login form on `/employee/login`, then an opaque token is issued, session is stored in Redis, and the user is redirected to `/employee/dashboard`.
- Given invalid credentials submitted on `/employee/login`, when login fails, then an inline error alert "Invalid email or password" is displayed and the user remains on the login page.
- Given an unauthenticated visitor navigating to `/employee/dashboard`, when accessed, then the visitor is redirected to `/employee/login`.

## Implementation Notes



## Spec Change Log



## Review Triage Log



## Verification

**Commands:**
- `npm test` -- expected: Unit tests for employee login logic and UI pass.
- `npm run build` -- expected: Monorepo builds cleanly.

**Manual checks (if no CLI):**
- Verify submitting `/employee/login` with valid credentials redirects to `/employee/dashboard`.
- Verify invalid credentials show appropriate error messages without revealing email existence.
