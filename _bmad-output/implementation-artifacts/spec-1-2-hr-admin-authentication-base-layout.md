---
title: 'Story 1.2: HR Admin Authentication & Base Layout'
type: 'feature'
created: '2026-09-23'
status: 'done'
baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
route: 'dispatch'
review_loop_iteration: 1
context:
  - '_bmad-output/planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** HR administrators cannot authenticate into the system, and the application lacks the persistent administrative navigation shell (fixed 260px sidebar and elevation-0 top App Bar) required to manage employees, salary structures, and payslips.

**Approach:** Implement stateful HR administrator authentication using opaque tokens (<12 chars) stored in Redis session storage, Redux Toolkit auth state management, and the Material UI base admin layout adhering to DESIGN.md visual tokens.

## Boundaries & Constraints

**Always:**
- Adhere to AD-3: Authentication uses an opaque token of less than 12 characters, stored as a key in Redis (`session:<token>`) with session data (`UserSession`), passed in HTTP headers as `Authorization: Bearer <token>`.
- Enforce DESIGN.md layout invariants: fixed 260px sidebar (white `#ffffff`, border-right `1px solid #e5e7eb`), top App Bar (`elevation: 0`, background `#ffffff`, text color `#111827`, border-bottom `1px solid #e5e7eb`), container padding `24px`, background `#f4f6f8`.
- Manage client auth state using Redux Toolkit (`authSlice`) and persist session tokens in browser session storage for page reload resilience.
- Protect all `/admin/*` routes via `ProtectedRoute` guard; unauthenticated visits must redirect to `/login`.
- Include standard admin navigation links: Dashboard (`/admin/dashboard`), Employees (`/admin/employees`), Salary Config (`/admin/salary-config`), and Payslips (`/admin/payslips`), highlighting active route with primary color `#1976d2`.

**Never:**
- Do not use stateless JWTs (violates AD-3).
- Do not create an API gateway (violates AD-2: direct microservice invocation).
- Do not implement employee portal login or password setup flows in this story (deferred to Epic 2).
- Do not introduce heavy drop shadows on cards, appbar, or sidebar (violates flat elevation design rules).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid HR Login | HR Admin submits valid email and password on `/login` | Authenticates, generates opaque token (<12 chars), stores session in Redis, populates Redux state, redirects to `/admin/dashboard` | N/A |
| Invalid Credentials | User enters invalid email or incorrect password | Login rejected (401), displays inline error alert banner on login form, preserves email input | "Invalid email or password" displayed cleanly without full reload |
| Unauthenticated Admin Access | Anonymous user navigates to `/admin/dashboard` or other `/admin/*` routes | Blocked by `ProtectedRoute`, automatically redirected to `/login` | Preserves intended destination for post-login redirect |
| Authenticated User Accesses Login | Active HR Admin navigates to `/login` | Detects valid session in Redux/storage, immediately redirects to `/admin/dashboard` | Seamless redirect without flashing login form |
| HR Admin Logout | Authenticated HR Admin clicks Logout button in App Bar / Sidebar | Calls logout API/store, removes token from Redis session store, clears Redux state & storage, redirects to `/login` | Graceful state cleanup |
| Token Expiration / Revocation | Session in Redis expires or is invalid | Next authenticated call detects missing session, resets Redux auth state, redirects to `/login` with notification | Clear session expiration message |

</frozen-after-approval>

## Code Map

