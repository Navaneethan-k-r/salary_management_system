# Edge Case Hunter Review

**Goal:** You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
When a diff is provided, scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.
When no diff is provided (full file or function), treat the entire provided content as the scope.
Ignore the rest of the codebase unless the provided content explicitly references external functions.
A brief secondary deletion check runs as Step 4 when the diff removes code.
A claims check runs as Step 5.

**Inputs:**
- **content** ‚Äî Content to review, or a path to read it from: diff, full file, or function
- **also_consider** (optional) ‚Äî Areas to keep in mind during review alongside normal edge-case analysis
- **claims_file** ‚Äî Path to the spec this change was built from. Do NOT read it before Step 5: the path tracing in Steps 2‚Äì3 must finish before the claims are seen.

**MANDATORY: Execute steps in the Execution section IN EXACT ORDER. DO NOT skip steps or change the sequence. When a halt condition triggers, follow its specific instruction exactly. Each action within a step is a REQUIRED action to complete that step.**

**Your method is exhaustive path enumeration ‚Äî mechanically walk every branch, not hunt by intuition. Report ONLY paths and conditions that lack handling ‚Äî discard handled ones silently. Do NOT editorialize or add filler. Do not assign severity labels, rankings, or priority levels.**


## EXECUTION

### Step 1: Receive Content

- Take the content to review from the parent message that launched you ‚Äî inline, or by reading the file it points to (never from this instruction file)
- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped ‚Äî no analysis performed"}]` and stop
- Identify content type (diff, full file, or function) to determine scope rules

### Step 2: Exhaustive Path Analysis

**Walk every branching path and boundary condition within scope ‚Äî report only unhandled ones.**

- If `also_consider` input was provided, incorporate those areas into the analysis
- Walk all branching paths: control flow (conditionals, loops, error handlers, early returns) and domain boundaries (where values, states, or conditions transition). Derive the relevant edge classes from the content itself ‚Äî don't rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
- Consider implicit branches: the diff special-cases or changes the handling of one or more members of a fixed set of values ‚Äî enums, status codes, sentinels, type tags, flags, value ranges. The rest of the set is implicit branches (e.g. the diff changes the `RED` and `YELLOW` cases of a `RED`/`YELLOW`/`GREEN` enum; `GREEN` is the implicit branch)
- Consider handle lifetime: when the changed code re-checks, re-fetches, or re-validates something it already held ‚Äî a handle, index, id, pointer ‚Äî the re-check exists because an intervening call can invalidate it. Identify that call, what it does to the thing held, and what the changed code silently skips when the re-check fails
- For each call site the diff adds or changes ‚Äî in test files as well as production code ‚Äî read the callee's declaration and check the call against it: argument count, order, types, and defaults. Report any mismatch
- For each path: determine whether the content handles it
- Collect only the unhandled paths as findings ‚Äî discard handled ones silently

### Step 3: Validate Completeness

- Revisit every edge class from Step 2 ‚Äî e.g., missing else/default, null/empty inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
- Add any newly found unhandled paths to findings; discard confirmed-handled ones

### Step 4: Deletion Check

If the diff removed or replaced meaningful code (ignore pure renames and whitespace): load `references/deletion-check.md` and follow it.

### Step 5: Claims Check

Load `references/claims-check.md` and follow it.

### Step 6: Present Findings

Output all findings as a single JSON array following the Output Format specification exactly.


## OUTPUT FORMAT

Return ONLY a valid JSON array of objects. Each edge-case finding contains exactly these four fields:

```json
[{
  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```

No extra text, no explanations, no markdown wrapping. An empty array `[]` is valid when nothing is found. Deletion findings from Step 4 and claim findings from Step 5, if any, go in the same array with the extra fields defined in `references/deletion-check.md` and `references/claims-check.md`.


## HALT CONDITIONS

- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped ‚Äî no analysis performed"}]` and stop
<reference path="references/deletion-check.md">
# Deletion Check

Secondary pass for the Edge Case Hunter ‚Äî runs only when the diff removed meaningful code. Subordinate to the edge-case pass; findings are usually few or none.

For each chunk of removed or replaced code (ignore pure renames and whitespace), ask: did it carry behavior or a contract that the change neither re-established nor intentionally retired? Add a finding for any resulting regression, orphaned reference, or newly-dead code. Skip anything already covered by your edge-case findings.

Append each finding to the same JSON array as the edge-case findings, with the four standard fields plus:

- `kind`: `"deletion"`
- `confidence`: `"high"`, `"medium"`, or `"low"` ‚Äî these are inferences; rate them

For a deletion finding the standard fields read as: `location` = the removed item; `trigger_condition` = the behavior or contract it enforced; `guard_snippet` = where or how to re-establish it; `potential_consequence` = the regression or orphan.

Add nothing if nothing qualifies.
</reference>
<reference path="references/claims-check.md">
# Claims Check

Final pass for the Edge Case Hunter. Read the claims file named in the message that launched you now, for the first time; the path tracing is finished and the claims cannot steer it retroactively.

It is the spec the change was built from. Read only its `## Intent` and `## Tasks & Acceptance` sections ‚Äî the claims live there; ignore the rest of the file. The spec is the change's own account of itself: testimony, not evidence ‚Äî a claim repeated in a code comment is still the same claim, not confirmation. Extract each checkable claim ‚Äî what the change does, what it preserves, ordering, arithmetic, and parity with existing code ("exactly as X does") ‚Äî then try to falsify each one against the code you have already traced. Where your trace is not enough to decide, read the code that decides it: the compared-to function, the actual callee, the state the claim assumes.

Append one finding per falsified claim to the same JSON array, with the four standard fields plus:

- `kind`: `"claim"`
- `confidence`: `"high"`, `"medium"`, or `"low"`

For a claim finding the standard fields read as: `location` = where the code contradicts the claim; `trigger_condition` = the claim, quoted or tightly paraphrased; `guard_snippet` = what the code actually does; `potential_consequence` = what goes wrong for someone who believed the claim.

Verified claims produce nothing. Add nothing if nothing is falsified.
</reference>

## CONTENT SOURCE

"Review content:" in the message that launched you gives the content itself or a path to read it from. Read the file when it is a path; either way that is the content under review, and this instruction file never is.


claims_file (leave unread until your instructions call for it):
---
title: 'Story 1.5: Backend Authentication API'
type: 'feature'
created: '2026-09-24'
status: 'in-review'
baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent ‚Äî do not modify unless human renegotiates">

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

## Verification

**Commands:**
- `nx serve service-employee` -- expected: API starts successfully.
- `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@salarymgmt.com","password":"admin123"}'` -- expected: Returns 200 OK with token.


