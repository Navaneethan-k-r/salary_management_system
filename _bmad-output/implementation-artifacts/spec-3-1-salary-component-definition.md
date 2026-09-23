---
title: 'Story 3.1: Salary Component Definition'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ['c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** HR administrators need a way to define the building blocks of the organization's payroll structure (additive and deductive components) so that accurate net payouts can be calculated automatically. Currently, this capability is missing.

**Approach:** Build the Salary Configuration management feature. On the frontend, create the `/admin/salary-config` page in `frontend-web` with a list view and a modal for adding/editing components. On the backend, initialize the `service-payroll` application (if not already present) and create REST endpoints to manage salary components stored in the shared MySQL database.

## Boundaries & Constraints

**Always:** 
- Format all currency values strictly as INR right-aligned in data tables.
- Use modals for forms to maintain user context.
- Require explicit confirmation via dialog before deleting any component, warning about the impact on net payouts.
- Backend must connect to the shared MySQL database and validate opaque session tokens via Redis (fallback to `service-employee` if miss).

**Never:** 
- Do not implement complex localized tax rules engines; tax is just another manual deductive component.
- Do not use stateless JWT validation; strictly use the opaque token pattern defined in architecture.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add valid component | Name: "Basic", Type: "Additive", Default Value: 50000 | Component saved, list updates, success toast shown | N/A |
| Add component with negative value | Default Value: -100 | Validation error prevents submission | Show inline error: "Value must be positive" |
| Delete component | User clicks delete | Show confirmation dialog | N/A |
| Confirm deletion | User confirms deletion | Component removed from DB, list updates, success toast shown | If attached to employees (future check), handle gracefully |

**Decisions:**
- Initialization of `service-payroll`: Initialize `service-payroll` now (Adheres to Architecture Spine).
- Default Value Type: Allow either percentage of basic or fixed amount.

</frozen-after-approval>

## Code Map

- `apps/frontend-web/src/pages/admin/SalaryConfig.tsx` -- New page for salary configuration list.
- `apps/frontend-web/src/components/admin/SalaryComponentModal.tsx` -- Modal/drawer form for adding/editing components.
- `apps/frontend-web/src/services/api/payroll.ts` -- API client methods for salary components.
- `apps/service-payroll/` -- NestJS application directory (to be created/used).
- `apps/service-payroll/src/salary-component/` -- Module, controller, and service for managing components.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/service-payroll` -- generate NestJS app -- required to host the backend endpoints for payroll and salary config.
- [ ] `apps/service-payroll/src/salary-component/salary-component.module.ts` -- create module -- encapsulates the CRUD operations for salary components.
- [ ] `apps/frontend-web/src/pages/admin/SalaryConfig.tsx` -- create UI page -- provides the data table for HR to view existing components.
- [ ] `apps/frontend-web/src/components/admin/SalaryComponentModal.tsx` -- create modal component -- allows adding and editing components.

**Acceptance Criteria:**
- Given I am on the Salary Configuration page, when I add a new component, then I can specify its name, type (additive or deductive), and default value.
- Given I want to delete a component, when I trigger the deletion, then a reassuring confirmation dialog appears warning about net payout impact.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx nx run service-payroll:build` -- expected: Build completes successfully
- `npx nx run frontend-web:build` -- expected: Build completes successfully

**Manual checks (if no CLI):**
- Verify the `/admin/salary-config` route renders correctly.
- Verify adding a component reflects in the UI and the database.
- Verify the delete confirmation dialog appears and works as expected.
