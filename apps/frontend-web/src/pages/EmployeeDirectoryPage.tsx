import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, TextField, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, Skeleton,
  InputAdornment
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchEmployees, setPage, setLimit } from '../store/slices/employeeSlice';

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
  const { data, total, page, limit, loading } = useAppSelector((state) => state.employee);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // Reset page to 1 when search term changes
    dispatch(setPage(1));
    dispatch(fetchEmployees({ search: debouncedSearchTerm, page: 1, limit }));
  }, [debouncedSearchTerm, dispatch, limit]);

  useEffect(() => {
    // Fetch when page or limit changes but not search
    dispatch(fetchEmployees({ search: debouncedSearchTerm, page, limit }));
  }, [page, limit, dispatch]);

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

  const isEmpty = data.length === 0 && !loading && !searchTerm;

  return (
    <Box sx={{ p: '24px' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Employee Directory
      </Typography>

      {isEmpty ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af', marginBottom: '16px' }}>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from(new Array(limit)).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                      <TableCell><Skeleton animation="wave" height={24} /></TableCell>
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
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
    </Box>
  );
};

export default EmployeeDirectoryPage;
