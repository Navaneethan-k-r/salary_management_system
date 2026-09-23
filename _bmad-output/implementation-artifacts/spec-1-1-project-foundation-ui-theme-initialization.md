---
title: 'Story 1.1: Project Foundation & UI Theme Initialization'
type: 'feature'
created: '2026-09-23'
status: 'done'
baseline_commit: 'a2ee6c720b6e940872d5a26c0a9f3a55ceff5034'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The project repository is empty, lacking the monorepo architecture, shared libraries, and Material UI design system required for all subsequent HR and employee features.

**Approach:** Initialize an Nx monorepo workspace containing the React `frontend-web` application configured with the custom Material UI design tokens and typography, alongside foundational `shared-types` and `shared-auth` libraries.

## Boundaries & Constraints

**Always:**
- Use an integrated Nx monorepo workspace matching the structural seed in ARCHITECTURE-SPINE.md (`apps/frontend-web`, `libs/shared-types`, `libs/shared-auth`).
- Enforce the DESIGN.md visual specification: primary `#1976d2`, background `#f4f6f8`, surface `#ffffff`, text primary `#111827`, typography `"Inter", "Roboto", sans-serif`, 8px base spacing unit, and flat elevation (0 elevation on App Bar).
- Configure TypeScript path aliases in the root `tsconfig.base.json` so apps can import cleanly from `@salary-mgmt/shared-types` and `@salary-mgmt/shared-auth`.

**Never:**
- Do not use Tailwind CSS or alternative CSS frameworks; use Material UI styling and CSS baseline.
- Do not implement backend authentication routes, Redis sessions, or MySQL schema migrations in this story (deferred to Story 1.2 and 1.3).
- Do not create heavy drop shadows; cards and tables must use subtle border outlines (`1px solid #e5e7eb`) with flat elevation per design invariants.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App Initialization | User opens `http://localhost:3000` (or Vite dev port) | Application loads with global CssBaseline, background `#f4f6f8`, Inter font family, and a preview component demonstrating primary/surface palette tokens | Graceful fallback font stack (`"Inter", "Roboto", "Helvetica", "Arial", sans-serif`) if Inter fails to load |
| Theme Token Consumption | Child components request theme values via `useTheme()` | Correct custom values returned: `palette.primary.main === '#1976d2'`, `palette.background.default === '#f4f6f8'`, `shape.borderRadius === 8` | Fallback to MUI standard theme defaults if provider unmounted |
| Shared Library Imports | `frontend-web` imports from `@salary-mgmt/shared-types` | TypeScript compiler and bundler resolve shared types without build errors or circular dependencies | Build fails fast if path aliases are misconfigured |

</frozen-after-approval>

## Code Map

- `package.json` -- Root dependencies, workspace scripts, and monorepo package definitions.
- `nx.json` -- Nx workspace configuration and task runner targets.
- `tsconfig.base.json` -- Root TypeScript configuration with shared path mappings (`@salary-mgmt/*`).
- `apps/frontend-web/` -- React web application client.
- `apps/frontend-web/src/theme/theme.ts` -- Material UI custom theme definition adhering to DESIGN.md.
- `apps/frontend-web/src/theme/ThemeProvider.tsx` -- Global theme provider wrapper with CssBaseline and Google Fonts link.
- `apps/frontend-web/src/app/App.tsx` -- Root application entry rendering theme validation preview.
- `libs/shared-types/` -- TypeScript interfaces for user sessions, employee models, and payroll data.
- `libs/shared-auth/` -- Library scaffolding for shared authentication tokens and Redis session client interfaces.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- Initialize root monorepo configuration with Nx, TypeScript, React, and MUI dependencies -- Establishes monorepo toolchain.
- [x] `nx.json` & `tsconfig.base.json` -- Configure workspace targets and TypeScript path aliases (`@salary-mgmt/shared-types`, `@salary-mgmt/shared-auth`) -- Enables seamless cross-project references.
- [x] `libs/shared-types/src/index.ts` -- Scaffold shared TypeScript definitions including basic user roles and DTO shapes -- Provides type safety across frontend and backend.
- [x] `libs/shared-auth/src/index.ts` -- Scaffold shared auth interfaces including session token structure -- Prepares shared auth foundation for Story 1.2.
- [x] `apps/frontend-web/src/theme/theme.ts` -- Define custom MUI theme (colors, typography, component overrides, shape radius) per DESIGN.md -- Enforces system visual identity.
- [x] `apps/frontend-web/src/app/App.tsx` -- Implement base landing component wrapped in ThemeProvider validating theme tokens and layout foundation -- Verifies frontend theme setup.
- [x] `apps/frontend-web/src/app/App.spec.tsx` -- Implement unit test asserting theme provider renders correctly and custom theme properties are applied -- Validates theme integration.

