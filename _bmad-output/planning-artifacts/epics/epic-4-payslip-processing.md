# Epic 4: Payslip Processing & Employee Viewing

Enable HR to generate payslips (manually or in bulk) and dispatch notifications, while providing employees a portal to view their detailed pay history.

## Story 4.1: Manual Payslip Generation

As an HR Administrator,
I want to manually generate a payslip for a specific employee by inputting their leave counts at `/admin/payslips`,
So that I can process exceptions, corrections, or individual off-cycle payrolls.

**Acceptance Criteria:**

**Given** I select a specific employee on the payslip generation screen
**When** I input their leave count and click "Generate"
**Then** the Payroll Service calculates the pro-rated net payout and creates a payslip record
**And** I see a success toast notification.

## Story 4.2: Bulk Payslip Generation Engine

As an HR Administrator,
I want to bulk generate payslips for all active employees with one click (assuming 0 leaves),
So that I can run the standard monthly payroll efficiently (under 5 minutes for 10,000 employees).

**Acceptance Criteria:**

**Given** I click "Bulk Generate Payslips" and pass the confirmation dialog
**When** the batch process begins
**Then** I see a persistent asynchronous progress banner (e.g., "Generating payslips... 45% complete")
**And** I can navigate away while the Payroll Service processes the batch in the background, receiving a global toast when complete.

## Story 4.3: Bulk Salary Credited Notifications

As an HR Administrator,
I want to trigger "salary credited" notification emails to the entire organization,
So that employees are promptly informed when payroll is finalized.

**Acceptance Criteria:**

**Given** payslips have been generated for the month
**When** I click "Send Notifications"
**Then** the Payroll Service publishes `payslip.generated` events to RabbitMQ
**And** the background Notification Service consumes these events to dispatch standardized emails asynchronously without blocking the UI.

## Story 4.4: Employee Payslip Viewer

As an Employee,
I want to view a historical list of my monthly payslips and their detailed component breakdowns directly in the web portal,
So that I can understand my pay without needing to download PDFs.

**Acceptance Criteria:**

**Given** I navigate to `/employee/payslips`
**When** I have no payslips, **Then** I see the "No payslips generated for you yet" empty state
**When** I do have payslips, **Then** I see a list of them loading via Skeleton loaders
**And** clicking one reveals the exact additive/deductive component breakdown and the Net Payout (strictly right-aligned in INR format).
