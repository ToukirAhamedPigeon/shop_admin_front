// D:\shop\shop_admin_front\src\redux\slices\settingsSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  getAllSettings,
  updateThemeSettings,
  updateGeneralSettings,
  updateBrandingSettings,
  resetThemeSettings,
  resetGeneralSettings
} from '@/modules/settings/app-settings/api';
import type { SettingsResponse, UserSettings, BrandingSettings } from '@/types/settings';

interface SettingsState {
  data: SettingsResponse | null;
  userSettings: UserSettings | null;
  brandingSettings: BrandingSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  userSettings: null,
  brandingSettings: null,
  loading: false,
  error: null
};

export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async () => {
    const response = await getAllSettings();
    return response;
  }
);

export const updateTheme = createAsyncThunk(
  'settings/updateTheme',
  async (settings: any) => {
    const response = await updateThemeSettings(settings);
    return response;
  }
);

export const updateGeneral = createAsyncThunk(
  'settings/updateGeneral',
  async (settings: any) => {
    const response = await updateGeneralSettings(settings);
    return response;
  }
);

export const updateBranding = createAsyncThunk(
  'settings/updateBranding',
  async (settings: any) => {
    const response = await updateBrandingSettings(settings);
    return response;
  }
);

export const resetTheme = createAsyncThunk(
  'settings/resetTheme',
  async () => {
    const response = await resetThemeSettings();
    return response;
  }
);

export const resetGeneral = createAsyncThunk(
  'settings/resetGeneral',
  async () => {
    const response = await resetGeneralSettings();
    return response;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettings: (state) => {
      state.data = null;
      state.userSettings = null;
      state.brandingSettings = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<SettingsResponse>) => {
        state.loading = false;
        state.data = action.payload;
        state.userSettings = action.payload.user;
        state.brandingSettings = action.payload.branding;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      // Update Theme
      .addCase(updateTheme.fulfilled, (state, action: PayloadAction<UserSettings>) => {
        state.userSettings = action.payload;
        if (state.data) {
          state.data.user = action.payload;
          state.data.lastUpdated = action.payload.updatedAt || new Date().toISOString();
          // Fix: Provide default empty string if updatedBy is undefined
          state.data.updatedBy = action.payload.updatedBy || '';
        }
      })
      // Update General
      .addCase(updateGeneral.fulfilled, (state, action: PayloadAction<UserSettings>) => {
        state.userSettings = action.payload;
        if (state.data) {
          state.data.user = action.payload;
          state.data.lastUpdated = action.payload.updatedAt || new Date().toISOString();
          // Fix: Provide default empty string if updatedBy is undefined
          state.data.updatedBy = action.payload.updatedBy || '';
        }
      })
      // Update Branding
      .addCase(updateBranding.fulfilled, (state, action: PayloadAction<BrandingSettings>) => {
        state.brandingSettings = action.payload;
        if (state.data) {
          state.data.branding = action.payload;
        }
      })
      // Reset Theme
      .addCase(resetTheme.fulfilled, (state, action: PayloadAction<UserSettings>) => {
        state.userSettings = action.payload;
        if (state.data) {
          state.data.user = action.payload;
          state.data.lastUpdated = action.payload.updatedAt || new Date().toISOString();
          // Fix: Provide default empty string if updatedBy is undefined
          state.data.updatedBy = action.payload.updatedBy || '';
        }
      })
      // Reset General
      .addCase(resetGeneral.fulfilled, (state, action: PayloadAction<UserSettings>) => {
        state.userSettings = action.payload;
        if (state.data) {
          state.data.user = action.payload;
          state.data.lastUpdated = action.payload.updatedAt || new Date().toISOString();
          // Fix: Provide default empty string if updatedBy is undefined
          state.data.updatedBy = action.payload.updatedBy || '';
        }
      });
  }
});

export const { clearSettings } = settingsSlice.actions;
export default settingsSlice.reducer;