**Acceptance Criteria:**
- Given the project is initialized, when running build/test commands, then all apps and libraries build without TypeScript or bundling errors.
- Given `apps/frontend-web` is running in browser, when the page is inspected, then the background is `#f4f6f8`, primary elements use `#1976d2`, typography family is `"Inter", "Roboto", ...`, and elevation is flat.
- Given `frontend-web` imports types from `@salary-mgmt/shared-types`, when building the application, then path resolution succeeds seamlessly.

## Implementation Notes

- Initialized root Nx monorepo workspace with npm workspaces for `apps/*` and `libs/*`.
- Configured TypeScript path aliases `@salary-mgmt/shared-types` and `@salary-mgmt/shared-auth` in `tsconfig.base.json` and `vite.config.ts`.
- Created `libs/shared-types` with models for `UserSession`, `OrganizationProfile`, `Employee`, and `SalaryComponent`.
- Created `libs/shared-auth` with authentication context, bearer token extractor, and session store interfaces.
- Implemented Material UI theme according to `DESIGN.md` in `apps/frontend-web/src/theme/theme.ts` with custom palette (`#1976d2`, `#f4f6f8`), Inter/Roboto typography, flat elevation, and rounded border specifications.
- Implemented `AppThemeProvider` with `CssBaseline` and base landing layout preview in `apps/frontend-web/src/app/App.tsx`.
- Implemented unit test suite in `apps/frontend-web/src/app/App.spec.tsx` covering all I/O matrix rows (app initialization, theme token values, preview rendering, and shared types integration). All tests pass. Build succeeded.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence | Route |
|---------|---------|----------|-------|
| `libs/shared-auth/src/index.ts`: `extractBearerToken` only matched exact casing `Bearer `, failing for RFC 6750 case-insensitive header tokens | low | Case insensitivity is standard for HTTP Authorization headers; resolved via regex `/^Bearer\s+(.+)$/i`. | patch |
| `libs/shared-auth`: Missing dedicated test suite for auth token extraction and contract invariants | low | Added `libs/shared-auth/src/index.spec.ts` with 6 comprehensive test cases verifying standard, case-insensitive, whitespace-padded, and invalid inputs. | patch |
| `libs/shared-types/tsconfig.json`: Missing `composite: true` when referenced by `apps/frontend-web` | low | TypeScript project references require referenced projects to enable `composite: true` and specify `tsBuildInfoFile`. | patch |
| `apps/frontend-web/tsconfig.json`: `noEmit: true` was omitted, causing `tsc -b` to output unnecessary `.js` files into source directory | low | Configured `noEmit: true` and removed stray `.js` files; Vite directly processes `.tsx`/`.ts` sources. | patch |
| `vitest.workspace.ts`: Deprecation warning from Vitest v3 | low | Replaced deprecated `vitest.workspace.ts` with modern `vitest.config.ts` using `test.projects`. | patch |

## Design Notes

The Material UI theme configuration directly implements tokens from `_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md`:
- Primary: `#1976d2`
- Secondary: `#9c27b0`
- Background: `#f4f6f8`
- Surface: `#ffffff`
- Error: `#d32f2f`
- Text Primary: `#111827`
- Text Secondary: `#6b7280`
- Border radius: default `8px`, button `6px`, card `12px`
- Flat elevation: App Bar elevation `0`, cards bordered with `1px solid #e5e7eb` instead of box-shadow.

## Verification

**Commands:**
- `npm test` or `npx nx run-many -t test` -- expected: All unit tests pass across apps and libs.
- `npm run build` or `npx nx run-many -t build` -- expected: Successful build of `frontend-web` and shared libraries.
- `npx nx serve frontend-web` -- expected: Dev server starts without compilation warnings.

**Manual checks (if no CLI):**
- Verify `index.html` loads Inter font and MUI styles render expected colors and spacing.
