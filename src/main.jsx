import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker for installable/offline PWA support.
if ("serviceWorker" in navigator) {
  const base = import.meta.env.BASE_URL; // e.g. "/steps-planner/"
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* offline support is best-effort */
    });
  });
}
