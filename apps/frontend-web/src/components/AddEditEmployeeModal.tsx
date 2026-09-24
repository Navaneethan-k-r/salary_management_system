import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography,
  CircularProgress, Alert, IconButton,
} from '@mui/material';
import { EmployeeListDto } from '@salary-mgmt/shared-types';
import { useAppDispatch, useAppSelector } from '../store';
import { createEmployee, updateEmployee, clearMutationError } from '../store/slices/employeeSlice';

// Mocked salary package options — placeholder until Epic 3 (Salary Configuration) provides the real API
const MOCK_SALARY_PACKAGES = [
  { id: 'pkg-junior', label: 'Junior Package (₹3,00,000 p.a.)' },
  { id: 'pkg-mid', label: 'Mid-Level Package (₹6,00,000 p.a.)' },
  { id: 'pkg-senior', label: 'Senior Package (₹12,00,000 p.a.)' },
  { id: 'pkg-lead', label: 'Lead Package (₹20,00,000 p.a.)' },
];

interface FormState {
  email: string;
  fullName: string;
  mobile: string;
  salaryPackageId: string;
}

interface FormErrors {
  email?: string;
  fullName?: string;
  mobile?: string;
  salaryPackageId?: string;
}

interface AddEditEmployeeModalProps {
  open: boolean;
  employee: EmployeeListDto | null; // null = Add mode, non-null = Edit mode
  onClose: () => void;
  onSuccess: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\+?[0-9\s\-()\s]{7,20}$/;

function validate(form: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!isEdit) {
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(form.email.trim())) errors.email = 'Please enter a valid email address';
  }
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.mobile.trim()) errors.mobile = 'Mobile number is required';
  else if (!mobileRegex.test(form.mobile.trim())) errors.mobile = 'Please enter a valid mobile number';
  if (!form.salaryPackageId) errors.salaryPackageId = 'Please select a salary package';
  return errors;
}

const AddEditEmployeeModal: React.FC<AddEditEmployeeModalProps> = ({
  open, employee, onClose, onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { mutating, mutationError } = useAppSelector(state => state.employee);
  const isEdit = employee !== null;

  const [form, setForm] = useState<FormState>({
    email: '',
    fullName: '',
    mobile: '',
    salaryPackageId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (employee) {
        setForm({
          email: employee.email,
          fullName: employee.fullName,
          mobile: employee.mobile,
          salaryPackageId: 'pkg-mid', // Default placeholder — Epic 3 will link real package
        });
      } else {
        setForm({ email: '', fullName: '', mobile: '', salaryPackageId: '' });
      }
      setErrors({});
      dispatch(clearMutationError());
    }
  }, [open, employee, dispatch]);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate(form, isEdit);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (isEdit && employee) {
      const result = await dispatch(updateEmployee({
        id: employee.id,
        dto: {
          fullName: form.fullName,
          mobile: form.mobile,
          salaryPackageId: form.salaryPackageId,
        },
      }));
      if (!result.type.endsWith('/rejected')) {
        onSuccess();
      }
    } else {
      const result = await dispatch(createEmployee({
        email: form.email,
        fullName: form.fullName,
        mobile: form.mobile,
        salaryPackageId: form.salaryPackageId,
      }));
      if (!result.type.endsWith('/rejected')) {
        onSuccess();
      }
    }
  };

  const handleClose = () => {
    if (!mutating) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 700,
          fontSize: '1.125rem',
        }}
      >
        {isEdit ? 'Edit Employee' : 'Add Employee'}
        <IconButton
          id="add-edit-employee-modal-close"
          onClick={handleClose}
          disabled={mutating}
          size="small"
          sx={{ color: 'text.secondary' }}
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {mutationError && (
          <Alert severity="error" sx={{ mb: 2 }} id="add-edit-employee-api-error">
            {mutationError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Email — read-only in edit mode */}
          <TextField
            id="add-edit-employee-email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            disabled={isEdit || mutating}
            fullWidth
            required={!isEdit}
            size="small"
            inputProps={{ maxLength: 255 }}
          />

          <TextField
            id="add-edit-employee-fullName"
            label="Full Name"
            value={form.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName}
            disabled={mutating}
            fullWidth
            required
            size="small"
            inputProps={{ maxLength: 255 }}
          />

          <TextField
            id="add-edit-employee-mobile"
            label="Mobile Number"
            value={form.mobile}
            onChange={handleChange('mobile')}
            error={!!errors.mobile}
            helperText={errors.mobile}
            disabled={mutating}
            fullWidth
            required
            size="small"
            inputProps={{ maxLength: 20 }}
          />

          <TextField
            id="add-edit-employee-salaryPackage"
            label="Salary Package"
            select
            value={form.salaryPackageId}
            onChange={handleChange('salaryPackageId')}
            error={!!errors.salaryPackageId}
            helperText={errors.salaryPackageId || 'Mocked packages — will be replaced by Epic 3 data'}
            disabled={mutating}
            fullWidth
            required
            size="small"
          >
            {MOCK_SALARY_PACKAGES.map(pkg => (
              <MenuItem key={pkg.id} value={pkg.id}>
                {pkg.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {isEdit && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Note: Email address cannot be changed after account creation.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          id="add-edit-employee-cancel"
          onClick={handleClose}
          disabled={mutating}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 90 }}
        >
          Cancel
        </Button>
        <Button
          id="add-edit-employee-save"
          onClick={handleSubmit}
          disabled={mutating}
          variant="contained"
          color="primary"
          sx={{ minWidth: 90 }}
          startIcon={mutating ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {mutating ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEditEmployeeModal;
