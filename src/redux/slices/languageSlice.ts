import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { fetchTranslationsApi } from "@/modules/settings/languages/api";
import type { TranslationMap, FetchTranslationsPayload } from "@/modules/settings/languages/types";

interface TranslationState {
  currentLang: string;
  translations: TranslationMap;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const DEFAULT_LANG = "en";

// =========================
// Async Thunks
// =========================
export const fetchTranslations = createAsyncThunk<
  TranslationMap,
  FetchTranslationsPayload,
  { rejectValue: string }
>(
  "language/fetchTranslations",
  async ({ lang, forceFetch = false }, { rejectWithValue }) => {
    try {
      const translations = await fetchTranslationsApi({ lang, forceFetch });
      if (!translations) return rejectWithValue("No translations found");
      return translations;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch translations");
    }
  }
);

// =========================
// Slice
// =========================
const initialState: TranslationState = {
  currentLang: localStorage.getItem("lang") || DEFAULT_LANG,
  translations: {},
  loading: false,
  error: null,
  lastUpdated: null,
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<string>) {
      state.currentLang = action.payload;
      localStorage.setItem("lang", action.payload);
    },
    clearTranslations(state) {
      state.translations = {};
    },
    updateTranslationKey(state, action: PayloadAction<{ key: string; value: string }>) {
      const { key, value } = action.payload;
      state.translations[key] = value;
      state.lastUpdated = Date.now();
    },
    removeTranslationKey(state, action: PayloadAction<string>) {
      const key = action.payload;
      delete state.translations[key];
      state.lastUpdated = Date.now();
    },
    refreshTranslations(state) {
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTranslations.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload;
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchTranslations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { setLanguage, clearTranslations, updateTranslationKey, removeTranslationKey, refreshTranslations } = languageSlice.actions;
export default languageSlice.reducer;