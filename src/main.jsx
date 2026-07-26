import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./App.jsx";
import { handleZohoRedirect } from "./services/zoho.service";

// Si volvemos del login de Zoho, el token viene en el # de la URL: se guarda
// y se limpia ANTES de montar la app.
handleZohoRedirect();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
