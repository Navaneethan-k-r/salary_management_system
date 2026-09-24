/**
 * Re-exports event contracts from shared-types to keep service-employee's
 * internal imports clean and consistent.
 */
export { type EmployeeCreatedEvent, EMPLOYEE_CREATED_QUEUE } from '@salary-mgmt/shared-types';
