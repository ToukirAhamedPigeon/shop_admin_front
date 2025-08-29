import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🔹 Redux
import { Provider } from "react-redux";
import { store } from "./redux/store";

// 🔹 Global CSS
import "./index.css";

// 🔹 CSRF Initialization
import { fetchCsrfToken } from "./redux/slices/authSlice";

// 🔹 Language Initialization
import { fetchTranslations, setLanguage } from "./redux/slices/languageSlice";

// ============================================================
// STEP 1: Initialize CSRF + Language before rendering App
// ============================================================
const initApp = async () => {
  try {
    // ✅ 1. Get CSRF
    await store.dispatch(fetchCsrfToken()).unwrap();

    // ✅ 2. Initialize Language
    const savedLang = localStorage.getItem("lang") || "en";
    store.dispatch(setLanguage(savedLang));
    await store.dispatch(fetchTranslations(savedLang)).unwrap();
  } catch (err) {
    // Auto logout if CSRF fetch fails
    window.dispatchEvent(new Event("logout"));
  }
};

// ============================================================
// STEP 2: Render React App
// ============================================================
initApp().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
});
