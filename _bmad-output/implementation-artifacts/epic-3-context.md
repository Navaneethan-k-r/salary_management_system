# Epic 3 Context: Salary Structure Configuration

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Provide HR the ability to configure custom salary components so the system can automatically compute accurate net payouts.

## Stories

- Story 3.1: Salary Component Definition
- Story 3.2: Net Payout Calculation Engine
- Story 3.3: INR Currency Standardization & Formatting

## Requirements & Constraints

- HR can configure custom salary structures by defining additive components (e.g., Basic, DA, HRA) and deductive components (e.g., PF).
- The system automatically calculates the net payout based on the defined components.
- Strict support for INR currency only. No localized tax rules engine; tax is handled entirely via manual deductive components defined by HR.

## Technical Decisions

- Architecture Paradigm: Event-Driven Microservices in a single Nx/Turborepo monorepo.
- Backend services connect to and query the same shared MySQL database schema. The Payroll Service (`service-payroll`) handles Salary Configuration.
- The React frontend (`frontend-web`) communicates directly with individual microservice public endpoints.
- Authentication relies on an opaque token (< 12 characters) serving as a key in a shared Redis cache.

## UX & Interaction Patterns

- **Forms**: Use modals or slide-out drawers for adding/editing Salary Components to maintain context without navigating away from the list at `/admin/salary-config`.
- **Currency formatting**: Always format as `₹ XX,XXX.XX` or `INR XX,XXX.XX` and align strictly to the right in data tables.
- **Confirmation**: Destructive actions (deleting a salary component) require a confirmation dialog (e.g., "Are you sure you want to delete this salary component? This will affect net payouts.").
- **Feedback**: Use MUI Snackbars (toast notifications) for success/error feedback.
