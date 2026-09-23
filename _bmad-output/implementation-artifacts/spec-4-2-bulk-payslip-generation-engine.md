---
title: 'Bulk Payslip Generation Engine'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ["c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-4-context.md"]
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Generating payslips manually for every employee is inefficient and error-prone. HR needs a way to generate payslips for all active employees simultaneously at the end of the billing cycle.

**Approach:** Implement a background batch-processing engine in `service-payroll` that calculates and generates payslips for all active employees. HR will trigger this bulk generation from the web UI, which will show a persistent progress indicator while the backend processes the batches asynchronously.

## Boundaries & Constraints

**Always:**
- Assume 0 leaves (no loss of pay) for all active employees during bulk generation.
- Format all currency values strictly as `₹ XX,XXX.XX` and align right in UI tables.
- Handle batch generation asynchronously in the background to prevent blocking the UI.
- Must complete processing for 10,000 employees in under 5 minutes.
- Show a persistent bottom snackbar/banner during generation and a global toast notification upon completion.
- Require a confirmation dialog before initiating bulk generation.
- Place the "Bulk Generate Payslips" trigger on the Employee Directory page.
- Enable the bulk generation button ONLY on the 1st day of the month (disabled otherwise).
- Target the immediately preceding month for the generated payslips.

**Never:**
- Do not implement PDF generation or download capabilities.
- Do not block the main Node.js event loop while generating large batches of payslips.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful Bulk Run | HR clicks "Bulk Generate", confirms. | Job is enqueued, UI shows progress banner. Eventually toast shows success. | N/A |
| Processing Failure | Job fails midway due to DB error. | Background job stops or retries. | UI toast displays failure message. |
| No Active Employees | 0 active employees in DB. | Job completes immediately. | UI toast displays "No active employees found." |

</frozen-after-approval>



## Code Map

- `apps/frontend-web/src/app/pages/admin/EmployeesPage.tsx` -- Add bulk generate button and confirmation dialog (pending Open Question decision).
- `apps/frontend-web/src/app/components/PayslipProgressBanner.tsx` -- New persistent banner to show async generation progress.
- `apps/service-payroll/src/payslip/bulk-payslip.service.ts` -- New service to handle fetching active employees and chunking them for batch processing.
- `apps/service-payroll/src/payslip/bulk-payslip.controller.ts` -- REST endpoint to initiate the bulk job and endpoint to poll/stream progress.
- `libs/shared-types/src/lib/payslip.types.ts` -- Interfaces for bulk generation request and progress state.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/lib/payslip.types.ts` -- Add DTOs for bulk generation requests and progress updates.
- [ ] `apps/service-payroll/src/payslip/bulk-payslip.service.ts` -- Implement batch processing logic (e.g., using BullMQ or chunked async processing) to generate payslips for all active employees, assuming 0 leaves.
- [ ] `apps/service-payroll/src/payslip/bulk-payslip.controller.ts` -- Create POST endpoint to start bulk generation and GET endpoint to check progress.
- [ ] `apps/frontend-web/src/app/components/PayslipProgressBanner.tsx` -- Create a banner component that polls the backend or listens to events for progress updates.
- [ ] `apps/frontend-web/src/app/pages/admin/EmployeesPage.tsx` -- Build the trigger button, confirmation dialog, and integrate the progress banner.

**Acceptance Criteria:**
- Given I am an HR Admin, when I click "Bulk Generate Payslips" and confirm the dialog, then a persistent progress banner appears showing the generation progress.
- Given a bulk generation is running, when the backend processes 10,000 employees, then it completes in under 5 minutes without blocking other UI operations.
- Given the bulk generation finishes successfully, when completed, then the progress banner disappears and a global success toast is shown.

## Implementation Notes



## Spec Change Log



## Review Triage Log



## Design Notes

Use an async queue or batch chunking with `Promise.all` in `service-payroll` to handle the load without blocking the event loop. The frontend can use a simple interval-based polling mechanism (RTK Query with `pollingInterval`) to fetch progress updates until the job is complete, avoiding the overhead of WebSockets for a simple progress bar.

## Verification

**Commands:**
- `nx test service-payroll` -- expected: Unit tests for batch chunking and bulk processing pass.
- `nx test frontend-web` -- expected: UI tests for confirmation dialog and progress banner pass.

**Manual checks (if no CLI):**
- Trigger bulk generation and verify the confirmation dialog appears.
- Verify the progress banner updates and eventually shows a success toast.
- Check the database to ensure payslips were generated for all active employees with 0 leaves.
