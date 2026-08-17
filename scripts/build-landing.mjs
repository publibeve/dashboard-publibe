// Se corre DESPUÉS de "vite build" (ver el script "build" en package.json).
// vite.config.js ya deja el dashboard compilado en dist/dashboardapp/ (por
// el outDir configurado ahí) — acá solo falta poner, al lado, un
// dist/index.html mínimo y estático para la raíz del sitio. No usa nada
// del bundle de React a propósito: tiene que cargar rápido y quedar
// totalmente independiente de si el dashboard compiló bien o no.
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distDir = join(root, "dist");
const logoSvg = readFileSync(join(root, "src/assets/publibe-logo.svg"), "utf-8")
  // Se saca el <?xml ...?> de arriba — no hace falta embebido inline en HTML,
  // y algunos navegadores lo tratan raro ahí adentro.
  .replace(/<\?xml[^>]*\?>\s*/i, "");

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/dashboardapp/favicon.svg" />
    <meta name="theme-color" content="#F5F3EF" />
    <title>publiBe Agencia Gráfica</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        display: flex; align-items: center; justify-content: center;
        background: #F5F3EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .landing-logo { width: min(280px, 70vw); height: auto; margin-bottom: 22px; }
      .landing-logo svg { display: block; width: 100%; height: auto; }
      .landing-tagline { color: #6E6B63; font-size: 15px; letter-spacing: 0.02em; text-align: center; }
      .landing-wrap { display: flex; flex-direction: column; align-items: center; }
    </style>
  </head>
  <body>
    <div class="landing-wrap">
      <div class="landing-logo">${logoSvg}</div>
      <div class="landing-tagline">Próximamente</div>
    </div>
  </body>
</html>
`;

if (!existsSync(distDir)) {
  throw new Error("No existe dist/ — corré \"vite build\" primero (el script \"build\" de package.json ya lo hace en orden).");
}
writeFileSync(join(distDir, "index.html"), html, "utf-8");
console.log("Landing estática escrita en dist/index.html");
