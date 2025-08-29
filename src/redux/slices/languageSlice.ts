import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "@/lib/axios";

interface TranslationState {
  currentLang: string;
  translations: Record<string, string>;
  loading: boolean;
  error: string | null;
}

const DEFAULT_LANG = "en";

// =========================
// Async Thunks
// =========================
export const fetchTranslations = createAsyncThunk<
  Record<string, string>, // only inner translations
  string,                 // parameter type (lang)
  { rejectValue: string }
>(
  "language/fetchTranslations",
  async (lang, { rejectWithValue }) => {
    try {
      const response = await api.get(`/translations/get?lang=${lang}`);
      // Extract only inner translations object
      return response.data.translations as Record<string, string>;
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTranslations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTranslations.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload; // now only flat key-value object
        state.error = null;
      })
      .addCase(fetchTranslations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unknown error";
      });
  },
});

export const { setLanguage, clearTranslations } = languageSlice.actions;
export default languageSlice.reducer;
