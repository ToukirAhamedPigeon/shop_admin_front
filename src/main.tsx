import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Redux
import { Provider } from "react-redux";
import { store } from "./redux/store";

// Global CSS
import "./index.css";

// Auth
import {
  fetchCsrfToken,
  logout,
  setAccessToken,
} from "./redux/slices/authSlice";

// Language
import {
  fetchTranslations,
  setLanguage,
} from "./redux/slices/languageSlice";

// Axios handlers
import {
  setAccessTokenGetter,
  setRefreshSuccessHandler,
  setLogoutHandler,
  setCsrfTokenGetter,
} from "@/lib/axios";

// Components
import GlobalLoader from "@/components/custom/GlobalLoader";
import ToastContainer from "./components/custom/ToastContainer";

// ============================================================
// STEP 1: Bind Axios Auth Handlers
// ============================================================

// Access token getter
setAccessTokenGetter(() => store.getState().auth.accessToken);

// CSRF token getter
setCsrfTokenGetter(() => store.getState().auth.csrfToken);

// Refresh success handler
setRefreshSuccessHandler((token) => {
  store.dispatch(setAccessToken(token));
});

// Logout handler
setLogoutHandler(() => {
  store.dispatch(logout());
});

// Global logout event
window.addEventListener("logout", () => {
  store.dispatch(logout());
});

// ============================================================
// STEP 2: Initialize App (CSRF + Language)
// ============================================================

const initApp = async () => {
  try {
    // ✅ Fetch CSRF
    await store.dispatch(fetchCsrfToken()).unwrap();

    // ✅ Initialize language
    const savedLang = localStorage.getItem("lang") || "en";

    store.dispatch(setLanguage(savedLang));

    await store.dispatch(
      fetchTranslations({ lang: savedLang })
    ).unwrap();
  } catch (err) {
    window.dispatchEvent(new Event("logout"));
  }
};

// ============================================================
// STEP 3: Render React App
// ============================================================

initApp().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <GlobalLoader />
        <App />
        <ToastContainer />
      </Provider>
    </React.StrictMode>
  );
});