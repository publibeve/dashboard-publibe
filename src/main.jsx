import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Root from "./App.jsx";
import { handleZohoRedirect } from "./services/zoho.service";
import { handlePasswordRecoveryRedirect } from "./services/auth.service";

// Dos flujos distintos vuelven con un token en el "#" de la URL: el link de
// "recuperar clave" de Supabase Y el redirect de Zoho WorkDrive. Se revisa
// PRIMERO si es el de recuperación (marcador exclusivo: type=recovery) —
// si lo es, ya deja limpio el hash y no hace falta chequear Zoho.
// Nota: BrowserRouter (abajo) solo mira el "pathname" de la URL, nunca el
// "#" — así que no compite con ninguno de estos dos flujos por el hash.
async function boot() {
  const wasRecovery = await handlePasswordRecoveryRedirect();
  if (!wasRecovery) handleZohoRedirect();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </React.StrictMode>
  );

  // Service worker mínimo (ver public/sw.js) — sin caché offline real, solo
  // para que Chrome/Edge de escritorio muestren el prompt de "Instalar app"
  // de forma consistente. No interfiere con nada si falla o no es soportado.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch((e) => {
      console.warn("No se pudo registrar el service worker (no afecta el uso normal de la app):", e);
    });
  }
}
boot();
