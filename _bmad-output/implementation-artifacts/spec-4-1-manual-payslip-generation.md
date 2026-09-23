---
title: 'Manual Payslip Generation'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ["c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-4-context.md"]
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** HR needs a way to process exceptions, corrections, or individual off-cycle payrolls manually, which requires accounting for specific leave counts for an individual employee.

**Approach:** Implement a manual payslip generation flow triggered via an action menu on the Employee Directory list. When triggered, a modal/drawer opens where HR can input the leave count for that specific employee. The backend `service-payroll` will calculate the pro-rated net payout (applying pro-ration proportionally to the final calculated net payout, rather than individual components) and create a payslip record.

## Boundaries & Constraints

**Always:**
- Format all currency values strictly as `₹ XX,XXX.XX` and align right in UI tables.
- Send generation requests to the `service-payroll` backend.
- Ensure the result is viewable only in the web portal.

**Never:**
- Do not implement PDF generation or download capabilities.
- Do not implement a complex localized tax engine; rely entirely on the assigned additive and deductive salary components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Zero leaves | Employee selected, Leaves: 0 | Payslip created with full calculated net payout. Success toast displayed. | N/A |
| Pro-rated salary | Employee selected, Leaves > 0 | Net payout is reduced proportionally based on the leave count. Success toast displayed. | N/A |
| Backend failure | Backend returns 5xx | Payslip is not generated. | Display error toast indicating failure. |
| Invalid leave count | Negative leave count | Input validation prevents submission. | Show field-level validation error. |

</frozen-after-approval>



## Code Map

- `apps/frontend-web/src/app/pages/admin/EmployeesPage.tsx` -- Employee Directory list where the "Generate Payslip" action menu item will be added.
- `apps/service-payroll/src/payslip/payslip.controller.ts` -- REST endpoint to accept manual payslip generation requests.
- `apps/service-payroll/src/payslip/payslip.service.ts` -- Business logic for pro-ration (applied to final net payout) and saving to MySQL.
- `libs/shared-types/src/lib/payslip.types.ts` -- Interfaces for payslip requests, responses, and database entities.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/lib/payslip.types.ts` -- Add `GeneratePayslipDto` and `Payslip` entity interfaces.
- [ ] `apps/service-payroll/src/payslip/payslip.controller.ts` -- Create POST endpoint for generating manual payslips.
- [ ] `apps/service-payroll/src/payslip/payslip.service.ts` -- Implement payout calculation and pro-ration logic (applying to final net payout) based on leave counts.
- [ ] `apps/frontend-web/src/app/pages/admin/EmployeesPage.tsx` -- Build UI action menu on the Directory list to trigger a modal with leave count input and submit button.

**Acceptance Criteria:**
- Given I select a specific employee on the payslip generation screen, when I input their leave count and click "Generate", then the Payroll Service calculates the pro-rated net payout and creates a payslip record.
- Given a successful generation, when the request completes, then I see a success toast notification.

## Implementation Notes



## Spec Change Log



## Review Triage Log



## Design Notes

No complex design patterns needed. Standard React state for the form and RTK Query for the backend request.

## Verification

**Commands:**
- `nx test service-payroll` -- expected: Unit tests for payout calculation pass.
- `nx test frontend-web` -- expected: Form validation and submission tests pass.

**Manual checks (if no CLI):**
- Verify the form submission correctly triggers the backend and displays a toast.
- Verify the generated payslip is accessible in the database.
