---
title: 'Story 2.2: Add & Edit Employee Records'
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

**Problem:** HR administrators need a way to populate the employee directory and keep employee information up to date, but currently, they can only view the directory.

**Approach:** Implement a modal on the Employee Directory page where HR can add new employees and edit existing employee records, capturing their email, mobile, and salary package. Upon saving, the list updates and a success notification is displayed.

## Boundaries & Constraints

**Always:**
- Use a modal with a pronounced shadow to maintain user context on the directory list.
- Display a UI toast notification (MUI Snackbar) upon successful save.
- Follow DESIGN.md styling constraints (e.g., flat elevation, Inter/Roboto fonts, specific spacing).
- Validate all inputs on the frontend and backend.
- **Decision Record:** Password Setup — HR will not provide passwords when creating an employee. The system will handle password setup via onboarding emails (aligning with Story 2.4). The add/edit form will not include a password field.
- **Decision Record:** Salary Package — The form will use references to predefined salary components (a selected "Salary Package ID") rather than a single numeric gross value. Since Epic 3 (Salary Configuration) is in the backlog, the frontend can use a mocked dropdown input as a placeholder until the real API is available.

**Never:**
- Do not implement the open signup flow for employees; all onboarding must go through this HR form.
- Do not build the "Delete Employee" functionality in this story (deferred to Story 2.3).
- Do not collect employee passwords on the HR form.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add New Employee | Valid email, mobile, and selected salary components | Record is created (without password), modal closes, list updates, success toast shown | Show validation errors if email/mobile is malformed |
| Edit Employee | Valid updated mobile number | Record is updated, modal closes, list reflects new mobile | Show validation error if data is invalid |
| Duplicate Email | Email already exists in DB | Form submission fails | Show error message: "Email already registered." |

</frozen-after-approval>

## Code Map

- `libs/shared-types/src/index.ts` -- Define `CreateEmployeeDto` and `UpdateEmployeeDto` interfaces.
- `apps/service-employee/src/employee/employee.controller.ts` -- REST API controller adding `POST /api/employees` and `PUT /api/employees/:id`.
- `apps/service-employee/src/employee/employee.service.ts` -- Business logic for inserting and updating employee records, including duplicate checks.
- `apps/frontend-web/src/services/employeeService.ts` -- Client API methods for `POST` and `PUT`.
- `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Redux Toolkit slice actions/thunks to add/update an employee in the local state.
- `apps/frontend-web/src/components/AddEditEmployeeModal.tsx` -- New UI component for the modal/drawer form.
- `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Update to include the "Add Employee" button, "Edit" row actions, and state to toggle the modal.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/index.ts` -- Add `CreateEmployeeDto` and `UpdateEmployeeDto` -- Formalizes the API contracts for mutations.
- [ ] `apps/service-employee/src/employee/employee.service.ts` & `apps/service-employee/src/employee/employee.controller.ts` -- Implement `POST` and `PUT` endpoints -- Handles database inserts and updates with validation.
- [ ] `apps/frontend-web/src/services/employeeService.ts` -- Add client service methods for mutations -- Connects frontend forms to backend APIs.
- [ ] `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Add thunks for create and update -- Manages async state and updates the local list.
- [ ] `apps/frontend-web/src/components/AddEditEmployeeModal.tsx` -- Build the modal/drawer form -- Provides the UI for data entry, using a mock dropdown for the salary package if Epic 3 APIs are unavailable.
- [ ] `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Wire up "Add" and "Edit" buttons to the modal -- Integrates the form into the directory view and handles success toasts.

**Acceptance Criteria:**
- Given I am on the Employee Directory, when I click "Add Employee", then a modal/drawer opens to collect employee details without a password field.
- Given I am on the Employee Directory, when I click "Edit" on a specific employee, then the modal/drawer opens pre-filled with their current data.
- Given I have filled out the employee form with valid data, when I click "Save", then the modal closes, the directory list updates, and a "Employee saved successfully" toast appears.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

- **Modal**: Should be centered on the screen to provide ample space for form fields while keeping the directory visible in the background. Use a pronounced shadow.
- **Form Layout**: Stack fields vertically with standard spacing (`16px`).

## Verification

**Commands:**
- `npm test` -- expected: All unit tests in `frontend-web` and `service-employee` pass.
- `npm run build` -- expected: Monorepo builds cleanly.

**Manual checks (if no CLI):**
- Verify the modal opens correctly from the "Add Employee" and "Edit" buttons.
- Verify that saving a new employee adds them to the directory and shows a success toast.
- Verify that duplicate emails are rejected gracefully.