Review content:
diff --git a/_bmad-output/implementation-artifacts/blind-hunter-prompt.md b/_bmad-output/implementation-artifacts/blind-hunter-prompt.md
new file mode 100644
index 0000000..5426a7f
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/blind-hunter-prompt.md
@@ -0,0 +1,1624 @@
+n++Conduct a review of CONTENT.
+Look for what's missing, not only what's wrong.
+Compute your finding floor N from the diff file's size: N = min(floor(sqrt(kB) + 1), 10), where kB is the file's size in kilobytes. State the arithmetic in one line, then find at least N issues to fix or improve.
+Output a Markdown list of findings only G«ˆ no severity, priority, or ranking.
+If the content is empty, stop and say so.
+If you have zero findings, re-check and keep thinking; do not stop with an empty list.
+
+CONTENT:
+diff --git a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+index 69a0e41..be74a6a 100644
+--- a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
++++ b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+@@ -2,7 +2,8 @@
+ title: 'Story 1.2: HR Admin Authentication & Base Layout'
+ type: 'feature'
+ created: '2026-09-23'
+-status: 'ready-for-dev'
++status: 'in-review'
++baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
+ route: 'dispatch'
+ review_loop_iteration: 0
+ context:
+@@ -67,18 +68,18 @@ context:
+ ## Tasks & Acceptance
+ 
+ **Execution:**
+-- [ ] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
+-- [ ] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
+-- [ ] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
+-- [ ] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
+-- [ ] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
+-- [ ] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
+-- [ ] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
+-- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
+-- [ ] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
+-- [ ] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
++- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
++- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
++- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
++- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
++- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
++- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
++- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
++- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
++- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
++- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
++- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
++- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
+ 
+ **Acceptance Criteria:**
+ - Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
+diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
+index e172c16..0642af4 100644
+--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
++++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
+@@ -1,5 +1,5 @@
+ generated: 09-23-2026 17:01
+-last_updated: 09-23-2026 18:25
++last_updated: 09-24-2026 08:36
+ project: salary_management_system
+ project_key: NOKEY
+ tracking_system: file-system
+@@ -8,7 +8,7 @@ story_location: "c:/Users/navan/projects/salary_management_system/_bmad-output/i
+ development_status:
+   epic-1: in-progress
+   1-1-project-foundation-ui-theme-initialization: done
+-  1-2-hr-admin-authentication-base-layout: ready-for-dev
++  1-2-hr-admin-authentication-base-layout: in-progress
+   1-3-organization-profile-setup: ready-for-dev
+   1-4-hr-dashboard-overview: ready-for-dev
+   epic-1-retrospective: optional
+diff --git a/apps/frontend-web/package.json b/apps/frontend-web/package.json
+index 1b19f12..89a7e1c 100644
+--- a/apps/frontend-web/package.json
++++ b/apps/frontend-web/package.json
+@@ -12,10 +12,14 @@
+   "dependencies": {
+     "@emotion/react": "^11.14.0",
+     "@emotion/styled": "^11.14.0",
++    "@mui/icons-material": "^6.5.0",
+     "@mui/material": "^6.4.4",
++    "@reduxjs/toolkit": "^2.12.0",
+     "@salary-mgmt/shared-types": "*",
+     "react": "^18.3.1",
+-    "react-dom": "^18.3.1"
++    "react-dom": "^18.3.1",
++    "react-redux": "^9.3.0",
++    "react-router-dom": "^7.18.4"
+   },
+   "devDependencies": {
+     "@testing-library/jest-dom": "^6.6.3",
+diff --git a/apps/frontend-web/src/app/App.spec.tsx b/apps/frontend-web/src/app/App.spec.tsx
+index 844b816..19660bf 100644
+--- a/apps/frontend-web/src/app/App.spec.tsx
++++ b/apps/frontend-web/src/app/App.spec.tsx
+@@ -1,15 +1,13 @@
+ import { render, screen } from '@testing-library/react';
+ import { describe, it, expect } from 'vitest';
+ import React from 'react';
+-import App, { AppContent } from './App';
++import App from './App';
+ import { theme, designTokens } from '../theme/theme';
+-import { AppThemeProvider } from '../theme/ThemeProvider';
+ 
+-describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+-  it('renders application with global theme provider and heading', () => {
++describe('App component', () => {
++  it('renders application and redirects to login by default', () => {
+     render(<App />);
+-    expect(screen.getByText(/Foundation & UI Theme Initialized/i)).toBeInTheDocument();
+-    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
+   });
+ 
+   it('verifies custom theme tokens adhere strictly to DESIGN.md', () => {
+@@ -24,28 +22,4 @@ describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+     expect(theme.typography.fontFamily).toContain('Inter');
+     expect(theme.typography.fontFamily).toContain('Roboto');
+   });
+-
+-  it('renders theme tokens in the UI preview card', () => {
+-    render(
+-      <AppThemeProvider>
+-        <AppContent />
+-      </AppThemeProvider>
+-    );
+-
+-    const primaryColorText = screen.getByText('#1976d2');
+-    expect(primaryColorText).toBeInTheDocument();
+-
+-    const bgDefaultText = screen.getByText('#f4f6f8');
+-    expect(bgDefaultText).toBeInTheDocument();
+-
+-    const borderRadiusText = screen.getByText('8px');
+-    expect(borderRadiusText).toBeInTheDocument();
+-  });
+-
+-  it('successfully consumes models from @salary-mgmt/shared-types', () => {
+-    render(<App />);
+-    expect(screen.getByText(/ACME Technologies Pvt Ltd/i)).toBeInTheDocument();
+-    expect(screen.getByText(/+Ù+¨GÚ˙ INR/i)).toBeInTheDocument();
+-    expect(screen.getByText(/HR Administrator/i)).toBeInTheDocument();
+-  });
+ });
+diff --git a/apps/frontend-web/src/app/App.tsx b/apps/frontend-web/src/app/App.tsx
+index acaba5e..a19e5d5 100644
+--- a/apps/frontend-web/src/app/App.tsx
++++ b/apps/frontend-web/src/app/App.tsx
+@@ -1,173 +1,43 @@
+ import React from 'react';
+-import AppBar from '@mui/material/AppBar';
+-import Toolbar from '@mui/material/Toolbar';
+-import Typography from '@mui/material/Typography';
+-import Container from '@mui/material/Container';
+-import Box from '@mui/material/Box';
+-import Card from '@mui/material/Card';
+-import CardContent from '@mui/material/CardContent';
+-import Button from '@mui/material/Button';
+-import Stack from '@mui/material/Stack';
+-import Chip from '@mui/material/Chip';
+-import { useTheme } from '@mui/material/styles';
++import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
++import { Provider } from 'react-redux';
+ import { AppThemeProvider } from '../theme/ThemeProvider';
+-import { OrganizationProfile, UserRole } from '@salary-mgmt/shared-types';
+-
+-export const AppContent: React.FC = () => {
+-  const currentTheme = useTheme();
+-
+-  const demoProfile: OrganizationProfile = {
+-    id: 'org-demo-001',
+-    name: 'ACME Technologies Pvt Ltd',
+-    code: 'ACME',
+-    contactEmail: 'admin@acme.corp',
+-    currency: 'INR',
+-    createdAt: '2026-09-23T00:00:00Z',
+-    updatedAt: '2026-09-23T00:00:00Z',
+-  };
+-
+-  const sampleRole: UserRole = 'hr_admin';
+-
+-  return (
+-    <Box
+-      data-testid="app-container"
+-      sx={{
+-        minHeight: '100vh',
+-        backgroundColor: currentTheme.palette.background.default,
+-        display: 'flex',
+-        flexDirection: 'column',
+-      }}
+-    >
+-      <AppBar position="static" data-testid="app-bar">
+-        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
+-          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
+-            Salary Management System
+-          </Typography>
+-          <Chip
+-            label={sampleRole === 'hr_admin' ? 'HR Administrator' : 'Employee'}
+-            size="small"
+-            color="primary"
+-            variant="outlined"
+-            data-testid="role-chip"
+-          />
+-        </Toolbar>
+-      </AppBar>
+-
+-      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
+-        <Stack spacing={3}>
+-          <Box>
+-            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
+-              Foundation & UI Theme Initialized
+-            </Typography>
+-            <Typography variant="body1" color="text.secondary">
+-              The foundational Nx monorepo, shared types, and Material UI design system are active.
+-            </Typography>
+-          </Box>
+-
+-          <Box
+-            sx={{
+-              display: 'grid',
+-              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
+-              gap: 3,
+-            }}
+-          >
+-            <Card data-testid="theme-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Design Tokens Preview
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Color:</Typography>
+-                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
+-                      <Box
+-                        data-testid="primary-color-swatch"
+-                        sx={{
+-                          width: 20,
+-                          height: 20,
+-                          borderRadius: '4px',
+-                          backgroundColor: currentTheme.palette.primary.main,
+-                        }}
+-                      />
+-                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                        {currentTheme.palette.primary.main}
+-                      </Typography>
+-                    </Box>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Background Default:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.palette.background.default}
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Card Border Radius:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.shape.borderRadius}px
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Font:</Typography>
+-                    <Typography
+-                      variant="body2"
+-                      data-testid="font-family-label"
+-                      sx={{ maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}
+-                    >
+-                      {currentTheme.typography.fontFamily}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-              </CardContent>
+-            </Card>
+-
+-            <Card data-testid="shared-type-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Shared Models & Architecture
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Organization Profile:</Typography>
+-                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
+-                      {demoProfile.name}
+-                    </Typography>
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Currency Standard:</Typography>
+-                    <Chip label={`+Ù+¨GÚ˙ ${demoProfile.currency}`} size="small" />
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Org Code:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {demoProfile.code}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
+-                  <Button variant="contained" color="primary" size="medium">
+-                    Primary Action
+-                  </Button>
+-                  <Button variant="outlined" color="primary" size="medium">
+-                    Outlined Action
+-                  </Button>
+-                </Box>
+-              </CardContent>
+-            </Card>
+-          </Box>
+-        </Stack>
+-      </Container>
+-    </Box>
+-  );
+-};
++import { store } from '../store';
++import { LoginPage } from '../pages/LoginPage';
++import { AdminLayout } from '../layouts/AdminLayout';
++import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
++import { ProtectedRoute } from '../components/ProtectedRoute';
+ 
+ export const App: React.FC = () => {
+   return (
+-    <AppThemeProvider>
+-      <AppContent />
+-    </AppThemeProvider>
++    <Provider store={store}>
++      <AppThemeProvider>
++        <BrowserRouter>
++          <Routes>
++            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
++            
++            <Route path="/login" element={<LoginPage />} />
++            
++            <Route 
++              path="/admin" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              }
++            >
++              <Route index element={<Navigate to="dashboard" replace />} />
++              <Route path="dashboard" element={<AdminDashboardPlaceholder />} />
++              <Route path="employees" element={<div>Employees Page (Not Implemented)</div>} />
++              <Route path="salary-config" element={<div>Salary Config (Not Implemented)</div>} />
++              <Route path="payslips" element={<div>Payslips (Not Implemented)</div>} />
++            </Route>
++
++            <Route path="*" element={<Navigate to="/login" replace />} />
++          </Routes>
++        </BrowserRouter>
++      </AppThemeProvider>
++    </Provider>
+   );
+ };
+ 
+diff --git a/apps/frontend-web/src/components/ProtectedRoute.tsx b/apps/frontend-web/src/components/ProtectedRoute.tsx
+new file mode 100644
+index 0000000..495d14e
+--- /dev/null
++++ b/apps/frontend-web/src/components/ProtectedRoute.tsx
+@@ -0,0 +1,22 @@
++import React from 'react';
++import { Navigate, useLocation } from 'react-router-dom';
++import { useAppSelector } from '../store';
++
++interface ProtectedRouteProps {
++  children: React.ReactNode;
++}
++
++export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
++  const { isAuthenticated } = useAppSelector((state) => state.auth);
++  const location = useLocation();
++
++  if (!isAuthenticated) {
++    // Redirect them to the /login page, but save the current location they were
++    // trying to go to when they were redirected. This allows us to send them
++    // along to that page after they login, which is a nicer user experience
++    // than dropping them off on the home page.
++    return <Navigate to="/login" state={{ from: location }} replace />;
++  }
++
++  return <>{children}</>;
++};
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.spec.tsx b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+new file mode 100644
+index 0000000..43ae7b6
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+@@ -0,0 +1,91 @@
++import React from 'react';
++import { render, screen, fireEvent } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import authReducer from '../store/slices/authSlice';
++import { AdminLayout } from './AdminLayout';
++import { ProtectedRoute } from '../components/ProtectedRoute';
++
++const createTestStore = (isAuthenticated = true) => {
++  return configureStore({
++    reducer: { auth: authReducer },
++    preloadedState: {
++      auth: {
++        isAuthenticated,
++        session: null,
++        isLoading: false,
++        error: null
++      }
++    }
++  });
++};
++
++describe('AdminLayout & ProtectedRoute', () => {
++  it('renders sidebar navigation items when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <BrowserRouter>
++          <AdminLayout />
++        </BrowserRouter>
++      </Provider>
++    );
++
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++    expect(screen.getByText('Dashboard')).toBeInTheDocument();
++    expect(screen.getByText('Employees')).toBeInTheDocument();
++    expect(screen.getByText('Salary Config')).toBeInTheDocument();
++    expect(screen.getByText('Payslips')).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
++  });
++
++  it('redirects to login when unauthenticated accessing protected route', () => {
++    const store = createTestStore(false);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    // Should redirect to login
++    expect(screen.getByText('Login Page')).toBeInTheDocument();
++    expect(screen.queryByText('HR Administration')).not.toBeInTheDocument();
++  });
++
++  it('allows access to protected route when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.tsx b/apps/frontend-web/src/layouts/AdminLayout.tsx
+new file mode 100644
+index 0000000..9d65b6f
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.tsx
+@@ -0,0 +1,137 @@
++import React from 'react';
++import { Outlet, useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Drawer, 
++  AppBar, 
++  Toolbar, 
++  Typography, 
++  List, 
++  ListItem, 
++  ListItemButton, 
++  ListItemIcon, 
++  ListItemText,
++  Button
++} from '@mui/material';
++import DashboardIcon from '@mui/icons-material/Dashboard';
++import PeopleIcon from '@mui/icons-material/People';
++import SettingsIcon from '@mui/icons-material/Settings';
++import ReceiptIcon from '@mui/icons-material/Receipt';
++import LogoutIcon from '@mui/icons-material/Logout';
++import { useAppDispatch } from '../store';
++import { logout } from '../store/slices/authSlice';
++
++const drawerWidth = 260;
++
++export const AdminLayout: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++
++  const handleLogout = async () => {
++    await dispatch(logout());
++    navigate('/login');
++  };
++
++  const navItems = [
++    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
++    { text: 'Employees', path: '/admin/employees', icon: <PeopleIcon /> },
++    { text: 'Salary Config', path: '/admin/salary-config', icon: <SettingsIcon /> },
++    { text: 'Payslips', path: '/admin/payslips', icon: <ReceiptIcon /> },
++  ];
++
++  return (
++    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
++      <AppBar
++        position="fixed"
++        elevation={0}
++        sx={{
++          width: `calc(100% - ${drawerWidth}px)`,
++          ml: `${drawerWidth}px`,
++          backgroundColor: '#ffffff',
++          color: '#111827',
++          borderBottom: '1px solid #e5e7eb',
++        }}
++      >
++        <Toolbar>
++          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            HR Administration
++          </Typography>
++          <Button 
++            color="inherit" 
++            onClick={handleLogout}
++            endIcon={<LogoutIcon />}
++            sx={{ textTransform: 'none' }}
++          >
++            Logout
++          </Button>
++        </Toolbar>
++      </AppBar>
++      
++      <Drawer
++        sx={{
++          width: drawerWidth,
++          flexShrink: 0,
++          '& .MuiDrawer-paper': {
++            width: drawerWidth,
++            boxSizing: 'border-box',
++            backgroundColor: '#ffffff',
++            borderRight: '1px solid #e5e7eb',
++          },
++        }}
++        variant="permanent"
++        anchor="left"
++      >
++        <Toolbar>
++          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            Salary Mgmt
++          </Typography>
++        </Toolbar>
++        
++        <List sx={{ px: 1 }}>
++          {navItems.map((item) => {
++            const isActive = location.pathname.startsWith(item.path);
++            return (
++              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
++                <ListItemButton
++                  onClick={() => navigate(item.path)}
++                  sx={{
++                    borderRadius: '6px',
++                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
++                    color: isActive ? '#1976d2' : '#6b7280',
++                    '&:hover': {
++                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
++                    }
++                  }}
++                >
++                  <ListItemIcon sx={{ color: isActive ? '#1976d2' : '#6b7280', minWidth: '40px' }}>
++                    {item.icon}
++                  </ListItemIcon>
++                  <ListItemText 
++                    primary={item.text} 
++                    primaryTypographyProps={{ 
++                      fontWeight: isActive ? 600 : 500,
++                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
++                    }} 
++                  />
++                </ListItemButton>
++              </ListItem>
++            );
++          })}
++        </List>
++      </Drawer>
++      
++      <Box
++        component="main"
++        sx={{
++          flexGrow: 1,
++          p: '24px',
++          width: `calc(100% - ${drawerWidth}px)`,
++          mt: '64px' // Toolbar height
++        }}
++      >
++        <Outlet />
++      </Box>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+new file mode 100644
+index 0000000..c48896a
+--- /dev/null
++++ b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+@@ -0,0 +1,20 @@
++import React from 'react';
++import { Box, Typography, Card, CardContent } from '@mui/material';
++
++export const AdminDashboardPlaceholder: React.FC = () => {
++  return (
++    <Box>
++      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++        Dashboard Overview
++      </Typography>
++      
++      <Card sx={{ mt: 3, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
++        <CardContent sx={{ p: 4 }}>
++          <Typography variant="body1" color="text.secondary">
++            Welcome to the HR Admin Dashboard. The full dashboard implementation is scheduled for a future sprint.
++          </Typography>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/LoginPage.spec.tsx b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+new file mode 100644
+index 0000000..7e0e2c5
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+@@ -0,0 +1,95 @@
++import React from 'react';
++import { render, screen, fireEvent, waitFor } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import { vi } from 'vitest';
++import authReducer from '../store/slices/authSlice';
++import { LoginPage } from './LoginPage';
++import { authService } from '../services/authService';
++
++// Mock authService
++vi.mock('../services/authService', () => ({
++  authService: {
++    login: vi.fn()
++  }
++}));
++
++const renderWithProviders = (
++  ui: React.ReactElement,
++  {
++    preloadedState = {},
++    store = configureStore({
++      reducer: { auth: authReducer },
++      preloadedState,
++    }),
++    ...renderOptions
++  } = {}
++) => {
++  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
++    return <Provider store={store}><BrowserRouter>{children}</BrowserRouter></Provider>;
++  };
++  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
++};
++
++describe('LoginPage', () => {
++  beforeEach(() => {
++    vi.clearAllMocks();
++  });
++
++  it('renders login form elements', () => {
++    renderWithProviders(<LoginPage />);
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
++    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
++    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
++  });
++
++  it('shows validation error for empty fields', async () => {
++    renderWithProviders(<LoginPage />);
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Email is required')).toBeInTheDocument();
++  });
++
++  it('shows validation error for missing password', async () => {
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Password is required')).toBeInTheDocument();
++  });
++
++  it('submits form when fields are valid', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockResolvedValueOnce({ token: '123', user: { id: '1' } });
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    await waitFor(() => {
++      expect(mockLogin).toHaveBeenCalledWith({
++        email: 'admin@example.com',
++        password: 'password123'
++      });
++    });
++  });
++
++  it('displays error on failed login', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/pages/LoginPage.tsx b/apps/frontend-web/src/pages/LoginPage.tsx
+new file mode 100644
+index 0000000..331ef8c
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.tsx
+@@ -0,0 +1,136 @@
++import React, { useState } from 'react';
++import { useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Card, 
++  CardContent, 
++  Typography, 
++  TextField, 
++  Button, 
++  Alert,
++  CircularProgress
++} from '@mui/material';
++import { useAppDispatch, useAppSelector } from '../store';
++import { login, clearError } from '../store/slices/authSlice';
++
++export const LoginPage: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
++
++  const [email, setEmail] = useState('');
++  const [password, setPassword] = useState('');
++  const [validationError, setValidationError] = useState('');
++
++  // If already authenticated, redirect to admin dashboard
++  React.useEffect(() => {
++    if (isAuthenticated) {
++      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
++      navigate(from, { replace: true });
++    }
++  }, [isAuthenticated, navigate, location]);
++
++  const handleSubmit = async (e: React.FormEvent) => {
++    e.preventDefault();
++    setValidationError('');
++    
++    if (error) {
++      dispatch(clearError());
++    }
++
++    if (!email) {
++      setValidationError('Email is required');
++      return;
++    }
++    
++    if (!password) {
++      setValidationError('Password is required');
++      return;
++    }
++
++    await dispatch(login({ email, password }));
++  };
++
++  return (
++    <Box 
++      sx={{ 
++        minHeight: '100vh', 
++        display: 'flex', 
++        alignItems: 'center', 
++        justifyContent: 'center',
++        backgroundColor: '#f4f6f8'
++      }}
++    >
++      <Card 
++        sx={{ 
++          maxWidth: 400, 
++          width: '100%', 
++          borderRadius: '12px',
++          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
++        }}
++      >
++        <CardContent sx={{ p: '32px' }}>
++          <Typography 
++            variant="h5" 
++            component="h1" 
++            align="center" 
++            gutterBottom
++            sx={{ fontWeight: 700, mb: 3, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}
++          >
++            HR Login
++          </Typography>
++
++          {(error || validationError) && (
++            <Alert severity="error" sx={{ mb: 3 }}>
++              {error || validationError}
++            </Alert>
++          )}
++
++          <form onSubmit={handleSubmit}>
++            <TextField
++              label="Email Address"
++              variant="outlined"
++              fullWidth
++              margin="normal"
++              value={email}
++              onChange={(e) => setEmail(e.target.value)}
++              disabled={isLoading}
++              autoComplete="email"
++            />
++            
++            <TextField
++              label="Password"
++              variant="outlined"
++              type="password"
++              fullWidth
++              margin="normal"
++              value={password}
++              onChange={(e) => setPassword(e.target.value)}
++              disabled={isLoading}
++              autoComplete="current-password"
++            />
++            
++            <Button
++              type="submit"
++              variant="contained"
++              fullWidth
++              disabled={isLoading}
++              sx={{ 
++                mt: 3, 
++                mb: 2, 
++                py: 1.5,
++                borderRadius: '6px',
++                backgroundColor: '#1976d2',
++                fontWeight: 600,
++                textTransform: 'none'
++              }}
++            >
++              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
++            </Button>
++          </form>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/services/authService.ts b/apps/frontend-web/src/services/authService.ts
+new file mode 100644
+index 0000000..a5725fd
+--- /dev/null
++++ b/apps/frontend-web/src/services/authService.ts
+@@ -0,0 +1,78 @@
++import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';
++
++export type LoginRequest = LoginCredentialsDto;
++
++class AuthService {
++  private baseUrl = '/api/auth';
++  private useMock = true; // Use mock adapter for development
++
++  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
++    if (this.useMock) {
++      return this.mockLogin(credentials);
++    }
++
++    const response = await fetch(`${this.baseUrl}/login`, {
++      method: 'POST',
++      headers: {
++        'Content-Type': 'application/json',
++      },
++      body: JSON.stringify(credentials),
++    });
++
++    if (!response.ok) {
++      const error = await response.json();
++      throw new Error(error.message || 'Login failed');
++    }
++
++    const result = await response.json();
++    return result.data as AuthResponseDto;
++  }
++
++  async logout(): Promise<void> {
++    if (this.useMock) {
++      return new Promise(resolve => setTimeout(resolve, 300));
++    }
++
++    const sessionData = sessionStorage.getItem('auth_session');
++    let token = '';
++    if (sessionData) {
++      try {
++        const parsed = JSON.parse(sessionData);
++        token = parsed.token;
++      } catch (e) {}
++    }
++
++    const response = await fetch(`${this.baseUrl}/logout`, {
++      method: 'POST',
++      headers: {
++        'Authorization': `Bearer ${token}`
++      }
++    });
++
++    if (!response.ok) {
++      console.error('Logout failed on server');
++    }
++  }
++
++  private mockLogin(credentials: LoginRequest): Promise<AuthResponseDto> {
++    return new Promise((resolve, reject) => {
++      setTimeout(() => {
++        if (credentials.email === 'admin@salarymgmt.com' && credentials.password === 'admin123') {
++          resolve({
++            token: 'mock123token',
++            user: {
++              id: 'admin-1',
++              email: 'admin@salarymgmt.com',
++              fullName: 'Admin User',
++              role: 'hr_admin'
++            }
++          });
++        } else {
++          reject(new Error('Invalid email or password'));
++        }
++      }, 500);
++    });
++  }
++}
++
++export const authService = new AuthService();
+diff --git a/apps/frontend-web/src/store/index.ts b/apps/frontend-web/src/store/index.ts
+new file mode 100644
+index 0000000..ec300b9
+--- /dev/null
++++ b/apps/frontend-web/src/store/index.ts
+@@ -0,0 +1,15 @@
++import { configureStore } from '@reduxjs/toolkit';
++import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
++import authReducer from './slices/authSlice';
++
++export const store = configureStore({
++  reducer: {
++    auth: authReducer,
++  },
++});
++
++export type RootState = ReturnType<typeof store.getState>;
++export type AppDispatch = typeof store.dispatch;
++
++export const useAppDispatch = () => useDispatch<AppDispatch>();
++export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
+diff --git a/apps/frontend-web/src/store/slices/authSlice.ts b/apps/frontend-web/src/store/slices/authSlice.ts
+new file mode 100644
+index 0000000..76d786e
+--- /dev/null
++++ b/apps/frontend-web/src/store/slices/authSlice.ts
+@@ -0,0 +1,102 @@
++import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
++import { UserSession } from '@salary-mgmt/shared-types';
++import { authService, LoginRequest } from '../../services/authService';
++
++interface AuthState {
++  session: UserSession | null;
++  isAuthenticated: boolean;
++  isLoading: boolean;
++  error: string | null;
++}
++
++const getInitialSession = (): UserSession | null => {
++  try {
++    const stored = sessionStorage.getItem('auth_session');
++    if (stored) {
++      return JSON.parse(stored) as UserSession;
++    }
++  } catch (e) {
++    console.error('Failed to parse stored session', e);
++  }
++  return null;
++};
++
++const initialSession = getInitialSession();
++
++const initialState: AuthState = {
++  session: initialSession,
++  isAuthenticated: !!initialSession,
++  isLoading: false,
++  error: null,
++};
++
++export const login = createAsyncThunk(
++  'auth/login',
++  async (credentials: LoginRequest, { rejectWithValue }) => {
++    try {
++      const response = await authService.login(credentials);
++      return response;
++    } catch (error: any) {
++      return rejectWithValue(error.message || 'Login failed');
++    }
++  }
++);
++
++export const logout = createAsyncThunk(
++  'auth/logout',
++  async (_, { getState, rejectWithValue }) => {
++    try {
++      await authService.logout();
++    } catch (error: any) {
++      // Proceed to clear state anyway
++      console.error('Logout API failed', error);
++    }
++  }
++);
++
++const authSlice = createSlice({
++  name: 'auth',
++  initialState,
++  reducers: {
++    clearError: (state) => {
++      state.error = null;
++    }
++  },
++  extraReducers: (builder) => {
++    builder
++      .addCase(login.pending, (state) => {
++        state.isLoading = true;
++        state.error = null;
++      })
++      .addCase(login.fulfilled, (state, action) => {
++        state.isLoading = false;
++        state.isAuthenticated = true;
++        
++        // Mock session payload for Redux from AuthResponseDto
++        const mockSession: UserSession = {
++          token: action.payload.token,
++          userId: action.payload.user.id,
++          role: action.payload.user.role,
++          email: action.payload.user.email,
++          organizationId: 'org-1',
++          createdAt: new Date().toISOString(),
++          expiresAt: new Date(Date.now() + 86400000).toISOString(),
++        };
++        
++        state.session = mockSession;
++        sessionStorage.setItem('auth_session', JSON.stringify(mockSession));
++      })
++      .addCase(login.rejected, (state, action) => {
++        state.isLoading = false;
++        state.error = action.payload as string;
++      })
++      .addCase(logout.fulfilled, (state) => {
++        state.session = null;
++        state.isAuthenticated = false;
++        sessionStorage.removeItem('auth_session');
++      });
++  },
++});
++
++export const { clearError } = authSlice.actions;
++export default authSlice.reducer;
+diff --git a/apps/frontend-web/vite.config.ts b/apps/frontend-web/vite.config.ts
+index cf18ebd..19d12a7 100644
+--- a/apps/frontend-web/vite.config.ts
++++ b/apps/frontend-web/vite.config.ts
+@@ -18,5 +18,10 @@ export default defineConfig({
+     globals: true,
+     environment: 'jsdom',
+     setupFiles: ['./src/test/setup.ts'],
++    server: {
++      deps: {
++        inline: ['@mui/icons-material', '@mui/material']
++      }
++    }
+   },
+ });
+diff --git a/libs/shared-auth/src/index.ts b/libs/shared-auth/src/index.ts
+index e305dec..701962b 100644
+--- a/libs/shared-auth/src/index.ts
++++ b/libs/shared-auth/src/index.ts
+@@ -26,3 +26,24 @@ export interface SessionStore {
+   setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
+   deleteSession(token: string): Promise<void>;
+ }
++
++export function generateOpaqueToken(length: number = 10): string {
++  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
++  let token = '';
++  // Use crypto for secure random bytes if available (in node environment)
++  if (typeof process !== 'undefined' && typeof require !== 'undefined') {
++    const crypto = require('crypto');
++    const randomBytes = crypto.randomBytes(length);
++    for (let i = 0; i < length; i++) {
++      token += chars[randomBytes[i] % chars.length];
++    }
++  } else {
++    // Fallback for non-node environments
++    for (let i = 0; i < length; i++) {
++      token += chars.charAt(Math.floor(Math.random() * chars.length));
++    }
++  }
++  return token;
++}
++
++export * from './session-store';
+diff --git a/libs/shared-auth/src/session-store.spec.ts b/libs/shared-auth/src/session-store.spec.ts
+new file mode 100644
+index 0000000..d0e52c2
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.spec.ts
+@@ -0,0 +1,60 @@
++import { generateOpaqueToken, REDIS_SESSION_KEY_PREFIX } from './index';
++import { RedisSessionStore } from './session-store';
++import { UserSession } from '@salary-mgmt/shared-types';
++
++describe('Auth Library', () => {
++  describe('generateOpaqueToken', () => {
++    it('should generate a token of specified length', () => {
++      const token = generateOpaqueToken(10);
++      expect(token.length).toBe(10);
++    });
++
++    it('should generate unique tokens', () => {
++      const token1 = generateOpaqueToken(10);
++      const token2 = generateOpaqueToken(10);
++      expect(token1).not.toBe(token2);
++    });
++  });
++
++  describe('RedisSessionStore (in-memory fallback)', () => {
++    let store: RedisSessionStore;
++    let mockSession: UserSession;
++
++    beforeEach(() => {
++      store = new RedisSessionStore();
++      mockSession = {
++        token: 'test-token',
++        userId: 'user-123',
++        role: 'hr_admin',
++        email: 'test@example.com',
++        organizationId: 'org-123',
++        createdAt: new Date().toISOString(),
++        expiresAt: new Date(Date.now() + 86400000).toISOString()
++      };
++    });
++
++    it('should store and retrieve a session', async () => {
++      await store.setSession('test-token', mockSession);
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toEqual(mockSession);
++    });
++
++    it('should return null for non-existent session', async () => {
++      const retrieved = await store.getSession('non-existent');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should delete a session', async () => {
++      await store.setSession('test-token', mockSession);
++      await store.deleteSession('test-token');
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should handle expired sessions (mocking time)', async () => {
++      await store.setSession('test-token', mockSession, -1); // Expire immediately
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++  });
++});
+diff --git a/libs/shared-auth/src/session-store.ts b/libs/shared-auth/src/session-store.ts
+new file mode 100644
+index 0000000..b58c4b0
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.ts
+@@ -0,0 +1,86 @@
++import { UserSession } from '@salary-mgmt/shared-types';
++import { SessionStore, REDIS_SESSION_KEY_PREFIX } from './index';
++
++// A simple in-memory fallback store
++class InMemorySessionStore implements SessionStore {
++  private store: Map<string, { session: UserSession; expiresAt: number }> = new Map();
++
++  async getSession(token: string): Promise<UserSession | null> {
++    const data = this.store.get(token);
++    if (!data) return null;
++    
++    if (Date.now() > data.expiresAt) {
++      this.store.delete(token);
++      return null;
++    }
++    
++    return data.session;
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    this.store.set(token, {
++      session,
++      expiresAt: Date.now() + (ttlSeconds * 1000)
++    });
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    this.store.delete(token);
++  }
++}
++
++export class RedisSessionStore implements SessionStore {
++  private fallbackStore = new InMemorySessionStore();
++  
++  constructor(private redisClient?: any) {} // Assuming ioredis or redis client
++
++  private getKey(token: string): string {
++    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
++  }
++
++  async getSession(token: string): Promise<UserSession | null> {
++    if (!this.redisClient) {
++      return this.fallbackStore.getSession(token);
++    }
++    
++    try {
++      const data = await this.redisClient.get(this.getKey(token));
++      if (!data) return null;
++      return JSON.parse(data) as UserSession;
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.getSession(token);
++    }
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++    
++    try {
++      await this.redisClient.set(
++        this.getKey(token),
++        JSON.stringify(session),
++        'EX',
++        ttlSeconds
++      );
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.deleteSession(token);
++    }
++    
++    try {
++      await this.redisClient.del(this.getKey(token));
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.deleteSession(token);
++    }
++  }
++}
+diff --git a/libs/shared-types/src/index.ts b/libs/shared-types/src/index.ts
+index 7a2dd89..c3e91cd 100644
+--- a/libs/shared-types/src/index.ts
++++ b/libs/shared-types/src/index.ts
+@@ -46,3 +46,19 @@ export interface ApiResponse<T> {
+   data: T;
+   message?: string;
+ }
++
++export interface LoginCredentialsDto {
++  email: string;
++  password?: string;
++  token?: string; // For magic links
++}
++
++export interface AuthResponseDto {
++  token: string;
++  user: {
++    id: string;
++    email: string;
++    fullName: string;
++    role: UserRole;
++  };
++}
+diff --git a/package-lock.json b/package-lock.json
+index 847886a..01814cc 100644
+--- a/package-lock.json
++++ b/package-lock.json
+@@ -42,10 +42,14 @@
+       "dependencies": {
+         "@emotion/react": "^11.14.0",
+         "@emotion/styled": "^11.14.0",
++        "@mui/icons-material": "^6.5.0",
+         "@mui/material": "^6.4.4",
++        "@reduxjs/toolkit": "^2.12.0",
+         "@salary-mgmt/shared-types": "*",
+         "react": "^18.3.1",
+-        "react-dom": "^18.3.1"
++        "react-dom": "^18.3.1",
++        "react-redux": "^9.3.0",
++        "react-router-dom": "^7.18.4"
+       },
+       "devDependencies": {
+         "@testing-library/jest-dom": "^6.6.3",
+@@ -59,6 +63,32 @@
+         "vitest": "^3.0.5"
+       }
+     },
++    "apps/frontend-web/node_modules/@mui/icons-material": {
++      "version": "6.5.0",
++      "resolved": "https://registry.npmjs.org/@mui/icons-material/-/icons-material-6.5.0.tgz",
++      "integrity": "sha512-VPuPqXqbBPlcVSA0BmnoE4knW4/xG6Thazo8vCLWkOKusko6DtwFV6B665MMWJ9j0KFohTIf3yx2zYtYacvG1g==",
++      "license": "MIT",
++      "dependencies": {
++        "@babel/runtime": "^7.26.0"
++      },
++      "engines": {
++        "node": ">=14.0.0"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/mui-org"
++      },
++      "peerDependencies": {
++        "@mui/material": "^6.5.0",
++        "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
++        "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        }
++      }
++    },
+     "libs/shared-auth": {
+       "name": "@salary-mgmt/shared-auth",
+       "version": "0.1.0",
+@@ -4431,6 +4461,32 @@
+         "url": "https://opencollective.com/popperjs"
+       }
+     },
++    "node_modules/@reduxjs/toolkit": {
++      "version": "2.12.0",
++      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
++      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
++      "license": "MIT",
++      "dependencies": {
++        "@standard-schema/spec": "^1.0.0",
++        "@standard-schema/utils": "^0.3.0",
++        "immer": "^11.0.0",
++        "redux": "^5.0.1",
++        "redux-thunk": "^3.1.0",
++        "reselect": "^5.1.0"
++      },
++      "peerDependencies": {
++        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
++        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
++      },
++      "peerDependenciesMeta": {
++        "react": {
++          "optional": true
++        },
++        "react-redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/@rolldown/pluginutils": {
+       "version": "1.0.0-beta.27",
+       "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
+@@ -5106,6 +5162,18 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@standard-schema/spec": {
++      "version": "1.1.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
++      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
++      "license": "MIT"
++    },
++    "node_modules/@standard-schema/utils": {
++      "version": "0.3.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
++      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
++      "license": "MIT"
++    },
+     "node_modules/@svgr/babel-plugin-add-jsx-attribute": {
+       "version": "8.0.0",
+       "resolved": "https://registry.npmjs.org/@svgr/babel-plugin-add-jsx-attribute/-/babel-plugin-add-jsx-attribute-8.0.0.tgz",
+@@ -5627,6 +5695,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@types/use-sync-external-store": {
++      "version": "0.0.6",
++      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
++      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
++      "license": "MIT"
++    },
+     "node_modules/@vitejs/plugin-react": {
+       "version": "4.7.0",
+       "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
+@@ -8971,6 +9045,16 @@
+         "node": ">= 4"
+       }
+     },
++    "node_modules/immer": {
++      "version": "11.1.18",
++      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.18.tgz",
++      "integrity": "sha512-EQyQtLiYW029lyoczMl/Hh4Xu7cDecSc58JRYpHyL4tIAu3eqd1yJzQX04d2BZHDkzFFvm6qJEJWOtfDSWAXbQ==",
++      "license": "MIT",
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/immer"
++      }
++    },
+     "node_modules/import-fresh": {
+       "version": "3.3.1",
+       "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
+@@ -11031,6 +11115,29 @@
+       "integrity": "sha512-UpMYezM4v5/18F28aC66AEsjXIgE02kyEMH6yLdgLXu/UTfa1Ntwck/nNLrbqJsEXW7gPb0coNO9FQse9WTovA==",
+       "license": "MIT"
+     },
++    "node_modules/react-redux": {
++      "version": "9.3.0",
++      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
++      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
++      "license": "MIT",
++      "dependencies": {
++        "@types/use-sync-external-store": "^0.0.6",
++        "use-sync-external-store": "^1.4.0"
++      },
++      "peerDependencies": {
++        "@types/react": "^18.2.25 || ^19",
++        "react": "^18.0 || ^19",
++        "redux": "^5.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        },
++        "redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/react-refresh": {
+       "version": "0.17.0",
+       "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
+@@ -11041,6 +11148,57 @@
+         "node": ">=0.10.0"
+       }
+     },
++    "node_modules/react-router": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
++      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
++      "license": "MIT",
++      "dependencies": {
++        "cookie": "^1.0.1",
++        "set-cookie-parser": "^2.6.0"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      },
++      "peerDependenciesMeta": {
++        "react-dom": {
++          "optional": true
++        }
++      }
++    },
++    "node_modules/react-router-dom": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
++      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
++      "license": "MIT",
++      "dependencies": {
++        "react-router": "7.18.4"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      }
++    },
++    "node_modules/react-router/node_modules/cookie": {
++      "version": "1.1.1",
++      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
++      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
++      "license": "MIT",
++      "engines": {
++        "node": ">=18"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/express"
++      }
++    },
+     "node_modules/react-transition-group": {
+       "version": "4.4.5",
+       "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
+@@ -11086,6 +11244,21 @@
+         "node": ">=8"
+       }
+     },
++    "node_modules/redux": {
++      "version": "5.0.1",
++      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
++      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
++      "license": "MIT"
++    },
++    "node_modules/redux-thunk": {
++      "version": "3.1.0",
++      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
++      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
++      "license": "MIT",
++      "peerDependencies": {
++        "redux": "^5.0.0"
++      }
++    },
+     "node_modules/regenerate": {
+       "version": "1.4.2",
+       "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.4.2.tgz",
+@@ -11171,6 +11344,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/reselect": {
++      "version": "5.3.0",
++      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.3.0.tgz",
++      "integrity": "sha512-XGoLeRAVzUTcJ1qkxPQhDJyIZ5d6zzZD9nT7AEZOaaU9UbWclhycElmhO+VD5bFeLuzhPBaOV2oXC8uG35ZSpg==",
++      "license": "MIT"
++    },
+     "node_modules/resolve": {
+       "version": "1.22.8",
+       "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
+@@ -11470,6 +11649,12 @@
+         "node": ">= 0.8.0"
+       }
+     },
++    "node_modules/set-cookie-parser": {
++      "version": "2.7.2",
++      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
++      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
++      "license": "MIT"
++    },
+     "node_modules/setprototypeof": {
+       "version": "1.2.0",
+       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
+@@ -12357,6 +12542,15 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/use-sync-external-store": {
++      "version": "1.7.0",
++      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
++      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
++      "license": "MIT",
++      "peerDependencies": {
++        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
++      }
++    },
+     "node_modules/util-deprecate": {
+       "version": "1.0.2",
+       "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
+
+Do not invoke any skill, and do not spawn subagents of your own G«ˆ you are the reviewer. Return your findings as text in your final message; do not route them through any findings-reporting tool the host may offer.
diff --git a/_bmad-output/implementation-artifacts/edge-case-hunter-prompt.md b/_bmad-output/implementation-artifacts/edge-case-hunter-prompt.md
new file mode 100644
index 0000000..8b62348
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/edge-case-hunter-prompt.md
@@ -0,0 +1,1851 @@
+n++# Edge Case Hunter Review
+
+**Goal:** You are a pure path tracer. Never comment on whether code is good or bad; only list missing handling.
+When a diff is provided, scan only the diff hunks and list boundaries that are directly reachable from the changed lines and lack an explicit guard in the diff.
+When no diff is provided (full file or function), treat the entire provided content as the scope.
+Ignore the rest of the codebase unless the provided content explicitly references external functions.
+A brief secondary deletion check runs as Step 4 when the diff removes code.
+A claims check runs as Step 5.
+
+**Inputs:**
+- **content** +ÛGÈºG«• Content to review, or a path to read it from: diff, full file, or function
+- **also_consider** (optional) +ÛGÈºG«• Areas to keep in mind during review alongside normal edge-case analysis
+- **claims_file** +ÛGÈºG«• Path to the spec this change was built from. Do NOT read it before Step 5: the path tracing in Steps 2+ÛGÈºG«£3 must finish before the claims are seen.
+
+**MANDATORY: Execute steps in the Execution section IN EXACT ORDER. DO NOT skip steps or change the sequence. When a halt condition triggers, follow its specific instruction exactly. Each action within a step is a REQUIRED action to complete that step.**
+
+**Your method is exhaustive path enumeration +ÛGÈºG«• mechanically walk every branch, not hunt by intuition. Report ONLY paths and conditions that lack handling +ÛGÈºG«• discard handled ones silently. Do NOT editorialize or add filler. Do not assign severity labels, rankings, or priority levels.**
+
+
+## EXECUTION
+
+### Step 1: Receive Content
+
+- Take the content to review from the parent message that launched you +ÛGÈºG«• inline, or by reading the file it points to (never from this instruction file)
+- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped +ÛGÈºG«• no analysis performed"}]` and stop
+- Identify content type (diff, full file, or function) to determine scope rules
+
+### Step 2: Exhaustive Path Analysis
+
+**Walk every branching path and boundary condition within scope +ÛGÈºG«• report only unhandled ones.**
+
+- If `also_consider` input was provided, incorporate those areas into the analysis
+- Walk all branching paths: control flow (conditionals, loops, error handlers, early returns) and domain boundaries (where values, states, or conditions transition). Derive the relevant edge classes from the content itself +ÛGÈºG«• don't rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
+- Consider implicit branches: the diff special-cases or changes the handling of one or more members of a fixed set of values +ÛGÈºG«• enums, status codes, sentinels, type tags, flags, value ranges. The rest of the set is implicit branches (e.g. the diff changes the `RED` and `YELLOW` cases of a `RED`/`YELLOW`/`GREEN` enum; `GREEN` is the implicit branch)
+- Consider handle lifetime: when the changed code re-checks, re-fetches, or re-validates something it already held +ÛGÈºG«• a handle, index, id, pointer +ÛGÈºG«• the re-check exists because an intervening call can invalidate it. Identify that call, what it does to the thing held, and what the changed code silently skips when the re-check fails
+- For each call site the diff adds or changes +ÛGÈºG«• in test files as well as production code +ÛGÈºG«• read the callee's declaration and check the call against it: argument count, order, types, and defaults. Report any mismatch
+- For each path: determine whether the content handles it
+- Collect only the unhandled paths as findings +ÛGÈºG«• discard handled ones silently
+
+### Step 3: Validate Completeness
+
+- Revisit every edge class from Step 2 +ÛGÈºG«• e.g., missing else/default, null/empty inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps
+- Add any newly found unhandled paths to findings; discard confirmed-handled ones
+
+### Step 4: Deletion Check
+
+If the diff removed or replaced meaningful code (ignore pure renames and whitespace): load `references/deletion-check.md` and follow it.
+
+### Step 5: Claims Check
+
+Load `references/claims-check.md` and follow it.
+
+### Step 6: Present Findings
+
+Output all findings as a single JSON array following the Output Format specification exactly.
+
+
+## OUTPUT FORMAT
+
+Return ONLY a valid JSON array of objects. Each edge-case finding contains exactly these four fields:
+
+```json
+[{
+  "location": "file:start-end (or file:line when single line, or file:hunk when exact line unavailable)",
+  "trigger_condition": "one-line description (max 15 words)",
+  "guard_snippet": "minimal code sketch that closes the gap (single-line escaped string, no raw newlines or unescaped quotes)",
+  "potential_consequence": "what could actually go wrong (max 15 words)"
+}]
+```
+
+No extra text, no explanations, no markdown wrapping. An empty array `[]` is valid when nothing is found. Deletion findings from Step 4 and claim findings from Step 5, if any, go in the same array with the extra fields defined in `references/deletion-check.md` and `references/claims-check.md`.
+
+
+## HALT CONDITIONS
+
+- If no content is supplied, or it is empty, unreadable, or cannot be decoded as text, return `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped +ÛGÈºG«• no analysis performed"}]` and stop
+<reference path="references/deletion-check.md">
+# Deletion Check
+
+Secondary pass for the Edge Case Hunter +ÛGÈºG«• runs only when the diff removed meaningful code. Subordinate to the edge-case pass; findings are usually few or none.
+
+For each chunk of removed or replaced code (ignore pure renames and whitespace), ask: did it carry behavior or a contract that the change neither re-established nor intentionally retired? Add a finding for any resulting regression, orphaned reference, or newly-dead code. Skip anything already covered by your edge-case findings.
+
+Append each finding to the same JSON array as the edge-case findings, with the four standard fields plus:
+
+- `kind`: `"deletion"`
+- `confidence`: `"high"`, `"medium"`, or `"low"` +ÛGÈºG«• these are inferences; rate them
+
+For a deletion finding the standard fields read as: `location` = the removed item; `trigger_condition` = the behavior or contract it enforced; `guard_snippet` = where or how to re-establish it; `potential_consequence` = the regression or orphan.
+
+Add nothing if nothing qualifies.
+</reference>
+<reference path="references/claims-check.md">
+# Claims Check
+
+Final pass for the Edge Case Hunter. Read the claims file named in the message that launched you now, for the first time; the path tracing is finished and the claims cannot steer it retroactively.
+
+It is the spec the change was built from. Read only its `## Intent` and `## Tasks & Acceptance` sections +ÛGÈºG«• the claims live there; ignore the rest of the file. The spec is the change's own account of itself: testimony, not evidence +ÛGÈºG«• a claim repeated in a code comment is still the same claim, not confirmation. Extract each checkable claim +ÛGÈºG«• what the change does, what it preserves, ordering, arithmetic, and parity with existing code ("exactly as X does") +ÛGÈºG«• then try to falsify each one against the code you have already traced. Where your trace is not enough to decide, read the code that decides it: the compared-to function, the actual callee, the state the claim assumes.
+
+Append one finding per falsified claim to the same JSON array, with the four standard fields plus:
+
+- `kind`: `"claim"`
+- `confidence`: `"high"`, `"medium"`, or `"low"`
+
+For a claim finding the standard fields read as: `location` = where the code contradicts the claim; `trigger_condition` = the claim, quoted or tightly paraphrased; `guard_snippet` = what the code actually does; `potential_consequence` = what goes wrong for someone who believed the claim.
+
+Verified claims produce nothing. Add nothing if nothing is falsified.
+</reference>
+
+## CONTENT SOURCE
+
+"Review content:" in the message that launched you gives the content itself or a path to read it from. Read the file when it is a path; either way that is the content under review, and this instruction file never is.
+
+
+claims_file (leave unread until your instructions call for it):
+---
+title: 'Story 1.2: HR Admin Authentication & Base Layout'
+type: 'feature'
+created: '2026-09-23'
+status: 'in-review'
+baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
+route: 'dispatch'
+review_loop_iteration: 0
+context:
+  - '_bmad-output/planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md'
+  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md'
+  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/EXPERIENCE.md'
+---
+
+<frozen-after-approval reason="human-owned intent +ÛGÈºG«• do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** HR administrators cannot authenticate into the system, and the application lacks the persistent administrative navigation shell (fixed 260px sidebar and elevation-0 top App Bar) required to manage employees, salary structures, and payslips.
+
+**Approach:** Implement stateful HR administrator authentication using opaque tokens (<12 chars) stored in Redis session storage, Redux Toolkit auth state management, and the Material UI base admin layout adhering to DESIGN.md visual tokens.
+
+## Boundaries & Constraints
+
+**Always:**
+- Adhere to AD-3: Authentication uses an opaque token of less than 12 characters, stored as a key in Redis (`session:<token>`) with session data (`UserSession`), passed in HTTP headers as `Authorization: Bearer <token>`.
+- Enforce DESIGN.md layout invariants: fixed 260px sidebar (white `#ffffff`, border-right `1px solid #e5e7eb`), top App Bar (`elevation: 0`, background `#ffffff`, text color `#111827`, border-bottom `1px solid #e5e7eb`), container padding `24px`, background `#f4f6f8`.
+- Manage client auth state using Redux Toolkit (`authSlice`) and persist session tokens in browser session storage for page reload resilience.
+- Protect all `/admin/*` routes via `ProtectedRoute` guard; unauthenticated visits must redirect to `/login`.
+- Include standard admin navigation links: Dashboard (`/admin/dashboard`), Employees (`/admin/employees`), Salary Config (`/admin/salary-config`), and Payslips (`/admin/payslips`), highlighting active route with primary color `#1976d2`.
+
+**Never:**
+- Do not use stateless JWTs (violates AD-3).
+- Do not create an API gateway (violates AD-2: direct microservice invocation).
+- Do not implement employee portal login or password setup flows in this story (deferred to Epic 2).
+- Do not introduce heavy drop shadows on cards, appbar, or sidebar (violates flat elevation design rules).
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Valid HR Login | HR Admin submits valid email and password on `/login` | Authenticates, generates opaque token (<12 chars), stores session in Redis, populates Redux state, redirects to `/admin/dashboard` | N/A |
+| Invalid Credentials | User enters invalid email or incorrect password | Login rejected (401), displays inline error alert banner on login form, preserves email input | "Invalid email or password" displayed cleanly without full reload |
+| Unauthenticated Admin Access | Anonymous user navigates to `/admin/dashboard` or other `/admin/*` routes | Blocked by `ProtectedRoute`, automatically redirected to `/login` | Preserves intended destination for post-login redirect |
+| Authenticated User Accesses Login | Active HR Admin navigates to `/login` | Detects valid session in Redux/storage, immediately redirects to `/admin/dashboard` | Seamless redirect without flashing login form |
+| HR Admin Logout | Authenticated HR Admin clicks Logout button in App Bar / Sidebar | Calls logout API/store, removes token from Redis session store, clears Redux state & storage, redirects to `/login` | Graceful state cleanup |
+| Token Expiration / Revocation | Session in Redis expires or is invalid | Next authenticated call detects missing session, resets Redux auth state, redirects to `/login` with notification | Clear session expiration message |
+
+</frozen-after-approval>
+
+## Code Map
+
+- `libs/shared-types/src/index.ts` -- Shared auth DTOs (`LoginCredentialsDto`, `AuthResponseDto`) and role types.
+- `libs/shared-auth/src/index.ts` -- Shared auth constants, bearer token parser, and opaque token generator.
+- `libs/shared-auth/src/session-store.ts` -- Redis session store implementation with in-memory fallback for offline/test environments.
+- `libs/shared-auth/src/session-store.spec.ts` -- Unit tests validating opaque token generation and Redis session lifecycle.
+- `apps/frontend-web/src/store/index.ts` -- Redux Toolkit store setup with typed `useAppDispatch` and `useAppSelector` hooks.
+- `apps/frontend-web/src/store/slices/authSlice.ts` -- Redux slice for authentication state, login, logout, and token persistence.
+- `apps/frontend-web/src/services/authService.ts` -- Client authentication service communicating with auth endpoints with development mock adapter.
+- `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Route guard redirecting unauthenticated users to `/login`.
+- `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Base layout rendering fixed 260px sidebar, navigation items, elevation-0 App Bar, and page container.
+- `apps/frontend-web/src/pages/LoginPage.tsx` -- Material UI login screen with email/password validation, error banners, and loading state.
+- `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Initial dashboard placeholder verifying successful navigation and layout rendering.
+- `apps/frontend-web/src/app/App.tsx` -- Root application router configured with `/login`, `/admin/*`, and default redirects.
+- `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Unit tests for sidebar navigation, 260px width, App Bar, and logout action.
+- `apps/frontend-web/src/pages/LoginPage.spec.tsx` -- Unit tests for login submission, validation, error alert, and successful redirect.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
+- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
+- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
+- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
+- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
+- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
+- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
+- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
+- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
+- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
+- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
+- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
+
+**Acceptance Criteria:**
+- Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
+- Given invalid credentials submitted on `/login`, when login fails, then an inline error alert is displayed and user remains on `/login`.
+- Given an unauthenticated visitor navigating to `/admin/*`, when accessed, then visitor is redirected to `/login`.
+- Given an authenticated HR administrator on `/admin/dashboard`, when inspecting the layout, then a fixed 260px sidebar is rendered on the left, an elevation-0 App Bar is at the top, and content is padded by 24px on a `#f4f6f8` background.
+- Given an authenticated HR administrator, when clicking the Logout button, then the session is destroyed in Redis, local auth state is cleared, and user is redirected to `/login`.
+
+## Implementation Notes
+
+## Spec Change Log
+
+## Review Triage Log
+
+## Design Notes
+
+- The Admin Layout directly implements specifications from `DESIGN.md`:
+  - Sidebar: fixed `width: 260px`, `background: #ffffff`, border-right `1px solid #e5e7eb`.
+  - App Bar: `elevation: 0`, `background: #ffffff`, `color: #111827`, border-bottom `1px solid #e5e7eb`.
+  - Container padding: `24px` on main container with background `#f4f6f8`.
+  - Active navigation item: highlighted with primary `#1976d2` and subtle background tint (`rgba(25, 118, 210, 0.08)`).
+- Session auth adheres strictly to `ARCHITECTURE-SPINE.md` AD-3:
+  - Opaque token format: 10-character alphanumeric string (generated via cryptographically secure random bytes).
+  - Stored in Redis with prefix `session:<token>`.
+
+## Verification
+
+**Commands:**
+- `npm test` -- expected: All unit tests in `frontend-web` and `shared-auth` pass.
+- `npm run build` -- expected: Monorepo builds cleanly without TypeScript or bundling errors.
+
+**Manual checks (if no CLI):**
+- Verify `/login` form renders correctly with email/password inputs.
+- Verify logging in with valid credentials transitions smoothly to `/admin/dashboard` displaying sidebar and App Bar.
+- Verify logging out clears session and returns to `/login`.
+
+
+Review content:
+diff --git a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+index 69a0e41..be74a6a 100644
+--- a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
++++ b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+@@ -2,7 +2,8 @@
+ title: 'Story 1.2: HR Admin Authentication & Base Layout'
+ type: 'feature'
+ created: '2026-09-23'
+-status: 'ready-for-dev'
++status: 'in-review'
++baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
+ route: 'dispatch'
+ review_loop_iteration: 0
+ context:
+@@ -67,18 +68,18 @@ context:
+ ## Tasks & Acceptance
+ 
+ **Execution:**
+-- [ ] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
+-- [ ] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
+-- [ ] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
+-- [ ] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
+-- [ ] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
+-- [ ] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
+-- [ ] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
+-- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
+-- [ ] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
+-- [ ] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
++- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
++- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
++- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
++- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
++- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
++- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
++- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
++- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
++- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
++- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
++- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
++- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
+ 
+ **Acceptance Criteria:**
+ - Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
+diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
+index e172c16..0642af4 100644
+--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
++++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
+@@ -1,5 +1,5 @@
+ generated: 09-23-2026 17:01
+-last_updated: 09-23-2026 18:25
++last_updated: 09-24-2026 08:36
+ project: salary_management_system
+ project_key: NOKEY
+ tracking_system: file-system
+@@ -8,7 +8,7 @@ story_location: "c:/Users/navan/projects/salary_management_system/_bmad-output/i
+ development_status:
+   epic-1: in-progress
+   1-1-project-foundation-ui-theme-initialization: done
+-  1-2-hr-admin-authentication-base-layout: ready-for-dev
++  1-2-hr-admin-authentication-base-layout: in-progress
+   1-3-organization-profile-setup: ready-for-dev
+   1-4-hr-dashboard-overview: ready-for-dev
+   epic-1-retrospective: optional
+diff --git a/apps/frontend-web/package.json b/apps/frontend-web/package.json
+index 1b19f12..89a7e1c 100644
+--- a/apps/frontend-web/package.json
++++ b/apps/frontend-web/package.json
+@@ -12,10 +12,14 @@
+   "dependencies": {
+     "@emotion/react": "^11.14.0",
+     "@emotion/styled": "^11.14.0",
++    "@mui/icons-material": "^6.5.0",
+     "@mui/material": "^6.4.4",
++    "@reduxjs/toolkit": "^2.12.0",
+     "@salary-mgmt/shared-types": "*",
+     "react": "^18.3.1",
+-    "react-dom": "^18.3.1"
++    "react-dom": "^18.3.1",
++    "react-redux": "^9.3.0",
++    "react-router-dom": "^7.18.4"
+   },
+   "devDependencies": {
+     "@testing-library/jest-dom": "^6.6.3",
+diff --git a/apps/frontend-web/src/app/App.spec.tsx b/apps/frontend-web/src/app/App.spec.tsx
+index 844b816..19660bf 100644
+--- a/apps/frontend-web/src/app/App.spec.tsx
++++ b/apps/frontend-web/src/app/App.spec.tsx
+@@ -1,15 +1,13 @@
+ import { render, screen } from '@testing-library/react';
+ import { describe, it, expect } from 'vitest';
+ import React from 'react';
+-import App, { AppContent } from './App';
++import App from './App';
+ import { theme, designTokens } from '../theme/theme';
+-import { AppThemeProvider } from '../theme/ThemeProvider';
+ 
+-describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+-  it('renders application with global theme provider and heading', () => {
++describe('App component', () => {
++  it('renders application and redirects to login by default', () => {
+     render(<App />);
+-    expect(screen.getByText(/Foundation & UI Theme Initialized/i)).toBeInTheDocument();
+-    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
+   });
+ 
+   it('verifies custom theme tokens adhere strictly to DESIGN.md', () => {
+@@ -24,28 +22,4 @@ describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+     expect(theme.typography.fontFamily).toContain('Inter');
+     expect(theme.typography.fontFamily).toContain('Roboto');
+   });
+-
+-  it('renders theme tokens in the UI preview card', () => {
+-    render(
+-      <AppThemeProvider>
+-        <AppContent />
+-      </AppThemeProvider>
+-    );
+-
+-    const primaryColorText = screen.getByText('#1976d2');
+-    expect(primaryColorText).toBeInTheDocument();
+-
+-    const bgDefaultText = screen.getByText('#f4f6f8');
+-    expect(bgDefaultText).toBeInTheDocument();
+-
+-    const borderRadiusText = screen.getByText('8px');
+-    expect(borderRadiusText).toBeInTheDocument();
+-  });
+-
+-  it('successfully consumes models from @salary-mgmt/shared-types', () => {
+-    render(<App />);
+-    expect(screen.getByText(/ACME Technologies Pvt Ltd/i)).toBeInTheDocument();
+-    expect(screen.getByText(/+Ù+¨GÚ˙ INR/i)).toBeInTheDocument();
+-    expect(screen.getByText(/HR Administrator/i)).toBeInTheDocument();
+-  });
+ });
+diff --git a/apps/frontend-web/src/app/App.tsx b/apps/frontend-web/src/app/App.tsx
+index acaba5e..a19e5d5 100644
+--- a/apps/frontend-web/src/app/App.tsx
++++ b/apps/frontend-web/src/app/App.tsx
+@@ -1,173 +1,43 @@
+ import React from 'react';
+-import AppBar from '@mui/material/AppBar';
+-import Toolbar from '@mui/material/Toolbar';
+-import Typography from '@mui/material/Typography';
+-import Container from '@mui/material/Container';
+-import Box from '@mui/material/Box';
+-import Card from '@mui/material/Card';
+-import CardContent from '@mui/material/CardContent';
+-import Button from '@mui/material/Button';
+-import Stack from '@mui/material/Stack';
+-import Chip from '@mui/material/Chip';
+-import { useTheme } from '@mui/material/styles';
++import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
++import { Provider } from 'react-redux';
+ import { AppThemeProvider } from '../theme/ThemeProvider';
+-import { OrganizationProfile, UserRole } from '@salary-mgmt/shared-types';
+-
+-export const AppContent: React.FC = () => {
+-  const currentTheme = useTheme();
+-
+-  const demoProfile: OrganizationProfile = {
+-    id: 'org-demo-001',
+-    name: 'ACME Technologies Pvt Ltd',
+-    code: 'ACME',
+-    contactEmail: 'admin@acme.corp',
+-    currency: 'INR',
+-    createdAt: '2026-09-23T00:00:00Z',
+-    updatedAt: '2026-09-23T00:00:00Z',
+-  };
+-
+-  const sampleRole: UserRole = 'hr_admin';
+-
+-  return (
+-    <Box
+-      data-testid="app-container"
+-      sx={{
+-        minHeight: '100vh',
+-        backgroundColor: currentTheme.palette.background.default,
+-        display: 'flex',
+-        flexDirection: 'column',
+-      }}
+-    >
+-      <AppBar position="static" data-testid="app-bar">
+-        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
+-          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
+-            Salary Management System
+-          </Typography>
+-          <Chip
+-            label={sampleRole === 'hr_admin' ? 'HR Administrator' : 'Employee'}
+-            size="small"
+-            color="primary"
+-            variant="outlined"
+-            data-testid="role-chip"
+-          />
+-        </Toolbar>
+-      </AppBar>
+-
+-      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
+-        <Stack spacing={3}>
+-          <Box>
+-            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
+-              Foundation & UI Theme Initialized
+-            </Typography>
+-            <Typography variant="body1" color="text.secondary">
+-              The foundational Nx monorepo, shared types, and Material UI design system are active.
+-            </Typography>
+-          </Box>
+-
+-          <Box
+-            sx={{
+-              display: 'grid',
+-              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
+-              gap: 3,
+-            }}
+-          >
+-            <Card data-testid="theme-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Design Tokens Preview
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Color:</Typography>
+-                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
+-                      <Box
+-                        data-testid="primary-color-swatch"
+-                        sx={{
+-                          width: 20,
+-                          height: 20,
+-                          borderRadius: '4px',
+-                          backgroundColor: currentTheme.palette.primary.main,
+-                        }}
+-                      />
+-                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                        {currentTheme.palette.primary.main}
+-                      </Typography>
+-                    </Box>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Background Default:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.palette.background.default}
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Card Border Radius:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.shape.borderRadius}px
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Font:</Typography>
+-                    <Typography
+-                      variant="body2"
+-                      data-testid="font-family-label"
+-                      sx={{ maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}
+-                    >
+-                      {currentTheme.typography.fontFamily}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-              </CardContent>
+-            </Card>
+-
+-            <Card data-testid="shared-type-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Shared Models & Architecture
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Organization Profile:</Typography>
+-                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
+-                      {demoProfile.name}
+-                    </Typography>
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Currency Standard:</Typography>
+-                    <Chip label={`+Ù+¨GÚ˙ ${demoProfile.currency}`} size="small" />
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Org Code:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {demoProfile.code}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
+-                  <Button variant="contained" color="primary" size="medium">
+-                    Primary Action
+-                  </Button>
+-                  <Button variant="outlined" color="primary" size="medium">
+-                    Outlined Action
+-                  </Button>
+-                </Box>
+-              </CardContent>
+-            </Card>
+-          </Box>
+-        </Stack>
+-      </Container>
+-    </Box>
+-  );
+-};
++import { store } from '../store';
++import { LoginPage } from '../pages/LoginPage';
++import { AdminLayout } from '../layouts/AdminLayout';
++import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
++import { ProtectedRoute } from '../components/ProtectedRoute';
+ 
+ export const App: React.FC = () => {
+   return (
+-    <AppThemeProvider>
+-      <AppContent />
+-    </AppThemeProvider>
++    <Provider store={store}>
++      <AppThemeProvider>
++        <BrowserRouter>
++          <Routes>
++            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
++            
++            <Route path="/login" element={<LoginPage />} />
++            
++            <Route 
++              path="/admin" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              }
++            >
++              <Route index element={<Navigate to="dashboard" replace />} />
++              <Route path="dashboard" element={<AdminDashboardPlaceholder />} />
++              <Route path="employees" element={<div>Employees Page (Not Implemented)</div>} />
++              <Route path="salary-config" element={<div>Salary Config (Not Implemented)</div>} />
++              <Route path="payslips" element={<div>Payslips (Not Implemented)</div>} />
++            </Route>
++
++            <Route path="*" element={<Navigate to="/login" replace />} />
++          </Routes>
++        </BrowserRouter>
++      </AppThemeProvider>
++    </Provider>
+   );
+ };
+ 
+diff --git a/apps/frontend-web/src/components/ProtectedRoute.tsx b/apps/frontend-web/src/components/ProtectedRoute.tsx
+new file mode 100644
+index 0000000..495d14e
+--- /dev/null
++++ b/apps/frontend-web/src/components/ProtectedRoute.tsx
+@@ -0,0 +1,22 @@
++import React from 'react';
++import { Navigate, useLocation } from 'react-router-dom';
++import { useAppSelector } from '../store';
++
++interface ProtectedRouteProps {
++  children: React.ReactNode;
++}
++
++export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
++  const { isAuthenticated } = useAppSelector((state) => state.auth);
++  const location = useLocation();
++
++  if (!isAuthenticated) {
++    // Redirect them to the /login page, but save the current location they were
++    // trying to go to when they were redirected. This allows us to send them
++    // along to that page after they login, which is a nicer user experience
++    // than dropping them off on the home page.
++    return <Navigate to="/login" state={{ from: location }} replace />;
++  }
++
++  return <>{children}</>;
++};
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.spec.tsx b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+new file mode 100644
+index 0000000..43ae7b6
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+@@ -0,0 +1,91 @@
++import React from 'react';
++import { render, screen, fireEvent } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import authReducer from '../store/slices/authSlice';
++import { AdminLayout } from './AdminLayout';
++import { ProtectedRoute } from '../components/ProtectedRoute';
++
++const createTestStore = (isAuthenticated = true) => {
++  return configureStore({
++    reducer: { auth: authReducer },
++    preloadedState: {
++      auth: {
++        isAuthenticated,
++        session: null,
++        isLoading: false,
++        error: null
++      }
++    }
++  });
++};
++
++describe('AdminLayout & ProtectedRoute', () => {
++  it('renders sidebar navigation items when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <BrowserRouter>
++          <AdminLayout />
++        </BrowserRouter>
++      </Provider>
++    );
++
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++    expect(screen.getByText('Dashboard')).toBeInTheDocument();
++    expect(screen.getByText('Employees')).toBeInTheDocument();
++    expect(screen.getByText('Salary Config')).toBeInTheDocument();
++    expect(screen.getByText('Payslips')).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
++  });
++
++  it('redirects to login when unauthenticated accessing protected route', () => {
++    const store = createTestStore(false);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    // Should redirect to login
++    expect(screen.getByText('Login Page')).toBeInTheDocument();
++    expect(screen.queryByText('HR Administration')).not.toBeInTheDocument();
++  });
++
++  it('allows access to protected route when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.tsx b/apps/frontend-web/src/layouts/AdminLayout.tsx
+new file mode 100644
+index 0000000..9d65b6f
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.tsx
+@@ -0,0 +1,137 @@
++import React from 'react';
++import { Outlet, useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Drawer, 
++  AppBar, 
++  Toolbar, 
++  Typography, 
++  List, 
++  ListItem, 
++  ListItemButton, 
++  ListItemIcon, 
++  ListItemText,
++  Button
++} from '@mui/material';
++import DashboardIcon from '@mui/icons-material/Dashboard';
++import PeopleIcon from '@mui/icons-material/People';
++import SettingsIcon from '@mui/icons-material/Settings';
++import ReceiptIcon from '@mui/icons-material/Receipt';
++import LogoutIcon from '@mui/icons-material/Logout';
++import { useAppDispatch } from '../store';
++import { logout } from '../store/slices/authSlice';
++
++const drawerWidth = 260;
++
++export const AdminLayout: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++
++  const handleLogout = async () => {
++    await dispatch(logout());
++    navigate('/login');
++  };
++
++  const navItems = [
++    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
++    { text: 'Employees', path: '/admin/employees', icon: <PeopleIcon /> },
++    { text: 'Salary Config', path: '/admin/salary-config', icon: <SettingsIcon /> },
++    { text: 'Payslips', path: '/admin/payslips', icon: <ReceiptIcon /> },
++  ];
++
++  return (
++    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
++      <AppBar
++        position="fixed"
++        elevation={0}
++        sx={{
++          width: `calc(100% - ${drawerWidth}px)`,
++          ml: `${drawerWidth}px`,
++          backgroundColor: '#ffffff',
++          color: '#111827',
++          borderBottom: '1px solid #e5e7eb',
++        }}
++      >
++        <Toolbar>
++          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            HR Administration
++          </Typography>
++          <Button 
++            color="inherit" 
++            onClick={handleLogout}
++            endIcon={<LogoutIcon />}
++            sx={{ textTransform: 'none' }}
++          >
++            Logout
++          </Button>
++        </Toolbar>
++      </AppBar>
++      
++      <Drawer
++        sx={{
++          width: drawerWidth,
++          flexShrink: 0,
++          '& .MuiDrawer-paper': {
++            width: drawerWidth,
++            boxSizing: 'border-box',
++            backgroundColor: '#ffffff',
++            borderRight: '1px solid #e5e7eb',
++          },
++        }}
++        variant="permanent"
++        anchor="left"
++      >
++        <Toolbar>
++          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            Salary Mgmt
++          </Typography>
++        </Toolbar>
++        
++        <List sx={{ px: 1 }}>
++          {navItems.map((item) => {
++            const isActive = location.pathname.startsWith(item.path);
++            return (
++              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
++                <ListItemButton
++                  onClick={() => navigate(item.path)}
++                  sx={{
++                    borderRadius: '6px',
++                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
++                    color: isActive ? '#1976d2' : '#6b7280',
++                    '&:hover': {
++                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
++                    }
++                  }}
++                >
++                  <ListItemIcon sx={{ color: isActive ? '#1976d2' : '#6b7280', minWidth: '40px' }}>
++                    {item.icon}
++                  </ListItemIcon>
++                  <ListItemText 
++                    primary={item.text} 
++                    primaryTypographyProps={{ 
++                      fontWeight: isActive ? 600 : 500,
++                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
++                    }} 
++                  />
++                </ListItemButton>
++              </ListItem>
++            );
++          })}
++        </List>
++      </Drawer>
++      
++      <Box
++        component="main"
++        sx={{
++          flexGrow: 1,
++          p: '24px',
++          width: `calc(100% - ${drawerWidth}px)`,
++          mt: '64px' // Toolbar height
++        }}
++      >
++        <Outlet />
++      </Box>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+new file mode 100644
+index 0000000..c48896a
+--- /dev/null
++++ b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+@@ -0,0 +1,20 @@
++import React from 'react';
++import { Box, Typography, Card, CardContent } from '@mui/material';
++
++export const AdminDashboardPlaceholder: React.FC = () => {
++  return (
++    <Box>
++      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++        Dashboard Overview
++      </Typography>
++      
++      <Card sx={{ mt: 3, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
++        <CardContent sx={{ p: 4 }}>
++          <Typography variant="body1" color="text.secondary">
++            Welcome to the HR Admin Dashboard. The full dashboard implementation is scheduled for a future sprint.
++          </Typography>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/LoginPage.spec.tsx b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+new file mode 100644
+index 0000000..7e0e2c5
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+@@ -0,0 +1,95 @@
++import React from 'react';
++import { render, screen, fireEvent, waitFor } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import { vi } from 'vitest';
++import authReducer from '../store/slices/authSlice';
++import { LoginPage } from './LoginPage';
++import { authService } from '../services/authService';
++
++// Mock authService
++vi.mock('../services/authService', () => ({
++  authService: {
++    login: vi.fn()
++  }
++}));
++
++const renderWithProviders = (
++  ui: React.ReactElement,
++  {
++    preloadedState = {},
++    store = configureStore({
++      reducer: { auth: authReducer },
++      preloadedState,
++    }),
++    ...renderOptions
++  } = {}
++) => {
++  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
++    return <Provider store={store}><BrowserRouter>{children}</BrowserRouter></Provider>;
++  };
++  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
++};
++
++describe('LoginPage', () => {
++  beforeEach(() => {
++    vi.clearAllMocks();
++  });
++
++  it('renders login form elements', () => {
++    renderWithProviders(<LoginPage />);
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
++    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
++    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
++  });
++
++  it('shows validation error for empty fields', async () => {
++    renderWithProviders(<LoginPage />);
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Email is required')).toBeInTheDocument();
++  });
++
++  it('shows validation error for missing password', async () => {
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Password is required')).toBeInTheDocument();
++  });
++
++  it('submits form when fields are valid', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockResolvedValueOnce({ token: '123', user: { id: '1' } });
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    await waitFor(() => {
++      expect(mockLogin).toHaveBeenCalledWith({
++        email: 'admin@example.com',
++        password: 'password123'
++      });
++    });
++  });
++
++  it('displays error on failed login', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/pages/LoginPage.tsx b/apps/frontend-web/src/pages/LoginPage.tsx
+new file mode 100644
+index 0000000..331ef8c
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.tsx
+@@ -0,0 +1,136 @@
++import React, { useState } from 'react';
++import { useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Card, 
++  CardContent, 
++  Typography, 
++  TextField, 
++  Button, 
++  Alert,
++  CircularProgress
++} from '@mui/material';
++import { useAppDispatch, useAppSelector } from '../store';
++import { login, clearError } from '../store/slices/authSlice';
++
++export const LoginPage: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
++
++  const [email, setEmail] = useState('');
++  const [password, setPassword] = useState('');
++  const [validationError, setValidationError] = useState('');
++
++  // If already authenticated, redirect to admin dashboard
++  React.useEffect(() => {
++    if (isAuthenticated) {
++      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
++      navigate(from, { replace: true });
++    }
++  }, [isAuthenticated, navigate, location]);
++
++  const handleSubmit = async (e: React.FormEvent) => {
++    e.preventDefault();
++    setValidationError('');
++    
++    if (error) {
++      dispatch(clearError());
++    }
++
++    if (!email) {
++      setValidationError('Email is required');
++      return;
++    }
++    
++    if (!password) {
++      setValidationError('Password is required');
++      return;
++    }
++
++    await dispatch(login({ email, password }));
++  };
++
++  return (
++    <Box 
++      sx={{ 
++        minHeight: '100vh', 
++        display: 'flex', 
++        alignItems: 'center', 
++        justifyContent: 'center',
++        backgroundColor: '#f4f6f8'
++      }}
++    >
++      <Card 
++        sx={{ 
++          maxWidth: 400, 
++          width: '100%', 
++          borderRadius: '12px',
++          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
++        }}
++      >
++        <CardContent sx={{ p: '32px' }}>
++          <Typography 
++            variant="h5" 
++            component="h1" 
++            align="center" 
++            gutterBottom
++            sx={{ fontWeight: 700, mb: 3, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}
++          >
++            HR Login
++          </Typography>
++
++          {(error || validationError) && (
++            <Alert severity="error" sx={{ mb: 3 }}>
++              {error || validationError}
++            </Alert>
++          )}
++
++          <form onSubmit={handleSubmit}>
++            <TextField
++              label="Email Address"
++              variant="outlined"
++              fullWidth
++              margin="normal"
++              value={email}
++              onChange={(e) => setEmail(e.target.value)}
++              disabled={isLoading}
++              autoComplete="email"
++            />
++            
++            <TextField
++              label="Password"
++              variant="outlined"
++              type="password"
++              fullWidth
++              margin="normal"
++              value={password}
++              onChange={(e) => setPassword(e.target.value)}
++              disabled={isLoading}
++              autoComplete="current-password"
++            />
++            
++            <Button
++              type="submit"
++              variant="contained"
++              fullWidth
++              disabled={isLoading}
++              sx={{ 
++                mt: 3, 
++                mb: 2, 
++                py: 1.5,
++                borderRadius: '6px',
++                backgroundColor: '#1976d2',
++                fontWeight: 600,
++                textTransform: 'none'
++              }}
++            >
++              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
++            </Button>
++          </form>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/services/authService.ts b/apps/frontend-web/src/services/authService.ts
+new file mode 100644
+index 0000000..a5725fd
+--- /dev/null
++++ b/apps/frontend-web/src/services/authService.ts
+@@ -0,0 +1,78 @@
++import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';
++
++export type LoginRequest = LoginCredentialsDto;
++
++class AuthService {
++  private baseUrl = '/api/auth';
++  private useMock = true; // Use mock adapter for development
++
++  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
++    if (this.useMock) {
++      return this.mockLogin(credentials);
++    }
++
++    const response = await fetch(`${this.baseUrl}/login`, {
++      method: 'POST',
++      headers: {
++        'Content-Type': 'application/json',
++      },
++      body: JSON.stringify(credentials),
++    });
++
++    if (!response.ok) {
++      const error = await response.json();
++      throw new Error(error.message || 'Login failed');
++    }
++
++    const result = await response.json();
++    return result.data as AuthResponseDto;
++  }
++
++  async logout(): Promise<void> {
++    if (this.useMock) {
++      return new Promise(resolve => setTimeout(resolve, 300));
++    }
++
++    const sessionData = sessionStorage.getItem('auth_session');
++    let token = '';
++    if (sessionData) {
++      try {
++        const parsed = JSON.parse(sessionData);
++        token = parsed.token;
++      } catch (e) {}
++    }
++
++    const response = await fetch(`${this.baseUrl}/logout`, {
++      method: 'POST',
++      headers: {
++        'Authorization': `Bearer ${token}`
++      }
++    });
++
++    if (!response.ok) {
++      console.error('Logout failed on server');
++    }
++  }
++
++  private mockLogin(credentials: LoginRequest): Promise<AuthResponseDto> {
++    return new Promise((resolve, reject) => {
++      setTimeout(() => {
++        if (credentials.email === 'admin@salarymgmt.com' && credentials.password === 'admin123') {
++          resolve({
++            token: 'mock123token',
++            user: {
++              id: 'admin-1',
++              email: 'admin@salarymgmt.com',
++              fullName: 'Admin User',
++              role: 'hr_admin'
++            }
++          });
++        } else {
++          reject(new Error('Invalid email or password'));
++        }
++      }, 500);
++    });
++  }
++}
++
++export const authService = new AuthService();
+diff --git a/apps/frontend-web/src/store/index.ts b/apps/frontend-web/src/store/index.ts
+new file mode 100644
+index 0000000..ec300b9
+--- /dev/null
++++ b/apps/frontend-web/src/store/index.ts
+@@ -0,0 +1,15 @@
++import { configureStore } from '@reduxjs/toolkit';
++import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
++import authReducer from './slices/authSlice';
++
++export const store = configureStore({
++  reducer: {
++    auth: authReducer,
++  },
++});
++
++export type RootState = ReturnType<typeof store.getState>;
++export type AppDispatch = typeof store.dispatch;
++
++export const useAppDispatch = () => useDispatch<AppDispatch>();
++export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
+diff --git a/apps/frontend-web/src/store/slices/authSlice.ts b/apps/frontend-web/src/store/slices/authSlice.ts
+new file mode 100644
+index 0000000..76d786e
+--- /dev/null
++++ b/apps/frontend-web/src/store/slices/authSlice.ts
+@@ -0,0 +1,102 @@
++import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
++import { UserSession } from '@salary-mgmt/shared-types';
++import { authService, LoginRequest } from '../../services/authService';
++
++interface AuthState {
++  session: UserSession | null;
++  isAuthenticated: boolean;
++  isLoading: boolean;
++  error: string | null;
++}
++
++const getInitialSession = (): UserSession | null => {
++  try {
++    const stored = sessionStorage.getItem('auth_session');
++    if (stored) {
++      return JSON.parse(stored) as UserSession;
++    }
++  } catch (e) {
++    console.error('Failed to parse stored session', e);
++  }
++  return null;
++};
++
++const initialSession = getInitialSession();
++
++const initialState: AuthState = {
++  session: initialSession,
++  isAuthenticated: !!initialSession,
++  isLoading: false,
++  error: null,
++};
++
++export const login = createAsyncThunk(
++  'auth/login',
++  async (credentials: LoginRequest, { rejectWithValue }) => {
++    try {
++      const response = await authService.login(credentials);
++      return response;
++    } catch (error: any) {
++      return rejectWithValue(error.message || 'Login failed');
++    }
++  }
++);
++
++export const logout = createAsyncThunk(
++  'auth/logout',
++  async (_, { getState, rejectWithValue }) => {
++    try {
++      await authService.logout();
++    } catch (error: any) {
++      // Proceed to clear state anyway
++      console.error('Logout API failed', error);
++    }
++  }
++);
++
++const authSlice = createSlice({
++  name: 'auth',
++  initialState,
++  reducers: {
++    clearError: (state) => {
++      state.error = null;
++    }
++  },
++  extraReducers: (builder) => {
++    builder
++      .addCase(login.pending, (state) => {
++        state.isLoading = true;
++        state.error = null;
++      })
++      .addCase(login.fulfilled, (state, action) => {
++        state.isLoading = false;
++        state.isAuthenticated = true;
++        
++        // Mock session payload for Redux from AuthResponseDto
++        const mockSession: UserSession = {
++          token: action.payload.token,
++          userId: action.payload.user.id,
++          role: action.payload.user.role,
++          email: action.payload.user.email,
++          organizationId: 'org-1',
++          createdAt: new Date().toISOString(),
++          expiresAt: new Date(Date.now() + 86400000).toISOString(),
++        };
++        
++        state.session = mockSession;
++        sessionStorage.setItem('auth_session', JSON.stringify(mockSession));
++      })
++      .addCase(login.rejected, (state, action) => {
++        state.isLoading = false;
++        state.error = action.payload as string;
++      })
++      .addCase(logout.fulfilled, (state) => {
++        state.session = null;
++        state.isAuthenticated = false;
++        sessionStorage.removeItem('auth_session');
++      });
++  },
++});
++
++export const { clearError } = authSlice.actions;
++export default authSlice.reducer;
+diff --git a/apps/frontend-web/vite.config.ts b/apps/frontend-web/vite.config.ts
+index cf18ebd..19d12a7 100644
+--- a/apps/frontend-web/vite.config.ts
++++ b/apps/frontend-web/vite.config.ts
+@@ -18,5 +18,10 @@ export default defineConfig({
+     globals: true,
+     environment: 'jsdom',
+     setupFiles: ['./src/test/setup.ts'],
++    server: {
++      deps: {
++        inline: ['@mui/icons-material', '@mui/material']
++      }
++    }
+   },
+ });
+diff --git a/libs/shared-auth/src/index.ts b/libs/shared-auth/src/index.ts
+index e305dec..701962b 100644
+--- a/libs/shared-auth/src/index.ts
++++ b/libs/shared-auth/src/index.ts
+@@ -26,3 +26,24 @@ export interface SessionStore {
+   setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
+   deleteSession(token: string): Promise<void>;
+ }
++
++export function generateOpaqueToken(length: number = 10): string {
++  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
++  let token = '';
++  // Use crypto for secure random bytes if available (in node environment)
++  if (typeof process !== 'undefined' && typeof require !== 'undefined') {
++    const crypto = require('crypto');
++    const randomBytes = crypto.randomBytes(length);
++    for (let i = 0; i < length; i++) {
++      token += chars[randomBytes[i] % chars.length];
++    }
++  } else {
++    // Fallback for non-node environments
++    for (let i = 0; i < length; i++) {
++      token += chars.charAt(Math.floor(Math.random() * chars.length));
++    }
++  }
++  return token;
++}
++
++export * from './session-store';
+diff --git a/libs/shared-auth/src/session-store.spec.ts b/libs/shared-auth/src/session-store.spec.ts
+new file mode 100644
+index 0000000..d0e52c2
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.spec.ts
+@@ -0,0 +1,60 @@
++import { generateOpaqueToken, REDIS_SESSION_KEY_PREFIX } from './index';
++import { RedisSessionStore } from './session-store';
++import { UserSession } from '@salary-mgmt/shared-types';
++
++describe('Auth Library', () => {
++  describe('generateOpaqueToken', () => {
++    it('should generate a token of specified length', () => {
++      const token = generateOpaqueToken(10);
++      expect(token.length).toBe(10);
++    });
++
++    it('should generate unique tokens', () => {
++      const token1 = generateOpaqueToken(10);
++      const token2 = generateOpaqueToken(10);
++      expect(token1).not.toBe(token2);
++    });
++  });
++
++  describe('RedisSessionStore (in-memory fallback)', () => {
++    let store: RedisSessionStore;
++    let mockSession: UserSession;
++
++    beforeEach(() => {
++      store = new RedisSessionStore();
++      mockSession = {
++        token: 'test-token',
++        userId: 'user-123',
++        role: 'hr_admin',
++        email: 'test@example.com',
++        organizationId: 'org-123',
++        createdAt: new Date().toISOString(),
++        expiresAt: new Date(Date.now() + 86400000).toISOString()
++      };
++    });
++
++    it('should store and retrieve a session', async () => {
++      await store.setSession('test-token', mockSession);
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toEqual(mockSession);
++    });
++
++    it('should return null for non-existent session', async () => {
++      const retrieved = await store.getSession('non-existent');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should delete a session', async () => {
++      await store.setSession('test-token', mockSession);
++      await store.deleteSession('test-token');
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should handle expired sessions (mocking time)', async () => {
++      await store.setSession('test-token', mockSession, -1); // Expire immediately
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++  });
++});
+diff --git a/libs/shared-auth/src/session-store.ts b/libs/shared-auth/src/session-store.ts
+new file mode 100644
+index 0000000..b58c4b0
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.ts
+@@ -0,0 +1,86 @@
++import { UserSession } from '@salary-mgmt/shared-types';
++import { SessionStore, REDIS_SESSION_KEY_PREFIX } from './index';
++
++// A simple in-memory fallback store
++class InMemorySessionStore implements SessionStore {
++  private store: Map<string, { session: UserSession; expiresAt: number }> = new Map();
++
++  async getSession(token: string): Promise<UserSession | null> {
++    const data = this.store.get(token);
++    if (!data) return null;
++    
++    if (Date.now() > data.expiresAt) {
++      this.store.delete(token);
++      return null;
++    }
++    
++    return data.session;
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    this.store.set(token, {
++      session,
++      expiresAt: Date.now() + (ttlSeconds * 1000)
++    });
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    this.store.delete(token);
++  }
++}
++
++export class RedisSessionStore implements SessionStore {
++  private fallbackStore = new InMemorySessionStore();
++  
++  constructor(private redisClient?: any) {} // Assuming ioredis or redis client
++
++  private getKey(token: string): string {
++    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
++  }
++
++  async getSession(token: string): Promise<UserSession | null> {
++    if (!this.redisClient) {
++      return this.fallbackStore.getSession(token);
++    }
++    
++    try {
++      const data = await this.redisClient.get(this.getKey(token));
++      if (!data) return null;
++      return JSON.parse(data) as UserSession;
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.getSession(token);
++    }
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++    
++    try {
++      await this.redisClient.set(
++        this.getKey(token),
++        JSON.stringify(session),
++        'EX',
++        ttlSeconds
++      );
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.deleteSession(token);
++    }
++    
++    try {
++      await this.redisClient.del(this.getKey(token));
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.deleteSession(token);
++    }
++  }
++}
+diff --git a/libs/shared-types/src/index.ts b/libs/shared-types/src/index.ts
+index 7a2dd89..c3e91cd 100644
+--- a/libs/shared-types/src/index.ts
++++ b/libs/shared-types/src/index.ts
+@@ -46,3 +46,19 @@ export interface ApiResponse<T> {
+   data: T;
+   message?: string;
+ }
++
++export interface LoginCredentialsDto {
++  email: string;
++  password?: string;
++  token?: string; // For magic links
++}
++
++export interface AuthResponseDto {
++  token: string;
++  user: {
++    id: string;
++    email: string;
++    fullName: string;
++    role: UserRole;
++  };
++}
+diff --git a/package-lock.json b/package-lock.json
+index 847886a..01814cc 100644
+--- a/package-lock.json
++++ b/package-lock.json
+@@ -42,10 +42,14 @@
+       "dependencies": {
+         "@emotion/react": "^11.14.0",
+         "@emotion/styled": "^11.14.0",
++        "@mui/icons-material": "^6.5.0",
+         "@mui/material": "^6.4.4",
++        "@reduxjs/toolkit": "^2.12.0",
+         "@salary-mgmt/shared-types": "*",
+         "react": "^18.3.1",
+-        "react-dom": "^18.3.1"
++        "react-dom": "^18.3.1",
++        "react-redux": "^9.3.0",
++        "react-router-dom": "^7.18.4"
+       },
+       "devDependencies": {
+         "@testing-library/jest-dom": "^6.6.3",
+@@ -59,6 +63,32 @@
+         "vitest": "^3.0.5"
+       }
+     },
++    "apps/frontend-web/node_modules/@mui/icons-material": {
++      "version": "6.5.0",
++      "resolved": "https://registry.npmjs.org/@mui/icons-material/-/icons-material-6.5.0.tgz",
++      "integrity": "sha512-VPuPqXqbBPlcVSA0BmnoE4knW4/xG6Thazo8vCLWkOKusko6DtwFV6B665MMWJ9j0KFohTIf3yx2zYtYacvG1g==",
++      "license": "MIT",
++      "dependencies": {
++        "@babel/runtime": "^7.26.0"
++      },
++      "engines": {
++        "node": ">=14.0.0"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/mui-org"
++      },
++      "peerDependencies": {
++        "@mui/material": "^6.5.0",
++        "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
++        "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        }
++      }
++    },
+     "libs/shared-auth": {
+       "name": "@salary-mgmt/shared-auth",
+       "version": "0.1.0",
+@@ -4431,6 +4461,32 @@
+         "url": "https://opencollective.com/popperjs"
+       }
+     },
++    "node_modules/@reduxjs/toolkit": {
++      "version": "2.12.0",
++      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
++      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
++      "license": "MIT",
++      "dependencies": {
++        "@standard-schema/spec": "^1.0.0",
++        "@standard-schema/utils": "^0.3.0",
++        "immer": "^11.0.0",
++        "redux": "^5.0.1",
++        "redux-thunk": "^3.1.0",
++        "reselect": "^5.1.0"
++      },
++      "peerDependencies": {
++        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
++        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
++      },
++      "peerDependenciesMeta": {
++        "react": {
++          "optional": true
++        },
++        "react-redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/@rolldown/pluginutils": {
+       "version": "1.0.0-beta.27",
+       "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
+@@ -5106,6 +5162,18 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@standard-schema/spec": {
++      "version": "1.1.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
++      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
++      "license": "MIT"
++    },
++    "node_modules/@standard-schema/utils": {
++      "version": "0.3.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
++      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
++      "license": "MIT"
++    },
+     "node_modules/@svgr/babel-plugin-add-jsx-attribute": {
+       "version": "8.0.0",
+       "resolved": "https://registry.npmjs.org/@svgr/babel-plugin-add-jsx-attribute/-/babel-plugin-add-jsx-attribute-8.0.0.tgz",
+@@ -5627,6 +5695,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@types/use-sync-external-store": {
++      "version": "0.0.6",
++      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
++      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
++      "license": "MIT"
++    },
+     "node_modules/@vitejs/plugin-react": {
+       "version": "4.7.0",
+       "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
+@@ -8971,6 +9045,16 @@
+         "node": ">= 4"
+       }
+     },
++    "node_modules/immer": {
++      "version": "11.1.18",
++      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.18.tgz",
++      "integrity": "sha512-EQyQtLiYW029lyoczMl/Hh4Xu7cDecSc58JRYpHyL4tIAu3eqd1yJzQX04d2BZHDkzFFvm6qJEJWOtfDSWAXbQ==",
++      "license": "MIT",
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/immer"
++      }
++    },
+     "node_modules/import-fresh": {
+       "version": "3.3.1",
+       "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
+@@ -11031,6 +11115,29 @@
+       "integrity": "sha512-UpMYezM4v5/18F28aC66AEsjXIgE02kyEMH6yLdgLXu/UTfa1Ntwck/nNLrbqJsEXW7gPb0coNO9FQse9WTovA==",
+       "license": "MIT"
+     },
++    "node_modules/react-redux": {
++      "version": "9.3.0",
++      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
++      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
++      "license": "MIT",
++      "dependencies": {
++        "@types/use-sync-external-store": "^0.0.6",
++        "use-sync-external-store": "^1.4.0"
++      },
++      "peerDependencies": {
++        "@types/react": "^18.2.25 || ^19",
++        "react": "^18.0 || ^19",
++        "redux": "^5.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        },
++        "redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/react-refresh": {
+       "version": "0.17.0",
+       "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
+@@ -11041,6 +11148,57 @@
+         "node": ">=0.10.0"
+       }
+     },
++    "node_modules/react-router": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
++      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
++      "license": "MIT",
++      "dependencies": {
++        "cookie": "^1.0.1",
++        "set-cookie-parser": "^2.6.0"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      },
++      "peerDependenciesMeta": {
++        "react-dom": {
++          "optional": true
++        }
++      }
++    },
++    "node_modules/react-router-dom": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
++      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
++      "license": "MIT",
++      "dependencies": {
++        "react-router": "7.18.4"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      }
++    },
++    "node_modules/react-router/node_modules/cookie": {
++      "version": "1.1.1",
++      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
++      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
++      "license": "MIT",
++      "engines": {
++        "node": ">=18"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/express"
++      }
++    },
+     "node_modules/react-transition-group": {
+       "version": "4.4.5",
+       "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
+@@ -11086,6 +11244,21 @@
+         "node": ">=8"
+       }
+     },
++    "node_modules/redux": {
++      "version": "5.0.1",
++      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
++      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
++      "license": "MIT"
++    },
++    "node_modules/redux-thunk": {
++      "version": "3.1.0",
++      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
++      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
++      "license": "MIT",
++      "peerDependencies": {
++        "redux": "^5.0.0"
++      }
++    },
+     "node_modules/regenerate": {
+       "version": "1.4.2",
+       "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.4.2.tgz",
+@@ -11171,6 +11344,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/reselect": {
++      "version": "5.3.0",
++      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.3.0.tgz",
++      "integrity": "sha512-XGoLeRAVzUTcJ1qkxPQhDJyIZ5d6zzZD9nT7AEZOaaU9UbWclhycElmhO+VD5bFeLuzhPBaOV2oXC8uG35ZSpg==",
++      "license": "MIT"
++    },
+     "node_modules/resolve": {
+       "version": "1.22.8",
+       "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
+@@ -11470,6 +11649,12 @@
+         "node": ">= 0.8.0"
+       }
+     },
++    "node_modules/set-cookie-parser": {
++      "version": "2.7.2",
++      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
++      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
++      "license": "MIT"
++    },
+     "node_modules/setprototypeof": {
+       "version": "1.2.0",
+       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
+@@ -12357,6 +12542,15 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/use-sync-external-store": {
++      "version": "1.7.0",
++      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
++      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
++      "license": "MIT",
++      "peerDependencies": {
++        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
++      }
++    },
+     "node_modules/util-deprecate": {
+       "version": "1.0.2",
+       "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
+
+Do not invoke any skill, and do not spawn subagents of your own G«ˆ you are the reviewer. If the instruction file is unreadable, report that exact failure and stop. Return your findings as text in your final message; do not route them through any findings-reporting tool the host may offer.
diff --git a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
index 69a0e41..be74a6a 100644
--- a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+++ b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
@@ -2,7 +2,8 @@
 title: 'Story 1.2: HR Admin Authentication & Base Layout'
 type: 'feature'
 created: '2026-09-23'
-status: 'ready-for-dev'
+status: 'in-review'
+baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
 route: 'dispatch'
 review_loop_iteration: 0
 context:
@@ -67,18 +68,18 @@ context:
 ## Tasks & Acceptance
 
 **Execution:**
-- [ ] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
-- [ ] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
-- [ ] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
-- [ ] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
-- [ ] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
-- [ ] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
-- [ ] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
-- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
-- [ ] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
-- [ ] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
-- [ ] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
-- [ ] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
+- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
+- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
+- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
+- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
+- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
+- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
+- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
+- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
+- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
+- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
+- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
+- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
 
 **Acceptance Criteria:**
 - Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
diff --git a/_bmad-output/implementation-artifacts/spec-1-5-backend-authentication-api.md b/_bmad-output/implementation-artifacts/spec-1-5-backend-authentication-api.md
new file mode 100644
index 0000000..e89bf39
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/spec-1-5-backend-authentication-api.md
@@ -0,0 +1,87 @@
+---
+title: 'Story 1.5: Backend Authentication API'
+type: 'feature'
+created: '2026-09-24'
+status: 'in-review'
+baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
+route: 'dispatch'
+review_loop_iteration: 0
+context:
+  - '_bmad-output/implementation-artifacts/epic-1-context.md'
+---
+
+<frozen-after-approval reason="human-owned intent G«ˆ do not modify unless human renegotiates">
+
+## Intent
+
+**Problem:** The frontend HR Admin interface has been built and requires a secure, functioning backend to verify user credentials and establish a session. Currently, it relies on a frontend mock adapter. Additionally, there is no signup page for HR admins, so a seeded admin account is needed.
+
+**Approach:** Initialize the `service-employee` NestJS backend application if it doesn't exist. Implement the REST API auth controller to handle POST `/api/auth/login`. Verify HR admin credentials against the MySQL database. Insert seeded HR admin data (email: admin@salarymgmt.com, password: admin123) via database migration. Use the `shared-auth` library to generate opaque tokens and store sessions in Redis.
+
+## Boundaries & Constraints
+
+**Always:**
+- Must be implemented as a NestJS REST API backend application.
+- Must use the existing `shared-auth` library for token generation and Redis session storage.
+- Must seed initial HR admin data (email: admin@salarymgmt.com, password: admin123) in a database migration.
+
+**Never:**
+- No user registration endpoint is built in this story.
+- No frontend changes are made other than updating the mock adapter to `false`.
+
+## I/O & Edge-Case Matrix
+
+| Scenario | Input / State | Expected Output / Behavior | Error Handling |
+|----------|--------------|---------------------------|----------------|
+| Successful Login | POST `/api/auth/login` with correct seeded credentials | Returns `{ token: "opaque-token" }`, stores session in Redis | N/A |
+| Invalid Credentials | POST `/api/auth/login` with wrong password | Returns 401 Unauthorized | Return generic "Invalid credentials" |
+| Non-existent User | POST `/api/auth/login` with unknown email | Returns 401 Unauthorized | Return generic "Invalid credentials" |
+| Validation Error | POST `/api/auth/login` missing email or password | Returns 400 Bad Request | Return validation error details |
+
+**Decisions:**
+- ORM Choice: TypeORM will be used for database access and migrations.
+- Backend Initialization: The `service-employee` NestJS backend application will be generated as part of this story.
+
+</frozen-after-approval>
+
+## Code Map
+
+- `package.json` -- Needs updates to install `@nx/nest`, ORM packages (e.g. `typeorm`, `mysql2` or `prisma`), and redis packages (`ioredis`).
+- `apps/service-employee/` -- The NestJS application to be generated.
+- `apps/service-employee/src/auth/` -- Auth module, controller, and service.
+- `apps/frontend-web/src/services/authService.ts` -- Needs to have mock adapter updated to `false`.
+- `libs/shared-auth/src/session-store.ts` -- Reused for Redis storage types/interfaces.
+
+## Tasks & Acceptance
+
+**Execution:**
+- [x] `package.json` -- Install NestJS Nx plugin, ORM, and Redis dependencies.
+- [x] `workspace` -- Generate `service-employee` NestJS application using Nx.
+- [x] `apps/service-employee/src/database/` -- Setup ORM connection and HR Admin entity/schema.
+- [x] `apps/service-employee/migrations/` -- Create migration to create HR Admin table and insert seeded data.
+- [x] `apps/service-employee/src/auth/` -- Implement `AuthController` for login and `AuthService` for credential verification and token generation using `shared-auth`.
+- [x] `apps/frontend-web/src/services/authService.ts` -- Update `USE_MOCK_AUTH` to `false` (or equivalent config) to connect to real backend.
+
+**Acceptance Criteria:**
+- Given the system is running, when a local POST request is made to `/api/auth/login` with `admin@salarymgmt.com`/`admin123`, then an opaque token is returned and successfully resolves to an active session in the Redis store.
+- Given the database is migrated, the HR admin table exists and contains the seeded admin record.
+
+## Implementation Notes
+
+- Nx generator for `@nx/nest` was getting stuck fetching packages, so the `service-employee` basic structure (project configs, tsconfigs, main.ts, modules) was scaffolded manually.
+- Installed `typeorm`, `mysql2`, `@nestjs/typeorm`, `ioredis`, `@nestjs-modules/ioredis`.
+- Created TypeORM database module and `HrAdmin` entity.
+- Created `1700000000000-SeedHrAdmin.ts` migration to insert seeded data.
+- Created AuthController and AuthService. AuthService compares credentials and generates a token utilizing `crypto` and `RedisSessionStore` from `@salary-mgmt/shared-auth`.
+- Updated `authService.ts` on the frontend to disable the mock adapter. Also adjusted it to return the API response directly since our backend returns `{ token }` rather than `{ data: { token } }`.
+- Added a Vite proxy configuration to route `/api` to `http://localhost:3333` (the backend NestJS server).
+
+## Spec Change Log
+
+## Review Triage Log
+
+## Verification
+
+**Commands:**
+- `nx serve service-employee` -- expected: API starts successfully.
+- `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@salarymgmt.com","password":"admin123"}'` -- expected: Returns 200 OK with token.
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index e172c16..6c9bdca 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -1,5 +1,5 @@
 generated: 09-23-2026 17:01
-last_updated: 09-23-2026 18:25
+last_updated: 09-24-2026 09:20
 project: salary_management_system
 project_key: NOKEY
 tracking_system: file-system
@@ -8,9 +8,10 @@ story_location: "c:/Users/navan/projects/salary_management_system/_bmad-output/i
 development_status:
   epic-1: in-progress
   1-1-project-foundation-ui-theme-initialization: done
-  1-2-hr-admin-authentication-base-layout: ready-for-dev
+  1-2-hr-admin-authentication-base-layout: in-progress
   1-3-organization-profile-setup: ready-for-dev
   1-4-hr-dashboard-overview: ready-for-dev
+  1-5-backend-authentication-api: in-progress
   epic-1-retrospective: optional
 
   epic-2: backlog
diff --git a/_bmad-output/implementation-artifacts/verification-gap-prompt.md b/_bmad-output/implementation-artifacts/verification-gap-prompt.md
new file mode 100644
index 0000000..536e759
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/verification-gap-prompt.md
@@ -0,0 +1,1732 @@
+n++# Verification Gap Review
+
+**Goal:** Find changed behavior that could break without reliable verification catching it. Ask one question +ÛGÈºG«• "if the behavior this change is supposed to produce broke where it's actually used, would verification fail?" Do not hunt for correctness bugs, but report genuine problems you notice while tracing verification.
+
+The main verification gap shapes are:
+
+1. **Regression gap:** the changed code regresses where it's used, and no test covering that use would fail.
+2. **Missing-adoption gap:** a place that should now use the new behavior doesn't; it handles the same case its own way, or not at all, and no test would flag the omission.
+3. **Broken-verification gap:** a test appears to cover the changed behavior, but would not actually protect it because it is skipped, flaky, not run in the normal verification path, or too weak to observe the regression.
+
+## Evidence Rules
+
+- Read a test before claiming what it covers, runs, asserts, or misses.
+- Before claiming no test exists, search the whole repo by the symbol under test and by import references; expected file locations are not enough.
+- Never assert what you did not verify. If a finding cannot be grounded, drop it.
+- In a finding, say what you actually checked +ÛGÈºG«• "none of the tests I read cover this" +ÛGÈºG«• and show how far you looked. Say a test doesn't exist anywhere only when the symbol/import-reference search actually shows that.
+- Do not assign severity, confidence, priority, or ranking.
+
+## Review Sequence
+
+### Step 1: Screen for behavioral change
+
+Screen each part of the change separately. If a part is non-behavioral, skip it. Call a part non-behavioral only when the changed code does not alter return values, thrown errors, caller-visible side effects, or observable state (including iteration order and emitted messages). Once a part meets that test, move on; do not inspect callers or tests for extra confirmation.
+
+Common non-behavioral examples: formatting, comments, whitespace; pure renames; trivial getters/setters and pass-throughs; type-only or compiler-enforced changes with no runtime effect; etc.
+
+Only outcomes produced by deterministic code are worth automatically testing; tests are useless on static source text and brittle on LLM output. Skip those parts.
+
+If every part is skipped, output the clean result (see Output Format).
+
+### Step 2: Find the behavior that changed
+
+Identify what behavior changed compared to the previous version: output, side effect, branch, error path, schema/event shape, config default, validation/authorization rule, external contract, etc. If the change affects more than one behavior, handle each separately.
+
+Treat broad-impact changes as behavioral even when no single changed line looks important: dependency, toolchain, build/config, data-file, etc.
+
+### Step 3: Trace where that behavior is used
+
+Trace the changed behavior to the places that observe it. Start with direct callers and registered entry points (routes, commands, DI), contract consumers (schemas, events, APIs, database readers), and reverse-dependency info if already available.
+
+Follow a path only while the changed behavior is reachable and unverified. Stop when a test at that boundary would fail, the consumer does not observe the changed behavior, or the next hop is guesswork (dynamic dispatch, reflection, outside-repo consumers, etc.). Prefer the nearest observable boundary, often one to three hops away, especially across contract, integration, or service edges. If there are more than five similar consumers, group obvious repeats and check representative paths; expand only when a consumer observes the behavior differently.
+
+### Step 4: Qualify the consumer, then check its test
+
+For each consumer, name the smallest realistic regression this consumer would observe: invert the branch, drop the default, omit the field, return the old error code, skip the integration call, etc. This is the Demonstration. If no such regression exists, drop the path; untested downstream code is not a finding.
+
+A `Missing-adoption gap` qualifies not by the adoption failure alone but by a supersession signal: the change gives clear evidence the new behavior is meant to replace the local one +ÛGÈºG«• PR intent, naming or docs, a replaced sibling site, deleted duplicate logic, or a test defining the new rule +ÛGÈºG«• and the local site shares the same observable contract. Without a supersession signal and a shared observable contract, it is a refactor suggestion, not a verification-gap finding. Once both hold, check whether any test for that site would flag the non-adoption; missing coverage of the non-adoption is the gap itself, not a disqualifier.
+
+Find and read the relevant test. Ask whether the Demonstration would make an assertion fail.
+
+- If yes, the behavior is verified. No finding.
+- For a regression-style Demonstration: if no test runs the path, the test is skipped/flaky/not run normally, or the test runs the code without checking the changed result, report a `Regression gap` or `Broken-verification gap`.
+- For a qualifying Missing-adoption case: if none of the site tests you found assert it adopts the new behavior, report a `Missing-adoption gap`.
+
+A test counts only if it runs normally and an assertion observes the changed output, branch, or contract. These do not count: no execution; source-text assertions that match a file's wording instead of running it; success/no-throw/snapshot-only checks; mock/log-call checks; human-only checks; tests that mock away the integration; e2e tests that pass through without checking the changed output; stale assertions or fixtures.
+
+For example, `expect(x ?? DEFAULT).toBe(DEFAULT)` passes when `x` is missing.
+
+Common patterns:
+
+- **Caller-path gap** +ÛGÈºG«• helper test covers the branch, but caller values skip it.
+- **Contract drift** +ÛGÈºG«• payload/schema/event changes must be verified at the consumer.
+- **Migration compatibility** +ÛGÈºG«• tests only create new-format rows or fresh schemas.
+- **Phantom exception** +ÛGÈºG«• handled partial-failure path has no test.
+- **Missing-adoption gap** +ÛGÈºG«• sibling site should use the new rule/helper and does not.
+- **Removed verification** +ÛGÈºG«• deleted test or weakened assertion leaves behavior unpinned; removing a source-text assertion is not this, since it never counted.
+
+### Step 5: Confirm each finding is real
+
+Before writing a finding, re-open the specific tests or search results the finding relies on. Verify the Demonstration would not make any test you checked fail, or that the absence claim is backed by the symbol/import-reference search. Do not claim more than you verified; drop any finding you cannot ground.
+
+Explain why the test misses the bug using what the test sets up and checks.
+
+Do not report: compiler/type-checker-enforced cases; behavior already verified by an integration, contract, or e2e test; implementation-detail or mock-only tests; low coverage or a missing test file by itself; legacy untested code the change did not affect.
+
+Report genuine problems you noticed while tracing verification, even if they are not verification gaps. Put them under `Other findings` in the output. This permits reporting what you already reached, not extra hunting. A claim that code misbehaves is a defect, not a gap +ÛGÈºG«• it goes under `Other findings` for standard triage, however you found it.
+
+## OUTPUT FORMAT
+
+Emit each verification-gap finding as one block. No general advice, no severity or confidence. Triage trusts a gap finding as filed and does not re-verify it, so each block must stand on its own evidence.
+
+```markdown
+### <one-line title naming the gap>
+
+- **Changed surface:** the exact behavior or contract that changed +ÛGÈºG«• `file:line`.
+- **Impacted consumer or site:** named concretely with `file:line` (e.g. "the `createInvoice` mutation used by the billing dashboard at `billing/dashboard.ts:88`," not "callers of this function").
+- **Existing test evidence:**
+  - `Regression gap`: what the relevant test actually asserts, with `file:line`; or, if none, the symbol/import-reference searches run and their result.
+  - `Missing-adoption gap`: tests for the impacted site, and whether any assert it adopts the new behavior.
+  - `Broken-verification gap`: the apparent test or verification path, and why it does not count.
+- **Missing verification:** the precise assertion or check that's absent.
+- **Demonstration:**
+  - `Regression gap` / `Broken-verification gap`: the concrete regression that would ship undetected, and why the tests you checked would not fail.
+  - `Missing-adoption gap`: the case the site mishandles by not adopting the new behavior, and that none of the tests you read assert adoption.
+- **Consequence:** the concrete thing that ships wrong +ÛGÈºG«• a regression the checked evidence would not catch, or a site that should use the new behavior and doesn't.
+- **Disposition:** `patch` +ÛGÈºG«• name the test to add, fit to the repo's own way of verifying (don't impose a generic test pyramid) +ÛGÈºG«• or `defer` when the gap is real but not worth closing as part of this change, with one sentence of why.
+```
+
+If you noticed genuine non-gap problems while tracing verification, append:
+
+```markdown
+## Other findings
+
+- <description only; no severity, confidence, priority, or ranking>
+```
+
+When you find no verification gaps and no other findings, output exactly this single line, not an empty response:
+
+`No verification gaps found.`
+
+## CONTENT SOURCE
+
+"Review content:" in the message that launched you gives the content itself or a path to read it from. Read the file when it is a path; either way that is the content under review, and this instruction file never is. If no content is supplied, or the file it points to is missing, empty, or unreadable, say exactly that and stop +ÛGÈºG«• never report a clean review for content you could not read.
+
+
+Review content:
+diff --git a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+index 69a0e41..be74a6a 100644
+--- a/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
++++ b/_bmad-output/implementation-artifacts/spec-1-2-hr-admin-authentication-base-layout.md
+@@ -2,7 +2,8 @@
+ title: 'Story 1.2: HR Admin Authentication & Base Layout'
+ type: 'feature'
+ created: '2026-09-23'
+-status: 'ready-for-dev'
++status: 'in-review'
++baseline_commit: '3b783f84d9a6c46598ab9a6cf2c8005393f1ab56'
+ route: 'dispatch'
+ review_loop_iteration: 0
+ context:
+@@ -67,18 +68,18 @@ context:
+ ## Tasks & Acceptance
+ 
+ **Execution:**
+-- [ ] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
+-- [ ] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
+-- [ ] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
+-- [ ] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
+-- [ ] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
+-- [ ] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
+-- [ ] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
+-- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
+-- [ ] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
+-- [ ] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
+-- [ ] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
++- [x] `libs/shared-types/src/index.ts` -- Add `LoginCredentialsDto` and `AuthResponseDto` interfaces -- Formalizes auth contract across frontend and backend.
++- [x] `libs/shared-auth/src/index.ts` & `libs/shared-auth/src/session-store.ts` -- Implement `generateOpaqueToken()` and `RedisSessionStore` with in-memory fallback -- Fulfills AD-3 stateful Redis session token management.
++- [x] `libs/shared-auth/src/session-store.spec.ts` -- Add unit test suite for token generation (<12 chars) and session store lifecycle -- Verifies auth library invariants.
++- [x] `apps/frontend-web/package.json` -- Add dependencies (`react-router-dom`, `@reduxjs/toolkit`, `react-redux`, `@mui/icons-material`) -- Supplies routing and state management libraries.
++- [x] `apps/frontend-web/src/store/index.ts` & `apps/frontend-web/src/store/slices/authSlice.ts` -- Implement Redux Toolkit store and auth slice -- Provides centralized auth state and session persistence.
++- [x] `apps/frontend-web/src/services/authService.ts` -- Implement authentication service with mock and REST client adapters -- Enables authentication communication.
++- [x] `apps/frontend-web/src/components/ProtectedRoute.tsx` -- Implement route guard component -- Enforces access control on `/admin/*` routes.
++- [x] `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Implement administrative layout with fixed 260px sidebar and elevation-0 App Bar per DESIGN.md -- Delivers core HR shell.
++- [x] `apps/frontend-web/src/pages/LoginPage.tsx` -- Implement HR Admin login page with Material UI outlined inputs, validation, and error states -- Provides authentication entry point.
++- [x] `apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx` -- Implement dashboard overview placeholder page -- Verifies route resolution within AdminLayout.
++- [x] `apps/frontend-web/src/app/App.tsx` -- Configure routing with `BrowserRouter`, Redux provider, and route redirects -- Connects all views and guards.
++- [x] `apps/frontend-web/src/pages/LoginPage.spec.tsx` & `apps/frontend-web/src/layouts/AdminLayout.spec.tsx` -- Implement unit tests for login flow, protected routing, and admin layout -- Validates all I/O scenarios and design requirements.
+ 
+ **Acceptance Criteria:**
+ - Given an HR administrator with valid credentials (`admin@salarymgmt.com` / `admin123`), when submitting the login form on `/login`, then an opaque token (<12 chars) is issued, session is stored in Redis, and user is redirected to `/admin/dashboard`.
+diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
+index e172c16..0642af4 100644
+--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
++++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
+@@ -1,5 +1,5 @@
+ generated: 09-23-2026 17:01
+-last_updated: 09-23-2026 18:25
++last_updated: 09-24-2026 08:36
+ project: salary_management_system
+ project_key: NOKEY
+ tracking_system: file-system
+@@ -8,7 +8,7 @@ story_location: "c:/Users/navan/projects/salary_management_system/_bmad-output/i
+ development_status:
+   epic-1: in-progress
+   1-1-project-foundation-ui-theme-initialization: done
+-  1-2-hr-admin-authentication-base-layout: ready-for-dev
++  1-2-hr-admin-authentication-base-layout: in-progress
+   1-3-organization-profile-setup: ready-for-dev
+   1-4-hr-dashboard-overview: ready-for-dev
+   epic-1-retrospective: optional
+diff --git a/apps/frontend-web/package.json b/apps/frontend-web/package.json
+index 1b19f12..89a7e1c 100644
+--- a/apps/frontend-web/package.json
++++ b/apps/frontend-web/package.json
+@@ -12,10 +12,14 @@
+   "dependencies": {
+     "@emotion/react": "^11.14.0",
+     "@emotion/styled": "^11.14.0",
++    "@mui/icons-material": "^6.5.0",
+     "@mui/material": "^6.4.4",
++    "@reduxjs/toolkit": "^2.12.0",
+     "@salary-mgmt/shared-types": "*",
+     "react": "^18.3.1",
+-    "react-dom": "^18.3.1"
++    "react-dom": "^18.3.1",
++    "react-redux": "^9.3.0",
++    "react-router-dom": "^7.18.4"
+   },
+   "devDependencies": {
+     "@testing-library/jest-dom": "^6.6.3",
+diff --git a/apps/frontend-web/src/app/App.spec.tsx b/apps/frontend-web/src/app/App.spec.tsx
+index 844b816..19660bf 100644
+--- a/apps/frontend-web/src/app/App.spec.tsx
++++ b/apps/frontend-web/src/app/App.spec.tsx
+@@ -1,15 +1,13 @@
+ import { render, screen } from '@testing-library/react';
+ import { describe, it, expect } from 'vitest';
+ import React from 'react';
+-import App, { AppContent } from './App';
++import App from './App';
+ import { theme, designTokens } from '../theme/theme';
+-import { AppThemeProvider } from '../theme/ThemeProvider';
+ 
+-describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+-  it('renders application with global theme provider and heading', () => {
++describe('App component', () => {
++  it('renders application and redirects to login by default', () => {
+     render(<App />);
+-    expect(screen.getByText(/Foundation & UI Theme Initialized/i)).toBeInTheDocument();
+-    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
+   });
+ 
+   it('verifies custom theme tokens adhere strictly to DESIGN.md', () => {
+@@ -24,28 +22,4 @@ describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
+     expect(theme.typography.fontFamily).toContain('Inter');
+     expect(theme.typography.fontFamily).toContain('Roboto');
+   });
+-
+-  it('renders theme tokens in the UI preview card', () => {
+-    render(
+-      <AppThemeProvider>
+-        <AppContent />
+-      </AppThemeProvider>
+-    );
+-
+-    const primaryColorText = screen.getByText('#1976d2');
+-    expect(primaryColorText).toBeInTheDocument();
+-
+-    const bgDefaultText = screen.getByText('#f4f6f8');
+-    expect(bgDefaultText).toBeInTheDocument();
+-
+-    const borderRadiusText = screen.getByText('8px');
+-    expect(borderRadiusText).toBeInTheDocument();
+-  });
+-
+-  it('successfully consumes models from @salary-mgmt/shared-types', () => {
+-    render(<App />);
+-    expect(screen.getByText(/ACME Technologies Pvt Ltd/i)).toBeInTheDocument();
+-    expect(screen.getByText(/+Ù+¨GÚ˙ INR/i)).toBeInTheDocument();
+-    expect(screen.getByText(/HR Administrator/i)).toBeInTheDocument();
+-  });
+ });
+diff --git a/apps/frontend-web/src/app/App.tsx b/apps/frontend-web/src/app/App.tsx
+index acaba5e..a19e5d5 100644
+--- a/apps/frontend-web/src/app/App.tsx
++++ b/apps/frontend-web/src/app/App.tsx
+@@ -1,173 +1,43 @@
+ import React from 'react';
+-import AppBar from '@mui/material/AppBar';
+-import Toolbar from '@mui/material/Toolbar';
+-import Typography from '@mui/material/Typography';
+-import Container from '@mui/material/Container';
+-import Box from '@mui/material/Box';
+-import Card from '@mui/material/Card';
+-import CardContent from '@mui/material/CardContent';
+-import Button from '@mui/material/Button';
+-import Stack from '@mui/material/Stack';
+-import Chip from '@mui/material/Chip';
+-import { useTheme } from '@mui/material/styles';
++import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
++import { Provider } from 'react-redux';
+ import { AppThemeProvider } from '../theme/ThemeProvider';
+-import { OrganizationProfile, UserRole } from '@salary-mgmt/shared-types';
+-
+-export const AppContent: React.FC = () => {
+-  const currentTheme = useTheme();
+-
+-  const demoProfile: OrganizationProfile = {
+-    id: 'org-demo-001',
+-    name: 'ACME Technologies Pvt Ltd',
+-    code: 'ACME',
+-    contactEmail: 'admin@acme.corp',
+-    currency: 'INR',
+-    createdAt: '2026-09-23T00:00:00Z',
+-    updatedAt: '2026-09-23T00:00:00Z',
+-  };
+-
+-  const sampleRole: UserRole = 'hr_admin';
+-
+-  return (
+-    <Box
+-      data-testid="app-container"
+-      sx={{
+-        minHeight: '100vh',
+-        backgroundColor: currentTheme.palette.background.default,
+-        display: 'flex',
+-        flexDirection: 'column',
+-      }}
+-    >
+-      <AppBar position="static" data-testid="app-bar">
+-        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
+-          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
+-            Salary Management System
+-          </Typography>
+-          <Chip
+-            label={sampleRole === 'hr_admin' ? 'HR Administrator' : 'Employee'}
+-            size="small"
+-            color="primary"
+-            variant="outlined"
+-            data-testid="role-chip"
+-          />
+-        </Toolbar>
+-      </AppBar>
+-
+-      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
+-        <Stack spacing={3}>
+-          <Box>
+-            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
+-              Foundation & UI Theme Initialized
+-            </Typography>
+-            <Typography variant="body1" color="text.secondary">
+-              The foundational Nx monorepo, shared types, and Material UI design system are active.
+-            </Typography>
+-          </Box>
+-
+-          <Box
+-            sx={{
+-              display: 'grid',
+-              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
+-              gap: 3,
+-            }}
+-          >
+-            <Card data-testid="theme-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Design Tokens Preview
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Color:</Typography>
+-                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
+-                      <Box
+-                        data-testid="primary-color-swatch"
+-                        sx={{
+-                          width: 20,
+-                          height: 20,
+-                          borderRadius: '4px',
+-                          backgroundColor: currentTheme.palette.primary.main,
+-                        }}
+-                      />
+-                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                        {currentTheme.palette.primary.main}
+-                      </Typography>
+-                    </Box>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Background Default:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.palette.background.default}
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Card Border Radius:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {currentTheme.shape.borderRadius}px
+-                    </Typography>
+-                  </Box>
+-
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Primary Font:</Typography>
+-                    <Typography
+-                      variant="body2"
+-                      data-testid="font-family-label"
+-                      sx={{ maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}
+-                    >
+-                      {currentTheme.typography.fontFamily}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-              </CardContent>
+-            </Card>
+-
+-            <Card data-testid="shared-type-card">
+-              <CardContent>
+-                <Typography variant="h6" gutterBottom>
+-                  Shared Models & Architecture
+-                </Typography>
+-                <Stack spacing={1.5} sx={{ mt: 2 }}>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Organization Profile:</Typography>
+-                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
+-                      {demoProfile.name}
+-                    </Typography>
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Currency Standard:</Typography>
+-                    <Chip label={`+Ù+¨GÚ˙ ${demoProfile.currency}`} size="small" />
+-                  </Box>
+-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
+-                    <Typography variant="body2">Org Code:</Typography>
+-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
+-                      {demoProfile.code}
+-                    </Typography>
+-                  </Box>
+-                </Stack>
+-                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
+-                  <Button variant="contained" color="primary" size="medium">
+-                    Primary Action
+-                  </Button>
+-                  <Button variant="outlined" color="primary" size="medium">
+-                    Outlined Action
+-                  </Button>
+-                </Box>
+-              </CardContent>
+-            </Card>
+-          </Box>
+-        </Stack>
+-      </Container>
+-    </Box>
+-  );
+-};
++import { store } from '../store';
++import { LoginPage } from '../pages/LoginPage';
++import { AdminLayout } from '../layouts/AdminLayout';
++import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
++import { ProtectedRoute } from '../components/ProtectedRoute';
+ 
+ export const App: React.FC = () => {
+   return (
+-    <AppThemeProvider>
+-      <AppContent />
+-    </AppThemeProvider>
++    <Provider store={store}>
++      <AppThemeProvider>
++        <BrowserRouter>
++          <Routes>
++            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
++            
++            <Route path="/login" element={<LoginPage />} />
++            
++            <Route 
++              path="/admin" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              }
++            >
++              <Route index element={<Navigate to="dashboard" replace />} />
++              <Route path="dashboard" element={<AdminDashboardPlaceholder />} />
++              <Route path="employees" element={<div>Employees Page (Not Implemented)</div>} />
++              <Route path="salary-config" element={<div>Salary Config (Not Implemented)</div>} />
++              <Route path="payslips" element={<div>Payslips (Not Implemented)</div>} />
++            </Route>
++
++            <Route path="*" element={<Navigate to="/login" replace />} />
++          </Routes>
++        </BrowserRouter>
++      </AppThemeProvider>
++    </Provider>
+   );
+ };
+ 
+diff --git a/apps/frontend-web/src/components/ProtectedRoute.tsx b/apps/frontend-web/src/components/ProtectedRoute.tsx
+new file mode 100644
+index 0000000..495d14e
+--- /dev/null
++++ b/apps/frontend-web/src/components/ProtectedRoute.tsx
+@@ -0,0 +1,22 @@
++import React from 'react';
++import { Navigate, useLocation } from 'react-router-dom';
++import { useAppSelector } from '../store';
++
++interface ProtectedRouteProps {
++  children: React.ReactNode;
++}
++
++export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
++  const { isAuthenticated } = useAppSelector((state) => state.auth);
++  const location = useLocation();
++
++  if (!isAuthenticated) {
++    // Redirect them to the /login page, but save the current location they were
++    // trying to go to when they were redirected. This allows us to send them
++    // along to that page after they login, which is a nicer user experience
++    // than dropping them off on the home page.
++    return <Navigate to="/login" state={{ from: location }} replace />;
++  }
++
++  return <>{children}</>;
++};
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.spec.tsx b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+new file mode 100644
+index 0000000..43ae7b6
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
+@@ -0,0 +1,91 @@
++import React from 'react';
++import { render, screen, fireEvent } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import authReducer from '../store/slices/authSlice';
++import { AdminLayout } from './AdminLayout';
++import { ProtectedRoute } from '../components/ProtectedRoute';
++
++const createTestStore = (isAuthenticated = true) => {
++  return configureStore({
++    reducer: { auth: authReducer },
++    preloadedState: {
++      auth: {
++        isAuthenticated,
++        session: null,
++        isLoading: false,
++        error: null
++      }
++    }
++  });
++};
++
++describe('AdminLayout & ProtectedRoute', () => {
++  it('renders sidebar navigation items when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <BrowserRouter>
++          <AdminLayout />
++        </BrowserRouter>
++      </Provider>
++    );
++
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++    expect(screen.getByText('Dashboard')).toBeInTheDocument();
++    expect(screen.getByText('Employees')).toBeInTheDocument();
++    expect(screen.getByText('Salary Config')).toBeInTheDocument();
++    expect(screen.getByText('Payslips')).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
++  });
++
++  it('redirects to login when unauthenticated accessing protected route', () => {
++    const store = createTestStore(false);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    // Should redirect to login
++    expect(screen.getByText('Login Page')).toBeInTheDocument();
++    expect(screen.queryByText('HR Administration')).not.toBeInTheDocument();
++  });
++
++  it('allows access to protected route when authenticated', () => {
++    const store = createTestStore(true);
++    render(
++      <Provider store={store}>
++        <MemoryRouter initialEntries={['/admin/dashboard']}>
++          <Routes>
++            <Route path="/login" element={<div>Login Page</div>} />
++            <Route 
++              path="/admin/*" 
++              element={
++                <ProtectedRoute>
++                  <AdminLayout />
++                </ProtectedRoute>
++              } 
++            />
++          </Routes>
++        </MemoryRouter>
++      </Provider>
++    );
++
++    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
++    expect(screen.getByText('HR Administration')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/layouts/AdminLayout.tsx b/apps/frontend-web/src/layouts/AdminLayout.tsx
+new file mode 100644
+index 0000000..9d65b6f
+--- /dev/null
++++ b/apps/frontend-web/src/layouts/AdminLayout.tsx
+@@ -0,0 +1,137 @@
++import React from 'react';
++import { Outlet, useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Drawer, 
++  AppBar, 
++  Toolbar, 
++  Typography, 
++  List, 
++  ListItem, 
++  ListItemButton, 
++  ListItemIcon, 
++  ListItemText,
++  Button
++} from '@mui/material';
++import DashboardIcon from '@mui/icons-material/Dashboard';
++import PeopleIcon from '@mui/icons-material/People';
++import SettingsIcon from '@mui/icons-material/Settings';
++import ReceiptIcon from '@mui/icons-material/Receipt';
++import LogoutIcon from '@mui/icons-material/Logout';
++import { useAppDispatch } from '../store';
++import { logout } from '../store/slices/authSlice';
++
++const drawerWidth = 260;
++
++export const AdminLayout: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++
++  const handleLogout = async () => {
++    await dispatch(logout());
++    navigate('/login');
++  };
++
++  const navItems = [
++    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
++    { text: 'Employees', path: '/admin/employees', icon: <PeopleIcon /> },
++    { text: 'Salary Config', path: '/admin/salary-config', icon: <SettingsIcon /> },
++    { text: 'Payslips', path: '/admin/payslips', icon: <ReceiptIcon /> },
++  ];
++
++  return (
++    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
++      <AppBar
++        position="fixed"
++        elevation={0}
++        sx={{
++          width: `calc(100% - ${drawerWidth}px)`,
++          ml: `${drawerWidth}px`,
++          backgroundColor: '#ffffff',
++          color: '#111827',
++          borderBottom: '1px solid #e5e7eb',
++        }}
++      >
++        <Toolbar>
++          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            HR Administration
++          </Typography>
++          <Button 
++            color="inherit" 
++            onClick={handleLogout}
++            endIcon={<LogoutIcon />}
++            sx={{ textTransform: 'none' }}
++          >
++            Logout
++          </Button>
++        </Toolbar>
++      </AppBar>
++      
++      <Drawer
++        sx={{
++          width: drawerWidth,
++          flexShrink: 0,
++          '& .MuiDrawer-paper': {
++            width: drawerWidth,
++            boxSizing: 'border-box',
++            backgroundColor: '#ffffff',
++            borderRight: '1px solid #e5e7eb',
++          },
++        }}
++        variant="permanent"
++        anchor="left"
++      >
++        <Toolbar>
++          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++            Salary Mgmt
++          </Typography>
++        </Toolbar>
++        
++        <List sx={{ px: 1 }}>
++          {navItems.map((item) => {
++            const isActive = location.pathname.startsWith(item.path);
++            return (
++              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
++                <ListItemButton
++                  onClick={() => navigate(item.path)}
++                  sx={{
++                    borderRadius: '6px',
++                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
++                    color: isActive ? '#1976d2' : '#6b7280',
++                    '&:hover': {
++                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
++                    }
++                  }}
++                >
++                  <ListItemIcon sx={{ color: isActive ? '#1976d2' : '#6b7280', minWidth: '40px' }}>
++                    {item.icon}
++                  </ListItemIcon>
++                  <ListItemText 
++                    primary={item.text} 
++                    primaryTypographyProps={{ 
++                      fontWeight: isActive ? 600 : 500,
++                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
++                    }} 
++                  />
++                </ListItemButton>
++              </ListItem>
++            );
++          })}
++        </List>
++      </Drawer>
++      
++      <Box
++        component="main"
++        sx={{
++          flexGrow: 1,
++          p: '24px',
++          width: `calc(100% - ${drawerWidth}px)`,
++          mt: '64px' // Toolbar height
++        }}
++      >
++        <Outlet />
++      </Box>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+new file mode 100644
+index 0000000..c48896a
+--- /dev/null
++++ b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
+@@ -0,0 +1,20 @@
++import React from 'react';
++import { Box, Typography, Card, CardContent } from '@mui/material';
++
++export const AdminDashboardPlaceholder: React.FC = () => {
++  return (
++    <Box>
++      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
++        Dashboard Overview
++      </Typography>
++      
++      <Card sx={{ mt: 3, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
++        <CardContent sx={{ p: 4 }}>
++          <Typography variant="body1" color="text.secondary">
++            Welcome to the HR Admin Dashboard. The full dashboard implementation is scheduled for a future sprint.
++          </Typography>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/pages/LoginPage.spec.tsx b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+new file mode 100644
+index 0000000..7e0e2c5
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.spec.tsx
+@@ -0,0 +1,95 @@
++import React from 'react';
++import { render, screen, fireEvent, waitFor } from '@testing-library/react';
++import { Provider } from 'react-redux';
++import { BrowserRouter } from 'react-router-dom';
++import { configureStore } from '@reduxjs/toolkit';
++import { vi } from 'vitest';
++import authReducer from '../store/slices/authSlice';
++import { LoginPage } from './LoginPage';
++import { authService } from '../services/authService';
++
++// Mock authService
++vi.mock('../services/authService', () => ({
++  authService: {
++    login: vi.fn()
++  }
++}));
++
++const renderWithProviders = (
++  ui: React.ReactElement,
++  {
++    preloadedState = {},
++    store = configureStore({
++      reducer: { auth: authReducer },
++      preloadedState,
++    }),
++    ...renderOptions
++  } = {}
++) => {
++  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
++    return <Provider store={store}><BrowserRouter>{children}</BrowserRouter></Provider>;
++  };
++  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
++};
++
++describe('LoginPage', () => {
++  beforeEach(() => {
++    vi.clearAllMocks();
++  });
++
++  it('renders login form elements', () => {
++    renderWithProviders(<LoginPage />);
++    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
++    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
++    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
++    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
++  });
++
++  it('shows validation error for empty fields', async () => {
++    renderWithProviders(<LoginPage />);
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Email is required')).toBeInTheDocument();
++  });
++
++  it('shows validation error for missing password', async () => {
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    expect(await screen.findByText('Password is required')).toBeInTheDocument();
++  });
++
++  it('submits form when fields are valid', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockResolvedValueOnce({ token: '123', user: { id: '1' } });
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    await waitFor(() => {
++      expect(mockLogin).toHaveBeenCalledWith({
++        email: 'admin@example.com',
++        password: 'password123'
++      });
++    });
++  });
++
++  it('displays error on failed login', async () => {
++    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
++    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
++    
++    renderWithProviders(<LoginPage />);
++    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
++    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
++    
++    const submitBtn = screen.getByRole('button', { name: /sign in/i });
++    fireEvent.click(submitBtn);
++    
++    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
++  });
++});
+diff --git a/apps/frontend-web/src/pages/LoginPage.tsx b/apps/frontend-web/src/pages/LoginPage.tsx
+new file mode 100644
+index 0000000..331ef8c
+--- /dev/null
++++ b/apps/frontend-web/src/pages/LoginPage.tsx
+@@ -0,0 +1,136 @@
++import React, { useState } from 'react';
++import { useNavigate, useLocation } from 'react-router-dom';
++import { 
++  Box, 
++  Card, 
++  CardContent, 
++  Typography, 
++  TextField, 
++  Button, 
++  Alert,
++  CircularProgress
++} from '@mui/material';
++import { useAppDispatch, useAppSelector } from '../store';
++import { login, clearError } from '../store/slices/authSlice';
++
++export const LoginPage: React.FC = () => {
++  const dispatch = useAppDispatch();
++  const navigate = useNavigate();
++  const location = useLocation();
++  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
++
++  const [email, setEmail] = useState('');
++  const [password, setPassword] = useState('');
++  const [validationError, setValidationError] = useState('');
++
++  // If already authenticated, redirect to admin dashboard
++  React.useEffect(() => {
++    if (isAuthenticated) {
++      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
++      navigate(from, { replace: true });
++    }
++  }, [isAuthenticated, navigate, location]);
++
++  const handleSubmit = async (e: React.FormEvent) => {
++    e.preventDefault();
++    setValidationError('');
++    
++    if (error) {
++      dispatch(clearError());
++    }
++
++    if (!email) {
++      setValidationError('Email is required');
++      return;
++    }
++    
++    if (!password) {
++      setValidationError('Password is required');
++      return;
++    }
++
++    await dispatch(login({ email, password }));
++  };
++
++  return (
++    <Box 
++      sx={{ 
++        minHeight: '100vh', 
++        display: 'flex', 
++        alignItems: 'center', 
++        justifyContent: 'center',
++        backgroundColor: '#f4f6f8'
++      }}
++    >
++      <Card 
++        sx={{ 
++          maxWidth: 400, 
++          width: '100%', 
++          borderRadius: '12px',
++          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
++        }}
++      >
++        <CardContent sx={{ p: '32px' }}>
++          <Typography 
++            variant="h5" 
++            component="h1" 
++            align="center" 
++            gutterBottom
++            sx={{ fontWeight: 700, mb: 3, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}
++          >
++            HR Login
++          </Typography>
++
++          {(error || validationError) && (
++            <Alert severity="error" sx={{ mb: 3 }}>
++              {error || validationError}
++            </Alert>
++          )}
++
++          <form onSubmit={handleSubmit}>
++            <TextField
++              label="Email Address"
++              variant="outlined"
++              fullWidth
++              margin="normal"
++              value={email}
++              onChange={(e) => setEmail(e.target.value)}
++              disabled={isLoading}
++              autoComplete="email"
++            />
++            
++            <TextField
++              label="Password"
++              variant="outlined"
++              type="password"
++              fullWidth
++              margin="normal"
++              value={password}
++              onChange={(e) => setPassword(e.target.value)}
++              disabled={isLoading}
++              autoComplete="current-password"
++            />
++            
++            <Button
++              type="submit"
++              variant="contained"
++              fullWidth
++              disabled={isLoading}
++              sx={{ 
++                mt: 3, 
++                mb: 2, 
++                py: 1.5,
++                borderRadius: '6px',
++                backgroundColor: '#1976d2',
++                fontWeight: 600,
++                textTransform: 'none'
++              }}
++            >
++              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
++            </Button>
++          </form>
++        </CardContent>
++      </Card>
++    </Box>
++  );
++};
+diff --git a/apps/frontend-web/src/services/authService.ts b/apps/frontend-web/src/services/authService.ts
+new file mode 100644
+index 0000000..a5725fd
+--- /dev/null
++++ b/apps/frontend-web/src/services/authService.ts
+@@ -0,0 +1,78 @@
++import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';
++
++export type LoginRequest = LoginCredentialsDto;
++
++class AuthService {
++  private baseUrl = '/api/auth';
++  private useMock = true; // Use mock adapter for development
++
++  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
++    if (this.useMock) {
++      return this.mockLogin(credentials);
++    }
++
++    const response = await fetch(`${this.baseUrl}/login`, {
++      method: 'POST',
++      headers: {
++        'Content-Type': 'application/json',
++      },
++      body: JSON.stringify(credentials),
++    });
++
++    if (!response.ok) {
++      const error = await response.json();
++      throw new Error(error.message || 'Login failed');
++    }
++
++    const result = await response.json();
++    return result.data as AuthResponseDto;
++  }
++
++  async logout(): Promise<void> {
++    if (this.useMock) {
++      return new Promise(resolve => setTimeout(resolve, 300));
++    }
++
++    const sessionData = sessionStorage.getItem('auth_session');
++    let token = '';
++    if (sessionData) {
++      try {
++        const parsed = JSON.parse(sessionData);
++        token = parsed.token;
++      } catch (e) {}
++    }
++
++    const response = await fetch(`${this.baseUrl}/logout`, {
++      method: 'POST',
++      headers: {
++        'Authorization': `Bearer ${token}`
++      }
++    });
++
++    if (!response.ok) {
++      console.error('Logout failed on server');
++    }
++  }
++
++  private mockLogin(credentials: LoginRequest): Promise<AuthResponseDto> {
++    return new Promise((resolve, reject) => {
++      setTimeout(() => {
++        if (credentials.email === 'admin@salarymgmt.com' && credentials.password === 'admin123') {
++          resolve({
++            token: 'mock123token',
++            user: {
++              id: 'admin-1',
++              email: 'admin@salarymgmt.com',
++              fullName: 'Admin User',
++              role: 'hr_admin'
++            }
++          });
++        } else {
++          reject(new Error('Invalid email or password'));
++        }
++      }, 500);
++    });
++  }
++}
++
++export const authService = new AuthService();
+diff --git a/apps/frontend-web/src/store/index.ts b/apps/frontend-web/src/store/index.ts
+new file mode 100644
+index 0000000..ec300b9
+--- /dev/null
++++ b/apps/frontend-web/src/store/index.ts
+@@ -0,0 +1,15 @@
++import { configureStore } from '@reduxjs/toolkit';
++import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
++import authReducer from './slices/authSlice';
++
++export const store = configureStore({
++  reducer: {
++    auth: authReducer,
++  },
++});
++
++export type RootState = ReturnType<typeof store.getState>;
++export type AppDispatch = typeof store.dispatch;
++
++export const useAppDispatch = () => useDispatch<AppDispatch>();
++export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
+diff --git a/apps/frontend-web/src/store/slices/authSlice.ts b/apps/frontend-web/src/store/slices/authSlice.ts
+new file mode 100644
+index 0000000..76d786e
+--- /dev/null
++++ b/apps/frontend-web/src/store/slices/authSlice.ts
+@@ -0,0 +1,102 @@
++import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
++import { UserSession } from '@salary-mgmt/shared-types';
++import { authService, LoginRequest } from '../../services/authService';
++
++interface AuthState {
++  session: UserSession | null;
++  isAuthenticated: boolean;
++  isLoading: boolean;
++  error: string | null;
++}
++
++const getInitialSession = (): UserSession | null => {
++  try {
++    const stored = sessionStorage.getItem('auth_session');
++    if (stored) {
++      return JSON.parse(stored) as UserSession;
++    }
++  } catch (e) {
++    console.error('Failed to parse stored session', e);
++  }
++  return null;
++};
++
++const initialSession = getInitialSession();
++
++const initialState: AuthState = {
++  session: initialSession,
++  isAuthenticated: !!initialSession,
++  isLoading: false,
++  error: null,
++};
++
++export const login = createAsyncThunk(
++  'auth/login',
++  async (credentials: LoginRequest, { rejectWithValue }) => {
++    try {
++      const response = await authService.login(credentials);
++      return response;
++    } catch (error: any) {
++      return rejectWithValue(error.message || 'Login failed');
++    }
++  }
++);
++
++export const logout = createAsyncThunk(
++  'auth/logout',
++  async (_, { getState, rejectWithValue }) => {
++    try {
++      await authService.logout();
++    } catch (error: any) {
++      // Proceed to clear state anyway
++      console.error('Logout API failed', error);
++    }
++  }
++);
++
++const authSlice = createSlice({
++  name: 'auth',
++  initialState,
++  reducers: {
++    clearError: (state) => {
++      state.error = null;
++    }
++  },
++  extraReducers: (builder) => {
++    builder
++      .addCase(login.pending, (state) => {
++        state.isLoading = true;
++        state.error = null;
++      })
++      .addCase(login.fulfilled, (state, action) => {
++        state.isLoading = false;
++        state.isAuthenticated = true;
++        
++        // Mock session payload for Redux from AuthResponseDto
++        const mockSession: UserSession = {
++          token: action.payload.token,
++          userId: action.payload.user.id,
++          role: action.payload.user.role,
++          email: action.payload.user.email,
++          organizationId: 'org-1',
++          createdAt: new Date().toISOString(),
++          expiresAt: new Date(Date.now() + 86400000).toISOString(),
++        };
++        
++        state.session = mockSession;
++        sessionStorage.setItem('auth_session', JSON.stringify(mockSession));
++      })
++      .addCase(login.rejected, (state, action) => {
++        state.isLoading = false;
++        state.error = action.payload as string;
++      })
++      .addCase(logout.fulfilled, (state) => {
++        state.session = null;
++        state.isAuthenticated = false;
++        sessionStorage.removeItem('auth_session');
++      });
++  },
++});
++
++export const { clearError } = authSlice.actions;
++export default authSlice.reducer;
+diff --git a/apps/frontend-web/vite.config.ts b/apps/frontend-web/vite.config.ts
+index cf18ebd..19d12a7 100644
+--- a/apps/frontend-web/vite.config.ts
++++ b/apps/frontend-web/vite.config.ts
+@@ -18,5 +18,10 @@ export default defineConfig({
+     globals: true,
+     environment: 'jsdom',
+     setupFiles: ['./src/test/setup.ts'],
++    server: {
++      deps: {
++        inline: ['@mui/icons-material', '@mui/material']
++      }
++    }
+   },
+ });
+diff --git a/libs/shared-auth/src/index.ts b/libs/shared-auth/src/index.ts
+index e305dec..701962b 100644
+--- a/libs/shared-auth/src/index.ts
++++ b/libs/shared-auth/src/index.ts
+@@ -26,3 +26,24 @@ export interface SessionStore {
+   setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
+   deleteSession(token: string): Promise<void>;
+ }
++
++export function generateOpaqueToken(length: number = 10): string {
++  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
++  let token = '';
++  // Use crypto for secure random bytes if available (in node environment)
++  if (typeof process !== 'undefined' && typeof require !== 'undefined') {
++    const crypto = require('crypto');
++    const randomBytes = crypto.randomBytes(length);
++    for (let i = 0; i < length; i++) {
++      token += chars[randomBytes[i] % chars.length];
++    }
++  } else {
++    // Fallback for non-node environments
++    for (let i = 0; i < length; i++) {
++      token += chars.charAt(Math.floor(Math.random() * chars.length));
++    }
++  }
++  return token;
++}
++
++export * from './session-store';
+diff --git a/libs/shared-auth/src/session-store.spec.ts b/libs/shared-auth/src/session-store.spec.ts
+new file mode 100644
+index 0000000..d0e52c2
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.spec.ts
+@@ -0,0 +1,60 @@
++import { generateOpaqueToken, REDIS_SESSION_KEY_PREFIX } from './index';
++import { RedisSessionStore } from './session-store';
++import { UserSession } from '@salary-mgmt/shared-types';
++
++describe('Auth Library', () => {
++  describe('generateOpaqueToken', () => {
++    it('should generate a token of specified length', () => {
++      const token = generateOpaqueToken(10);
++      expect(token.length).toBe(10);
++    });
++
++    it('should generate unique tokens', () => {
++      const token1 = generateOpaqueToken(10);
++      const token2 = generateOpaqueToken(10);
++      expect(token1).not.toBe(token2);
++    });
++  });
++
++  describe('RedisSessionStore (in-memory fallback)', () => {
++    let store: RedisSessionStore;
++    let mockSession: UserSession;
++
++    beforeEach(() => {
++      store = new RedisSessionStore();
++      mockSession = {
++        token: 'test-token',
++        userId: 'user-123',
++        role: 'hr_admin',
++        email: 'test@example.com',
++        organizationId: 'org-123',
++        createdAt: new Date().toISOString(),
++        expiresAt: new Date(Date.now() + 86400000).toISOString()
++      };
++    });
++
++    it('should store and retrieve a session', async () => {
++      await store.setSession('test-token', mockSession);
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toEqual(mockSession);
++    });
++
++    it('should return null for non-existent session', async () => {
++      const retrieved = await store.getSession('non-existent');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should delete a session', async () => {
++      await store.setSession('test-token', mockSession);
++      await store.deleteSession('test-token');
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++
++    it('should handle expired sessions (mocking time)', async () => {
++      await store.setSession('test-token', mockSession, -1); // Expire immediately
++      const retrieved = await store.getSession('test-token');
++      expect(retrieved).toBeNull();
++    });
++  });
++});
+diff --git a/libs/shared-auth/src/session-store.ts b/libs/shared-auth/src/session-store.ts
+new file mode 100644
+index 0000000..b58c4b0
+--- /dev/null
++++ b/libs/shared-auth/src/session-store.ts
+@@ -0,0 +1,86 @@
++import { UserSession } from '@salary-mgmt/shared-types';
++import { SessionStore, REDIS_SESSION_KEY_PREFIX } from './index';
++
++// A simple in-memory fallback store
++class InMemorySessionStore implements SessionStore {
++  private store: Map<string, { session: UserSession; expiresAt: number }> = new Map();
++
++  async getSession(token: string): Promise<UserSession | null> {
++    const data = this.store.get(token);
++    if (!data) return null;
++    
++    if (Date.now() > data.expiresAt) {
++      this.store.delete(token);
++      return null;
++    }
++    
++    return data.session;
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    this.store.set(token, {
++      session,
++      expiresAt: Date.now() + (ttlSeconds * 1000)
++    });
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    this.store.delete(token);
++  }
++}
++
++export class RedisSessionStore implements SessionStore {
++  private fallbackStore = new InMemorySessionStore();
++  
++  constructor(private redisClient?: any) {} // Assuming ioredis or redis client
++
++  private getKey(token: string): string {
++    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
++  }
++
++  async getSession(token: string): Promise<UserSession | null> {
++    if (!this.redisClient) {
++      return this.fallbackStore.getSession(token);
++    }
++    
++    try {
++      const data = await this.redisClient.get(this.getKey(token));
++      if (!data) return null;
++      return JSON.parse(data) as UserSession;
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.getSession(token);
++    }
++  }
++
++  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++    
++    try {
++      await this.redisClient.set(
++        this.getKey(token),
++        JSON.stringify(session),
++        'EX',
++        ttlSeconds
++      );
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.setSession(token, session, ttlSeconds);
++    }
++  }
++
++  async deleteSession(token: string): Promise<void> {
++    if (!this.redisClient) {
++      return this.fallbackStore.deleteSession(token);
++    }
++    
++    try {
++      await this.redisClient.del(this.getKey(token));
++    } catch (error) {
++      console.warn('Redis error, falling back to in-memory', error);
++      return this.fallbackStore.deleteSession(token);
++    }
++  }
++}
+diff --git a/libs/shared-types/src/index.ts b/libs/shared-types/src/index.ts
+index 7a2dd89..c3e91cd 100644
+--- a/libs/shared-types/src/index.ts
++++ b/libs/shared-types/src/index.ts
+@@ -46,3 +46,19 @@ export interface ApiResponse<T> {
+   data: T;
+   message?: string;
+ }
++
++export interface LoginCredentialsDto {
++  email: string;
++  password?: string;
++  token?: string; // For magic links
++}
++
++export interface AuthResponseDto {
++  token: string;
++  user: {
++    id: string;
++    email: string;
++    fullName: string;
++    role: UserRole;
++  };
++}
+diff --git a/package-lock.json b/package-lock.json
+index 847886a..01814cc 100644
+--- a/package-lock.json
++++ b/package-lock.json
+@@ -42,10 +42,14 @@
+       "dependencies": {
+         "@emotion/react": "^11.14.0",
+         "@emotion/styled": "^11.14.0",
++        "@mui/icons-material": "^6.5.0",
+         "@mui/material": "^6.4.4",
++        "@reduxjs/toolkit": "^2.12.0",
+         "@salary-mgmt/shared-types": "*",
+         "react": "^18.3.1",
+-        "react-dom": "^18.3.1"
++        "react-dom": "^18.3.1",
++        "react-redux": "^9.3.0",
++        "react-router-dom": "^7.18.4"
+       },
+       "devDependencies": {
+         "@testing-library/jest-dom": "^6.6.3",
+@@ -59,6 +63,32 @@
+         "vitest": "^3.0.5"
+       }
+     },
++    "apps/frontend-web/node_modules/@mui/icons-material": {
++      "version": "6.5.0",
++      "resolved": "https://registry.npmjs.org/@mui/icons-material/-/icons-material-6.5.0.tgz",
++      "integrity": "sha512-VPuPqXqbBPlcVSA0BmnoE4knW4/xG6Thazo8vCLWkOKusko6DtwFV6B665MMWJ9j0KFohTIf3yx2zYtYacvG1g==",
++      "license": "MIT",
++      "dependencies": {
++        "@babel/runtime": "^7.26.0"
++      },
++      "engines": {
++        "node": ">=14.0.0"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/mui-org"
++      },
++      "peerDependencies": {
++        "@mui/material": "^6.5.0",
++        "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
++        "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        }
++      }
++    },
+     "libs/shared-auth": {
+       "name": "@salary-mgmt/shared-auth",
+       "version": "0.1.0",
+@@ -4431,6 +4461,32 @@
+         "url": "https://opencollective.com/popperjs"
+       }
+     },
++    "node_modules/@reduxjs/toolkit": {
++      "version": "2.12.0",
++      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
++      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
++      "license": "MIT",
++      "dependencies": {
++        "@standard-schema/spec": "^1.0.0",
++        "@standard-schema/utils": "^0.3.0",
++        "immer": "^11.0.0",
++        "redux": "^5.0.1",
++        "redux-thunk": "^3.1.0",
++        "reselect": "^5.1.0"
++      },
++      "peerDependencies": {
++        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
++        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
++      },
++      "peerDependenciesMeta": {
++        "react": {
++          "optional": true
++        },
++        "react-redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/@rolldown/pluginutils": {
+       "version": "1.0.0-beta.27",
+       "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
+@@ -5106,6 +5162,18 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@standard-schema/spec": {
++      "version": "1.1.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
++      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
++      "license": "MIT"
++    },
++    "node_modules/@standard-schema/utils": {
++      "version": "0.3.0",
++      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
++      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
++      "license": "MIT"
++    },
+     "node_modules/@svgr/babel-plugin-add-jsx-attribute": {
+       "version": "8.0.0",
+       "resolved": "https://registry.npmjs.org/@svgr/babel-plugin-add-jsx-attribute/-/babel-plugin-add-jsx-attribute-8.0.0.tgz",
+@@ -5627,6 +5695,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/@types/use-sync-external-store": {
++      "version": "0.0.6",
++      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
++      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
++      "license": "MIT"
++    },
+     "node_modules/@vitejs/plugin-react": {
+       "version": "4.7.0",
+       "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
+@@ -8971,6 +9045,16 @@
+         "node": ">= 4"
+       }
+     },
++    "node_modules/immer": {
++      "version": "11.1.18",
++      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.18.tgz",
++      "integrity": "sha512-EQyQtLiYW029lyoczMl/Hh4Xu7cDecSc58JRYpHyL4tIAu3eqd1yJzQX04d2BZHDkzFFvm6qJEJWOtfDSWAXbQ==",
++      "license": "MIT",
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/immer"
++      }
++    },
+     "node_modules/import-fresh": {
+       "version": "3.3.1",
+       "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
+@@ -11031,6 +11115,29 @@
+       "integrity": "sha512-UpMYezM4v5/18F28aC66AEsjXIgE02kyEMH6yLdgLXu/UTfa1Ntwck/nNLrbqJsEXW7gPb0coNO9FQse9WTovA==",
+       "license": "MIT"
+     },
++    "node_modules/react-redux": {
++      "version": "9.3.0",
++      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
++      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
++      "license": "MIT",
++      "dependencies": {
++        "@types/use-sync-external-store": "^0.0.6",
++        "use-sync-external-store": "^1.4.0"
++      },
++      "peerDependencies": {
++        "@types/react": "^18.2.25 || ^19",
++        "react": "^18.0 || ^19",
++        "redux": "^5.0.0"
++      },
++      "peerDependenciesMeta": {
++        "@types/react": {
++          "optional": true
++        },
++        "redux": {
++          "optional": true
++        }
++      }
++    },
+     "node_modules/react-refresh": {
+       "version": "0.17.0",
+       "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
+@@ -11041,6 +11148,57 @@
+         "node": ">=0.10.0"
+       }
+     },
++    "node_modules/react-router": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
++      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
++      "license": "MIT",
++      "dependencies": {
++        "cookie": "^1.0.1",
++        "set-cookie-parser": "^2.6.0"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      },
++      "peerDependenciesMeta": {
++        "react-dom": {
++          "optional": true
++        }
++      }
++    },
++    "node_modules/react-router-dom": {
++      "version": "7.18.4",
++      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
++      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
++      "license": "MIT",
++      "dependencies": {
++        "react-router": "7.18.4"
++      },
++      "engines": {
++        "node": ">=20.0.0"
++      },
++      "peerDependencies": {
++        "react": ">=18",
++        "react-dom": ">=18"
++      }
++    },
++    "node_modules/react-router/node_modules/cookie": {
++      "version": "1.1.1",
++      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
++      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
++      "license": "MIT",
++      "engines": {
++        "node": ">=18"
++      },
++      "funding": {
++        "type": "opencollective",
++        "url": "https://opencollective.com/express"
++      }
++    },
+     "node_modules/react-transition-group": {
+       "version": "4.4.5",
+       "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
+@@ -11086,6 +11244,21 @@
+         "node": ">=8"
+       }
+     },
++    "node_modules/redux": {
++      "version": "5.0.1",
++      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
++      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
++      "license": "MIT"
++    },
++    "node_modules/redux-thunk": {
++      "version": "3.1.0",
++      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
++      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
++      "license": "MIT",
++      "peerDependencies": {
++        "redux": "^5.0.0"
++      }
++    },
+     "node_modules/regenerate": {
+       "version": "1.4.2",
+       "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.4.2.tgz",
+@@ -11171,6 +11344,12 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/reselect": {
++      "version": "5.3.0",
++      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.3.0.tgz",
++      "integrity": "sha512-XGoLeRAVzUTcJ1qkxPQhDJyIZ5d6zzZD9nT7AEZOaaU9UbWclhycElmhO+VD5bFeLuzhPBaOV2oXC8uG35ZSpg==",
++      "license": "MIT"
++    },
+     "node_modules/resolve": {
+       "version": "1.22.8",
+       "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
+@@ -11470,6 +11649,12 @@
+         "node": ">= 0.8.0"
+       }
+     },
++    "node_modules/set-cookie-parser": {
++      "version": "2.7.2",
++      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
++      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
++      "license": "MIT"
++    },
+     "node_modules/setprototypeof": {
+       "version": "1.2.0",
+       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
+@@ -12357,6 +12542,15 @@
+       "dev": true,
+       "license": "MIT"
+     },
++    "node_modules/use-sync-external-store": {
++      "version": "1.7.0",
++      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
++      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
++      "license": "MIT",
++      "peerDependencies": {
++        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
++      }
++    },
+     "node_modules/util-deprecate": {
+       "version": "1.0.2",
+       "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
+
+Do not invoke any skill, and do not spawn subagents of your own G«ˆ you are the reviewer. If the instruction file is unreadable, report that exact failure and stop. Return your findings as text in your final message; do not route them through any findings-reporting tool the host may offer.
diff --git a/_bmad-output/planning-artifacts/epics.md b/_bmad-output/planning-artifacts/epics.md
index 2bc31ce..dbb2d69 100644
--- a/_bmad-output/planning-artifacts/epics.md
+++ b/_bmad-output/planning-artifacts/epics.md
@@ -143,6 +143,19 @@ So that I have a quick summary of the organization's current state upon logging
 **Then** I see the total count of employees
 **And** I see a summary of the most recent payroll runs.
 
+### Story 1.5: Backend Authentication API
+
+As a System (Frontend),
+I want a NestJS REST API backend that handles authentication and session management,
+So that HR Administrators can log in with their real credentials and the frontend can establish a secure session.
+
+**Acceptance Criteria:**
+
+**Given** the frontend sends a POST request to `/api/auth/login` with valid HR admin credentials
+**When** the backend receives the request
+**Then** it verifies the credentials against the MySQL database (or a seeded default admin)
+**And** generates an opaque token using the `shared-auth` library, storing the session in Redis, and returns the token.
+
 ## Epic 2: Employee Lifecycle & Portal Onboarding
 
 Enable HR to securely manage the employee directory, and allow employees to activate their accounts and access their self-service portal.
diff --git a/_bmad-output/specs/spec-1-5-backend-authentication-api/SPEC.md b/_bmad-output/specs/spec-1-5-backend-authentication-api/SPEC.md
new file mode 100644
index 0000000..ab8c833
--- /dev/null
+++ b/_bmad-output/specs/spec-1-5-backend-authentication-api/SPEC.md
@@ -0,0 +1,33 @@
+---
+id: SPEC-1-5-backend-authentication-api
+companions: []
+sources: ["c:/Users/navan/projects/salary_management_system/_bmad-output/planning-artifacts/epics.md"]
+---
+
+> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability G«ˆ consult them only if you need narrative rationale or prose color this contract intentionally omits.
+
+# Story 1.5: Backend Authentication API
+
+## Why
+
+The frontend HR Admin interface has been built and requires a secure, functioning backend to verify user credentials and establish a session. Implementing the NestJS REST API auth controller ensures HR Administrators can log in to the actual system, moving from the frontend mock adapter to a fully integrated authentication flow.
+
+## Capabilities
+
+- **CAP-1**
+  - **intent:** Frontend can send a POST request to `/api/auth/login` to authenticate HR admin credentials against the MySQL database.
+  - **success:** The backend returns a valid opaque token generated by `shared-auth` if credentials are correct (or using a seeded default admin account), storing the active session in Redis.
+
+## Constraints
+
+- Must be implemented as a NestJS REST API backend application.
+- Must use the existing `shared-auth` library for token generation and Redis session storage.
+
+## Non-goals
+
+- No user registration endpoint is built in this story (HR onboarding is covered in Epic 2).
+- No frontend changes are made other than updating the mock adapter to `false`.
+
+## Success signal
+
+- A local POST request to `/api/auth/login` with valid credentials returns an opaque token, and that token successfully resolves to an active session in the Redis store.
diff --git a/apps/frontend-web/package.json b/apps/frontend-web/package.json
index 1b19f12..89a7e1c 100644
--- a/apps/frontend-web/package.json
+++ b/apps/frontend-web/package.json
@@ -12,10 +12,14 @@
   "dependencies": {
     "@emotion/react": "^11.14.0",
     "@emotion/styled": "^11.14.0",
+    "@mui/icons-material": "^6.5.0",
     "@mui/material": "^6.4.4",
+    "@reduxjs/toolkit": "^2.12.0",
     "@salary-mgmt/shared-types": "*",
     "react": "^18.3.1",
-    "react-dom": "^18.3.1"
+    "react-dom": "^18.3.1",
+    "react-redux": "^9.3.0",
+    "react-router-dom": "^7.18.4"
   },
   "devDependencies": {
     "@testing-library/jest-dom": "^6.6.3",
diff --git a/apps/frontend-web/src/app/App.spec.tsx b/apps/frontend-web/src/app/App.spec.tsx
index 844b816..19660bf 100644
--- a/apps/frontend-web/src/app/App.spec.tsx
+++ b/apps/frontend-web/src/app/App.spec.tsx
@@ -1,15 +1,13 @@
 import { render, screen } from '@testing-library/react';
 import { describe, it, expect } from 'vitest';
 import React from 'react';
-import App, { AppContent } from './App';
+import App from './App';
 import { theme, designTokens } from '../theme/theme';
-import { AppThemeProvider } from '../theme/ThemeProvider';
 
-describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
-  it('renders application with global theme provider and heading', () => {
+describe('App component', () => {
+  it('renders application and redirects to login by default', () => {
     render(<App />);
-    expect(screen.getByText(/Foundation & UI Theme Initialized/i)).toBeInTheDocument();
-    expect(screen.getByTestId('app-bar')).toBeInTheDocument();
+    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
   });
 
   it('verifies custom theme tokens adhere strictly to DESIGN.md', () => {
@@ -24,28 +22,4 @@ describe('Story 1.1: Project Foundation & UI Theme Initialization', () => {
     expect(theme.typography.fontFamily).toContain('Inter');
     expect(theme.typography.fontFamily).toContain('Roboto');
   });
-
-  it('renders theme tokens in the UI preview card', () => {
-    render(
-      <AppThemeProvider>
-        <AppContent />
-      </AppThemeProvider>
-    );
-
-    const primaryColorText = screen.getByText('#1976d2');
-    expect(primaryColorText).toBeInTheDocument();
-
-    const bgDefaultText = screen.getByText('#f4f6f8');
-    expect(bgDefaultText).toBeInTheDocument();
-
-    const borderRadiusText = screen.getByText('8px');
-    expect(borderRadiusText).toBeInTheDocument();
-  });
-
-  it('successfully consumes models from @salary-mgmt/shared-types', () => {
-    render(<App />);
-    expect(screen.getByText(/ACME Technologies Pvt Ltd/i)).toBeInTheDocument();
-    expect(screen.getByText(/GÈ¶ INR/i)).toBeInTheDocument();
-    expect(screen.getByText(/HR Administrator/i)).toBeInTheDocument();
-  });
 });
diff --git a/apps/frontend-web/src/app/App.tsx b/apps/frontend-web/src/app/App.tsx
index acaba5e..a19e5d5 100644
--- a/apps/frontend-web/src/app/App.tsx
+++ b/apps/frontend-web/src/app/App.tsx
@@ -1,173 +1,43 @@
 import React from 'react';
-import AppBar from '@mui/material/AppBar';
-import Toolbar from '@mui/material/Toolbar';
-import Typography from '@mui/material/Typography';
-import Container from '@mui/material/Container';
-import Box from '@mui/material/Box';
-import Card from '@mui/material/Card';
-import CardContent from '@mui/material/CardContent';
-import Button from '@mui/material/Button';
-import Stack from '@mui/material/Stack';
-import Chip from '@mui/material/Chip';
-import { useTheme } from '@mui/material/styles';
+import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
+import { Provider } from 'react-redux';
 import { AppThemeProvider } from '../theme/ThemeProvider';
-import { OrganizationProfile, UserRole } from '@salary-mgmt/shared-types';
-
-export const AppContent: React.FC = () => {
-  const currentTheme = useTheme();
-
-  const demoProfile: OrganizationProfile = {
-    id: 'org-demo-001',
-    name: 'ACME Technologies Pvt Ltd',
-    code: 'ACME',
-    contactEmail: 'admin@acme.corp',
-    currency: 'INR',
-    createdAt: '2026-09-23T00:00:00Z',
-    updatedAt: '2026-09-23T00:00:00Z',
-  };
-
-  const sampleRole: UserRole = 'hr_admin';
-
-  return (
-    <Box
-      data-testid="app-container"
-      sx={{
-        minHeight: '100vh',
-        backgroundColor: currentTheme.palette.background.default,
-        display: 'flex',
-        flexDirection: 'column',
-      }}
-    >
-      <AppBar position="static" data-testid="app-bar">
-        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
-          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
-            Salary Management System
-          </Typography>
-          <Chip
-            label={sampleRole === 'hr_admin' ? 'HR Administrator' : 'Employee'}
-            size="small"
-            color="primary"
-            variant="outlined"
-            data-testid="role-chip"
-          />
-        </Toolbar>
-      </AppBar>
-
-      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
-        <Stack spacing={3}>
-          <Box>
-            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
-              Foundation & UI Theme Initialized
-            </Typography>
-            <Typography variant="body1" color="text.secondary">
-              The foundational Nx monorepo, shared types, and Material UI design system are active.
-            </Typography>
-          </Box>
-
-          <Box
-            sx={{
-              display: 'grid',
-              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
-              gap: 3,
-            }}
-          >
-            <Card data-testid="theme-card">
-              <CardContent>
-                <Typography variant="h6" gutterBottom>
-                  Design Tokens Preview
-                </Typography>
-                <Stack spacing={1.5} sx={{ mt: 2 }}>
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Primary Color:</Typography>
-                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
-                      <Box
-                        data-testid="primary-color-swatch"
-                        sx={{
-                          width: 20,
-                          height: 20,
-                          borderRadius: '4px',
-                          backgroundColor: currentTheme.palette.primary.main,
-                        }}
-                      />
-                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
-                        {currentTheme.palette.primary.main}
-                      </Typography>
-                    </Box>
-                  </Box>
-
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Background Default:</Typography>
-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
-                      {currentTheme.palette.background.default}
-                    </Typography>
-                  </Box>
-
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Card Border Radius:</Typography>
-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
-                      {currentTheme.shape.borderRadius}px
-                    </Typography>
-                  </Box>
-
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Primary Font:</Typography>
-                    <Typography
-                      variant="body2"
-                      data-testid="font-family-label"
-                      sx={{ maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis' }}
-                    >
-                      {currentTheme.typography.fontFamily}
-                    </Typography>
-                  </Box>
-                </Stack>
-              </CardContent>
-            </Card>
-
-            <Card data-testid="shared-type-card">
-              <CardContent>
-                <Typography variant="h6" gutterBottom>
-                  Shared Models & Architecture
-                </Typography>
-                <Stack spacing={1.5} sx={{ mt: 2 }}>
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Organization Profile:</Typography>
-                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
-                      {demoProfile.name}
-                    </Typography>
-                  </Box>
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Currency Standard:</Typography>
-                    <Chip label={`GÈ¶ ${demoProfile.currency}`} size="small" />
-                  </Box>
-                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
-                    <Typography variant="body2">Org Code:</Typography>
-                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
-                      {demoProfile.code}
-                    </Typography>
-                  </Box>
-                </Stack>
-                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
-                  <Button variant="contained" color="primary" size="medium">
-                    Primary Action
-                  </Button>
-                  <Button variant="outlined" color="primary" size="medium">
-                    Outlined Action
-                  </Button>
-                </Box>
-              </CardContent>
-            </Card>
-          </Box>
-        </Stack>
-      </Container>
-    </Box>
-  );
-};
+import { store } from '../store';
+import { LoginPage } from '../pages/LoginPage';
+import { AdminLayout } from '../layouts/AdminLayout';
+import { AdminDashboardPlaceholder } from '../pages/AdminDashboardPlaceholder';
+import { ProtectedRoute } from '../components/ProtectedRoute';
 
 export const App: React.FC = () => {
   return (
-    <AppThemeProvider>
-      <AppContent />
-    </AppThemeProvider>
+    <Provider store={store}>
+      <AppThemeProvider>
+        <BrowserRouter>
+          <Routes>
+            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
+            
+            <Route path="/login" element={<LoginPage />} />
+            
+            <Route 
+              path="/admin" 
+              element={
+                <ProtectedRoute>
+                  <AdminLayout />
+                </ProtectedRoute>
+              }
+            >
+              <Route index element={<Navigate to="dashboard" replace />} />
+              <Route path="dashboard" element={<AdminDashboardPlaceholder />} />
+              <Route path="employees" element={<div>Employees Page (Not Implemented)</div>} />
+              <Route path="salary-config" element={<div>Salary Config (Not Implemented)</div>} />
+              <Route path="payslips" element={<div>Payslips (Not Implemented)</div>} />
+            </Route>
+
+            <Route path="*" element={<Navigate to="/login" replace />} />
+          </Routes>
+        </BrowserRouter>
+      </AppThemeProvider>
+    </Provider>
   );
 };
 
diff --git a/apps/frontend-web/src/components/ProtectedRoute.tsx b/apps/frontend-web/src/components/ProtectedRoute.tsx
new file mode 100644
index 0000000..495d14e
--- /dev/null
+++ b/apps/frontend-web/src/components/ProtectedRoute.tsx
@@ -0,0 +1,22 @@
+import React from 'react';
+import { Navigate, useLocation } from 'react-router-dom';
+import { useAppSelector } from '../store';
+
+interface ProtectedRouteProps {
+  children: React.ReactNode;
+}
+
+export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
+  const { isAuthenticated } = useAppSelector((state) => state.auth);
+  const location = useLocation();
+
+  if (!isAuthenticated) {
+    // Redirect them to the /login page, but save the current location they were
+    // trying to go to when they were redirected. This allows us to send them
+    // along to that page after they login, which is a nicer user experience
+    // than dropping them off on the home page.
+    return <Navigate to="/login" state={{ from: location }} replace />;
+  }
+
+  return <>{children}</>;
+};
diff --git a/apps/frontend-web/src/layouts/AdminLayout.spec.tsx b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
new file mode 100644
index 0000000..43ae7b6
--- /dev/null
+++ b/apps/frontend-web/src/layouts/AdminLayout.spec.tsx
@@ -0,0 +1,91 @@
+import React from 'react';
+import { render, screen, fireEvent } from '@testing-library/react';
+import { Provider } from 'react-redux';
+import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
+import { configureStore } from '@reduxjs/toolkit';
+import authReducer from '../store/slices/authSlice';
+import { AdminLayout } from './AdminLayout';
+import { ProtectedRoute } from '../components/ProtectedRoute';
+
+const createTestStore = (isAuthenticated = true) => {
+  return configureStore({
+    reducer: { auth: authReducer },
+    preloadedState: {
+      auth: {
+        isAuthenticated,
+        session: null,
+        isLoading: false,
+        error: null
+      }
+    }
+  });
+};
+
+describe('AdminLayout & ProtectedRoute', () => {
+  it('renders sidebar navigation items when authenticated', () => {
+    const store = createTestStore(true);
+    render(
+      <Provider store={store}>
+        <BrowserRouter>
+          <AdminLayout />
+        </BrowserRouter>
+      </Provider>
+    );
+
+    expect(screen.getByText('HR Administration')).toBeInTheDocument();
+    expect(screen.getByText('Dashboard')).toBeInTheDocument();
+    expect(screen.getByText('Employees')).toBeInTheDocument();
+    expect(screen.getByText('Salary Config')).toBeInTheDocument();
+    expect(screen.getByText('Payslips')).toBeInTheDocument();
+    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
+  });
+
+  it('redirects to login when unauthenticated accessing protected route', () => {
+    const store = createTestStore(false);
+    render(
+      <Provider store={store}>
+        <MemoryRouter initialEntries={['/admin/dashboard']}>
+          <Routes>
+            <Route path="/login" element={<div>Login Page</div>} />
+            <Route 
+              path="/admin/*" 
+              element={
+                <ProtectedRoute>
+                  <AdminLayout />
+                </ProtectedRoute>
+              } 
+            />
+          </Routes>
+        </MemoryRouter>
+      </Provider>
+    );
+
+    // Should redirect to login
+    expect(screen.getByText('Login Page')).toBeInTheDocument();
+    expect(screen.queryByText('HR Administration')).not.toBeInTheDocument();
+  });
+
+  it('allows access to protected route when authenticated', () => {
+    const store = createTestStore(true);
+    render(
+      <Provider store={store}>
+        <MemoryRouter initialEntries={['/admin/dashboard']}>
+          <Routes>
+            <Route path="/login" element={<div>Login Page</div>} />
+            <Route 
+              path="/admin/*" 
+              element={
+                <ProtectedRoute>
+                  <AdminLayout />
+                </ProtectedRoute>
+              } 
+            />
+          </Routes>
+        </MemoryRouter>
+      </Provider>
+    );
+
+    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
+    expect(screen.getByText('HR Administration')).toBeInTheDocument();
+  });
+});
diff --git a/apps/frontend-web/src/layouts/AdminLayout.tsx b/apps/frontend-web/src/layouts/AdminLayout.tsx
new file mode 100644
index 0000000..9d65b6f
--- /dev/null
+++ b/apps/frontend-web/src/layouts/AdminLayout.tsx
@@ -0,0 +1,137 @@
+import React from 'react';
+import { Outlet, useNavigate, useLocation } from 'react-router-dom';
+import { 
+  Box, 
+  Drawer, 
+  AppBar, 
+  Toolbar, 
+  Typography, 
+  List, 
+  ListItem, 
+  ListItemButton, 
+  ListItemIcon, 
+  ListItemText,
+  Button
+} from '@mui/material';
+import DashboardIcon from '@mui/icons-material/Dashboard';
+import PeopleIcon from '@mui/icons-material/People';
+import SettingsIcon from '@mui/icons-material/Settings';
+import ReceiptIcon from '@mui/icons-material/Receipt';
+import LogoutIcon from '@mui/icons-material/Logout';
+import { useAppDispatch } from '../store';
+import { logout } from '../store/slices/authSlice';
+
+const drawerWidth = 260;
+
+export const AdminLayout: React.FC = () => {
+  const dispatch = useAppDispatch();
+  const navigate = useNavigate();
+  const location = useLocation();
+
+  const handleLogout = async () => {
+    await dispatch(logout());
+    navigate('/login');
+  };
+
+  const navItems = [
+    { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
+    { text: 'Employees', path: '/admin/employees', icon: <PeopleIcon /> },
+    { text: 'Salary Config', path: '/admin/salary-config', icon: <SettingsIcon /> },
+    { text: 'Payslips', path: '/admin/payslips', icon: <ReceiptIcon /> },
+  ];
+
+  return (
+    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
+      <AppBar
+        position="fixed"
+        elevation={0}
+        sx={{
+          width: `calc(100% - ${drawerWidth}px)`,
+          ml: `${drawerWidth}px`,
+          backgroundColor: '#ffffff',
+          color: '#111827',
+          borderBottom: '1px solid #e5e7eb',
+        }}
+      >
+        <Toolbar>
+          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
+            HR Administration
+          </Typography>
+          <Button 
+            color="inherit" 
+            onClick={handleLogout}
+            endIcon={<LogoutIcon />}
+            sx={{ textTransform: 'none' }}
+          >
+            Logout
+          </Button>
+        </Toolbar>
+      </AppBar>
+      
+      <Drawer
+        sx={{
+          width: drawerWidth,
+          flexShrink: 0,
+          '& .MuiDrawer-paper': {
+            width: drawerWidth,
+            boxSizing: 'border-box',
+            backgroundColor: '#ffffff',
+            borderRight: '1px solid #e5e7eb',
+          },
+        }}
+        variant="permanent"
+        anchor="left"
+      >
+        <Toolbar>
+          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
+            Salary Mgmt
+          </Typography>
+        </Toolbar>
+        
+        <List sx={{ px: 1 }}>
+          {navItems.map((item) => {
+            const isActive = location.pathname.startsWith(item.path);
+            return (
+              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
+                <ListItemButton
+                  onClick={() => navigate(item.path)}
+                  sx={{
+                    borderRadius: '6px',
+                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
+                    color: isActive ? '#1976d2' : '#6b7280',
+                    '&:hover': {
+                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
+                    }
+                  }}
+                >
+                  <ListItemIcon sx={{ color: isActive ? '#1976d2' : '#6b7280', minWidth: '40px' }}>
+                    {item.icon}
+                  </ListItemIcon>
+                  <ListItemText 
+                    primary={item.text} 
+                    primaryTypographyProps={{ 
+                      fontWeight: isActive ? 600 : 500,
+                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
+                    }} 
+                  />
+                </ListItemButton>
+              </ListItem>
+            );
+          })}
+        </List>
+      </Drawer>
+      
+      <Box
+        component="main"
+        sx={{
+          flexGrow: 1,
+          p: '24px',
+          width: `calc(100% - ${drawerWidth}px)`,
+          mt: '64px' // Toolbar height
+        }}
+      >
+        <Outlet />
+      </Box>
+    </Box>
+  );
+};
diff --git a/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
new file mode 100644
index 0000000..c48896a
--- /dev/null
+++ b/apps/frontend-web/src/pages/AdminDashboardPlaceholder.tsx
@@ -0,0 +1,20 @@
+import React from 'react';
+import { Box, Typography, Card, CardContent } from '@mui/material';
+
+export const AdminDashboardPlaceholder: React.FC = () => {
+  return (
+    <Box>
+      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
+        Dashboard Overview
+      </Typography>
+      
+      <Card sx={{ mt: 3, borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb' }}>
+        <CardContent sx={{ p: 4 }}>
+          <Typography variant="body1" color="text.secondary">
+            Welcome to the HR Admin Dashboard. The full dashboard implementation is scheduled for a future sprint.
+          </Typography>
+        </CardContent>
+      </Card>
+    </Box>
+  );
+};
diff --git a/apps/frontend-web/src/pages/LoginPage.spec.tsx b/apps/frontend-web/src/pages/LoginPage.spec.tsx
new file mode 100644
index 0000000..7e0e2c5
--- /dev/null
+++ b/apps/frontend-web/src/pages/LoginPage.spec.tsx
@@ -0,0 +1,95 @@
+import React from 'react';
+import { render, screen, fireEvent, waitFor } from '@testing-library/react';
+import { Provider } from 'react-redux';
+import { BrowserRouter } from 'react-router-dom';
+import { configureStore } from '@reduxjs/toolkit';
+import { vi } from 'vitest';
+import authReducer from '../store/slices/authSlice';
+import { LoginPage } from './LoginPage';
+import { authService } from '../services/authService';
+
+// Mock authService
+vi.mock('../services/authService', () => ({
+  authService: {
+    login: vi.fn()
+  }
+}));
+
+const renderWithProviders = (
+  ui: React.ReactElement,
+  {
+    preloadedState = {},
+    store = configureStore({
+      reducer: { auth: authReducer },
+      preloadedState,
+    }),
+    ...renderOptions
+  } = {}
+) => {
+  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
+    return <Provider store={store}><BrowserRouter>{children}</BrowserRouter></Provider>;
+  };
+  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
+};
+
+describe('LoginPage', () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it('renders login form elements', () => {
+    renderWithProviders(<LoginPage />);
+    expect(screen.getByRole('heading', { name: /hr login/i })).toBeInTheDocument();
+    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
+    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
+    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
+  });
+
+  it('shows validation error for empty fields', async () => {
+    renderWithProviders(<LoginPage />);
+    const submitBtn = screen.getByRole('button', { name: /sign in/i });
+    fireEvent.click(submitBtn);
+    expect(await screen.findByText('Email is required')).toBeInTheDocument();
+  });
+
+  it('shows validation error for missing password', async () => {
+    renderWithProviders(<LoginPage />);
+    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
+    const submitBtn = screen.getByRole('button', { name: /sign in/i });
+    fireEvent.click(submitBtn);
+    expect(await screen.findByText('Password is required')).toBeInTheDocument();
+  });
+
+  it('submits form when fields are valid', async () => {
+    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
+    mockLogin.mockResolvedValueOnce({ token: '123', user: { id: '1' } });
+    
+    renderWithProviders(<LoginPage />);
+    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
+    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
+    
+    const submitBtn = screen.getByRole('button', { name: /sign in/i });
+    fireEvent.click(submitBtn);
+    
+    await waitFor(() => {
+      expect(mockLogin).toHaveBeenCalledWith({
+        email: 'admin@example.com',
+        password: 'password123'
+      });
+    });
+  });
+
+  it('displays error on failed login', async () => {
+    const mockLogin = authService.login as ReturnType<typeof vi.fn>;
+    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
+    
+    renderWithProviders(<LoginPage />);
+    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@example.com' } });
+    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
+    
+    const submitBtn = screen.getByRole('button', { name: /sign in/i });
+    fireEvent.click(submitBtn);
+    
+    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
+  });
+});
diff --git a/apps/frontend-web/src/pages/LoginPage.tsx b/apps/frontend-web/src/pages/LoginPage.tsx
new file mode 100644
index 0000000..331ef8c
--- /dev/null
+++ b/apps/frontend-web/src/pages/LoginPage.tsx
@@ -0,0 +1,136 @@
+import React, { useState } from 'react';
+import { useNavigate, useLocation } from 'react-router-dom';
+import { 
+  Box, 
+  Card, 
+  CardContent, 
+  Typography, 
+  TextField, 
+  Button, 
+  Alert,
+  CircularProgress
+} from '@mui/material';
+import { useAppDispatch, useAppSelector } from '../store';
+import { login, clearError } from '../store/slices/authSlice';
+
+export const LoginPage: React.FC = () => {
+  const dispatch = useAppDispatch();
+  const navigate = useNavigate();
+  const location = useLocation();
+  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
+
+  const [email, setEmail] = useState('');
+  const [password, setPassword] = useState('');
+  const [validationError, setValidationError] = useState('');
+
+  // If already authenticated, redirect to admin dashboard
+  React.useEffect(() => {
+    if (isAuthenticated) {
+      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
+      navigate(from, { replace: true });
+    }
+  }, [isAuthenticated, navigate, location]);
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    setValidationError('');
+    
+    if (error) {
+      dispatch(clearError());
+    }
+
+    if (!email) {
+      setValidationError('Email is required');
+      return;
+    }
+    
+    if (!password) {
+      setValidationError('Password is required');
+      return;
+    }
+
+    await dispatch(login({ email, password }));
+  };
+
+  return (
+    <Box 
+      sx={{ 
+        minHeight: '100vh', 
+        display: 'flex', 
+        alignItems: 'center', 
+        justifyContent: 'center',
+        backgroundColor: '#f4f6f8'
+      }}
+    >
+      <Card 
+        sx={{ 
+          maxWidth: 400, 
+          width: '100%', 
+          borderRadius: '12px',
+          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
+        }}
+      >
+        <CardContent sx={{ p: '32px' }}>
+          <Typography 
+            variant="h5" 
+            component="h1" 
+            align="center" 
+            gutterBottom
+            sx={{ fontWeight: 700, mb: 3, fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}
+          >
+            HR Login
+          </Typography>
+
+          {(error || validationError) && (
+            <Alert severity="error" sx={{ mb: 3 }}>
+              {error || validationError}
+            </Alert>
+          )}
+
+          <form onSubmit={handleSubmit}>
+            <TextField
+              label="Email Address"
+              variant="outlined"
+              fullWidth
+              margin="normal"
+              value={email}
+              onChange={(e) => setEmail(e.target.value)}
+              disabled={isLoading}
+              autoComplete="email"
+            />
+            
+            <TextField
+              label="Password"
+              variant="outlined"
+              type="password"
+              fullWidth
+              margin="normal"
+              value={password}
+              onChange={(e) => setPassword(e.target.value)}
+              disabled={isLoading}
+              autoComplete="current-password"
+            />
+            
+            <Button
+              type="submit"
+              variant="contained"
+              fullWidth
+              disabled={isLoading}
+              sx={{ 
+                mt: 3, 
+                mb: 2, 
+                py: 1.5,
+                borderRadius: '6px',
+                backgroundColor: '#1976d2',
+                fontWeight: 600,
+                textTransform: 'none'
+              }}
+            >
+              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
+            </Button>
+          </form>
+        </CardContent>
+      </Card>
+    </Box>
+  );
+};
diff --git a/apps/frontend-web/src/services/authService.ts b/apps/frontend-web/src/services/authService.ts
new file mode 100644
index 0000000..f4b6328
--- /dev/null
+++ b/apps/frontend-web/src/services/authService.ts
@@ -0,0 +1,78 @@
+import { LoginCredentialsDto, AuthResponseDto } from '@salary-mgmt/shared-types';
+
+export type LoginRequest = LoginCredentialsDto;
+
+class AuthService {
+  private baseUrl = '/api/auth';
+  private useMock = false; // Connect to real NestJS backend
+
+  async login(credentials: LoginRequest): Promise<AuthResponseDto> {
+    if (this.useMock) {
+      return this.mockLogin(credentials);
+    }
+
+    const response = await fetch(`${this.baseUrl}/login`, {
+      method: 'POST',
+      headers: {
+        'Content-Type': 'application/json',
+      },
+      body: JSON.stringify(credentials),
+    });
+
+    if (!response.ok) {
+      const error = await response.json();
+      throw new Error(error.message || 'Login failed');
+    }
+
+    const result = await response.json();
+    return result as AuthResponseDto;
+  }
+
+  async logout(): Promise<void> {
+    if (this.useMock) {
+      return new Promise(resolve => setTimeout(resolve, 300));
+    }
+
+    const sessionData = sessionStorage.getItem('auth_session');
+    let token = '';
+    if (sessionData) {
+      try {
+        const parsed = JSON.parse(sessionData);
+        token = parsed.token;
+      } catch (e) {}
+    }
+
+    const response = await fetch(`${this.baseUrl}/logout`, {
+      method: 'POST',
+      headers: {
+        'Authorization': `Bearer ${token}`
+      }
+    });
+
+    if (!response.ok) {
+      console.error('Logout failed on server');
+    }
+  }
+
+  private mockLogin(credentials: LoginRequest): Promise<AuthResponseDto> {
+    return new Promise((resolve, reject) => {
+      setTimeout(() => {
+        if (credentials.email === 'admin@salarymgmt.com' && credentials.password === 'admin123') {
+          resolve({
+            token: 'mock123token',
+            user: {
+              id: 'admin-1',
+              email: 'admin@salarymgmt.com',
+              fullName: 'Admin User',
+              role: 'hr_admin'
+            }
+          });
+        } else {
+          reject(new Error('Invalid email or password'));
+        }
+      }, 500);
+    });
+  }
+}
+
+export const authService = new AuthService();
diff --git a/apps/frontend-web/src/store/index.ts b/apps/frontend-web/src/store/index.ts
new file mode 100644
index 0000000..ec300b9
--- /dev/null
+++ b/apps/frontend-web/src/store/index.ts
@@ -0,0 +1,15 @@
+import { configureStore } from '@reduxjs/toolkit';
+import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
+import authReducer from './slices/authSlice';
+
+export const store = configureStore({
+  reducer: {
+    auth: authReducer,
+  },
+});
+
+export type RootState = ReturnType<typeof store.getState>;
+export type AppDispatch = typeof store.dispatch;
+
+export const useAppDispatch = () => useDispatch<AppDispatch>();
+export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
diff --git a/apps/frontend-web/src/store/slices/authSlice.ts b/apps/frontend-web/src/store/slices/authSlice.ts
new file mode 100644
index 0000000..76d786e
--- /dev/null
+++ b/apps/frontend-web/src/store/slices/authSlice.ts
@@ -0,0 +1,102 @@
+import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
+import { UserSession } from '@salary-mgmt/shared-types';
+import { authService, LoginRequest } from '../../services/authService';
+
+interface AuthState {
+  session: UserSession | null;
+  isAuthenticated: boolean;
+  isLoading: boolean;
+  error: string | null;
+}
+
+const getInitialSession = (): UserSession | null => {
+  try {
+    const stored = sessionStorage.getItem('auth_session');
+    if (stored) {
+      return JSON.parse(stored) as UserSession;
+    }
+  } catch (e) {
+    console.error('Failed to parse stored session', e);
+  }
+  return null;
+};
+
+const initialSession = getInitialSession();
+
+const initialState: AuthState = {
+  session: initialSession,
+  isAuthenticated: !!initialSession,
+  isLoading: false,
+  error: null,
+};
+
+export const login = createAsyncThunk(
+  'auth/login',
+  async (credentials: LoginRequest, { rejectWithValue }) => {
+    try {
+      const response = await authService.login(credentials);
+      return response;
+    } catch (error: any) {
+      return rejectWithValue(error.message || 'Login failed');
+    }
+  }
+);
+
+export const logout = createAsyncThunk(
+  'auth/logout',
+  async (_, { getState, rejectWithValue }) => {
+    try {
+      await authService.logout();
+    } catch (error: any) {
+      // Proceed to clear state anyway
+      console.error('Logout API failed', error);
+    }
+  }
+);
+
+const authSlice = createSlice({
+  name: 'auth',
+  initialState,
+  reducers: {
+    clearError: (state) => {
+      state.error = null;
+    }
+  },
+  extraReducers: (builder) => {
+    builder
+      .addCase(login.pending, (state) => {
+        state.isLoading = true;
+        state.error = null;
+      })
+      .addCase(login.fulfilled, (state, action) => {
+        state.isLoading = false;
+        state.isAuthenticated = true;
+        
+        // Mock session payload for Redux from AuthResponseDto
+        const mockSession: UserSession = {
+          token: action.payload.token,
+          userId: action.payload.user.id,
+          role: action.payload.user.role,
+          email: action.payload.user.email,
+          organizationId: 'org-1',
+          createdAt: new Date().toISOString(),
+          expiresAt: new Date(Date.now() + 86400000).toISOString(),
+        };
+        
+        state.session = mockSession;
+        sessionStorage.setItem('auth_session', JSON.stringify(mockSession));
+      })
+      .addCase(login.rejected, (state, action) => {
+        state.isLoading = false;
+        state.error = action.payload as string;
+      })
+      .addCase(logout.fulfilled, (state) => {
+        state.session = null;
+        state.isAuthenticated = false;
+        sessionStorage.removeItem('auth_session');
+      });
+  },
+});
+
+export const { clearError } = authSlice.actions;
+export default authSlice.reducer;
diff --git a/apps/frontend-web/vite.config.ts b/apps/frontend-web/vite.config.ts
index cf18ebd..5db304a 100644
--- a/apps/frontend-web/vite.config.ts
+++ b/apps/frontend-web/vite.config.ts
@@ -13,10 +13,21 @@ export default defineConfig({
   server: {
     port: 3000,
     host: 'localhost',
+    proxy: {
+      '/api': {
+        target: 'http://localhost:3333',
+        changeOrigin: true,
+      }
+    }
   },
   test: {
     globals: true,
     environment: 'jsdom',
     setupFiles: ['./src/test/setup.ts'],
+    server: {
+      deps: {
+        inline: ['@mui/icons-material', '@mui/material']
+      }
+    }
   },
 });
diff --git a/apps/service-employee/migrations/1700000000000-SeedHrAdmin.ts b/apps/service-employee/migrations/1700000000000-SeedHrAdmin.ts
new file mode 100644
index 0000000..192ecfe
--- /dev/null
+++ b/apps/service-employee/migrations/1700000000000-SeedHrAdmin.ts
@@ -0,0 +1,21 @@
+import { MigrationInterface, QueryRunner } from 'typeorm';
+import { v4 as uuidv4 } from 'uuid';
+
+export class SeedHrAdmin1700000000000 implements MigrationInterface {
+  name = 'SeedHrAdmin1700000000000';
+
+  public async up(queryRunner: QueryRunner): Promise<void> {
+    await queryRunner.query(
+      `CREATE TABLE \`hr_admins\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_hr_admins_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
+    );
+
+    const id = uuidv4();
+    await queryRunner.query(
+      `INSERT INTO \`hr_admins\` (\`id\`, \`email\`, \`password_hash\`) VALUES ('${id}', 'admin@salarymgmt.com', 'admin123')`
+    );
+  }
+
+  public async down(queryRunner: QueryRunner): Promise<void> {
+    await queryRunner.query(`DROP TABLE \`hr_admins\``);
+  }
+}
diff --git a/apps/service-employee/project.json b/apps/service-employee/project.json
new file mode 100644
index 0000000..da40119
--- /dev/null
+++ b/apps/service-employee/project.json
@@ -0,0 +1,24 @@
+{
+  "name": "service-employee",
+  "projectType": "application",
+  "sourceRoot": "apps/service-employee/src",
+  "targets": {
+    "build": {
+      "executor": "@nx/webpack:webpack",
+      "outputs": ["{options.outputPath}"],
+      "options": {
+        "target": "node",
+        "compiler": "tsc",
+        "outputPath": "dist/apps/service-employee",
+        "main": "apps/service-employee/src/main.ts",
+        "tsConfig": "apps/service-employee/tsconfig.app.json"
+      }
+    },
+    "serve": {
+      "executor": "@nx/js:node",
+      "options": {
+        "buildTarget": "service-employee:build"
+      }
+    }
+  }
+}
diff --git a/apps/service-employee/src/app/app.module.ts b/apps/service-employee/src/app/app.module.ts
new file mode 100644
index 0000000..2e0912a
--- /dev/null
+++ b/apps/service-employee/src/app/app.module.ts
@@ -0,0 +1,10 @@
+import { Module } from '@nestjs/common';
+import { AuthModule } from '../auth/auth.module';
+import { DatabaseModule } from '../database/database.module';
+
+@Module({
+  imports: [AuthModule, DatabaseModule],
+  controllers: [],
+  providers: [],
+})
+export class AppModule {}
diff --git a/apps/service-employee/src/auth/auth.controller.ts b/apps/service-employee/src/auth/auth.controller.ts
new file mode 100644
index 0000000..5b7e8c8
--- /dev/null
+++ b/apps/service-employee/src/auth/auth.controller.ts
@@ -0,0 +1,23 @@
+import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
+import { AuthService } from './auth.service';
+
+@Controller('auth')
+export class AuthController {
+  constructor(private readonly authService: AuthService) {}
+
+  @Post('login')
+  @HttpCode(HttpStatus.OK)
+  async login(@Body() body: any) {
+    if (!body || !body.email || !body.password) {
+      throw new BadRequestException('Email and password are required');
+    }
+    
+    const token = await this.authService.validateUser(body.email, body.password);
+    
+    if (!token) {
+      throw new UnauthorizedException('Invalid credentials');
+    }
+    
+    return { token };
+  }
+}
diff --git a/apps/service-employee/src/auth/auth.module.ts b/apps/service-employee/src/auth/auth.module.ts
new file mode 100644
index 0000000..5b7b349
--- /dev/null
+++ b/apps/service-employee/src/auth/auth.module.ts
@@ -0,0 +1,11 @@
+import { Module } from '@nestjs/common';
+import { AuthController } from './auth.controller';
+import { AuthService } from './auth.service';
+import { DatabaseModule } from '../database/database.module';
+
+@Module({
+  imports: [DatabaseModule],
+  controllers: [AuthController],
+  providers: [AuthService],
+})
+export class AuthModule {}
diff --git a/apps/service-employee/src/auth/auth.service.ts b/apps/service-employee/src/auth/auth.service.ts
new file mode 100644
index 0000000..4b74226
--- /dev/null
+++ b/apps/service-employee/src/auth/auth.service.ts
@@ -0,0 +1,52 @@
+import { Injectable, OnModuleInit } from '@nestjs/common';
+import { InjectRepository } from '@nestjs/typeorm';
+import { Repository } from 'typeorm';
+import { HrAdmin } from '../database/hr-admin.entity';
+import { RedisSessionStore } from '@salary-mgmt/shared-auth';
+import { UserSession } from '@salary-mgmt/shared-types';
+import Redis from 'ioredis';
+import * as crypto from 'crypto';
+
+@Injectable()
+export class AuthService implements OnModuleInit {
+  private sessionStore: RedisSessionStore;
+
+  constructor(
+    @InjectRepository(HrAdmin)
+    private readonly adminRepository: Repository<HrAdmin>,
+  ) {}
+
+  onModuleInit() {
+    // Ideally from config, hardcoded for now
+    const redisClient = new Redis({
+      host: 'localhost',
+      port: 6379,
+    });
+    this.sessionStore = new RedisSessionStore(redisClient);
+  }
+
+  async validateUser(email: string, passwordHash: string): Promise<string | null> {
+    const admin = await this.adminRepository.findOne({ where: { email } });
+    if (!admin) {
+      return null;
+    }
+    
+    // In a real app we would use bcrypt, but here we simply compare the seed password for the spec
+    if (admin.password_hash !== passwordHash) {
+      return null;
+    }
+    
+    const token = crypto.randomBytes(16).toString('hex');
+    
+    const session: UserSession = {
+      userId: admin.id,
+      role: 'hr_admin',
+      email: admin.email,
+      organizationId: 'default-org' // Needed for the UserSession type
+    };
+    
+    await this.sessionStore.setSession(token, session);
+    
+    return token;
+  }
+}
diff --git a/apps/service-employee/src/database/database.module.ts b/apps/service-employee/src/database/database.module.ts
new file mode 100644
index 0000000..c5966e6
--- /dev/null
+++ b/apps/service-employee/src/database/database.module.ts
@@ -0,0 +1,21 @@
+import { Module } from '@nestjs/common';
+import { TypeOrmModule } from '@nestjs/typeorm';
+import { HrAdmin } from './hr-admin.entity';
+
+@Module({
+  imports: [
+    TypeOrmModule.forRoot({
+      type: 'mysql',
+      host: 'localhost',
+      port: 3306,
+      username: 'root', // Assumed defaults for local development
+      password: 'password',
+      database: 'salary_management',
+      entities: [HrAdmin],
+      synchronize: false, // Use migrations instead
+    }),
+    TypeOrmModule.forFeature([HrAdmin]),
+  ],
+  exports: [TypeOrmModule],
+})
+export class DatabaseModule {}
diff --git a/apps/service-employee/src/database/hr-admin.entity.ts b/apps/service-employee/src/database/hr-admin.entity.ts
new file mode 100644
index 0000000..442b33a
--- /dev/null
+++ b/apps/service-employee/src/database/hr-admin.entity.ts
@@ -0,0 +1,13 @@
+import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
+
+@Entity('hr_admins')
+export class HrAdmin {
+  @PrimaryGeneratedColumn('uuid')
+  id: string;
+
+  @Column({ unique: true })
+  email: string;
+
+  @Column()
+  password_hash: string;
+}
diff --git a/apps/service-employee/src/main.ts b/apps/service-employee/src/main.ts
new file mode 100644
index 0000000..f98c1cb
--- /dev/null
+++ b/apps/service-employee/src/main.ts
@@ -0,0 +1,12 @@
+import { NestFactory } from '@nestjs/core';
+import { AppModule } from './app/app.module';
+
+async function bootstrap() {
+  const app = await NestFactory.create(AppModule);
+  app.setGlobalPrefix('api');
+  app.enableCors();
+  const port = process.env.PORT || 3333;
+  await app.listen(port);
+  console.log(`Application is running on: http://localhost:${port}/api`);
+}
+bootstrap();
diff --git a/apps/service-employee/tsconfig.app.json b/apps/service-employee/tsconfig.app.json
new file mode 100644
index 0000000..0f02ed4
--- /dev/null
+++ b/apps/service-employee/tsconfig.app.json
@@ -0,0 +1,16 @@
+{
+  "extends": "./tsconfig.json",
+  "compilerOptions": {
+    "outDir": "../../dist/out-tsc",
+    "module": "commonjs",
+    "types": ["node"]
+  },
+  "exclude": [
+    "jest.config.ts",
+    "src/**/*.spec.ts",
+    "src/**/*.test.ts"
+  ],
+  "include": [
+    "src/**/*.ts"
+  ]
+}
diff --git a/apps/service-employee/tsconfig.json b/apps/service-employee/tsconfig.json
new file mode 100644
index 0000000..ce7d0c6
--- /dev/null
+++ b/apps/service-employee/tsconfig.json
@@ -0,0 +1,28 @@
+{
+  "extends": "../../tsconfig.base.json",
+  "compilerOptions": {
+    "module": "commonjs",
+    "declaration": true,
+    "removeComments": true,
+    "emitDecoratorMetadata": true,
+    "experimentalDecorators": true,
+    "allowSyntheticDefaultImports": true,
+    "target": "es2021",
+    "sourceMap": true,
+    "outDir": "../../dist/out-tsc",
+    "baseUrl": "./",
+    "incremental": true,
+    "strictNullChecks": false,
+    "noImplicitAny": false,
+    "strictBindCallApply": false,
+    "forceConsistentCasingInFileNames": false,
+    "noFallbackBumps": true
+  },
+  "files": [],
+  "include": [],
+  "references": [
+    {
+      "path": "./tsconfig.app.json"
+    }
+  ]
+}
diff --git a/apps/service-employee/typeorm.config.ts b/apps/service-employee/typeorm.config.ts
new file mode 100644
index 0000000..d60ca1c
--- /dev/null
+++ b/apps/service-employee/typeorm.config.ts
@@ -0,0 +1,16 @@
+import { DataSource } from 'typeorm';
+import { HrAdmin } from './src/database/hr-admin.entity';
+
+export const AppDataSource = new DataSource({
+  type: 'mysql',
+  host: 'localhost',
+  port: 3306,
+  username: 'root',
+  password: 'password',
+  database: 'salary_management',
+  synchronize: false,
+  logging: true,
+  entities: [HrAdmin],
+  migrations: ['./migrations/*.ts'],
+  subscribers: [],
+});
diff --git a/libs/shared-auth/src/index.ts b/libs/shared-auth/src/index.ts
index e305dec..9b26a92 100644
--- a/libs/shared-auth/src/index.ts
+++ b/libs/shared-auth/src/index.ts
@@ -26,3 +26,24 @@ export interface SessionStore {
   setSession(token: string, session: UserSession, ttlSeconds?: number): Promise<void>;
   deleteSession(token: string): Promise<void>;
 }
+
+export function generateOpaqueToken(length: number = 10): string {
+  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
+  let token = '';
+  // Use crypto for secure random bytes if available (in node environment)
+  if (typeof process !== 'undefined' && typeof require !== 'undefined') {
+    const crypto = require('crypto');
+    const randomBytes = crypto.randomBytes(length);
+    for (let i = 0; i < length; i++) {
+      token += chars[randomBytes[i] % chars.length];
+    }
+  } else {
+    // Fallback for non-node environments
+    for (let i = 0; i < length; i++) {
+      token += chars.charAt(Math.floor(Math.random() * chars.length));
+    }
+  }
+  return token;
+}
+
+export * from './session-store.js';
diff --git a/libs/shared-auth/src/session-store.spec.ts b/libs/shared-auth/src/session-store.spec.ts
new file mode 100644
index 0000000..eae81a2
--- /dev/null
+++ b/libs/shared-auth/src/session-store.spec.ts
@@ -0,0 +1,61 @@
+import { describe, it, expect, beforeEach } from 'vitest';
+import { generateOpaqueToken, REDIS_SESSION_KEY_PREFIX } from './index.js';
+import { RedisSessionStore } from './session-store.js';
+import { UserSession } from '@salary-mgmt/shared-types';
+
+describe('Auth Library', () => {
+  describe('generateOpaqueToken', () => {
+    it('should generate a token of specified length', () => {
+      const token = generateOpaqueToken(10);
+      expect(token.length).toBe(10);
+    });
+
+    it('should generate unique tokens', () => {
+      const token1 = generateOpaqueToken(10);
+      const token2 = generateOpaqueToken(10);
+      expect(token1).not.toBe(token2);
+    });
+  });
+
+  describe('RedisSessionStore (in-memory fallback)', () => {
+    let store: RedisSessionStore;
+    let mockSession: UserSession;
+
+    beforeEach(() => {
+      store = new RedisSessionStore();
+      mockSession = {
+        token: 'test-token',
+        userId: 'user-123',
+        role: 'hr_admin',
+        email: 'test@example.com',
+        organizationId: 'org-123',
+        createdAt: new Date().toISOString(),
+        expiresAt: new Date(Date.now() + 86400000).toISOString()
+      };
+    });
+
+    it('should store and retrieve a session', async () => {
+      await store.setSession('test-token', mockSession);
+      const retrieved = await store.getSession('test-token');
+      expect(retrieved).toEqual(mockSession);
+    });
+
+    it('should return null for non-existent session', async () => {
+      const retrieved = await store.getSession('non-existent');
+      expect(retrieved).toBeNull();
+    });
+
+    it('should delete a session', async () => {
+      await store.setSession('test-token', mockSession);
+      await store.deleteSession('test-token');
+      const retrieved = await store.getSession('test-token');
+      expect(retrieved).toBeNull();
+    });
+
+    it('should handle expired sessions (mocking time)', async () => {
+      await store.setSession('test-token', mockSession, -1); // Expire immediately
+      const retrieved = await store.getSession('test-token');
+      expect(retrieved).toBeNull();
+    });
+  });
+});
diff --git a/libs/shared-auth/src/session-store.ts b/libs/shared-auth/src/session-store.ts
new file mode 100644
index 0000000..b58c4b0
--- /dev/null
+++ b/libs/shared-auth/src/session-store.ts
@@ -0,0 +1,86 @@
+import { UserSession } from '@salary-mgmt/shared-types';
+import { SessionStore, REDIS_SESSION_KEY_PREFIX } from './index';
+
+// A simple in-memory fallback store
+class InMemorySessionStore implements SessionStore {
+  private store: Map<string, { session: UserSession; expiresAt: number }> = new Map();
+
+  async getSession(token: string): Promise<UserSession | null> {
+    const data = this.store.get(token);
+    if (!data) return null;
+    
+    if (Date.now() > data.expiresAt) {
+      this.store.delete(token);
+      return null;
+    }
+    
+    return data.session;
+  }
+
+  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
+    this.store.set(token, {
+      session,
+      expiresAt: Date.now() + (ttlSeconds * 1000)
+    });
+  }
+
+  async deleteSession(token: string): Promise<void> {
+    this.store.delete(token);
+  }
+}
+
+export class RedisSessionStore implements SessionStore {
+  private fallbackStore = new InMemorySessionStore();
+  
+  constructor(private redisClient?: any) {} // Assuming ioredis or redis client
+
+  private getKey(token: string): string {
+    return `${REDIS_SESSION_KEY_PREFIX}${token}`;
+  }
+
+  async getSession(token: string): Promise<UserSession | null> {
+    if (!this.redisClient) {
+      return this.fallbackStore.getSession(token);
+    }
+    
+    try {
+      const data = await this.redisClient.get(this.getKey(token));
+      if (!data) return null;
+      return JSON.parse(data) as UserSession;
+    } catch (error) {
+      console.warn('Redis error, falling back to in-memory', error);
+      return this.fallbackStore.getSession(token);
+    }
+  }
+
+  async setSession(token: string, session: UserSession, ttlSeconds: number = 86400): Promise<void> {
+    if (!this.redisClient) {
+      return this.fallbackStore.setSession(token, session, ttlSeconds);
+    }
+    
+    try {
+      await this.redisClient.set(
+        this.getKey(token),
+        JSON.stringify(session),
+        'EX',
+        ttlSeconds
+      );
+    } catch (error) {
+      console.warn('Redis error, falling back to in-memory', error);
+      return this.fallbackStore.setSession(token, session, ttlSeconds);
+    }
+  }
+
+  async deleteSession(token: string): Promise<void> {
+    if (!this.redisClient) {
+      return this.fallbackStore.deleteSession(token);
+    }
+    
+    try {
+      await this.redisClient.del(this.getKey(token));
+    } catch (error) {
+      console.warn('Redis error, falling back to in-memory', error);
+      return this.fallbackStore.deleteSession(token);
+    }
+  }
+}
diff --git a/libs/shared-types/src/index.ts b/libs/shared-types/src/index.ts
index 7a2dd89..c3e91cd 100644
--- a/libs/shared-types/src/index.ts
+++ b/libs/shared-types/src/index.ts
@@ -46,3 +46,19 @@ export interface ApiResponse<T> {
   data: T;
   message?: string;
 }
+
+export interface LoginCredentialsDto {
+  email: string;
+  password?: string;
+  token?: string; // For magic links
+}
+
+export interface AuthResponseDto {
+  token: string;
+  user: {
+    id: string;
+    email: string;
+    fullName: string;
+    role: UserRole;
+  };
+}
diff --git a/package-lock.json b/package-lock.json
index 847886a..2621fc2 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -15,8 +15,13 @@
         "@emotion/react": "^11.14.0",
         "@emotion/styled": "^11.14.0",
         "@mui/material": "^6.4.4",
+        "@nestjs-modules/ioredis": "^2.2.2",
+        "@nestjs/typeorm": "^11.0.3",
+        "ioredis": "^5.11.1",
+        "mysql2": "^3.24.4",
         "react": "^18.3.1",
-        "react-dom": "^18.3.1"
+        "react-dom": "^18.3.1",
+        "typeorm": "^1.1.1"
       },
       "devDependencies": {
         "@nx/js": "^20.4.0",
@@ -42,10 +47,14 @@
       "dependencies": {
         "@emotion/react": "^11.14.0",
         "@emotion/styled": "^11.14.0",
+        "@mui/icons-material": "^6.5.0",
         "@mui/material": "^6.4.4",
+        "@reduxjs/toolkit": "^2.12.0",
         "@salary-mgmt/shared-types": "*",
         "react": "^18.3.1",
-        "react-dom": "^18.3.1"
+        "react-dom": "^18.3.1",
+        "react-redux": "^9.3.0",
+        "react-router-dom": "^7.18.4"
       },
       "devDependencies": {
         "@testing-library/jest-dom": "^6.6.3",
@@ -59,6 +68,32 @@
         "vitest": "^3.0.5"
       }
     },
+    "apps/frontend-web/node_modules/@mui/icons-material": {
+      "version": "6.5.0",
+      "resolved": "https://registry.npmjs.org/@mui/icons-material/-/icons-material-6.5.0.tgz",
+      "integrity": "sha512-VPuPqXqbBPlcVSA0BmnoE4knW4/xG6Thazo8vCLWkOKusko6DtwFV6B665MMWJ9j0KFohTIf3yx2zYtYacvG1g==",
+      "license": "MIT",
+      "dependencies": {
+        "@babel/runtime": "^7.26.0"
+      },
+      "engines": {
+        "node": ">=14.0.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/mui-org"
+      },
+      "peerDependencies": {
+        "@mui/material": "^6.5.0",
+        "@types/react": "^17.0.0 || ^18.0.0 || ^19.0.0",
+        "react": "^17.0.0 || ^18.0.0 || ^19.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@types/react": {
+          "optional": true
+        }
+      }
+    },
     "libs/shared-auth": {
       "name": "@salary-mgmt/shared-auth",
       "version": "0.1.0",
@@ -1997,6 +2032,17 @@
         "node": ">=6.9.0"
       }
     },
