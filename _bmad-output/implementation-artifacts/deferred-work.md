# Deferred Work

- source_spec: none
  summary: Story 1.2: HR Admin Authentication & Base Layout
  evidence: Split during initial Epic 1 multi-goal triage to focus on Story 1.1 foundational substrate first.

- source_spec: none
  summary: Story 1.3: Organization Profile Setup
  evidence: Split during initial Epic 1 multi-goal triage to follow foundational workspace and auth.

- source_spec: none
  summary: Story 1.4: HR Dashboard Overview
  evidence: Split during initial Epic 1 multi-goal triage to follow core layout and organization profile setup.

- source_spec: \_bmad-output/implementation-artifacts/spec-2-2-add-edit-employee-records.md\`n  summary: Add a Redux employeeSlice unit test asserting that createEmployee.fulfilled prepends the new employee to state.data
  evidence: The modal spec mocks the service; the thunk's state mutation (prepending to data array and incrementing total) is not directly asserted anywhere. RTK is reliable OSS so the risk is low, but the coverage gap is real.
