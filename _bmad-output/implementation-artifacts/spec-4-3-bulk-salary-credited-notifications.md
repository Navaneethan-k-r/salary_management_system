---
title: 'Bulk Salary Credited Notifications'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ["c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-4-context.md"]
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Employees need to be notified when their payslip has been generated and their salary is credited, rather than manually checking the portal.

**Approach:** Implement event-driven notifications where `service-payroll` publishes a `payslip.generated` event to RabbitMQ upon payslip generation. The `service-worker` (Notification Service) consumes these events and asynchronously dispatches standardized "salary credited" emails to the employees.

## Boundaries & Constraints

**Always:**
- Use RabbitMQ for asynchronous event publishing and consumption between `service-payroll` and `service-worker`.
- Ensure all notification processing in `service-worker` does not block other workers or the main event loop.
- Only dispatch notifications for successfully generated payslips.

**Never:**
- Do not make synchronous HTTP calls from `service-payroll` to `service-worker` for sending emails; always use the event queue.
- Do not include sensitive information like full SSN/PAN in the email notification; rely on the web portal for detailed viewing.

**Design Decisions:**
- **Email Template:** Include the net payout amount directly in the detailed "salary credited" email.
- **Scope:** Dispatch notifications for both bulk generation and manual payslip generation.
- **Failure Handling:** Implement a RabbitMQ Dead-Letter Queue (DLQ) to handle and retry failed email dispatches.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful Notification | `payslip.generated` event received by `service-worker`. | Email dispatched to the employee's registered email address. | N/A |
| Email Dispatch Failure | External email provider is down or rejects the message. | Event is not acknowledged or is sent to a Dead Letter Queue (pending open question). | Retry or DLQ logging |

</frozen-after-approval>



## Code Map

- `apps/service-payroll/src/payslip/bulk-payslip.service.ts` -- Update to publish `payslip.generated` event to RabbitMQ upon successful generation.
- `apps/service-payroll/src/payslip/manual-payslip.service.ts` -- Update to publish `payslip.generated` event (if scope applies).
- `apps/service-worker/src/notifications/notification.consumer.ts` -- New RabbitMQ consumer to listen for `payslip.generated` events.
- `apps/service-worker/src/notifications/email.service.ts` -- New service to render and dispatch the "salary credited" email.
- `libs/shared-types/src/lib/events.types.ts` -- Define the interface/schema for the `payslip.generated` event payload.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/lib/events.types.ts` -- Define the `PayslipGeneratedEvent` interface.
- [ ] `apps/service-payroll/src/payslip/bulk-payslip.service.ts` -- Integrate RabbitMQ publisher to emit `PayslipGeneratedEvent`.
- [ ] `apps/service-worker/src/notifications/notification.consumer.ts` -- Implement the RabbitMQ consumer to process the event.
- [ ] `apps/service-worker/src/notifications/email.service.ts` -- Implement email dispatch using the configured email provider.

**Acceptance Criteria:**
- Given a payslip is successfully generated, when the backend processing completes, then a `payslip.generated` event is published to the queue.
- Given a `payslip.generated` event in the queue, when the `service-worker` consumes it, then a "salary credited" email is dispatched to the employee.

## Implementation Notes



## Spec Change Log



## Review Triage Log



## Design Notes

Use RabbitMQ topic exchanges (e.g., `payroll.events`) with a dedicated queue for notifications (e.g., `q.notifications.payslip`). The event payload should only carry necessary identifiers (e.g., `employeeId`, `payslipId`, `monthYear`) to avoid stale data, allowing `service-worker` to fetch employee contact details if needed or relying on the event payload if it's guaranteed to be complete.

## Verification

**Commands:**
- `nx test service-payroll` -- expected: Unit tests for RabbitMQ event publishing pass.
- `nx test service-worker` -- expected: Unit tests for consumer logic and email dispatch pass.

**Manual checks (if no CLI):**
- Generate a payslip in the local environment and verify the event is published to RabbitMQ.
- Verify the local `service-worker` consumes the message and logs the email dispatch (using a tool like Mailhog or Mailtrap).
