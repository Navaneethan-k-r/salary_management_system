---
title: 'Story 1.4: HR Dashboard Overview'
type: 'feature'
created: '2026-09-23'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'fbb44128fce1c0bc7ae140d52ec1aabccd85e745'
context:
  - '_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The HR administration portal lacks a central landing page summarizing the overall state of the organization.

**Approach:** Implement the HR Dashboard Overview at `/admin/dashboard` to display key metrics, specifically the total employee count and a summary of recent payroll runs.

## Boundaries & Constraints

**Always:**
- Render the dashboard within the base admin layout (sidebar/app bar) defined in Story 1.2.
- Adhere to the established Material UI design system (flat elevation, `#1976d2` primary color, Inter/Roboto typography).
- Ensure all currency formatting for the payroll summary strictly uses INR (`₹`).
- Display MUI Skeleton loaders while data is being fetched.

**Never:**
- Do not implement complex filtering, date-range selections, or drill-down charts in this story; stick to a high-level overview.
- Do not bypass the stateful session token authentication established in Story 1.2.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful Data Load | Authenticated HR Admin navigates to `/admin/dashboard` | Dashboard displays total employee count and a list/table of recent payroll runs | N/A |
| Loading State | Dashboard is waiting for API responses | UI displays Material UI Skeleton loaders for metrics and tables | N/A |
| Empty State | No employees or payroll runs exist | Dashboard displays "0" for employee count and a user-friendly empty state message for recent payroll runs | N/A |
| API Failure | Dashboard API request fails | Dashboard displays an error state (e.g., MUI Snackbar or inline error) and allows the user to retry | Display generic error message, log details |

**Decisions:**
- Payroll Summary Data Source: Use STUB_ENDPOINTS. The backend will return empty arrays/0 until actual payroll logic is built in later epics.

</frozen-after-approval>

## Code Map

- `apps/frontend-web/src/pages/admin/Dashboard.tsx` -- New page component for the dashboard overview.
- `apps/frontend-web/src/routes/index.tsx` -- Ensure `/admin/dashboard` route is registered and protected.
- `apps/service-employee/` -- (Or appropriate backend service) Add endpoints to fetch dashboard metrics.

## Tasks & Acceptance

**Execution:**
- [x] `apps/service-employee/src/controllers/dashboard.controller.ts` -- Implement backend endpoints to return total employee count and recent payroll summary.
- [x] `apps/frontend-web/src/pages/admin/Dashboard.tsx` -- Create the main dashboard component with Skeleton loaders and error handling.
- [x] `apps/frontend-web/src/pages/admin/Dashboard.spec.tsx` -- Add unit tests for loading, empty, and populated states.
- [x] `apps/frontend-web/src/routes/index.tsx` -- Register `/admin/dashboard` as a protected route using the layout from Story 1.2.

**Acceptance Criteria:**
- Given I am a logged-in HR Administrator, when I navigate to `/admin/dashboard`, then I see the total count of employees and a summary of recent payroll runs.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: All unit tests pass, including the new `Dashboard.spec.tsx`.
- `npm run build` -- expected: Successful build of `frontend-web` and backend services.

**Manual checks (if no CLI):**
- Log in as HR Admin and navigate to `/admin/dashboard`. Verify the metrics cards and tables match the expected data state (mocked or empty) and follow the design system.
