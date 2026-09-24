import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import employeeReducer from '../store/slices/employeeSlice';
import AddEditEmployeeModal from '../components/AddEditEmployeeModal';
import { employeeService } from '../services/employeeService';
import { EmployeeListDto } from '@salary-mgmt/shared-types';

// Mock employee service
vi.mock('../services/employeeService', () => ({
  employeeService: {
    getEmployees: vi.fn(),
    createEmployee: vi.fn(),
    updateEmployee: vi.fn(),
  },
}));

const makeStore = () =>
  configureStore({ reducer: { employee: employeeReducer } });

const renderModal = (
  open: boolean,
  employee: EmployeeListDto | null,
  onClose = vi.fn(),
  onSuccess = vi.fn(),
) => {
  const store = makeStore();
  render(
    <Provider store={store}>
      <AddEditEmployeeModal
        open={open}
        employee={employee}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </Provider>,
  );
  return { store, onClose, onSuccess };
};

const mockEmployee: EmployeeListDto = {
  id: 'emp-1',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  mobile: '+91 9876543210',
  status: 'pending_onboarding',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('AddEditEmployeeModal — Add mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders email field in Add mode', () => {
    renderModal(true, null);
    expect(screen.getByLabelText(/Email Address/i)).toBeEnabled();
  });

  it('shows validation error when email is missing on submit', async () => {
    renderModal(true, null);
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    renderModal(true, null);
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('calls createEmployee and onSuccess on valid submission', async () => {
    // I/O Matrix: Add New Employee — valid data → record created, modal closes, success toast shown
    (employeeService.createEmployee as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmployee);

    const { onSuccess } = renderModal(true, null);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Alice Smith' } });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '+91 9876543210' } });
    // Select salary package
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => screen.getByText('Mid-Level Package (₹6,00,000 p.a.)'));
    fireEvent.click(screen.getByText('Mid-Level Package (₹6,00,000 p.a.)'));

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it('shows API error message when duplicate email is returned', async () => {
    // I/O Matrix: Duplicate Email — shows "Email already registered."
    (employeeService.createEmployee as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { data: { message: 'Email already registered.' } },
    });

    renderModal(true, null);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Alice Smith' } });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '+91 9876543210' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => screen.getByText('Mid-Level Package (₹6,00,000 p.a.)'));
    fireEvent.click(screen.getByText('Mid-Level Package (₹6,00,000 p.a.)'));

    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(screen.getByText('Email already registered.')).toBeInTheDocument();
    });
  });
});

describe('AddEditEmployeeModal — Edit mode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pre-fills form with existing employee data in Edit mode', () => {
    renderModal(true, mockEmployee);
    expect(screen.getByDisplayValue('Alice Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+91 9876543210')).toBeInTheDocument();
  });

  it('email field is disabled in Edit mode', () => {
    renderModal(true, mockEmployee);
    expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
  });

  it('calls updateEmployee and onSuccess on valid edit submission', async () => {
    // I/O Matrix: Edit Employee — valid updated mobile → record updated, list reflects new mobile
    (employeeService.updateEmployee as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockEmployee,
      mobile: '+91 1111111111',
    });

    const { onSuccess } = renderModal(true, mockEmployee);

    fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '+91 1111111111' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});
