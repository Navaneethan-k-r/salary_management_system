---
stepsCompleted: [1, 2, 3]
inputDocuments: ["c:\\Users\\navan\\projects\\salary_management_system\\_bmad-output\\planning-artifacts\\prds\\prd-salary_management_system-20260923\\prd.md", "c:\\Users\\navan\\projects\\salary_management_system\\_bmad-output\\planning-artifacts\\architecture\\architecture-salary_management_system-20260923\\ARCHITECTURE-SPINE.md", "c:\\Users\\navan\\projects\\salary_management_system\\_bmad-output\\planning-artifacts\\ux-designs\\ux-salary_management_system-20260923\\DESIGN.md", "c:\\Users\\navan\\projects\\salary_management_system\\_bmad-output\\planning-artifacts\\ux-designs\\ux-salary_management_system-20260923\\EXPERIENCE.md"]
---

# Salary Management System - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Salary Management System, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1.1: HR can configure the initial organization profile to manage their employees.
FR-1.2: HR successfully accesses the administrative dashboard upon setup.
FR-2.1: HR can add, edit, and delete employee records (fields include email, password, mobile, and salary package).
FR-2.2: There is no open signup for employees. All employee onboarding is strictly HR-driven.
FR-3.1: HR can configure custom salary structures by defining additive components (e.g., Basic, DA, HRA) and deductive components (e.g., PF).
FR-3.2: The system automatically calculates the net payout based on the defined components.
FR-3.3: Strict support for INR currency only. No localized tax rules engine; tax is handled entirely via manual deductive components defined by HR.
FR-4.1: HR can manually generate a payslip for an employee by inputting their leave counts.
FR-4.2: HR can bulk generate payslips for the entire organization (assumes 0 leaves / no loss of pay).
FR-4.3: HR can trigger "salary credited" notification emails to specific employees or the entire organization using a standardized email template.
FR-5.1: Employees log in to the employee portal (e.g., `/login`).
FR-5.2: First-time logins without a set password receive a password setup email and are redirected to a password setup page before authenticating into the portal.
FR-5.3: Employees can access and view historical monthly payslips directly in the web portal, displaying accurate component breakdowns. (No downloadable PDFs).

### NonFunctional Requirements

NFR-1: Backend Stack: Node.js, TypeScript, NestJS, RabbitMQ (for bulk generation/emails), Redis, MySQL.
NFR-2: Frontend Stack: React.js, TypeScript, Redux & Redux Toolkit.
NFR-3: Performance: Bulk operations (10,000 payslips) must complete in under 5 minutes.

### Additional Requirements

- Architecture Paradigm: Event-Driven Microservices in a single Nx/Turborepo monorepo.
- Database: Shared MySQL database schema across backend services.
- Networking: Direct frontend HTTP calls to microservices (no API gateway).
- Authentication: Stateful Session Authentication using opaque tokens backed by Redis.
- Eventing: Event-driven notifications via RabbitMQ for asynchronous email dispatch.
- Omissions: Rate limiting is intentionally excluded.

### UX Design Requirements

UX-DR1 (Theme & Typography): Implement custom Material UI theme with specific colors (primary `#1976d2`, background `#f4f6f8`, surface `#ffffff`) and typography (Inter/Roboto).
UX-DR2 (Layout & Spacing): Apply base spacing of `8px`, `24px` page container padding, and `32px` section gaps.
UX-DR3 (Elevation & Shapes): Implement a flat elevation style with subtle borders (`1px solid #e5e7eb`) and soft rounding for cards (`12px`) and buttons (`6px`). Pronounced shadows for modals/drawers.
UX-DR4 (Components): Implement specific styles for App Bar (elevation 0), Sidebar (`260px` fixed width), and Data Tables (header bg `#f9fafb`, row hover `#f3f4f6`, right-aligned currency, pagination, search, sort).
UX-DR5 (Interaction & Feedback): Implement specific interaction patterns: Modals/Drawers for forms, persistent snackbars/banners for bulk asynchronous feedback, confirmation dialogs for destructive/bulk actions, and MUI skeleton loaders for loading states.
UX-DR6 (Formatting): Ensure currency is always formatted as `₹ XX,XXX.XX` or `INR XX,XXX.XX` and aligned to the right in data tables. Use Direct & Professional tone.
UX-DR7 (Empty States): Implement empty states with illustrations for Employee Directory and Employee Payslips.
UX-DR8 (Accessibility): Fully support keyboard navigation with focus traps in modals, ensure WCAG AA contrast compliance, and ensure screen readers read table headers before cell data.

### FR Coverage Map