- `libs/shared-types/src/index.ts` -- Shared auth DTOs (`LoginCredentialsDto`, `AuthResponseDto`) and role types.
- `libs/shared-auth/src/index.ts` -- Shared auth constants, bearer token parser, and opaque token generator.
- `libs/shared-auth/src/session-store.ts` -- Redis session store implementation with in-memory fallback for offline/test environments.
- `libs/shared-auth/src/session-store.spec.ts` -- Unit tests validating opaque token generation and Redis session lifecycle.
- `apps/frontend-web/src/store/index.ts` -- Redux Toolkit store setup with typed `useAppDispatch` and `useAppSelector` hooks.
- `apps/frontend-web/src/store/slices/authSlice.ts` -- Redux slice for authentication state, login, logout, and token persistence.
- `apps/frontend-web/src/services/authService.ts` -- Client authentication service communicating with auth endpoints with development mock adapter.
- `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Route guard redirecting unauthenticated users to `/login`.
- `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Base layout rendering fixed 260px sidebar, navigation items, elevation-0 App Bar, and page container.
- `apps/frontend-web/src/pages/LoginPage.tsx` -- Material UI login screen with email/password validation, error banners, and loading state.
- `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Initial dashboard placeholder verifying successful navigation and layout rendering.
- `apps/frontend-web/src/app/App.tsx` -- Root application router configured with `/login`, `/admin/*`, and default redirects.
- `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Unit tests for sidebar navigation, 260px width, App Bar, and logout action.
- `apps/frontend-web/src/pages/LoginPage.spec.tsx` -- Unit tests for login submission, validation, error alert, and successful redirect.

## Tasks & Acceptance

**Execution:**
- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.

**Acceptance Criteria:**
- Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
- Given invalid credentials submitted on `/login`, when login fails, then an inline error alert is displayed and user remains on `/login`.
- Given an unauthenticated visitor navigating to `/admin/*`, when accessed, then visitor is redirected to `/login`.
- Given an authenticated HR administrator on `/admin/dashboard`, when inspecting the layout, then a fixed 260px sidebar is rendered on the left, an elevation-0 App Bar is at the top, and content is padded by 24px on a `#f4f6f8` background.
- Given an authenticated HR administrator, when clicking the Logout button, then the session is destroyed in Redis, local auth state is cleared, and user is redirected to `/login`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

### Review Findings
- [x] [Review][Patch] Check session expiration on client re-hydration [apps/frontend-web/src/store/slices/authSlice.ts:24]
- [x] [Review][Patch] Replace hardcoded design token values in AdminLayout with theme tokens [apps/frontend-web/src/layouts/AdminLayout.tsx:44]
- [x] [Review][Patch] Add regression unit tests for location state redirect and expired session rehydration [apps/frontend-web/src/pages/LoginPage.spec.tsx:95]

#### Rejected
- [Review][Rejected][False] Consolidate SessionStore to separate module `./session-store`: Monorepo path mappings and lack of independent build target for `shared-auth` cause module resolution errors when referenced across package boundaries. The self-contained barrel in `index.ts` is required.
- [Review][Rejected][False] `login.fulfilled` hardcodes fallback email/role: The real backend response always populates `user`, and fallback is only defensive typing.
- [Review][Rejected][Low] `authService.baseUrl` ignores invalid port formats in `VITE_API_BASE_URL`: Standard URL configs suffice in environment variables.
- [Review][Rejected][False] `generateOpaqueToken` default length: Callee in AuthService explicitly calls `generateOpaqueToken(10)` fulfilling `<12 chars`.

## Design Notes

- The Admin Layout directly implements specifications from `DESIGN.md`:
  - Sidebar: fixed `width: 260px`, `background: #ffffff`, border-right `1px solid #e5e7eb`.
  - App Bar: `elevation: 0`, `background: #ffffff`, `color: #111827`, border-bottom `1px solid #e5e7eb`.
  - Container padding: `24px` on main container with background `#f4f6f8`.
  - Active navigation item: highlighted with primary `#1976d2` and subtle background tint (`rgba(25, 118, 210, 0.08)`).
- Session auth adheres strictly to `ARCHITECTURE-SPINE.md` AD-3:
  - Opaque token format: 10-character alphanumeric string (generated via cryptographically secure random bytes).
  - Stored in Redis with prefix `session:<token>`.

## Verification

**Commands:**
- `npm test` -- expected: All unit tests in `frontend-web` and `shared-auth` pass.
- `npm run build` -- expected: Monorepo builds cleanly without TypeScript or bundling errors.

**Manual checks (if no CLI):**
- Verify `/login` form renders correctly with email/password inputs.
- Verify logging in with valid credentials transitions smoothly to `/admin/dashboard` displaying sidebar and App Bar.
- Verify logging out clears session and returns to `/login`.
