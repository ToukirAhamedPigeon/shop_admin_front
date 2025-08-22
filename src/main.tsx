// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// 🔹 Redux
import { Provider } from "react-redux";
import { store } from "./redux/store";

// 🔹 Global CSS
import "./index.css";

// 🔹 Axios helper that integrates Redux access token & CSRF token
import { setAccessTokenGetter, setCsrfTokenGetter } from "./lib/axios";

// ============================================================
// STEP 1: Inject token getters into Axios
// - Access token getter reads Redux store state
// - CSRF token getter (optional) if storing CSRF in Redux/Zustand
// ============================================================
setAccessTokenGetter(() => store.getState().auth.accessToken);
// Example CSRF getter (if you store CSRF token in Redux):
setCsrfTokenGetter(() => store.getState().auth.csrfToken);

// ============================================================
// STEP 2: Render React App
// - Wrap with Redux Provider so Redux state is available globally
// - React.StrictMode helps detect unsafe lifecycles, legacy API usage
// ============================================================
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
