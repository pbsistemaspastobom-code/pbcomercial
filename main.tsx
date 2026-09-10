import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);

// Registra o service worker (habilita "Instalar app" no navegador)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => { /* segue sem PWA se falhar */ });
  });
}