+    "node_modules/@borewit/text-codec": {
+      "version": "0.2.2",
+      "resolved": "https://registry.npmjs.org/@borewit/text-codec/-/text-codec-0.2.2.tgz",
+      "integrity": "sha512-DDaRehssg1aNrH4+2hnj1B7vnUGEjU6OIlyRdkMd0aUdIUvKXrJfXsy8LVtXAy7DRvYVluWbMspsRhz2lcW0mQ==",
+      "license": "MIT",
+      "peer": true,
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/Borewit"
+      }
+    },
     "node_modules/@csstools/color-helpers": {
       "version": "5.1.0",
       "resolved": "https://registry.npmjs.org/@csstools/color-helpers/-/color-helpers-5.1.0.tgz",
@@ -3008,6 +3054,12 @@
         "url": "https://github.com/sponsors/nzakas"
       }
     },
+    "node_modules/@ioredis/commands": {
+      "version": "1.10.0",
+      "resolved": "https://registry.npmjs.org/@ioredis/commands/-/commands-1.10.0.tgz",
+      "integrity": "sha512-UmeW7z4LfctwoQ5wkhVzgq8tXkreED2xZGpX+Bg+zA+WJFZCT6c062AfCK/Dfk81xZnnwdhJCUMkitihRaoC2Q==",
+      "license": "MIT"
+    },
     "node_modules/@jest/schemas": {
       "version": "29.6.3",
       "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-29.6.3.tgz",
@@ -3078,6 +3130,16 @@
         "@jridgewell/sourcemap-codec": "^1.4.14"
       }
     },
