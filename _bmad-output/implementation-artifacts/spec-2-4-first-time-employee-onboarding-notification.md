---
title: 'Story 2.4: First-Time Employee Onboarding Notification'
type: 'feature'
created: '2026-09-23'
status: 'in-progress'
baseline_commit: 'b35c0bb633033a05c79b6455f74960a1e37609b7'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When HR adds a new employee to the system, the employee currently has no way to know they were added, nor do they have a mechanism to set up their password and activate their account for the self-service portal.

**Approach:** Implement an asynchronous notification mechanism. Upon employee creation, the Employee Service will publish a domain event to RabbitMQ. The Notification Service (`service-worker`) will consume this event and send an onboarding email containing an account activation/password setup link to the new employee.

## Boundaries & Constraints

**Always:**
- Publish an event (e.g., `EmployeeCreatedEvent`) to RabbitMQ rather than sending the email synchronously from the Employee Service.
- The Notification Service must consume the event to send the email.
- The email must contain a clear call-to-action link pointing to the frontend password setup page.
- **Decision Record:** Automatically trigger the onboarding event upon creation of the employee.
- **Decision Record:** Generate a database-backed stateful activation token for the onboarding setup link.
- **Decision Record:** In dev environments, mock email delivery by logging the URL. In production environments, expect a Zapier webhook URL in `.env`. Prepare a payload containing user and organization details and post it to the Zapier URL, allowing Zapier to handle the email dispatch.

**Never:**
- Do not send the password in plain text.
- Do not block the HR API response (the "Add Employee" request) waiting for the email to be sent.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Employee Created | Valid employee created by HR | Publish `EmployeeCreatedEvent` to RabbitMQ | Log event publishing failure |
| Event Consumed | Valid event received by `service-worker` | Send onboarding email to the employee | Retry event consumption on email sending failure (e.g., DLQ) |
| Invalid Email Config | Missing API keys or incorrect email config | Email fails to send | Log failure, do not crash worker |

</frozen-after-approval>



## Code Map

- `apps/service-employee/src/employee/employee.service.ts` -- Update to publish `EmployeeCreatedEvent` to RabbitMQ upon successful creation.
- `apps/service-employee/src/events/employee.events.ts` -- Define the event structure (e.g., payload with email, token, etc.).
- `apps/service-worker/src/notification/notification.consumer.ts` -- New consumer to listen for `EmployeeCreatedEvent`.
- `apps/service-worker/src/notification/email.service.ts` -- Service to handle the actual email sending (or mocking).

## Tasks & Acceptance

**Execution:**
- [x] `apps/service-employee/src/employee/employee.service.ts` -- Publish event on creation -- Decouples email sending from HTTP request.
- [x] `apps/service-worker/src/notification/notification.consumer.ts` -- Consume event and trigger email -- Handles the asynchronous background work.
- [x] `apps/service-worker/src/notification/email.service.ts` -- Construct and send the email with the activation link -- Delivers the message to the user.

**Acceptance Criteria:**
- Given HR successfully adds a new employee, when the employee is saved, then an `EmployeeCreatedEvent` is published to the message broker.
- Given an `EmployeeCreatedEvent` is published, when the Notification Service consumes it, then an onboarding email is dispatched to the employee's email address.
- Given the onboarding email is dispatched, when received, then it contains a link to set up their password.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm test` -- expected: Unit tests for event publishing and consumption pass.
- `npm run build` -- expected: Monorepo builds cleanly.

**Manual checks (if no CLI):**
- Verify RabbitMQ receives the event when an employee is added.
- Verify the worker logs show the email being "sent" or processed.
