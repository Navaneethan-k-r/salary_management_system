import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, CircularProgress,
} from '@mui/material';
import { EmployeeListDto } from '@salary-mgmt/shared-types';

interface DeleteEmployeeDialogProps {
  open: boolean;
  employee: EmployeeListDto | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteEmployeeDialog: React.FC<DeleteEmployeeDialogProps> = ({
  open,
  employee,
  deleting,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onCancel}
      aria-labelledby="delete-employee-dialog-title"
      aria-describedby="delete-employee-dialog-description"
      id="delete-employee-dialog"
      PaperProps={{
        sx: { borderRadius: '12px', maxWidth: 440, width: '100%' },
      }}
    >
      <DialogTitle
        id="delete-employee-dialog-title"
        sx={{ fontWeight: 700, pb: 1 }}
      >
        Delete Employee
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-employee-dialog-description" sx={{ color: 'text.primary' }}>
          Are you sure you want to delete{' '}
          <strong>{employee?.fullName}</strong>? This action cannot be undone.
          The employee record will be removed from the directory.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          id="delete-employee-cancel-button"
          onClick={onCancel}
          disabled={deleting}
          variant="outlined"
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          id="delete-employee-confirm-button"
          onClick={onConfirm}
          disabled={deleting}
          variant="contained"
          color="error"
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteEmployeeDialog;
