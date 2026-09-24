import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { employeeService, GetEmployeesParams } from '../../services/employeeService';
import { EmployeeListDto, PaginatedResponseDto, CreateEmployeeDto, UpdateEmployeeDto } from '@salary-mgmt/shared-types';

interface EmployeeState {
  data: EmployeeListDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  mutating: boolean;
  mutationError: string | null;
  deleting: boolean;
  deletionError: string | null;
}

const initialState: EmployeeState = {
  data: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  loading: false,
  error: null,
  mutating: false,
  mutationError: null,
  deleting: false,
  deletionError: null,
};

export const fetchEmployees = createAsyncThunk(
  'employee/fetchEmployees',
  async (params: GetEmployeesParams | undefined, { rejectWithValue }) => {
    try {
      const response = await employeeService.getEmployees(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employee/createEmployee',
  async (dto: CreateEmployeeDto, { rejectWithValue }) => {
    try {
      const response = await employeeService.createEmployee(dto);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employee/updateEmployee',
  async ({ id, dto }: { id: string; dto: UpdateEmployeeDto }, { rejectWithValue }) => {
    try {
      const response = await employeeService.updateEmployee(id, dto);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employee/deleteEmployee',
  async (id: string, { rejectWithValue }) => {
    try {
      await employeeService.deleteEmployee(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.status === 404
          ? 'Employee could not be found or was already deleted.'
          : error.response?.data?.message || 'Failed to delete employee'
      );
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
    clearMutationError: (state) => {
      state.mutationError = null;
    },
    clearDeletionError: (state) => {
      state.deletionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action: PayloadAction<PaginatedResponseDto<EmployeeListDto>>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createEmployee.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createEmployee.fulfilled, (state, action: PayloadAction<EmployeeListDto>) => {
        state.mutating = false;
        state.data = [action.payload, ...state.data];
        state.total += 1;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload as string;
      })
      // Update
      .addCase(updateEmployee.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action: PayloadAction<EmployeeListDto>) => {
        state.mutating = false;
        const index = state.data.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload as string;
      })
      // Delete
      .addCase(deleteEmployee.pending, (state) => {
        state.deleting = true;
        state.deletionError = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleting = false;
        state.data = state.data.filter(e => e.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.deleting = false;
        state.deletionError = action.payload as string;
      });
  },
});

export const { setPage, setLimit, clearMutationError, clearDeletionError } = employeeSlice.actions;
export default employeeSlice.reducer;