+    "node_modules/@lukeed/csprng": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/@lukeed/csprng/-/csprng-1.1.0.tgz",
+      "integrity": "sha512-Z7C/xXCiGWsg0KuKsHTKJxbWhpI3Vs5GwLfOean7MGyVFGqdRgBbAjOCh6u4bbjPc/8MJ2pZmK/0DLdCbivLDA==",
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/@module-federation/bridge-react-webpack-plugin": {
       "version": "0.9.1",
       "resolved": "https://registry.npmjs.org/@module-federation/bridge-react-webpack-plugin/-/bridge-react-webpack-plugin-0.9.1.tgz",
@@ -4026,6 +4088,187 @@
         "@tybys/wasm-util": "^0.10.1"
       }
     },
+    "node_modules/@nestjs-modules/ioredis": {
+      "version": "2.2.2",
+      "resolved": "https://registry.npmjs.org/@nestjs-modules/ioredis/-/ioredis-2.2.2.tgz",
+      "integrity": "sha512-8y/lzpP7CuBRXboPN9EdCBycg5PwzEY+wW6EkqjR+jYAxidlBVakxVLPPVtzDK7Yr0SiUiZu8hjuGwuB7uhicw==",
+      "license": "MIT",
+      "optionalDependencies": {
+        "@nestjs/terminus": "11.1.1"
+      },
+      "peerDependencies": {
+        "@nestjs/common": ">=6.7.0",
+        "@nestjs/core": ">=6.7.0",
+        "ioredis": ">=5.0.0"
+      }
+    },
+    "node_modules/@nestjs/common": {
+      "version": "11.2.6",
+      "resolved": "https://registry.npmjs.org/@nestjs/common/-/common-11.2.6.tgz",
+      "integrity": "sha512-uXs98qEOesTf6rGs0OcvFpRdF4M6JvzyBmoIXcTYvojdte4HiwDYv+whaALoboyfu/fuq2umF74FLQu3V7ZPHw==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "file-type": "21.3.4",
+        "iterare": "1.2.1",
+        "load-esm": "1.0.3",
+        "tslib": "2.8.1",
+        "uid": "2.0.2"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/nest"
+      },
+      "peerDependencies": {
+        "class-transformer": ">=0.4.1",
+        "class-validator": ">=0.13.2",
+        "reflect-metadata": "^0.1.12 || ^0.2.0",
+        "rxjs": "^7.1.0"
+      },
+      "peerDependenciesMeta": {
+        "class-transformer": {
+          "optional": true
+        },
+        "class-validator": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@nestjs/core": {
+      "version": "11.2.6",
+      "resolved": "https://registry.npmjs.org/@nestjs/core/-/core-11.2.6.tgz",
+      "integrity": "sha512-KZkwy6KBePPeT3EUj+NACVq6VLT5S+Msbc761NAVVyQ0FyOj7o4I85GEg/cdEPu6KdLqhJFfuqRW2SN+J2ZubQ==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "fast-safe-stringify": "2.1.1",
+        "iterare": "1.2.1",
+        "path-to-regexp": "8.4.2",
+        "tslib": "2.8.1",
+        "uid": "2.0.2"
+      },
+      "engines": {
+        "node": ">= 20"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/nest"
+      },
+      "peerDependencies": {
+        "@nestjs/common": "^11.0.0",
+        "@nestjs/microservices": "^11.0.0",
+        "@nestjs/platform-express": "^11.0.0",
+        "@nestjs/websockets": "^11.0.0",
+        "reflect-metadata": "^0.1.12 || ^0.2.0",
+        "rxjs": "^7.1.0"
+      },
+      "peerDependenciesMeta": {
+        "@nestjs/microservices": {
+          "optional": true
+        },
+        "@nestjs/platform-express": {
+          "optional": true
+        },
+        "@nestjs/websockets": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@nestjs/core/node_modules/path-to-regexp": {
+      "version": "8.4.2",
+      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-8.4.2.tgz",
+      "integrity": "sha512-qRcuIdP69NPm4qbACK+aDogI5CBDMi1jKe0ry5rSQJz8JVLsC7jV8XpiJjGRLLol3N+R5ihGYcrPLTno6pAdBA==",
+      "license": "MIT",
+      "peer": true,
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
+      }
+    },
+    "node_modules/@nestjs/terminus": {
+      "version": "11.1.1",
+      "resolved": "https://registry.npmjs.org/@nestjs/terminus/-/terminus-11.1.1.tgz",
+      "integrity": "sha512-Ssql79H+EQY/Wg108eJqN4NiNsO/tLrj+qbzOWSQUf2JE4vJQ2RG3WTqUOrYjfjWmVHD3+Ys0+azed7LSMKScw==",
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "boxen": "5.1.2",
+        "check-disk-space": "3.4.0"
+      },
+      "peerDependencies": {
+        "@grpc/grpc-js": "*",
+        "@grpc/proto-loader": "*",
+        "@mikro-orm/core": "*",
+        "@mikro-orm/nestjs": "*",
+        "@nestjs/axios": "^2.0.0 || ^3.0.0 || ^4.0.0",
+        "@nestjs/common": "^10.0.0 || ^11.0.0",
+        "@nestjs/core": "^10.0.0 || ^11.0.0",
+        "@nestjs/microservices": "^10.0.0 || ^11.0.0",
+        "@nestjs/mongoose": "^11.0.0",
+        "@nestjs/sequelize": "^10.0.0 || ^11.0.0",
+        "@nestjs/typeorm": "^10.0.0 || ^11.0.0",
+        "@prisma/client": "*",
+        "mongoose": "*",
+        "reflect-metadata": "0.1.x || 0.2.x",
+        "rxjs": "7.x",
+        "sequelize": "*",
+        "typeorm": "*"
+      },
+      "peerDependenciesMeta": {
+        "@grpc/grpc-js": {
+          "optional": true
+        },
+        "@grpc/proto-loader": {
+          "optional": true
+        },
+        "@mikro-orm/core": {
+          "optional": true
+        },
+        "@mikro-orm/nestjs": {
+          "optional": true
+        },
+        "@nestjs/axios": {
+          "optional": true
+        },
+        "@nestjs/microservices": {
+          "optional": true
+        },
+        "@nestjs/mongoose": {
+          "optional": true
+        },
+        "@nestjs/sequelize": {
+          "optional": true
+        },
+        "@nestjs/typeorm": {
+          "optional": true
+        },
+        "@prisma/client": {
+          "optional": true
+        },
+        "mongoose": {
+          "optional": true
+        },
+        "sequelize": {
+          "optional": true
+        },
+        "typeorm": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@nestjs/typeorm": {
+      "version": "11.0.3",
+      "resolved": "https://registry.npmjs.org/@nestjs/typeorm/-/typeorm-11.0.3.tgz",
+      "integrity": "sha512-zJ+E5l7auVVA7c0PsvcMdyvRPKTUqU5s2ToYmOA2QEsXQ42qbUGtK4+1HlRfpHqBkCSXP+phiH4luvf9DyJNog==",
+      "license": "MIT",
+      "peerDependencies": {
+        "@nestjs/common": "^10.0.0 || ^11.0.0",
+        "@nestjs/core": "^10.0.0 || ^11.0.0",
+        "reflect-metadata": "^0.1.13 || ^0.2.0",
+        "rxjs": "^7.2.0",
+        "typeorm": "^0.3.0 || ^1.0.0-dev"
+      }
+    },
     "node_modules/@nx/devkit": {
       "version": "20.8.4",
       "resolved": "https://registry.npmjs.org/@nx/devkit/-/devkit-20.8.4.tgz",
@@ -4431,6 +4674,32 @@
         "url": "https://opencollective.com/popperjs"
       }
     },
