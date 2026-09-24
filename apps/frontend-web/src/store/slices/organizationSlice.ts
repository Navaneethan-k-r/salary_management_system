import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OrganizationProfile, CreateOrganizationProfileDto, UpdateOrganizationProfileDto } from '@salary-mgmt/shared-types';
import { organizationService } from '../../services/organizationService';

interface OrganizationState {
  profile: OrganizationProfile | null;
  loading: boolean;
  error: string | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
}

const initialState: OrganizationState = {
  profile: null,
  loading: false,
  error: null,
  saveStatus: 'idle',
};

export const fetchOrganizationProfile = createAsyncThunk(
  'organization/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await organizationService.getOrganizationProfile();
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Initial setup case
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization profile');
    }
  }
);

export const saveOrganizationProfile = createAsyncThunk(
  'organization/saveProfile',
  async (profileData: CreateOrganizationProfileDto | UpdateOrganizationProfileDto, { rejectWithValue }) => {
    try {
      const data = await organizationService.saveOrganizationProfile(profileData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save organization profile');
    }
  }
);

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizationProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationProfile.fulfilled, (state, action: PayloadAction<OrganizationProfile | null>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchOrganizationProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveOrganizationProfile.pending, (state) => {
        state.saveStatus = 'saving';
        state.error = null;
      })
      .addCase(saveOrganizationProfile.fulfilled, (state, action: PayloadAction<OrganizationProfile>) => {
        state.saveStatus = 'success';
        state.profile = action.payload;
      })
      .addCase(saveOrganizationProfile.rejected, (state, action) => {
        state.saveStatus = 'error';
        state.error = action.payload as string;
      });
  },
});

export const { resetSaveStatus } = organizationSlice.actions;
export default organizationSlice.reducer;
