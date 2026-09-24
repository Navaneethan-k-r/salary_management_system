---
title: 'Story 2.3: Delete Employee Confirmation'
type: 'feature'
created: '2026-09-23'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '69e9da9b8929bc35a9c0fcd8396d0955f2b88b8d'
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** HR administrators have no way to remove employees who have left the organization or were created by mistake from the directory.

**Approach:** Implement a "Delete" action on the Employee Directory table. When clicked, present a reassurance confirmation dialog (MUI Dialog). Upon confirmation, the employee record is deleted via the backend and removed from the list, with a success notification.

## Boundaries & Constraints

**Always:**
- Display a reassurance confirmation dialog before triggering the deletion.
- Show a UI toast notification (MUI Snackbar) upon successful deletion.
- Follow DESIGN.md styling constraints.
- **Decision Record:** Soft Delete — The delete operation will perform a soft delete (e.g., setting an `is_active` flag to false and setting a `deleted_at` timestamp) to preserve historical records for payroll and audit purposes.

**Never:**
- Do not allow deletion without explicit confirmation.
- Do not delete the logged-in HR user's own account (if applicable).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Delete Cancelled | User clicks "Cancel" on confirmation dialog | Dialog closes, no data is deleted | N/A |
| Delete Confirmed | User confirms deletion of a valid employee | Call DELETE API, close dialog, update list, show success toast | Show error toast if API fails |
| Employee Not Found | ID no longer exists when API is called | API returns 404 Not Found | Show error toast: "Employee could not be found or was already deleted." |

</frozen-after-approval>

## Code Map

- `apps/service-employee/src/employee/employee.controller.ts` -- REST API controller adding `DELETE /api/employees/:id`.
- `apps/service-employee/src/employee/employee.service.ts` -- Business logic for deleting employee records.
- `apps/frontend-web/src/services/employeeService.ts` -- Client API methods for `DELETE`.
- `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Redux Toolkit slice actions/thunks to remove an employee from local state.
- `apps/frontend-web/src/components/DeleteEmployeeDialog.tsx` -- New UI component for the reassurance confirmation dialog.
- `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Update to include the "Delete" row action and state to toggle the delete dialog.

## Tasks & Acceptance

**Execution:**
- [x] `apps/service-employee/src/employee/employee.service.ts` & `apps/service-employee/src/employee/employee.controller.ts` -- Implement `DELETE /api/employees/:id` endpoint -- Handles database deletion.
  - [x] `apps/service-employee/migrations/1790250636833-AddSoftDeleteToEmployees.ts` -- Migration adds `is_active` and `deleted_at` columns.
- [x] `apps/frontend-web/src/services/employeeService.ts` -- Add client service method for deletion -- Connects frontend action to backend API.
- [x] `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Add thunk for delete -- Manages async state and updates the local list by removing the deleted employee.
- [x] `apps/frontend-web/src/components/DeleteEmployeeDialog.tsx` -- Build the confirmation dialog -- Provides the reassurance UI.
- [x] `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Wire up "Delete" button to the dialog -- Integrates the action into the directory view.

**Acceptance Criteria:**
- Given I am on the Employee Directory, when I click "Delete" on a specific employee row, then a reassurance confirmation dialog appears.
- Given the delete confirmation dialog is open, when I click "Cancel", then the dialog closes and the employee remains in the list.
- Given the delete confirmation dialog is open, when I confirm the deletion, then the dialog closes, the employee is removed from the directory list, and a "Employee deleted successfully" toast appears.

## Implementation Notes

- `DELETE /api/employees/:id`: Returns HTTP 200 OK with `{ message: 'Employee deleted successfully' }` instead of 204 No Content to provide explicit deletion feedback to API callers.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: All unit tests in `frontend-web` and `service-employee` pass.
- `npm run build` -- expected: Monorepo builds cleanly.

**Manual checks (if no CLI):**
- Verify the confirmation dialog opens when clicking "Delete".
- Verify canceling the dialog does not delete the employee.
- Verify confirming the dialog deletes the employee, updates the list, and shows a success toast.