+    "node_modules/@reduxjs/toolkit": {
+      "version": "2.12.0",
+      "resolved": "https://registry.npmjs.org/@reduxjs/toolkit/-/toolkit-2.12.0.tgz",
+      "integrity": "sha512-KiT+RzZbp6mQET+Mg+h2c97+9j1sNflUxQkIHI7Yuzf6Peu+OYpmkn6nbHWmLLWj+1ZODUJFwGZ7gx3L9R9EOw==",
+      "license": "MIT",
+      "dependencies": {
+        "@standard-schema/spec": "^1.0.0",
+        "@standard-schema/utils": "^0.3.0",
+        "immer": "^11.0.0",
+        "redux": "^5.0.1",
+        "redux-thunk": "^3.1.0",
+        "reselect": "^5.1.0"
+      },
+      "peerDependencies": {
+        "react": "^16.9.0 || ^17.0.0 || ^18 || ^19",
+        "react-redux": "^7.2.1 || ^8.1.3 || ^9.0.0"
+      },
+      "peerDependenciesMeta": {
+        "react": {
+          "optional": true
+        },
+        "react-redux": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/@rolldown/pluginutils": {
       "version": "1.0.0-beta.27",
       "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.27.tgz",
@@ -5106,6 +5375,24 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/@sqltools/formatter": {
+      "version": "1.2.5",
+      "resolved": "https://registry.npmjs.org/@sqltools/formatter/-/formatter-1.2.5.tgz",
+      "integrity": "sha512-Uy0+khmZqUrUGm5dmMqVlnvufZRSK0FbYzVgp0UMstm+F5+W2/jnEEQyc9vo1ZR/E5ZI/B1WjjoTqBqwJL6Krw==",
+      "license": "MIT"
+    },
+    "node_modules/@standard-schema/spec": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/@standard-schema/spec/-/spec-1.1.0.tgz",
+      "integrity": "sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==",
+      "license": "MIT"
+    },
+    "node_modules/@standard-schema/utils": {
+      "version": "0.3.0",
+      "resolved": "https://registry.npmjs.org/@standard-schema/utils/-/utils-0.3.0.tgz",
+      "integrity": "sha512-e7Mew686owMaPJVNNLs55PUvgz371nKgwsc4vxE49zsODpJEnxgxRo2y/OKrqueavXgZNMDVj3DdHFlaSAeU8g==",
+      "license": "MIT"
+    },
     "node_modules/@svgr/babel-plugin-add-jsx-attribute": {
       "version": "8.0.0",
       "resolved": "https://registry.npmjs.org/@svgr/babel-plugin-add-jsx-attribute/-/babel-plugin-add-jsx-attribute-8.0.0.tgz",
@@ -5463,6 +5750,31 @@
         }
       }
     },
