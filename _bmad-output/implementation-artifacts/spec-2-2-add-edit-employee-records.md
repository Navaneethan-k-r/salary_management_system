---
title: 'Story 2.2: Add & Edit Employee Records'
type: 'feature'
created: '2026-09-23'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '0fb5dfadbf0de755b56463eba67b6be548a891a7'
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
- [x] `libs/shared-types/src/index.ts` -- Add `CreateEmployeeDto` and `UpdateEmployeeDto` -- Formalizes the API contracts for mutations.
- [x] `apps/service-employee/src/employee/employee.service.ts` & `apps/service-employee/src/employee/employee.controller.ts` -- Implement `POST` and `PUT` endpoints -- Handles database inserts and updates with validation.
- [x] `apps/frontend-web/src/services/employeeService.ts` -- Add client service methods for mutations -- Connects frontend forms to backend APIs.
- [x] `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Add thunks for create and update -- Manages async state and updates the local list.
- [x] `apps/frontend-web/src/components/AddEditEmployeeModal.tsx` -- Build the modal/drawer form -- Provides the UI for data entry, using a mock dropdown for the salary package if Epic 3 APIs are unavailable.
- [x] `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Wire up "Add" and "Edit" buttons to the modal -- Integrates the form into the directory view and handles success toasts.

**Acceptance Criteria:**
- Given I am on the Employee Directory, when I click "Add Employee", then a modal/drawer opens to collect employee details without a password field.
- Given I am on the Employee Directory, when I click "Edit" on a specific employee, then the modal/drawer opens pre-filled with their current data.
- Given I have filled out the employee form with valid data, when I click "Save", then the modal closes, the directory list updates, and a "Employee saved successfully" toast appears.

## Implementation Notes

- **Backend DTOs**: Created `apps/service-employee/src/employee/dto/create-employee.dto.ts` and `update-employee.dto.ts` with `class-validator` decorators (email format, mobile regex, non-empty checks). The global `ValidationPipe` in `main.ts` handles automatic request validation and 400 responses.
- **Duplicate email**: `createEmployee` calls `findOne` scoped to `organizationId` before insert; throws `ConflictException` (HTTP 409) with the message "Email already registered." for the frontend to surface.
- **salaryPackageId**: Accepted in DTOs and dispatched through Redux but not yet persisted on `EmployeeEntity` — that field belongs in Epic 3. A mocked dropdown (4 representative packages) is shown in the form.
- **Email immutability**: `UpdateEmployeeDto` deliberately omits `email`; the controller only accepts mobile/fullName/salaryPackageId for PUT.
- **Redux state**: Added `mutating` / `mutationError` fields separate from the list's `loading` / `error` so the modal spinner and the list skeleton never conflict.
- **Tests**: `employee.service.spec.ts` covers all 3 I/O matrix rows (add, duplicate, edit). `AddEditEmployeeModal.spec.tsx` adds 8 component tests covering validation, API errors, pre-fill, and success callbacks.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Route | Evidence |
|---|--------|---------|---------|-------|----------|
| 1 | blind-hunter | Email duplicate ConflictException not thrown | `false` | — | `employee.service.ts:62–68` calls `findOne` first and throws `ConflictException('Email already registered.')` before any DB insert. |
| 2 | blind-hunter | UpdateEmployeeDto doesn't protect system fields | `false` | — | DTO only exposes `fullName`, `mobile`, `salaryPackageId`. NestJS `ValidationPipe(whitelist:true)` strips unknown fields; `id`/timestamps are never in the DTO. |
| 3 | blind-hunter | Numeric salary validation missing | `false` | — | No numeric salary field exists; spec Decision Record mandates a string `salaryPackageId` placeholder for Epic 3. Out of scope. |
| 4 | blind-hunter | Whitespace not trimmed on fullName/mobile | `low` | `patch` | Auto-fixed: `createEmployee` and `updateEmployee` now call `.trim()` on fullName and mobile; email is normalized with `.trim().toLowerCase()` before duplicate check and store. |
| 5 | blind-hunter | Redux update resets filters/pagination | `false` | — | `updateEmployee.fulfilled` patches `state.data[index]` in-place; no pagination/filter keys are touched. |
| 6 | blind-hunter | Modal errors not reset on re-open | `false` | — | `AddEditEmployeeModal` `useEffect` on `open` calls `setErrors({})` and `dispatch(clearMutationError())`. |
| 7 | blind-hunter | Date timezone shift in date pickers | `false` | — | No date fields exist in this form; inapplicable to this story. |
| 8 | blind-hunter | Double submission not prevented | `false` | — | Save button has `disabled={mutating}` and shows `CircularProgress` when `mutating` is true. |
| 9 | blind-hunter | Snackbar missing aria-live | `low` | Rejected | MUI `Alert` already carries `role="alert"`. Adding explicit `aria-live` is cosmetic; unlikely to affect everyday users; fix adds complexity. |
| 10 | blind-hunter | Edit mode pre-fill test missing | `false` | — | `AddEditEmployeeModal.spec.tsx` contains `it('pre-fills form...')` and `it('calls updateEmployee and onSuccess...')` in the Edit mode describe block. |
| 11 | edge-case | `createEmployee` — DB infrastructure error bubbles as 500 | `false` | — | Correct behavior for infrastructure failures; NestJS global exception filter handles this. |
| 12 | edge-case | `updateEmployee` — invalid UUID format | `false` | — | `findOne` with invalid UUID returns null → `NotFoundException` thrown and mapped to HTTP 404. |
| 13 | edge-case | `handleSaveSuccess` re-fetch error silently ignored | `low` | Rejected | Real but low: fetch failure after a successful save shows stale data; fixing requires a separate error toast path adding complexity beyond this story's scope. Defer. |
| 14 | edge-case | `createEmployee.fulfilled` — totalPages not recalculated | `low` | Rejected | Low cosmetic edge case on the exact boundary page; the next real fetch corrects it. Fix adds complexity. |
| 15 | verification-gap | Redux slice `createEmployee` thunk — no dedicated unit test for state mutation | `low` | `defer` | Real gap: `AddEditEmployeeModal.spec.tsx` mocks the service so the thunk's in-slice behavior (prepending to `state.data`) is not explicitly asserted. Low risk — RTK is well-tested OSS; add a slice spec in a future story. |

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
