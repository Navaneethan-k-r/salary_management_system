# Epic 2 Context: Employee Lifecycle & Portal Onboarding

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable HR to securely manage the employee directory, and allow employees to activate their accounts and access their self-service portal.

## Stories

- Story 2.1: Employee Directory List & Empty State
- Story 2.2: Add & Edit Employee Records
- Story 2.3: Delete Employee Confirmation
- Story 2.4: First-Time Employee Onboarding Notification
- Story 2.5: Employee Password Setup
- Story 2.6: Employee Portal Login

## Requirements & Constraints

- HR-driven onboarding only; there is no open signup for employees.
- HR must be able to add, edit, and delete employee records including email, password, mobile, and salary package fields.
- Employees authenticate via a standard login portal.
- First-time employees must receive a password setup email and navigate through a setup page before accessing the portal.

## Technical Decisions

- **Employee Service:** Handled by `service-employee` (NestJS). Responsible for employee records and authentication.
- **Data Storage:** Employee data is stored in the shared MySQL database.
- **Authentication:** Stateful session authentication using opaque tokens (< 12 characters) stored in a shared Redis cache. Services check Redis first and fallback to the Employee Service.
- **Asynchronous Notifications:** Onboarding emails are triggered by publishing domain events to RabbitMQ, which are consumed by `service-worker` (Notification Service).

## UX & Interaction Patterns

- **Data Tables:** The Employee Directory table must support pagination, search (by name/email), and sorting.
- **Empty States:** The directory requires an empty state reading "No employees added yet. Add an employee to get started." accompanied by an illustration/icon.
- **Modals/Drawers:** Add/Edit employee forms must appear in a modal or slide-out drawer with a pronounced shadow to maintain context on the directory list.
- **Destructive Actions:** Deleting an employee requires a reassurance confirmation dialog.
- **Feedback:** Use UI toast notifications (MUI Snackbars) to confirm successful saves (e.g., "Employee saved successfully").
