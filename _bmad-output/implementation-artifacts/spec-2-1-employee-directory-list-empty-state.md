---
title: 'Story 2.1: Employee Directory List & Empty State'
type: 'feature'
created: '2026-09-23'
status: 'ready-for-dev'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '_bmad-output/implementation-artifacts/epic-2-context.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-salary_management_system-20260923/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-salary_management_system-20260923/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** HR administrators currently have no way to view the list of employees or verify the current state of the organization's workforce within the system.

**Approach:** Implement the Employee Directory list view at `/admin/employees` consisting of a data table with pagination, search (by name/email), and sorting capabilities. When no employees exist, an empty state with an illustration should be displayed to guide the user.

## Boundaries & Constraints

**Always:**
- Use the shared MySQL database to store and retrieve employee records (AD-1).
- Protect backend endpoints with session token verification checking the Redis session store (AD-3).
- Implement server-side pagination, search, and sorting to handle the scale of 10,000+ employees efficiently.
- Enforce DESIGN.md aesthetics: 24px container padding, `#f9fafb` table header background, flat elevation, and Inter/Roboto typography.
- Use MUI Skeleton loaders matching the table shape while fetching data.

**Never:**
- Do not implement the "Add Employee" or "Edit Employee" modal functionality in this story (deferred to Story 2.2).
- Do not expose employee passwords or sensitive tokens in the API response for the directory list.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty State | No employees exist in the database | Renders an illustration and text: "No employees added yet. Add an employee to get started." | N/A |
| Populated List | Employees exist in the database | Renders MUI Data Table with Name, Email, and Mobile columns | N/A |
| Pagination | User clicks next page | Fetches and renders the next page of employees via backend pagination | Disables "Next" button if no more pages |
| Search | User types "john" in the search bar | Debounces input and fetches employees whose name or email matches "john" | Shows "No results found" if 0 matches |

**Design Decisions:**
- The Employee Directory data table will display the following columns: Name, Email, Mobile. (Keeps the table clean and readable).

</frozen-after-approval>



## Code Map

- `libs/shared-types/src/index.ts` -- Define `EmployeeListDto` and `PaginatedResponseDto` interfaces.
- `apps/service-employee/src/database/schema.sql` -- Define MySQL table schema for `employees`.
- `apps/service-employee/src/employee/employee.controller.ts` -- REST API controller for `GET /api/employees` supporting pagination, search, and sort query parameters.
- `apps/service-employee/src/employee/employee.service.ts` -- Business logic and database access for querying employees.
- `apps/frontend-web/src/services/employeeService.ts` -- Client API service for fetching employees.
- `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Redux Toolkit slice managing employee list state, pagination info, and search queries.
- `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- UI for the directory, including MUI data table, search input, pagination controls, and empty state component.
- `apps/frontend-web/src/layouts/AdminLayout.tsx` -- Update navigation menu to ensure `/admin/employees` is accessible.
- `apps/frontend-web/src/app/App.tsx` -- Register `/admin/employees` route.

## Tasks & Acceptance

**Execution:**
- [ ] `libs/shared-types/src/index.ts` -- Add `EmployeeListDto` and `PaginatedResponseDto` interfaces -- Formalizes API contract.
- [ ] `apps/service-employee/src/database/schema.sql` -- Create `employees` table definition -- Persists employee data.
- [ ] `apps/service-employee/src/employee/employee.service.ts` & `apps/service-employee/src/employee/employee.controller.ts` -- Implement endpoint `GET /api/employees` -- Serves paginated, searchable employee list.
- [ ] `apps/frontend-web/src/services/employeeService.ts` -- Implement client service for `GET /api/employees` -- Connects frontend to backend.
- [ ] `apps/frontend-web/src/store/slices/employeeSlice.ts` -- Implement Redux slice for employee list -- Manages local state for the directory.
- [ ] `apps/frontend-web/src/pages/EmployeeDirectoryPage.tsx` -- Build directory page with empty state, data table, search, and pagination -- Delivers the UI required for HR to view employees.
- [ ] `apps/frontend-web/src/layouts/AdminLayout.tsx` & `apps/frontend-web/src/app/App.tsx` -- Add navigation link and route -- Integrates view into admin shell.

**Acceptance Criteria:**
- Given I navigate to the Employee Directory, when no employees exist in the database, then I see an empty state reading "No employees added yet. Add an employee to get started." with an illustration.
- Given employees exist in the database, when I access the Employee Directory, then I see a data table displaying employee records with support for server-side pagination.
- Given I am on the Employee Directory, when I use the search bar, then the data table updates to show only employees matching the search string by name or email.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

- **Empty State**: Centered illustration with a prominent, professional message. Follows `DESIGN.md` spacing and typography.
- **Data Table**: Use `#f9fafb` for table header background. Rows should have a subtle hover effect (e.g., `#f3f4f6`).

## Verification

**Commands:**
- `npm test` -- expected: All unit tests in `frontend-web` and `service-employee` pass.
- `npm run build` -- expected: Monorepo builds cleanly without TypeScript errors.

**Manual checks (if no CLI):**
- Verify `/admin/employees` displays the empty state when the database is empty.
- Insert a mock record and verify the data table renders correctly.
- Verify search functionality successfully filters the mock record.