+    "node_modules/@tokenizer/inflate": {
+      "version": "0.4.1",
+      "resolved": "https://registry.npmjs.org/@tokenizer/inflate/-/inflate-0.4.1.tgz",
+      "integrity": "sha512-2mAv+8pkG6GIZiF1kNg1jAjh27IDxEPKwdGul3snfztFerfPGI1LjDezZp3i7BElXompqEtPmoPx6c2wgtWsOA==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "debug": "^4.4.3",
+        "token-types": "^6.1.1"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/Borewit"
+      }
+    },
+    "node_modules/@tokenizer/token": {
+      "version": "0.3.0",
+      "resolved": "https://registry.npmjs.org/@tokenizer/token/-/token-0.3.0.tgz",
+      "integrity": "sha512-OvjF+z51L3ov0OyAU0duzsYuvO01PH7x4t6DJx+guahgTnBHkhJdG7soQeTSFLWN3efnHyibZ4Z8l2EuWwJN3A==",
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/@tybys/wasm-util": {
       "version": "0.10.4",
       "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.4.tgz",
@@ -5573,7 +5885,6 @@
       "version": "22.20.4",
       "resolved": "https://registry.npmjs.org/@types/node/-/node-22.20.4.tgz",
       "integrity": "sha512-zJRE40jpHtKqE/C4fgHrAKQLJuSpzEnP9ff9Y7YtoR3Wd2pwqzlekDeEuUQXjRd+QCYnVnNwuJYmhdk9XV8gvA==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "undici-types": "~6.21.0"
@@ -5627,6 +5938,12 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/@types/use-sync-external-store": {
+      "version": "0.0.6",
+      "resolved": "https://registry.npmjs.org/@types/use-sync-external-store/-/use-sync-external-store-0.0.6.tgz",
+      "integrity": "sha512-zFDAD+tlpf2r4asuHEj0XH6pY6i0g5NeAHPn+15wk3BV6JA69eERFXC1gyGThDkVa1zCyKr5jox1+2LbV/AMLg==",
+      "license": "MIT"
+    },
     "node_modules/@vitejs/plugin-react": {
       "version": "4.7.0",
       "resolved": "https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-4.7.0.tgz",
@@ -6136,6 +6453,16 @@
         "ajv": "^6.9.1"
       }
     },
