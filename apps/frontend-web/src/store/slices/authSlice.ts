import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserSession } from '@salary-mgmt/shared-types';
import { authService, LoginRequest } from '../../services/authService';

interface AuthState {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getInitialSession = (): UserSession | null => {
  try {
    const stored = sessionStorage.getItem('auth_session');
    if (stored) {
      const parsed = JSON.parse(stored) as UserSession;
      if (parsed.expiresAt && Date.now() > new Date(parsed.expiresAt).getTime()) {
        sessionStorage.removeItem('auth_session');
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse stored session', e);
  }
  return null;
};

const initialSession = getInitialSession();

const initialState: AuthState = {
  session: initialSession,
  isAuthenticated: !!initialSession,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (error: any) {
      // Proceed to clear state anyway
      console.error('Logout API failed', error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        
        // Extract session details from AuthResponseDto
        const user = action.payload.user || {
          id: 'admin-id',
          role: 'hr_admin',
          email: action.meta.arg.email,
          fullName: 'HR Admin',
        };

        const session: UserSession = {
          token: action.payload.token,
          userId: user.id,
          role: user.role,
          email: user.email,
          organizationId: 'org-1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };
        
        state.session = session;
        sessionStorage.setItem('auth_session', JSON.stringify(session));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.session = null;
        state.isAuthenticated = false;
        sessionStorage.removeItem('auth_session');
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
