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
      return JSON.parse(stored) as UserSession;
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
        
        // Mock session payload for Redux from AuthResponseDto
        const mockSession: UserSession = {
          token: action.payload.token,
          userId: action.payload.user.id,
          role: action.payload.user.role,
          email: action.payload.user.email,
          organizationId: 'org-1',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        };
        
        state.session = mockSession;
        sessionStorage.setItem('auth_session', JSON.stringify(mockSession));
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