+    "node_modules/ansi-align": {
+      "version": "3.0.1",
+      "resolved": "https://registry.npmjs.org/ansi-align/-/ansi-align-3.0.1.tgz",
+      "integrity": "sha512-IOfwwBF5iczOjp/WeY4YxyjqAFMQoZufdQWDd19SEExbVLNXqvpzSJ/M7Za4/sCPmQ0+GRquoA7bGcINcxew6w==",
+      "license": "ISC",
+      "optional": true,
+      "dependencies": {
+        "string-width": "^4.1.0"
+      }
+    },
     "node_modules/ansi-colors": {
       "version": "4.1.3",
       "resolved": "https://registry.npmjs.org/ansi-colors/-/ansi-colors-4.1.3.tgz",
@@ -6150,7 +6477,7 @@
       "version": "5.0.1",
       "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
       "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "engines": {
         "node": ">=8"
@@ -6160,7 +6487,7 @@
       "version": "4.3.0",
       "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
       "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "color-convert": "^2.0.1"
@@ -6172,6 +6499,15 @@
         "url": "https://github.com/chalk/ansi-styles?sponsor=1"
       }
     },
+    "node_modules/ansis": {
+      "version": "4.4.0",
+      "resolved": "https://registry.npmjs.org/ansis/-/ansis-4.4.0.tgz",
+      "integrity": "sha512-9k3v7xcHwgdO/DruxGIg4HtjvlAZlcnsX/mzqUb1t3NkYnl9kK2UJ+Gq0io+vQf7iT//BD/HB/NBkUR1LWxoeA==",
+      "license": "ISC",
+      "engines": {
+        "node": ">=14"
+      }
+    },
     "node_modules/argparse": {
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
@@ -6230,6 +6566,15 @@
         "node": ">= 4.0.0"
       }
     },
+    "node_modules/aws-ssl-profiles": {
+      "version": "1.1.2",
+      "resolved": "https://registry.npmjs.org/aws-ssl-profiles/-/aws-ssl-profiles-1.1.2.tgz",
+      "integrity": "sha512-NZKeq9AfyQvEeNlN0zSYAaWrmBffJh3IELMZfRpJVWgrpEbtEpnjvzqBPf+mxoI287JohRDoa+/nsfqqiZmF6g==",
+      "license": "MIT",
+      "engines": {
+        "node": ">= 6.0.0"
+      }
+    },
     "node_modules/axios": {
       "version": "1.20.0",
       "resolved": "https://registry.npmjs.org/axios/-/axios-1.20.0.tgz",
@@ -6505,6 +6850,29 @@
       "dev": true,
       "license": "ISC"
     },
+    "node_modules/boxen": {
+      "version": "5.1.2",
+      "resolved": "https://registry.npmjs.org/boxen/-/boxen-5.1.2.tgz",
+      "integrity": "sha512-9gYgQKXx+1nP8mP7CzFyaUARhg7D3n1dF/FnErWmu9l6JvGpNUN278h0aSb+QjoiKSWG+iZ3uHrcqk0qrY9RQQ==",
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "ansi-align": "^3.0.0",
+        "camelcase": "^6.2.0",
+        "chalk": "^4.1.0",
+        "cli-boxes": "^2.2.1",
+        "string-width": "^4.2.2",
+        "type-fest": "^0.20.2",
+        "widest-line": "^3.1.0",
+        "wrap-ansi": "^7.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/brace-expansion": {
       "version": "2.1.7",
       "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.1.7.tgz",
@@ -6685,7 +7053,7 @@
       "version": "6.3.0",
       "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
       "integrity": "sha512-Gmy6FhYlCY7uOElZUSbxo2UCDH8owEk996gkbrpsgGtrJLM3J7jGxl9Ic7Qwwj4ivOE5AWZWRMecDdF7hqGjFA==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "engines": {
         "node": ">=10"
@@ -6736,7 +7104,7 @@
       "version": "4.1.2",
       "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
       "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "ansi-styles": "^4.1.0",
@@ -6749,6 +7117,16 @@
         "url": "https://github.com/chalk/chalk?sponsor=1"
       }
     },
+    "node_modules/check-disk-space": {
+      "version": "3.4.0",
+      "resolved": "https://registry.npmjs.org/check-disk-space/-/check-disk-space-3.4.0.tgz",
+      "integrity": "sha512-drVkSqfwA+TvuEhFipiR1OC9boEGZL5RrWvVsOthdcvQNXyCCuKkEiTOTXZ7qxSf/GLwq4GvzfrQD/Wz325hgw==",
+      "license": "MIT",
+      "optional": true,
+      "engines": {
+        "node": ">=16"
+      }
+    },
     "node_modules/check-error": {
       "version": "2.1.3",
       "resolved": "https://registry.npmjs.org/check-error/-/check-error-2.1.3.tgz",
@@ -6769,6 +7147,19 @@
         "node": ">=6.0"
       }
     },
+    "node_modules/cli-boxes": {
+      "version": "2.2.1",
+      "resolved": "https://registry.npmjs.org/cli-boxes/-/cli-boxes-2.2.1.tgz",
+      "integrity": "sha512-y4coMcylgSCdVinjiDBuR8PCC2bLjyGTwEmPb9NHR/QaNU6EUOXcTY/s6VjGMD6ENSEaeQYHCY0GNGS5jfMwPw==",
+      "license": "MIT",
+      "optional": true,
+      "engines": {
+        "node": ">=6"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/cli-cursor": {
       "version": "3.1.0",
       "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-3.1.0.tgz",
@@ -6829,6 +7220,15 @@
         "node": ">=6"
       }
     },
+    "node_modules/cluster-key-slot": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/cluster-key-slot/-/cluster-key-slot-1.1.1.tgz",
+      "integrity": "sha512-rwHwUfXL40Chm1r08yrhU3qpUvdVlgkKNeyeGPOxnW8/SyVDvgRaed/Uz54AqWNaTCAThlj6QAs3TZcKI0xDEw==",
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/co": {
       "version": "4.6.0",
       "resolved": "https://registry.npmjs.org/co/-/co-4.6.0.tgz",
@@ -6844,7 +7244,7 @@
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
       "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "color-name": "~1.1.4"
@@ -6857,7 +7257,7 @@
       "version": "1.1.4",
       "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
       "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT"
     },
     "node_modules/columnify": {
@@ -7180,6 +7580,12 @@
         "node": ">=4.0"
       }
     },
+    "node_modules/dayjs": {
+      "version": "1.11.23",
+      "resolved": "https://registry.npmjs.org/dayjs/-/dayjs-1.11.23.tgz",
+      "integrity": "sha512-QDTCU0M0MxR3hQfnlDJfwekQiaanm1ubOD231u73WBckQ/fsamwRLiE2GBz6D3a/xF1NgfiDLJjXBa1hYOYTtQ==",
+      "license": "MIT"
+    },
     "node_modules/debug": {
       "version": "4.4.3",
       "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
@@ -7204,6 +7610,20 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/dedent": {
+      "version": "1.7.2",
+      "resolved": "https://registry.npmjs.org/dedent/-/dedent-1.7.2.tgz",
+      "integrity": "sha512-WzMx3mW98SN+zn3hgemf4OzdmyNhhhKz5Ay0pUfQiMQ3e1g+xmTJWp/pKdwKVXhdSkAEGIIzqeuWrL3mV/AXbA==",
+      "license": "MIT",
+      "peerDependencies": {
+        "babel-plugin-macros": "^3.1.0"
+      },
+      "peerDependenciesMeta": {
+        "babel-plugin-macros": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/deep-eql": {
       "version": "5.0.2",
       "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-5.0.2.tgz",
@@ -7279,6 +7699,15 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/denque": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/denque/-/denque-2.1.0.tgz",
+      "integrity": "sha512-HVQE3AAb/pxF8fQAoiqpvg9i3evqug3hoiwakOyZAwJm+6vZehbkYXZ0l4JxS+I3QxM97v5aaRNhj8v5oBhekw==",
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=0.10"
+      }
+    },
     "node_modules/depd": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
