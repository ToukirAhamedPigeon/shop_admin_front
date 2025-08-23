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

// ============================================================
// STEP 1: Fetch CSRF token before rendering app
// - Ensures token is available for all API calls
// ============================================================
const initApp = async () => {
  try {
    await store.dispatch(fetchCsrfToken()).unwrap();
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