FR-1.1: Epic 1 - HR configures initial organization profile
FR-1.2: Epic 1 - HR accesses administrative dashboard
FR-2.1: Epic 2 - HR add, edit, delete employee records
FR-2.2: Epic 2 - No open signup, HR-driven onboarding
FR-3.1: Epic 3 - HR configure custom salary structures
FR-3.2: Epic 3 - System calculates net payout
FR-3.3: Epic 3 - Strict INR currency support
FR-4.1: Epic 4 - HR manual payslip generation
FR-4.2: Epic 4 - HR bulk payslip generation
FR-4.3: Epic 4 - HR trigger "salary credited" emails
FR-5.1: Epic 2 - Employees log in to employee portal
FR-5.2: Epic 2 - First-time password setup flow
FR-5.3: Epic 4 - Employees view historical monthly payslips

## Epic List

### Epic 1: HR Organization & Dashboard Initialization
Allow HR to set up the core organization profile and access the main admin dashboard, establishing the foundational environment.
**FRs covered:** FR-1.1, FR-1.2

### Epic 2: Employee Lifecycle & Portal Onboarding
Enable HR to securely manage the employee directory, and allow employees to activate their accounts and access their self-service portal.
**FRs covered:** FR-2.1, FR-2.2, FR-5.1, FR-5.2

### Epic 3: Salary Structure Configuration
Provide HR the ability to configure custom salary components so the system can automatically compute accurate net payouts.
**FRs covered:** FR-3.1, FR-3.2, FR-3.3

### Epic 4: Payslip Processing & Employee Viewing
Enable HR to generate payslips (manually or in bulk) and dispatch notifications, while providing employees a portal to view their detailed pay history.
**FRs covered:** FR-4.1, FR-4.2, FR-4.3, FR-5.3

## Epic 1: HR Organization & Dashboard Initialization

Allow HR to set up the organization profile and access the administration dashboard as a foundation for managing the company's payroll system.

### Story 1.1: Project Foundation & UI Theme Initialization

As an HR Administrator (and the development team),
I want the foundational Nx monorepo and Material UI theme established (colors, typography, spacing, elevation),
So that the system has a consistent, professional visual identity for all subsequent features.

**Acceptance Criteria:**

**Given** the project is initialized
**When** the application loads
**Then** the custom Material UI theme (Inter/Roboto, specific colors like `#1976d2`, flat elevation) is applied globally
**And** the shared Nx libraries for frontend and backend are established.

### Story 1.2: HR Admin Authentication & Base Layout

As an HR Administrator,
I want to authenticate into the system and see the main administrative layout (Sidebar, App Bar),
So that I can securely navigate between different HR management tools.

**Acceptance Criteria:**

**Given** I am an HR Administrator
**When** I provide valid credentials
**Then** I am authenticated via an opaque token stored in Redis
**And** I am directed to the admin portal with a fixed 260px sidebar and a top App Bar.

### Story 1.3: Organization Profile Setup

As an HR Administrator,
I want to configure the initial organization profile,
So that the system knows which organization's payroll is being managed.

**Acceptance Criteria:**

**Given** I am a logged-in HR Administrator
**When** I navigate to the initial setup screen
**Then** I can input and save the organization's core details
**And** the data is securely stored in the shared MySQL database.

### Story 1.4: HR Dashboard Overview

As an HR Administrator,
I want to view a high-level dashboard displaying total employees and recent payroll runs,
So that I have a quick summary of the organization's current state upon logging in.

**Acceptance Criteria:**

**Given** I am on the `/admin/dashboard` route
**When** the page loads
**Then** I see the total count of employees
**And** I see a summary of the most recent payroll runs.

## Epic 2: Employee Lifecycle & Portal Onboarding

Enable HR to securely manage the employee directory, and allow employees to activate their accounts and access their self-service portal.

### Story 2.1: Employee Directory List & Empty State

As an HR Administrator,
I want to view the employee directory at `/admin/employees` with pagination, search, and sorting,
So that I can easily find and manage employee records.

**Acceptance Criteria:**

**Given** I navigate to the Employee Directory
**When** no employees exist in the database
**Then** I see an empty state reading "No employees added yet. Add an employee to get started." with an illustration
**And** when employees exist, I see a data table supporting search by name/email and pagination.

### Story 2.2: Add & Edit Employee Records

As an HR Administrator,
I want to add and edit employee records (email, mobile, salary package) using a modal or slide-out drawer,
So that I can manage staff while maintaining my context on the directory list (and respecting the rule of no open employee signups).

**Acceptance Criteria:**

**Given** I am on the Employee Directory
**When** I click "Add Employee" or "Edit"
**Then** a modal or drawer opens containing the employee form
**And** upon saving, the list updates via a UI toast notification ("Employee saved successfully").

### Story 2.3: Delete Employee Confirmation

As an HR Administrator,
I want to be prompted with a confirmation dialog before deleting an employee record,
So that I do not accidentally remove active staff.

**Acceptance Criteria:**

**Given** I click "Delete" on an employee record
**When** the action is triggered
**Then** a reassurance confirmation dialog appears
**And** only upon explicit confirmation is the employee record deleted from the MySQL database.

### Story 2.4: First-Time Employee Onboarding Notification

As a new Employee,
I want to receive a password setup email when HR creates my account,
So that I am securely invited to the platform.

