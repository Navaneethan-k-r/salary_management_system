---
title: 'Story 3.3: INR Currency Standardization & Formatting'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context: ['c:/Users/navan/projects/salary_management_system/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The system requires all monetary values to be displayed consistently as INR (Indian Rupee). Without a standardized formatting utility, different developers might implement custom formatting, leading to inconsistent UI presentation (e.g., missing commas, incorrect decimal places, varying symbols).

**Approach:** Introduce a centralized utility function in the React frontend to handle all INR currency formatting. This utility will leverage `Intl.NumberFormat` with the `en-IN` locale to ensure correct Indian numbering system formatting (e.g., placing commas correctly for lakhs and crores) and strict right-alignment rules for data tables.

## Boundaries & Constraints

**Always:** 
- Format numbers using the Indian numbering system (comma separators at thousands, lakhs, crores).
- Ensure exactly two decimal places for all currency values (e.g., `₹ 10,000.00`).
- Ensure UI components or documentation specify strict right-alignment for table cells containing currency.

**Never:** 
- Do not support formatting for any currency other than INR.
- Do not attempt currency conversion; the system assumes all stored values are in INR.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Standard value | `50000` | `₹ 50,000.00` | N/A |
| Value with decimals | `1234567.89` | `₹ 12,34,567.89` (Note the comma after 12) | N/A |
| Zero value | `0` | `₹ 0.00` | N/A |
| Null or undefined | `null` or `undefined` | Fallback or `₹ 0.00` based on chosen approach | Return `₹ 0.00` |

**Decisions:**
- SYMBOL_CHOICE: Use the Symbol `₹` (e.g., ₹ 50,000.00) as the default format for the application UI.

</frozen-after-approval>

## Code Map

- `apps/frontend-web/src/utils/currency.ts` -- Centralized utility function (`formatCurrencyINR`) for formatting numbers as INR currency.
- `apps/frontend-web/src/utils/currency.spec.ts` -- Unit tests validating the formatting logic against various inputs (large numbers, decimals, edge cases).

## Tasks & Acceptance

**Execution:**
- [ ] `apps/frontend-web/src/utils/currency.ts` -- Create the formatting utility -- Ensures all monetary values use the `en-IN` locale and INR currency settings.
- [ ] `apps/frontend-web/src/utils/currency.spec.ts` -- Write unit tests -- Validates the formatting logic across the I/O edge case matrix.

**Acceptance Criteria:**
- Given a numerical monetary value, when passed to the formatting utility, then it returns a string correctly formatted in the Indian numbering system with the INR symbol and two decimal places.
- Given a table displaying monetary values, when rendered, then the values are strictly right-aligned (to be verified in future stories implementing tables).

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx nx test frontend-web` -- expected: The new currency utility tests pass successfully.
