# Epic 4 Context: Payslip Processing & Employee Viewing

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Enable HR to generate payslips (manually or in bulk) and dispatch notifications, while providing employees a portal to view their detailed pay history. This epic eliminates manual spreadsheet calculations and provides transparency to employees.

## Stories

- Story 4.1: Manual Payslip Generation
- Story 4.2: Bulk Payslip Generation Engine
- Story 4.3: Bulk Salary Credited Notifications
- Story 4.4: Employee Payslip Viewer

## Requirements & Constraints

- **Bulk Constraints:** Bulk generation assumes 0 leaves (no loss of pay) for all active employees. Must complete processing for 10,000 employees in under 5 minutes.
- **Manual Adjustments:** Manual payslip generation requires HR to input specific leave counts for an individual employee.
- **Format Constraint:** Payslips are strictly web-based views with detailed component breakdowns. PDF downloads are explicitly excluded.
- **Currency:** All monetary values must be strictly formatted in INR (`₹ XX,XXX.XX`) and right-aligned in data tables.

## Technical Decisions

- **Domain Boundaries:** The `service-payroll` (NestJS) handles all payslip generation, calculating net payouts by directly querying the shared MySQL database for employee data.
- **Asynchronous Processing:** `service-payroll` handles batch generation of payslips in the background to prevent blocking the UI.
- **Event-Driven Notifications:** Once payslips are generated, `service-payroll` publishes `payslip.generated` events to RabbitMQ. The `service-worker` (Notification Service) consumes these events to dispatch standardized "salary credited" emails asynchronously.

## UX & Interaction Patterns

- **Bulk Action Feedback:** Use a persistent bottom snackbar or banner (e.g., "Generating payslips... 45% complete") during bulk generation. Provide a global toast notification upon completion.
- **Confirmation dialogs:** Required for wide-impact actions like "Bulk Generate Payslips".
- **Loading States:** Use MUI Skeleton loaders matching the shape of the data table or card while fetching historical payslip lists.
- **Empty States:** Display "No payslips generated for you yet" in the employee portal if no history exists.