**Acceptance Criteria:**

**Given** HR adds my record to the system
**When** the record is saved
**Then** an event is published to RabbitMQ
**And** the Notification Service consumes it to send a "Welcome to ACME" email containing a magic link.

### Story 2.5: Employee Password Setup

As a new Employee,
I want to set and confirm my password via the `/setup-password` page linked in my email,
So that I can establish my credentials securely.

**Acceptance Criteria:**

**Given** I click the magic link in my onboarding email
**When** I am routed to `/setup-password?token=...`
**Then** I can enter and confirm a new password
**And** upon successful submission, I am automatically authenticated and redirected to `/employee/dashboard`.

### Story 2.6: Employee Portal Login

As an Employee,
I want to log in using my standard credentials at `/login`,
So that I can access my dashboard and view my current salary package.

**Acceptance Criteria:**

**Given** I have a registered account and password
**When** I enter my credentials at `/login`
**Then** I am authenticated via Redis session token
**And** I am directed to `/employee/dashboard` to view my current salary package.

## Epic 3: Salary Structure Configuration

Provide HR the ability to configure custom salary components so the system can automatically compute accurate net payouts.

### Story 3.1: Salary Component Definition

As an HR Administrator,
I want to add, edit, and delete additive (e.g., Basic, HRA) and deductive (e.g., PF) salary components at `/admin/salary-config` using a contextual modal or drawer,
So that I can establish the building blocks of our payroll structure.

**Acceptance Criteria:**

**Given** I am on the Salary Configuration page
**When** I add a new component
**Then** I can specify its name, type (additive or deductive), and default value
**And** deleting a component triggers a reassuring confirmation dialog ("Are you sure... This will affect net payouts.").

### Story 3.2: Net Payout Calculation Engine

As an HR Administrator (System Capability),
I want the system to automatically compute the net payout by summing additive components and subtracting deductive components,
So that manual spreadsheet calculations are eliminated.

**Acceptance Criteria:**

**Given** an employee is assigned specific salary components
**When** their salary package is evaluated or a payslip is being prepared
**Then** the backend Payroll Service calculates the Net Payout exactly as `Sum(Additive) - Sum(Deductive)`.

### Story 3.3: INR Currency Standardization & Formatting

As an HR Administrator,
I want all monetary values to be strictly validated and formatted in INR (`₹ XX,XXX.XX`),
So that financial data is standardized and highly readable.

**Acceptance Criteria:**

**Given** salary data is displayed in data tables or forms
**When** the UI renders the value
**Then** it is strictly formatted as INR (e.g., `₹ 50,000.00`)
**And** the values are right-aligned in all tabular views to prevent misreading numbers.

## Epic 4: Payslip Processing & Employee Viewing

Enable HR to generate payslips (manually or in bulk) and dispatch notifications, while providing employees a portal to view their detailed pay history.

### Story 4.1: Manual Payslip Generation

As an HR Administrator,
I want to manually generate a payslip for a specific employee by inputting their leave counts at `/admin/payslips`,
So that I can process exceptions, corrections, or individual off-cycle payrolls.

**Acceptance Criteria:**

**Given** I select a specific employee on the payslip generation screen
**When** I input their leave count and click "Generate"
**Then** the Payroll Service calculates the pro-rated net payout and creates a payslip record
**And** I see a success toast notification.

### Story 4.2: Bulk Payslip Generation Engine

As an HR Administrator,
I want to bulk generate payslips for all active employees with one click (assuming 0 leaves),
So that I can run the standard monthly payroll efficiently (under 5 minutes for 10,000 employees).

**Acceptance Criteria:**

**Given** I click "Bulk Generate Payslips" and pass the confirmation dialog
**When** the batch process begins
**Then** I see a persistent asynchronous progress banner (e.g., "Generating payslips... 45% complete")
**And** I can navigate away while the Payroll Service processes the batch in the background, receiving a global toast when complete.

### Story 4.3: Bulk Salary Credited Notifications

As an HR Administrator,
I want to trigger "salary credited" notification emails to the entire organization,
So that employees are promptly informed when payroll is finalized.

**Acceptance Criteria:**

**Given** payslips have been generated for the month
**When** I click "Send Notifications"
**Then** the Payroll Service publishes `payslip.generated` events to RabbitMQ
**And** the background Notification Service consumes these events to dispatch standardized emails asynchronously without blocking the UI.

### Story 4.4: Employee Payslip Viewer

As an Employee,
I want to view a historical list of my monthly payslips and their detailed component breakdowns directly in the web portal,
So that I can understand my pay without needing to download PDFs.

**Acceptance Criteria:**

**Given** I navigate to `/employee/payslips`
**When** I have no payslips, **Then** I see the "No payslips generated for you yet" empty state
**When** I do have payslips, **Then** I see a list of them loading via Skeleton loaders
**And** clicking one reveals the exact additive/deductive component breakdown and the Net Payout (strictly right-aligned in INR format).
