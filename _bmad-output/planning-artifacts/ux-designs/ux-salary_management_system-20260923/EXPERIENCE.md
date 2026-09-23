---
status: final
updated: 2026-09-23
---

# Salary Management System: Experience

## Foundation
- **Platform:** Web application (Desktop-first for HR, Responsive for Employees).
- **UI System:** Material UI (MUI). All visual tokens in `DESIGN.md` extend or override MUI defaults.

## Information Architecture

### HR Administrator (Admin Portal)
- **`/admin/dashboard`**: High-level overview (total employees, recent payroll runs).
- **`/admin/employees`**: Employee Directory (Add, Edit, Delete, View).
- **`/admin/salary-config`**: Salary structure definitions (Add/Edit Additive and Deductive components).
- **`/admin/payslips`**: Payslip operations (Manual generation, Bulk generation, Send Notifications).

### Employee (Self-Service Portal)
- **`/login`**: Standard authentication entry.
- **`/setup-password`**: Onboarding for first-time login via email link.
- **`/employee/dashboard`**: View current salary package.
- **`/employee/payslips`**: Historical list of monthly payslips with detailed view (no PDF download, strictly web view).

## Voice and Tone
- **Direct & Professional:** e.g., "Generate Payslips" rather than "Let's make some payslips!".
- **Reassuring:** When dealing with money, errors are stressful. Use clear, calm language for destructive actions (e.g., "Are you sure you want to delete this salary component? This will affect net payouts.").
- **Currency:** Always format as `₹ XX,XXX.XX` or `INR XX,XXX.XX`.

## Component Patterns (Behavioral)
- **Bulk Actions:** For generating 10,000+ payslips, rely on asynchronous feedback. Use a persistent bottom snackbar or a banner indicating "Generating payslips... (45% complete)".
- **Forms:** Use modals or slide-out drawers for adding/editing Employees or Salary Components to maintain context without navigating away from the list.
- **Data Tables:** Must support pagination, search (by name/email), and sorting for the Employee Directory.

## State Patterns
- **Empty States:** 
  - Employee Directory: "No employees added yet. Add an employee to get started." (Accompanied by an illustration/icon).
  - Employee Payslips: "No payslips generated for you yet."
- **Loading:** Use MUI Skeleton loaders matching the shape of the data table or card being fetched, avoiding abrupt layout shifts.

## Interaction Primitives
- **Confirmation:** Destructive actions (deleting an employee or salary component) and wide-impact actions (Bulk Generate Payslips) require a confirmation dialog.
- **Feedback:** Use MUI Snackbars (toast notifications) for success/error feedback (e.g., "Payslip generated successfully").

## Accessibility Floor
- **Keyboard Navigation:** Fully supported out-of-the-box via MUI. Focus traps in modals.
- **Contrast:** `DESIGN.md` colors ensure WCAG AA contrast for text.
- **Data Clarity:** Screen readers must read out table headers before cell data for salary tables.

## Key Flows

### 1. HR Bulk Generation Flow
**Protagonist:** Sarah, HR Admin.
1. Sarah navigates to `/admin/payslips`.
2. She clicks the primary action "Bulk Generate Payslips".
3. A confirmation modal appears, noting this will process all active employees assuming 0 leaves.
4. She confirms. The modal closes, and a progress indicator appears on the page. 
5. Because there are 10,000 employees, the system batches the request. Sarah can navigate elsewhere; a global toast will notify her when the batch completes.
6. She returns to the payslips tab and clicks "Send Notifications" to alert the company.

### 2. Employee First-Time Login Flow
**Protagonist:** John, New Employee.
1. John receives an automated email: "Welcome to ACME. Setup your Salary Portal account."
2. He clicks the magic link, which routes him to `/setup-password?token=abc`.
3. He enters a new password and confirms it.
4. Upon submission, he is redirected directly to `/employee/dashboard` where he sees his current salary structure and any available payslips.
