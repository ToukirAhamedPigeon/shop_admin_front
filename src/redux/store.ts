import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import dashboardReducer from "./slices/dashboardSlice";
import languageReducer from "./slices/languageSlice";
import themeReducer from "./slices/themeSlice";
import sidebarReducer from './slices/sidebarSlice'
import { setAccessTokenGetter, setCsrfTokenGetter } from "@/lib/axios";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    language: languageReducer,
    theme: themeReducer,
    sidebar: sidebarReducer
  },
});

// ✅ Wire axios getters to always pull latest tokens from Redux
setAccessTokenGetter(() => store.getState().auth.accessToken);
setCsrfTokenGetter(() => store.getState().auth.csrfToken);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
