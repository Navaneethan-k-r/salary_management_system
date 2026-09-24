import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteEmployeeDialog from './DeleteEmployeeDialog';
import { EmployeeListDto } from '@salary-mgmt/shared-types';

const mockEmployee: EmployeeListDto = {
  id: 'emp-1',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  mobile: '+91 9876543210',
  status: 'pending_onboarding',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('DeleteEmployeeDialog', () => {
  it('calls onCancel when Cancel is clicked without triggering onConfirm (Delete Cancelled)', () => {
    // I/O Matrix: Delete Cancelled — user clicks Cancel → dialog closes, no deletion
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteEmployeeDialog
        open={true}
        employee={mockEmployee}
        deleting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when Delete is clicked (Delete Confirmed)', () => {
    // I/O Matrix: Delete Confirmed — user clicks Delete → onConfirm is invoked
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <DeleteEmployeeDialog
        open={true}
        employee={mockEmployee}
        deleting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows employee name in the dialog content', () => {
    render(
      <DeleteEmployeeDialog
        open={true}
        employee={mockEmployee}
        deleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
  });

  it('disables buttons and shows spinner while deleting', () => {
    render(
      <DeleteEmployeeDialog
        open={true}
        employee={mockEmployee}
        deleting={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByText(/deleting/i)).toBeInTheDocument();
  });
});
