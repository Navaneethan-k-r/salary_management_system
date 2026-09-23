# Epic 3: Salary Structure Configuration

Provide HR the ability to configure custom salary components so the system can automatically compute accurate net payouts.

## Story 3.1: Salary Component Definition

As an HR Administrator,
I want to add, edit, and delete additive (e.g., Basic, HRA) and deductive (e.g., PF) salary components at `/admin/salary-config` using a contextual modal or drawer,
So that I can establish the building blocks of our payroll structure.

**Acceptance Criteria:**

**Given** I am on the Salary Configuration page
**When** I add a new component
**Then** I can specify its name, type (additive or deductive), and default value
**And** deleting a component triggers a reassuring confirmation dialog ("Are you sure... This will affect net payouts.").

## Story 3.2: Net Payout Calculation Engine

As an HR Administrator (System Capability),
I want the system to automatically compute the net payout by summing additive components and subtracting deductive components,
So that manual spreadsheet calculations are eliminated.

**Acceptance Criteria:**

**Given** an employee is assigned specific salary components
**When** their salary package is evaluated or a payslip is being prepared
**Then** the backend Payroll Service calculates the Net Payout exactly as `Sum(Additive) - Sum(Deductive)`.

## Story 3.3: INR Currency Standardization & Formatting

As an HR Administrator,
I want all monetary values to be strictly validated and formatted in INR (`₹ XX,XXX.XX`),
So that financial data is standardized and highly readable.

**Acceptance Criteria:**

**Given** salary data is displayed in data tables or forms
**When** the UI renders the value
**Then** it is strictly formatted as INR (e.g., `₹ 50,000.00`)
**And** the values are right-aligned in all tabular views to prevent misreading numbers.
