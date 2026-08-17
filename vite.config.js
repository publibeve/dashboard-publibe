import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El dashboard entero pasa a vivir en /dashboardapp — la raíz ("/") queda
// para la landing estática nueva, que no forma parte de este build en
// absoluto (ver scripts/build-landing.mjs, que la coloca aparte después).
// base:"/dashboardapp/" hace que Vite arme todas las rutas de assets
// (JS, CSS, íconos referenciados en index.html) con ese prefijo.
export default defineConfig({
  plugins: [react()],
  base: "/dashboardapp/",
  build: {
    outDir: "dist/dashboardapp",
  },
});
