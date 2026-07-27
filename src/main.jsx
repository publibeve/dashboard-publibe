import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./App.jsx";
import { handleZohoRedirect } from "./services/zoho.service";
import { handlePasswordRecoveryRedirect } from "./services/auth.service";

// Dos flujos distintos vuelven con un token en el "#" de la URL: el link de
// "recuperar clave" de Supabase Y el redirect de Zoho WorkDrive. Se revisa
// PRIMERO si es el de recuperación (marcador exclusivo: type=recovery) —
// si lo es, ya deja limpio el hash y no hace falta chequear Zoho.
async function boot() {
  const wasRecovery = await handlePasswordRecoveryRedirect();
  if (!wasRecovery) handleZohoRedirect();

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>
  );
}
boot();
