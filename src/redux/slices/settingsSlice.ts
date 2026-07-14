// D:\shop\shop_admin_front\src\modules\settings\app-settings\store\settingsSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getAllSettings, updateCategorySettings, resetCategory } from '../../modules/settings/app-settings/api';
import type { SettingsResponse, SettingsGroup } from '@/types/settings';

interface SettingsState {
  data: SettingsResponse | null;
  groups: SettingsGroup[];
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: null,
  groups: [],
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

export const updateSettings = createAsyncThunk(
  'settings/update',
  async ({ category, settings }: { category: string; settings: Record<string, any> }) => {
    await updateCategorySettings(category, settings);
    // Refetch after update
    const response = await getAllSettings();
    return response;
  }
);

export const resetCategorySettings = createAsyncThunk(
  'settings/reset',
  async (category: string) => {
    await resetCategory(category);
    const response = await getAllSettings();
    return response;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettings: (state) => {
      state.data = null;
      state.groups = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<SettingsResponse>) => {
        state.loading = false;
        state.data = action.payload;
        state.groups = action.payload.groups;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(updateSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateSettings.fulfilled, (state, action: PayloadAction<SettingsResponse>) => {
        state.loading = false;
        state.data = action.payload;
        state.groups = action.payload.groups;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update settings';
      })
      .addCase(resetCategorySettings.fulfilled, (state, action: PayloadAction<SettingsResponse>) => {
        state.data = action.payload;
        state.groups = action.payload.groups;
      });
  }
});

export const { clearSettings } = settingsSlice.actions;
export default settingsSlice.reducer;