---
title: 'Story 3.2: Net Payout Calculation Engine'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ['c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** To accurately pay employees and generate payslips, the system must compute a final net payout based on an employee's salary package and the organization's globally configured additive and deductive salary components. Currently, there is no centralized logic to perform this computation.

**Approach:** Build the Net Payout Calculation Engine within the `service-payroll` backend application. This engine will act as a core utility service that takes an employee's salary details, fetches the active salary components, applies the rules (resolving percentages of Basic vs. fixed amounts), and produces a detailed breakdown of earnings, deductions, and the final net payout.

## Boundaries & Constraints

**Always:** 
- Ensure the calculation logic is decoupled from HTTP controllers so it can be reused by bulk generation processes (Epic 4) or API endpoints.
- Handle currency calculations safely (e.g., using a decimal library or integers for cents) to prevent floating-point rounding errors.
- Support both additive and deductive components, and resolve percentage-based components accurately.

**Never:** 
- Do not hardcode specific tax brackets or localized rules; rely strictly on the deductive components configured by HR in the database.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Calculation with percentages | Basic is 50,000; PF is 10% of Basic (deductive) | Basic=50,000, PF=-5,000, Net=45,000 (plus any other components) | N/A |
| Calculation with fixed amounts | Bonus is fixed 5,000 (additive) | Adds 5,000 to the total earnings | N/A |
| Invalid configuration | A percentage component results in a negative total net payout | Calculation fails gracefully | Throw "Invalid salary structure: Net payout cannot be negative" |

**Decisions:**
- Frontend Preview: Backend only. The engine will be a backend service method only, UI integration will wait for Epic 4.
- Basic Component Definition: Manually entered per employee. The employee record directly stores the absolute 'Basic' amount, from which other percentage-based components will be calculated.

</frozen-after-approval>

## Code Map

- `apps/service-payroll/src/salary-calculation/` -- New module for calculation logic.
- `apps/service-payroll/src/salary-calculation/salary-calculation.service.ts` -- Core engine that computes earnings, deductions, and net payout.
- `apps/service-payroll/src/salary-calculation/salary-calculation.service.spec.ts` -- Unit tests verifying math accuracy and edge cases.

## Tasks & Acceptance

**Execution:**
- [ ] `apps/service-payroll/src/salary-calculation/salary-calculation.service.ts` -- Implement calculation logic -- Resolves percentage/fixed components into absolute values and computes net payout.
- [ ] `apps/service-payroll/src/salary-calculation/salary-calculation.service.spec.ts` -- Write unit tests -- Ensure floating point safety and correct deductive math.

**Acceptance Criteria:**
- Given an employee's salary package and a set of active components, when the calculation engine runs, then it returns a breakdown of all additive amounts, deductive amounts, and the correct net total.
- Given a component defined as a percentage of Basic, when calculated, then its value is derived correctly from the computed Basic amount.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx nx test service-payroll` -- expected: All unit tests for the calculation engine pass.
