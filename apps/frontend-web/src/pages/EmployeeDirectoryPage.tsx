import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Skeleton,
  InputAdornment, Button, IconButton, Snackbar, Alert, Tooltip,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchEmployees, setPage, setLimit,
  deleteEmployee, clearDeletionError,
} from '../store/slices/employeeSlice';
import { EmployeeListDto } from '@salary-mgmt/shared-types';
import AddEditEmployeeModal from '../components/AddEditEmployeeModal';
import DeleteEmployeeDialog from '../components/DeleteEmployeeDialog';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const EmployeeDirectoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data, total, page, limit, loading, deleting, deletionError } = useAppSelector((state) => state.employee);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeListDto | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeListDto | null>(null);

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Reset page to 1 when search term changes
    dispatch(setPage(1));
    dispatch(fetchEmployees({ search: debouncedSearchTerm, page: 1, limit }));
  }, [debouncedSearchTerm, dispatch, limit]);

  useEffect(() => {
    // Fetch when page or limit changes but not search
    dispatch(fetchEmployees({ search: debouncedSearchTerm, page, limit }));
  }, [page, limit, dispatch]);

  // Show error toast when deletion fails
  useEffect(() => {
    if (deletionError) {
      setToastMessage(deletionError);
      setToastSeverity('error');
      setToastOpen(true);
      dispatch(clearDeletionError());
    }
  }, [deletionError, dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    dispatch(setPage(newPage + 1));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setLimit(parseInt(event.target.value, 10)));
    dispatch(setPage(1));
  };

  const handleAddClick = () => {
    setSelectedEmployee(null);
    setModalOpen(true);
  };

  const handleEditClick = (employee: EmployeeListDto) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleSaveSuccess = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
    setToastMessage('Employee saved successfully.');
    setToastSeverity('success');
    setToastOpen(true);
    // Refresh the list to reflect the latest server state
    dispatch(fetchEmployees({ search: debouncedSearchTerm, page, limit }));
  };

  const handleDeleteClick = (employee: EmployeeListDto) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    const result = await dispatch(deleteEmployee(employeeToDelete.id));
    if (deleteEmployee.fulfilled.match(result)) {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      setToastMessage('Employee deleted successfully.');
      setToastSeverity('success');
      setToastOpen(true);
    }
    // On rejection, deletionError effect handles the error toast; keep dialog open
  };

  const handleToastClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setToastOpen(false);
  };

  const isEmpty = data.length === 0 && !loading && !searchTerm;

  return (
    <Box sx={{ p: '24px' }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Employee Directory
        </Typography>
        <Button
          id="add-employee-button"
          variant="contained"
          color="primary"
          onClick={handleAddClick}
          startIcon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          Add Employee
        </Button>
      </Box>

      {isEmpty ? (
        <Box
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', py: 10,
          }}
        >
          <svg
            width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: '#9ca3af', marginBottom: '16px' }}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <Typography variant="h6" color="text.primary">
            No employees added yet. Add an employee to get started.
          </Typography>
        </Box>
      ) : (
        <Paper sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: 'none' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <TextField
              size="small"
              placeholder="Search by name or email"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from(new Array(limit)).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:hover': { backgroundColor: '#f3f4f6' } }}
                    >
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.mobile}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            px: 1, py: 0.25,
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: row.status === 'active' ? '#d1fae5' : row.status === 'pending_onboarding' ? '#fef3c7' : '#fee2e2',
                            color: row.status === 'active' ? '#065f46' : row.status === 'pending_onboarding' ? '#92400e' : '#991b1b',
                            textTransform: 'capitalize',
                          }}
                        >
                          {row.status.replace(/_/g, ' ')}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit employee">
                          <IconButton
                            id={`edit-employee-${row.id}`}
                            size="small"
                            onClick={() => handleEditClick(row)}
                            aria-label={`Edit ${row.fullName}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete employee">
                          <IconButton
                            id={`delete-employee-${row.id}`}
                            size="small"
                            onClick={() => handleDeleteClick(row)}
                            aria-label={`Delete ${row.fullName}`}
                            sx={{ color: 'error.main' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Paper>
      )}

      {/* Add / Edit modal */}
      <AddEditEmployeeModal
        open={modalOpen}
        employee={selectedEmployee}
        onClose={handleModalClose}
        onSuccess={handleSaveSuccess}
      />

      {/* Delete confirmation dialog */}
      <DeleteEmployeeDialog
        open={deleteDialogOpen}
        employee={employeeToDelete}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Toast notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        id="employee-action-snackbar"
      >
        <Alert onClose={handleToastClose} severity={toastSeverity} variant="filled" sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeDirectoryPage;
