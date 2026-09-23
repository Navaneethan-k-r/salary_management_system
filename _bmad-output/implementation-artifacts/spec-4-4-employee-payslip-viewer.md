---
title: 'Employee Payslip Viewer'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ["c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-4-context.md"]
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Employees lack a transparent, centralized place to view their historical pay information and detailed payslip breakdowns.

**Approach:** Build a dedicated Employee Portal page that fetches and displays a list of the employee's generated payslips. When an employee selects a payslip, show a detailed, web-based breakdown of their salary components for that month.

## Boundaries & Constraints

**Always:**
- Format all monetary values strictly in INR (e.g., `₹ XX,XXX.XX`).
- Right-align monetary values in data tables.
- Use MUI Skeleton loaders matching the table/card shape while fetching data.
- Display an empty state reading "No payslips generated for you yet" if the list is empty.

**Never:**
- Do not provide a PDF download option or generate PDFs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| View Payslip History | Employee navigates to Payslips page. | A list of historical payslips is displayed in chronological order. | Render generic error state if fetch fails. |
| Loading History | API request to fetch payslips is pending. | Skeleton loaders matching the table shape are displayed. | N/A |
| Empty History | Employee has 0 payslips generated. | Show empty state: "No payslips generated for you yet". | N/A |
| View Detailed Payslip | Employee clicks on a specific month's payslip. | Detailed web view with all salary components broken down. | Show "Payslip details unavailable" error boundary if fetch fails. |

</frozen-after-approval>

## Code Map

- `apps/frontend-web/src/app/App.tsx` -- Update routing to include the new Employee Portal payslips page (if routing exists, else prepare base layout hook).
- `apps/frontend-web/src/pages/employee/PayslipsPage.tsx` -- New component for listing historical payslips and empty state logic.
- `apps/frontend-web/src/components/payslips/PayslipDetailView.tsx` -- New component for displaying the detailed breakdown of a single payslip.
- `apps/frontend-web/src/components/payslips/PayslipListSkeleton.tsx` -- New component for the skeleton loader.
- `apps/service-payroll/src/payslip/payslip.controller.ts` -- Add/ensure endpoint `GET /api/payslips/me` is available for fetching the employee's own payslips.
- `apps/service-payroll/src/payslip/payslip.service.ts` -- Business logic to fetch payslips by employee ID.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/service-payroll/src/payslip/payslip.controller.ts` -- Create endpoints `GET /api/payslips/me` and `GET /api/payslips/me/:id` to securely fetch the current employee's payslips.
- [ ] `apps/service-payroll/src/payslip/payslip.service.ts` -- Implement the retrieval logic from the database, scoped strictly to the requesting employee.
- [ ] `apps/frontend-web/src/components/payslips/PayslipListSkeleton.tsx` -- Create a reusable MUI Skeleton matching the table layout.
- [ ] `apps/frontend-web/src/pages/employee/PayslipsPage.tsx` -- Implement the main list view, handling loading (skeleton), empty ("No payslips generated for you yet"), and populated states.
- [ ] `apps/frontend-web/src/components/payslips/PayslipDetailView.tsx` -- Implement the detailed breakdown view with right-aligned INR formatting for all amounts.
- [ ] `apps/frontend-web/src/app/App.tsx` -- Wire up the new PayslipsPage in the application navigation.

**Acceptance Criteria:**
- Given an employee logs in and has no payslips, when they navigate to the payslip viewer, then they see the message "No payslips generated for you yet".
- Given an employee has payslips, when they navigate to the payslip viewer, then they see a chronological list of their payslips with right-aligned INR currency formatting.
- Given a slow network, when the payslip list is fetching, then Skeleton loaders matching the table shape are displayed.
- Given an employee views a specific payslip, when the page loads, then a detailed component-by-component breakdown is displayed purely in the web UI (no PDF).

## Implementation Notes



## Spec Change Log



## Review Triage Log



## Verification

**Commands:**
- `nx test frontend-web` -- expected: UI components render correctly for empty, loading, and populated states.
- `nx test service-payroll` -- expected: API endpoints correctly fetch and restrict payslip data to the authenticated employee.
