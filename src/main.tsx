import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import "./index.css";

// Import your axios helper that has setAccessTokenGetter
import { setAccessTokenGetter } from "./lib/axios";

// 🔹 Tell axios how to get the latest accessToken from Redux state
setAccessTokenGetter(() => store.getState().auth.accessToken);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 🔹 Wrap app with Redux Provider so store is accessible everywhere */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
