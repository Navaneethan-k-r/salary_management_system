# Epic 2: Employee Lifecycle & Portal Onboarding

Enable HR to securely manage the employee directory, and allow employees to activate their accounts and access their self-service portal.

## Story 2.1: Employee Directory List & Empty State

As an HR Administrator,
I want to view the employee directory at `/admin/employees` with pagination, search, and sorting,
So that I can easily find and manage employee records.

**Acceptance Criteria:**

**Given** I navigate to the Employee Directory
**When** no employees exist in the database
**Then** I see an empty state reading "No employees added yet. Add an employee to get started." with an illustration
**And** when employees exist, I see a data table supporting search by name/email and pagination.

## Story 2.2: Add & Edit Employee Records

As an HR Administrator,
I want to add and edit employee records (email, mobile, salary package) using a modal or slide-out drawer,
So that I can manage staff while maintaining my context on the directory list (and respecting the rule of no open employee signups).

**Acceptance Criteria:**

**Given** I am on the Employee Directory
**When** I click "Add Employee" or "Edit"
**Then** a modal or drawer opens containing the employee form
**And** upon saving, the list updates via a UI toast notification ("Employee saved successfully").

## Story 2.3: Delete Employee Confirmation

As an HR Administrator,
I want to be prompted with a confirmation dialog before deleting an employee record,
So that I do not accidentally remove active staff.

**Acceptance Criteria:**

**Given** I click "Delete" on an employee record
**When** the action is triggered
**Then** a reassurance confirmation dialog appears
**And** only upon explicit confirmation is the employee record deleted from the MySQL database.

## Story 2.4: First-Time Employee Onboarding Notification

As a new Employee,
I want to receive a password setup email when HR creates my account,
So that I am securely invited to the platform.

**Acceptance Criteria:**

**Given** HR adds my record to the system
**When** the record is saved
**Then** an event is published to RabbitMQ
**And** the Notification Service consumes it to send a "Welcome to ACME" email containing a magic link.

## Story 2.5: Employee Password Setup

As a new Employee,
I want to set and confirm my password via the `/setup-password` page linked in my email,
So that I can establish my credentials securely.

**Acceptance Criteria:**

**Given** I click the magic link in my onboarding email
**When** I am routed to `/setup-password?token=...`
**Then** I can enter and confirm a new password
**And** upon successful submission, I am automatically authenticated and redirected to `/employee/dashboard`.

## Story 2.6: Employee Portal Login

As an Employee,
I want to log in using my standard credentials at `/login`,
So that I can access my dashboard and view my current salary package.

**Acceptance Criteria:**

**Given** I have a registered account and password
**When** I enter my credentials at `/login`
**Then** I am authenticated via Redis session token
**And** I am directed to `/employee/dashboard` to view my current salary package.
