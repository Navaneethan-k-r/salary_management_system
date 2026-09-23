---
id: SPEC-salary-management-system
companions: ['../../planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md']
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Salary Management System

## Why

Currently, ACME org’s HR team manages salary data for 10,000 employees across multiple countries entirely via Excel spreadsheets, which is tedious and error-prone. This system replaces manual spreadsheet management with a web application, allowing HR to efficiently manage salary data, configure payout structures, and quickly answer organizational questions about how people are paid. 

## Capabilities

- **CAP-1: System Setup**
  - **intent:** HR can configure the initial organization profile to manage their employees.
  - **success:** HR successfully sets up the organization and accesses the administrative dashboard.

- **CAP-2: Employee Management**
  - **intent:** HR can add, edit, and delete employee records (including email, password, mobile, and salary package).
  - **success:** The total employee count updates dynamically, and employee data is correctly persisted and retrieved.

- **CAP-3: Salary Configuration**
  - **intent:** HR can configure custom salary structures by defining additive components (Basic, DA, HRA) and deductive components (PF).
  - **success:** The system correctly calculates the net payout based on the defined components.

- **CAP-4: Salary Notifications**
  - **intent:** HR can trigger "salary credited" notification emails to specific employees or the entire organization.
  - **success:** Notification emails are successfully dispatched to the selected employees' inboxes.

- **CAP-5: Employee Access**
  - **intent:** Employees can log in to the employee portal (`/login`) without needing to sign up themselves. First-time logins without a set password are automatically redirected to the password setup page.
  - **success:** New users successfully receive a password setup email, can set up their password when redirected, and authenticate into their portal.

- **CAP-6: Payslip Viewing**
  - **intent:** Employees can access and view their historical monthly payslips.
  - **success:** The system accurately renders the user's historical payslips with correct component breakdowns.

- **CAP-7: Payslip Generation**
  - **intent:** HR manually generates payslips for employees by entering their leave counts, or bulk generates for the entire organization (which assumes 0 leaves/no loss of pay).
  - **success:** Payslips are generated accurately using the latest salary configuration and leave count data, and become available for viewing.

## Constraints

- **Backend:** Node.js, TypeScript, NestJS, RabbitMQ, Redis, MySQL.
- **Frontend:** React.js, TypeScript, Redux & Redux Toolkit.
- **Currency & Taxation:** The system strictly supports INR currency only. There is no built-in localized tax rules engine; tax is handled entirely via HR-configured manual deductive components.

## Non-goals

- Not an open signup platform for employees (only HR can onboard employees).
- Not a full-suite HR Information System (HRIS); the scope is strictly limited to salary and employee access management.

## Success signal

The ACME HR team successfully migrates 10,000 employees from Excel to the new platform, processes a payroll cycle using the configured salary components, and employees successfully view their generated payslips.

## Assumptions

- HR manages the organization profile directly.