@@ -7504,7 +7933,7 @@
       "version": "8.0.0",
       "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
       "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT"
     },
     "node_modules/emojis-list": {
@@ -7712,7 +8141,6 @@
       "version": "3.2.0",
       "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
       "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
-      "dev": true,
       "license": "MIT",
       "engines": {
         "node": ">=6"
@@ -8083,6 +8511,13 @@
       "license": "MIT",
       "peer": true
     },
+    "node_modules/fast-safe-stringify": {
+      "version": "2.1.1",
+      "resolved": "https://registry.npmjs.org/fast-safe-stringify/-/fast-safe-stringify-2.1.1.tgz",
+      "integrity": "sha512-W+KJc2dmILlPplD/H4K9l9LcAHAfPtP6BY84uVLXQ6Evcz9Lcg33Y2z1IVblT6xdY54PXYVHEv+0Wpq8Io6zkA==",
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/fast-uri": {
       "version": "3.1.8",
       "resolved": "https://registry.npmjs.org/fast-uri/-/fast-uri-3.1.8.tgz",
@@ -8104,7 +8539,6 @@
       "version": "6.5.0",
       "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
       "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
-      "dev": true,
       "license": "MIT",
       "engines": {
         "node": ">=12.0.0"
@@ -8179,6 +8613,25 @@
         "webpack": "^4.0.0 || ^5.0.0"
       }
     },
+    "node_modules/file-type": {
+      "version": "21.3.4",
+      "resolved": "https://registry.npmjs.org/file-type/-/file-type-21.3.4.tgz",
+      "integrity": "sha512-Ievi/yy8DS3ygGvT47PjSfdFoX+2isQueoYP1cntFW1JLYAuS4GD7NUPGg4zv2iZfV52uDyk5w5Z0TdpRS6Q1g==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@tokenizer/inflate": "^0.4.1",
+        "strtok3": "^10.3.4",
+        "token-types": "^6.1.1",
+        "uint8array-extras": "^1.4.0"
+      },
+      "engines": {
+        "node": ">=20"
+      },
+      "funding": {
+        "url": "https://github.com/sindresorhus/file-type?sponsor=1"
+      }
+    },
     "node_modules/filelist": {
       "version": "1.0.6",
       "resolved": "https://registry.npmjs.org/filelist/-/filelist-1.0.6.tgz",
@@ -8472,6 +8925,15 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/generate-function": {
+      "version": "2.3.1",
+      "resolved": "https://registry.npmjs.org/generate-function/-/generate-function-2.3.1.tgz",
+      "integrity": "sha512-eeB5GfMNeevm/GRYq20ShmsaGcmI81kIX2K9XQx5miC8KdHaC6Jm0qQ8ZNeGOi7wYB8OsdxKs+Y2oVuTFuVwKQ==",
+      "license": "MIT",
+      "dependencies": {
+        "is-property": "^1.0.2"
+      }
+    },
     "node_modules/generator-function": {
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/generator-function/-/generator-function-2.0.1.tgz",
@@ -8496,12 +8958,23 @@
       "version": "2.0.5",
       "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
       "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
-      "dev": true,
       "license": "ISC",
       "engines": {
         "node": "6.* || 8.* || >= 10.*"
       }
     },
+    "node_modules/get-east-asian-width": {
+      "version": "1.7.0",
+      "resolved": "https://registry.npmjs.org/get-east-asian-width/-/get-east-asian-width-1.7.0.tgz",
+      "integrity": "sha512-XjH1AECxf0giL2V1aU8vKyRR2ppRUb5c0EvT7zuJTokQ74bNo52zOtghqdWIqrhUD79fo3x0WfKZdOqxF6LG1Q==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/get-intrinsic": {
       "version": "1.3.0",
       "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
@@ -8638,7 +9111,7 @@
       "version": "4.0.0",
       "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
       "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "engines": {
         "node": ">=8"
@@ -8944,7 +9417,6 @@
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
       "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
-      "dev": true,
       "funding": [
         {
           "type": "github",
@@ -8971,6 +9443,16 @@
         "node": ">= 4"
       }
     },
+    "node_modules/immer": {
+      "version": "11.1.18",
+      "resolved": "https://registry.npmjs.org/immer/-/immer-11.1.18.tgz",
+      "integrity": "sha512-EQyQtLiYW029lyoczMl/Hh4Xu7cDecSc58JRYpHyL4tIAu3eqd1yJzQX04d2BZHDkzFFvm6qJEJWOtfDSWAXbQ==",
+      "license": "MIT",
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/immer"
+      }
+    },
     "node_modules/import-fresh": {
       "version": "3.3.1",
       "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
@@ -9022,6 +9504,28 @@
       "dev": true,
       "license": "ISC"
     },
+    "node_modules/ioredis": {
+      "version": "5.11.1",
+      "resolved": "https://registry.npmjs.org/ioredis/-/ioredis-5.11.1.tgz",
+      "integrity": "sha512-ehuGcf94bQXhfagULNXrJdfnWO38v070jxSx/qE87Kjzmu2fU7ro5EFAb+OPituLqgfyuQaym5DlrNydW2sJ9A==",
+      "license": "MIT",
+      "dependencies": {
+        "@ioredis/commands": "1.10.0",
+        "cluster-key-slot": "1.1.1",
+        "debug": "4.4.3",
+        "denque": "2.1.0",
+        "redis-errors": "1.2.0",
+        "redis-parser": "3.0.0",
+        "standard-as-callback": "2.1.0"
+      },
+      "engines": {
+        "node": ">=12.22.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/ioredis"
+      }
+    },
     "node_modules/ipaddr.js": {
       "version": "1.9.1",
       "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
@@ -9083,7 +9587,7 @@
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
       "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "engines": {
         "node": ">=8"
@@ -9159,6 +9663,12 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/is-property": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/is-property/-/is-property-1.0.2.tgz",
+      "integrity": "sha512-Ks/IoX00TtClbGQr4TWXemAnktAQvYB7HzcCxDGqEZU6oCmb2INHuOoKxbtR+HFkmYWBKv/dOZtGRiAjDhj92g==",
+      "license": "MIT"
+    },
     "node_modules/is-regex": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.2.1.tgz",
@@ -9231,6 +9741,16 @@
         "ws": "*"
       }
     },
+    "node_modules/iterare": {
+      "version": "1.2.1",
+      "resolved": "https://registry.npmjs.org/iterare/-/iterare-1.2.1.tgz",
+      "integrity": "sha512-RKYVTCjAnRthyJes037NX/IiqeidgN1xc3j1RjFfECFp28A1GVwK9nA+i0rJPaHqSZwygLzRnFlzUuHFoWWy+Q==",
+      "license": "ISC",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/jake": {
       "version": "10.9.4",
       "resolved": "https://registry.npmjs.org/jake/-/jake-10.9.4.tgz",
@@ -9697,6 +10217,26 @@
         "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
       }
     },
+    "node_modules/load-esm": {
+      "version": "1.0.3",
+      "resolved": "https://registry.npmjs.org/load-esm/-/load-esm-1.0.3.tgz",
+      "integrity": "sha512-v5xlu8eHD1+6r8EHTg6hfmO97LN8ugKtiXcy5e6oN72iD2r6u0RPfLl6fxM+7Wnh2ZRq15o0russMst44WauPA==",
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/Borewit"
+        },
+        {
+          "type": "buymeacoffee",
+          "url": "https://buymeacoffee.com/borewit"
+        }
+      ],
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=13.2.0"
+      }
+    },
     "node_modules/loader-utils": {
       "version": "2.0.4",
       "resolved": "https://registry.npmjs.org/loader-utils/-/loader-utils-2.0.4.tgz",
@@ -9785,6 +10325,12 @@
         "node": ">=8.0"
       }
     },
+    "node_modules/long": {
+      "version": "5.3.2",
+      "resolved": "https://registry.npmjs.org/long/-/long-5.3.2.tgz",
+      "integrity": "sha512-mNAgZ1GmyNhD7AuqnTG3/VQ26o760+ZYBPKjPvugO8+nLbYfX6TVpJPseBvopbdY+qpZ/lKUnmEc1LeZYS3QAA==",
+      "license": "Apache-2.0"
+    },
     "node_modules/long-timeout": {
       "version": "0.1.1",
       "resolved": "https://registry.npmjs.org/long-timeout/-/long-timeout-0.1.1.tgz",
@@ -9831,6 +10377,21 @@
         "yallist": "^3.0.2"
       }
     },
+    "node_modules/lru.min": {
+      "version": "1.1.5",
+      "resolved": "https://registry.npmjs.org/lru.min/-/lru.min-1.1.5.tgz",
+      "integrity": "sha512-5J9ysMYUpYIg9RF2vJpy9SinEmSviFSe0GyPpCQ4L5QSkLAgeLXlTAOu2ZwWUU5m+0SBl6gUU1R1ZQB3aKypfA==",
+      "license": "MIT",
+      "engines": {
+        "bun": ">=1.0.0",
+        "deno": ">=1.30.0",
+        "node": ">=8.0.0"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/wellwelwel"
+      }
+    },
     "node_modules/luxon": {
       "version": "3.7.2",
       "resolved": "https://registry.npmjs.org/luxon/-/luxon-3.7.2.tgz",
@@ -10179,6 +10740,55 @@
       "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
       "license": "MIT"
     },
+    "node_modules/mysql2": {
+      "version": "3.24.4",
+      "resolved": "https://registry.npmjs.org/mysql2/-/mysql2-3.24.4.tgz",
+      "integrity": "sha512-A2olluVlj0mvgyIRRISMEzXc51m+21mRtcMVjJyIpt2GG98+XrC9m9HzsqcMsX2LcnfccJvY5NB22g8fENBnOA==",
+      "license": "MIT",
+      "dependencies": {
+        "aws-ssl-profiles": "^1.1.2",
+        "generate-function": "^2.3.1",
+        "iconv-lite": "^0.7.3",
+        "long": "^5.3.2",
+        "lru.min": "^1.1.4",
+        "named-placeholders": "^1.1.6",
+        "sql-escaper": "^1.5.1"
+      },
+      "engines": {
+        "node": ">= 8.0"
+      },
+      "peerDependencies": {
+        "@types/node": ">= 8"
+      }
+    },
+    "node_modules/mysql2/node_modules/iconv-lite": {
+      "version": "0.7.3",
+      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.7.3.tgz",
+      "integrity": "sha512-IKXpvIzjnC9XTAUbVBcMfGS0EPaIXtW6v+zr+RRp+hqULEpo0owZax6wyRwPOJbWbzjYspQwusTsfVr0ifh4uQ==",
+      "license": "MIT",
+      "dependencies": {
+        "safer-buffer": ">= 2.1.2 < 3.0.0"
+      },
+      "engines": {
+        "node": ">=0.10.0"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
+      }
+    },
+    "node_modules/named-placeholders": {
+      "version": "1.1.6",
+      "resolved": "https://registry.npmjs.org/named-placeholders/-/named-placeholders-1.1.6.tgz",
+      "integrity": "sha512-Tz09sEL2EEuv5fFowm419c1+a/jSMiBjI9gHxVLrVdbUkkNUUfjsVYs9pVZu5oCon/kmRh9TfLEObFtkVxmY0w==",
+      "license": "MIT",
+      "dependencies": {
+        "lru.min": "^1.1.0"
+      },
+      "engines": {
+        "node": ">=8.0.0"
+      }
+    },
     "node_modules/nanoid": {
       "version": "3.3.19",
       "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.19.tgz",
@@ -10771,7 +11381,7 @@
       "version": "4.0.2",
       "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.2.tgz",
       "integrity": "sha512-M7BAV6Rlcy5u+m6oPhAPFgJTzAioX/6B0DxyvDlo9l8+T3nLKbrczg2WLUyzd45L8RqfUMyGPzekbMvX2Ldkwg==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "engines": {
         "node": ">=12"
@@ -11031,6 +11641,29 @@
       "integrity": "sha512-UpMYezM4v5/18F28aC66AEsjXIgE02kyEMH6yLdgLXu/UTfa1Ntwck/nNLrbqJsEXW7gPb0coNO9FQse9WTovA==",
       "license": "MIT"
     },
+    "node_modules/react-redux": {
+      "version": "9.3.0",
+      "resolved": "https://registry.npmjs.org/react-redux/-/react-redux-9.3.0.tgz",
+      "integrity": "sha512-KQopgqFo/p/fgmAs5qz6p5RWaNAzq40WAu7fJIXnQpYxFPbJYtsJPWvGeF2rOBaY/kEuV77AVsX8TsQzKm+A/g==",
+      "license": "MIT",
+      "dependencies": {
+        "@types/use-sync-external-store": "^0.0.6",
+        "use-sync-external-store": "^1.4.0"
+      },
+      "peerDependencies": {
+        "@types/react": "^18.2.25 || ^19",
+        "react": "^18.0 || ^19",
+        "redux": "^5.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@types/react": {
+          "optional": true
+        },
+        "redux": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/react-refresh": {
       "version": "0.17.0",
       "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.17.0.tgz",
@@ -11041,6 +11674,57 @@
         "node": ">=0.10.0"
       }
     },
+    "node_modules/react-router": {
+      "version": "7.18.4",
+      "resolved": "https://registry.npmjs.org/react-router/-/react-router-7.18.4.tgz",
+      "integrity": "sha512-PUPQcMhMGRAslLcvtlPz/kmzBEWPhLdgLFrL7pLNepBL6dX0lWj4WD2cUYVgYCuT3jxvghYFg81cDTj44DhetQ==",
+      "license": "MIT",
+      "dependencies": {
+        "cookie": "^1.0.1",
+        "set-cookie-parser": "^2.6.0"
+      },
+      "engines": {
+        "node": ">=20.0.0"
+      },
+      "peerDependencies": {
+        "react": ">=18",
+        "react-dom": ">=18"
+      },
+      "peerDependenciesMeta": {
+        "react-dom": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/react-router-dom": {
+      "version": "7.18.4",
+      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-7.18.4.tgz",
+      "integrity": "sha512-yrfmJHIpDG7taCpqKjT1G5B6q3O2K+RN8/fgNf0lTjCwiPbQ0ei6vXX9ZjQR+7ld8Tr7Z5xmyMnZ8YJrphWQUw==",
+      "license": "MIT",
+      "dependencies": {
+        "react-router": "7.18.4"
+      },
+      "engines": {
+        "node": ">=20.0.0"
+      },
+      "peerDependencies": {
+        "react": ">=18",
+        "react-dom": ">=18"
+      }
+    },
+    "node_modules/react-router/node_modules/cookie": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/cookie/-/cookie-1.1.1.tgz",
+      "integrity": "sha512-ei8Aos7ja0weRpFzJnEA9UHJ/7XQmqglbRwnf2ATjcB9Wq874VKH9kfjjirM6UhU2/E5fFYadylyhFldcqSidQ==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "type": "opencollective",
+        "url": "https://opencollective.com/express"
+      }
+    },
     "node_modules/react-transition-group": {
       "version": "4.4.5",
       "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
@@ -11086,6 +11770,48 @@
         "node": ">=8"
       }
     },
+    "node_modules/redis-errors": {
+      "version": "1.2.0",
+      "resolved": "https://registry.npmjs.org/redis-errors/-/redis-errors-1.2.0.tgz",
+      "integrity": "sha512-1qny3OExCf0UvUV/5wpYKf2YwPcOqXzkwKKSmKHiE6ZMQs5heeE/c8eXK+PNllPvmjgAbfnsbpkGZWy8cBpn9w==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=4"
+      }
+    },
+    "node_modules/redis-parser": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/redis-parser/-/redis-parser-3.0.0.tgz",
+      "integrity": "sha512-DJnGAeenTdpMEH6uAJRK/uiyEIH9WVsUmoLwzudwGJUwZPp80PDBWPHXSAGNPwNvIXAbe7MSUB1zQFugFml66A==",
+      "license": "MIT",
+      "dependencies": {
+        "redis-errors": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=4"
+      }
+    },
+    "node_modules/redux": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/redux/-/redux-5.0.1.tgz",
+      "integrity": "sha512-M9/ELqF6fy8FwmkpnF0S3YKOqMyoWJ4+CS5Efg2ct3oY9daQvd/Pc71FpGZsVsbl3Cpb+IIcjBDUnnyBdQbq4w==",
+      "license": "MIT"
+    },
+    "node_modules/redux-thunk": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/redux-thunk/-/redux-thunk-3.1.0.tgz",
+      "integrity": "sha512-NW2r5T6ksUKXCabzhL9z+h206HQw/NJkcLm1GPImRQ8IzfXwRGqjVhKJGauHirT0DAuyy6hjdnMZaRoAcy0Klw==",
+      "license": "MIT",
+      "peerDependencies": {
+        "redux": "^5.0.0"
+      }
+    },
+    "node_modules/reflect-metadata": {
+      "version": "0.2.2",
+      "resolved": "https://registry.npmjs.org/reflect-metadata/-/reflect-metadata-0.2.2.tgz",
+      "integrity": "sha512-urBwgfrvVP/eAyXx4hluJivBKzuEbSQs9rKWCrCkbSxNv8mxPcUZKeuoF3Uy4mJl3Lwprp6yy5/39VWigZ4K6Q==",
+      "license": "Apache-2.0"
+    },
     "node_modules/regenerate": {
       "version": "1.4.2",
       "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.4.2.tgz",
@@ -11171,6 +11897,12 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/reselect": {
+      "version": "5.3.0",
+      "resolved": "https://registry.npmjs.org/reselect/-/reselect-5.3.0.tgz",
+      "integrity": "sha512-XGoLeRAVzUTcJ1qkxPQhDJyIZ5d6zzZD9nT7AEZOaaU9UbWclhycElmhO+VD5bFeLuzhPBaOV2oXC8uG35ZSpg==",
+      "license": "MIT"
+    },
     "node_modules/resolve": {
       "version": "1.22.8",
       "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
@@ -11295,6 +12027,16 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/rxjs": {
+      "version": "7.8.2",
+      "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-7.8.2.tgz",
+      "integrity": "sha512-dhKf903U/PQZY6boNNtAGdWbG85WAbjT/1xYoZIC7FAY0yWapOBQVsVrDl58W86//e1VpMNBtRV4MaXfdMySFA==",
+      "license": "Apache-2.0",
+      "peer": true,
+      "dependencies": {
+        "tslib": "^2.1.0"
+      }
+    },
     "node_modules/safe-buffer": {
       "version": "5.2.1",
       "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
@@ -11338,7 +12080,6 @@
       "version": "2.1.2",
       "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
       "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/sax": {
@@ -11470,6 +12211,12 @@
         "node": ">= 0.8.0"
       }
     },
+    "node_modules/set-cookie-parser": {
+      "version": "2.7.2",
+      "resolved": "https://registry.npmjs.org/set-cookie-parser/-/set-cookie-parser-2.7.2.tgz",
+      "integrity": "sha512-oeM1lpU/UvhTxw+g3cIfxXHyJRc/uidd3yK1P242gzHds0udQBYzs3y8j4gCCW+ZJ7ad0yctld8RYO+bdurlvw==",
+      "license": "MIT"
+    },
     "node_modules/setprototypeof": {
       "version": "1.2.0",
       "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
@@ -11657,6 +12404,37 @@
       "dev": true,
       "license": "BSD-3-Clause"
     },
+    "node_modules/sql-escaper": {
+      "version": "1.5.2",
+      "resolved": "https://registry.npmjs.org/sql-escaper/-/sql-escaper-1.5.2.tgz",
+      "integrity": "sha512-6CKD38c31SENivxOADeMNLdukOnUxUcflKtzVWzace7Riv1v7cAEym5Cx9Q7gYZ3ezIJI7ZpqecQq8cqNeSSFg==",
+      "license": "MIT",
+      "engines": {
+        "bun": ">=1.0.0",
+        "deno": ">=2.0.0",
+        "node": ">=12.0.0"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/mysqljs/sql-escaper?sponsor=1"
+      }
+    },
+    "node_modules/sql-highlight": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/sql-highlight/-/sql-highlight-6.1.0.tgz",
+      "integrity": "sha512-ed7OK4e9ywpE7pgRMkMQmZDPKSVdm0oX5IEtZiKnFucSF0zu6c80GZBe38UqHuVhTWJ9xsKgSMjCG2bml86KvA==",
+      "funding": [
+        "https://github.com/scriptcoded/sql-highlight?sponsor=1",
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/scriptcoded"
+        }
+      ],
+      "license": "MIT",
+      "engines": {
+        "node": ">=14"
+      }
+    },
     "node_modules/stackback": {
       "version": "0.0.2",
       "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
@@ -11664,6 +12442,12 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/standard-as-callback": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/standard-as-callback/-/standard-as-callback-2.1.0.tgz",
+      "integrity": "sha512-qoRRSyROncaz1z0mvYqIE4lCd9p2R90i6GxW3uZv5ucSu8tU7B5HXUP1gG8pVZsYNVaXjk8ClXHPttLyxAL48A==",
+      "license": "MIT"
+    },
     "node_modules/statuses": {
       "version": "2.0.2",
       "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
@@ -11745,7 +12529,7 @@
       "version": "4.2.3",
       "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
       "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "emoji-regex": "^8.0.0",
@@ -11760,7 +12544,7 @@
       "version": "6.0.1",
       "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
       "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "ansi-regex": "^5.0.1"
@@ -11826,6 +12610,23 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/strtok3": {
+      "version": "10.3.5",
+      "resolved": "https://registry.npmjs.org/strtok3/-/strtok3-10.3.5.tgz",
+      "integrity": "sha512-ki4hZQfh5rX0QDLLkOCj+h+CVNkqmp/CMf8v8kZpkNVK6jGQooMytqzLZYUVYIZcFZ6yDB70EfD8POcFXiF5oA==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@tokenizer/token": "^0.3.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/Borewit"
+      }
+    },
     "node_modules/stylis": {
       "version": "4.2.0",
       "resolved": "https://registry.npmjs.org/stylis/-/stylis-4.2.0.tgz",
@@ -11836,7 +12637,7 @@
       "version": "7.2.0",
       "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
       "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "has-flag": "^4.0.0"
@@ -11996,7 +12797,6 @@
       "version": "0.2.17",
       "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
       "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
-      "dev": true,
       "license": "MIT",
       "dependencies": {
         "fdir": "^6.5.0",
@@ -12013,7 +12813,6 @@
       "version": "4.0.7",
       "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
       "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
-      "dev": true,
       "license": "MIT",
       "engines": {
         "node": ">=12"
@@ -12105,6 +12904,25 @@
         "node": ">=0.6"
       }
     },
+    "node_modules/token-types": {
+      "version": "6.1.2",
+      "resolved": "https://registry.npmjs.org/token-types/-/token-types-6.1.2.tgz",
+      "integrity": "sha512-dRXchy+C0IgK8WPC6xvCHFRIWYUbqqdEIKPaKo/AcTUNzwLTK6AH7RjdLWsEZcAN/TBdtfUw3PYEgPr5VPr6ww==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@borewit/text-codec": "^0.2.1",
+        "@tokenizer/token": "^0.3.0",
+        "ieee754": "^1.2.1"
+      },
+      "engines": {
+        "node": ">=14.16"
+      },
+      "funding": {
+        "type": "github",
+        "url": "https://github.com/sponsors/Borewit"
+      }
+    },
     "node_modules/tough-cookie": {
       "version": "5.1.2",
       "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-5.1.2.tgz",
@@ -12150,7 +12968,6 @@
       "version": "2.8.1",
       "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
       "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
-      "dev": true,
       "license": "0BSD"
     },
     "node_modules/tsscmp": {
@@ -12177,6 +12994,19 @@
         "node": ">= 0.8.0"
       }
     },
+    "node_modules/type-fest": {
+      "version": "0.20.2",
+      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
+      "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
+      "license": "(MIT OR CC0-1.0)",
+      "optional": true,
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/type-is": {
       "version": "1.6.18",
       "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
@@ -12191,6 +13021,251 @@
         "node": ">= 0.6"
       }
     },
+    "node_modules/typeorm": {
+      "version": "1.1.1",
+      "resolved": "https://registry.npmjs.org/typeorm/-/typeorm-1.1.1.tgz",
+      "integrity": "sha512-og9mG4Lwlvj6MfvYd8yRCzXy73gETtwgTKQ/ISLYvEOpJPy4IrjU/89HK4ZAFmRIbEg1hkIk04v8phTrxfgPmQ==",
+      "license": "MIT",
+      "dependencies": {
+        "@sqltools/formatter": "^1.2.5",
+        "ansis": "^4.3.1",
+        "dayjs": "^1.11.21",
+        "debug": "^4.4.3",
+        "dedent": "^1.7.2",
+        "reflect-metadata": "^0.2.2",
+        "sql-highlight": "^6.1.0",
+        "tinyglobby": "^0.2.17",
+        "tslib": "^2.8.1",
+        "yargs": "^18.0.0"
+      },
+      "bin": {
+        "typeorm": "cli.js",
+        "typeorm-ts-node-commonjs": "cli-ts-node-commonjs.js",
+        "typeorm-ts-node-esm": "cli-ts-node-esm.js"
+      },
+      "engines": {
+        "node": "^20.19.0 || ^22.13.0 || >=24.11.0"
+      },
+      "funding": {
+        "url": "https://opencollective.com/typeorm"
+      },
+      "peerDependencies": {
+        "@google-cloud/spanner": "^8.0.0",
+        "@sap/hana-client": "^2.14.22",
+        "better-sqlite3": "^12.0.0",
+        "ioredis": "^5.0.4",
+        "mongodb": "^7.0.0",
+        "mssql": "^12.0.0",
+        "mysql2": "^3.15.3",
+        "oracledb": "^6.3.0 || ^7.0.0",
+        "pg": "^8.5.1",
+        "pg-native": "^3.0.0",
+        "pg-query-stream": "^4.0.0",
+        "redis": "^5.0.0 || ^6.0.0",
+        "sql.js": "^1.4.0",
+        "ts-node": "^10.9.2",
+        "typeorm-aurora-data-api-driver": "^3.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@google-cloud/spanner": {
+          "optional": true
+        },
+        "@sap/hana-client": {
+          "optional": true
+        },
+        "better-sqlite3": {
+          "optional": true
+        },
+        "ioredis": {
+          "optional": true
+        },
+        "mongodb": {
+          "optional": true
+        },
+        "mssql": {
+          "optional": true
+        },
+        "mysql2": {
+          "optional": true
+        },
+        "oracledb": {
+          "optional": true
+        },
+        "pg": {
+          "optional": true
+        },
+        "pg-native": {
+          "optional": true
+        },
+        "pg-query-stream": {
+          "optional": true
+        },
+        "redis": {
+          "optional": true
+        },
+        "sql.js": {
+          "optional": true
+        },
+        "ts-node": {
+          "optional": true
+        },
+        "typeorm-aurora-data-api-driver": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/typeorm/node_modules/ansi-regex": {
+      "version": "6.3.0",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.3.0.tgz",
+      "integrity": "sha512-WpDfL7NO6j7tH88IDBNVdUJxDh9nmCteAVW9dsep846XdwF4naCBK+/tGLX3KJgcpgMRXCFlTM2hKGoK9FsdrQ==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
+      }
+    },
+    "node_modules/typeorm/node_modules/ansi-styles": {
+      "version": "6.2.3",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.3.tgz",
+      "integrity": "sha512-4Dj6M28JB+oAH8kFkTLUo+a2jwOFkuqb3yucU0CANcRRUbxS0cP0nZYCGjcc3BNXwRIsUVmDGgzawme7zvJHvg==",
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/typeorm/node_modules/cliui": {
+      "version": "9.0.1",
+      "resolved": "https://registry.npmjs.org/cliui/-/cliui-9.0.1.tgz",
+      "integrity": "sha512-k7ndgKhwoQveBL+/1tqGJYNz097I7WOvwbmmU2AR5+magtbjPWQTS1C5vzGkBC8Ym8UWRzfKUzUUqFLypY4Q+w==",
+      "license": "ISC",
+      "dependencies": {
+        "string-width": "^7.2.0",
+        "strip-ansi": "^7.1.0",
+        "wrap-ansi": "^9.0.0"
+      },
+      "engines": {
+        "node": ">=20"
+      }
+    },
+    "node_modules/typeorm/node_modules/cliui/node_modules/string-width": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
+      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
+      "license": "MIT",
+      "dependencies": {
+        "emoji-regex": "^10.3.0",
+        "get-east-asian-width": "^1.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/typeorm/node_modules/emoji-regex": {
+      "version": "10.6.0",
+      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-10.6.0.tgz",
+      "integrity": "sha512-toUI84YS5YmxW219erniWD0CIVOo46xGKColeNQRgOzDorgBi1v4D71/OFzgD9GO2UGKIv1C3Sp8DAn0+j5w7A==",
+      "license": "MIT"
+    },
+    "node_modules/typeorm/node_modules/string-width": {
+      "version": "8.2.2",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-8.2.2.tgz",
+      "integrity": "sha512-GaPUh5gfdrYzqeVNZvUfT23vYYxXzKYidUcnMtJg/3rxRV63EFZy3k6xfKlmfeJD0176lnUV/Usr3XcwSvFzpg==",
+      "license": "MIT",
+      "dependencies": {
+        "get-east-asian-width": "^1.5.0",
+        "strip-ansi": "^7.1.2"
+      },
+      "engines": {
+        "node": ">=20"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/typeorm/node_modules/strip-ansi": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.2.0.tgz",
+      "integrity": "sha512-yDPMNjp4WyfYBkHnjIRLfca1i6KMyGCtsVgoKe/z1+6vukgaENdgGBZt+ZmKPc4gavvEZ5OgHfHdrazhgNyG7w==",
+      "license": "MIT",
+      "dependencies": {
+        "ansi-regex": "^6.2.2"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
+      }
+    },
+    "node_modules/typeorm/node_modules/wrap-ansi": {
+      "version": "9.0.2",
+      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-9.0.2.tgz",
+      "integrity": "sha512-42AtmgqjV+X1VpdOfyTGOYRi0/zsoLqtXQckTmqTeybT+BDIbM/Guxo7x3pE2vtpr1ok6xRqM9OpBe+Jyoqyww==",
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^6.2.1",
+        "string-width": "^7.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
+      }
+    },
+    "node_modules/typeorm/node_modules/wrap-ansi/node_modules/string-width": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/string-width/-/string-width-7.2.0.tgz",
+      "integrity": "sha512-tsaTIkKW9b4N+AEj+SVA+WhJzV7/zMhcSu78mLKWSk7cXMOSHsBKFWUs0fWwq8QyK3MgJBQRX6Gbi4kYbdvGkQ==",
+      "license": "MIT",
+      "dependencies": {
+        "emoji-regex": "^10.3.0",
+        "get-east-asian-width": "^1.0.0",
+        "strip-ansi": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/typeorm/node_modules/yargs": {
+      "version": "18.2.0",
+      "resolved": "https://registry.npmjs.org/yargs/-/yargs-18.2.0.tgz",
+      "integrity": "sha512-9OpKOLeaoNFecEp7P6iYbzze/5CqWoH7N3SMs/6y1XF4nMvFMspEGZzJ6uFi9MmQwXhyzqYoSEKO3tvA3Z/o2w==",
+      "license": "MIT",
+      "dependencies": {
+        "cliui": "^9.0.1",
+        "escalade": "^3.1.1",
+        "get-caller-file": "^2.0.5",
+        "string-width": "^8.2.1",
+        "y18n": "^5.0.5",
+        "yargs-parser": "^22.0.0"
+      },
+      "engines": {
+        "node": "^20.19.0 || ^22.12.0 || >=23"
+      }
+    },
+    "node_modules/typeorm/node_modules/yargs-parser": {
+      "version": "22.0.0",
+      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-22.0.0.tgz",
+      "integrity": "sha512-rwu/ClNdSMpkSrUb+d6BRsSkLUq1fmfsY6TOpYzTwvwkg1/NRG85KBy3kq++A8LKQwX6lsu+aWad+2khvuXrqw==",
+      "license": "ISC",
+      "engines": {
+        "node": "^20.19.0 || ^22.12.0 || >=23"
+      }
+    },
     "node_modules/typescript": {
       "version": "5.9.3",
       "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
@@ -12205,6 +13280,32 @@
         "node": ">=14.17"
       }
     },
+    "node_modules/uid": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/uid/-/uid-2.0.2.tgz",
+      "integrity": "sha512-u3xV3X7uzvi5b1MncmZo3i2Aw222Zk1keqLA1YkHldREkAhAqi65wuPfe7lHx8H/Wzy+8CE7S7uS3jekIM5s8g==",
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@lukeed/csprng": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/uint8array-extras": {
+      "version": "1.5.0",
+      "resolved": "https://registry.npmjs.org/uint8array-extras/-/uint8array-extras-1.5.0.tgz",
+      "integrity": "sha512-rvKSBiC5zqCCiDZ9kAOszZcDvdAHwwIKJG33Ykj43OKcWsnmcBRL09YTU4nOeHZ8Y2a7l1MgTd08SBe9A8Qj6A==",
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=18"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/undici": {
       "version": "7.29.0",
       "resolved": "https://registry.npmjs.org/undici/-/undici-7.29.0.tgz",
@@ -12219,7 +13320,6 @@
       "version": "6.21.0",
       "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
       "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
-      "dev": true,
       "license": "MIT"
     },
     "node_modules/unicode-canonical-property-names-ecmascript": {
@@ -12357,6 +13457,15 @@
       "dev": true,
       "license": "MIT"
     },
+    "node_modules/use-sync-external-store": {
+      "version": "1.7.0",
+      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
+      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
+      "license": "MIT",
+      "peerDependencies": {
+        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
+      }
+    },
     "node_modules/util-deprecate": {
       "version": "1.0.2",
       "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
@@ -12826,6 +13935,19 @@
         "node": ">=8"
       }
     },
+    "node_modules/widest-line": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/widest-line/-/widest-line-3.1.0.tgz",
+      "integrity": "sha512-NsmoXalsWVDMGupxZ5R08ka9flZjjiLvHVAWYOKtiKM8ujtZWr9cRffak+uSE48+Ob8ObalXpwyeUiyDD6QFgg==",
+      "license": "MIT",
+      "optional": true,
+      "dependencies": {
+        "string-width": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/word-wrap": {
       "version": "1.2.5",
       "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
@@ -12841,7 +13963,7 @@
       "version": "7.0.0",
       "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
       "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "ansi-styles": "^4.0.0",
@@ -12905,7 +14027,6 @@
       "version": "5.0.8",
       "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
       "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
-      "dev": true,
       "license": "ISC",
       "engines": {
         "node": ">=10"
diff --git a/package.json b/package.json
index c42c624..743810b 100644
--- a/package.json
+++ b/package.json
@@ -33,7 +33,12 @@
     "@emotion/react": "^11.14.0",
     "@emotion/styled": "^11.14.0",
     "@mui/material": "^6.4.4",
+    "@nestjs-modules/ioredis": "^2.2.2",
+    "@nestjs/typeorm": "^11.0.3",
+    "ioredis": "^5.11.1",
+    "mysql2": "^3.24.4",
     "react": "^18.3.1",
-    "react-dom": "^18.3.1"
+    "react-dom": "^18.3.1",
+    "typeorm": "^1.1.1"
   }
 }

