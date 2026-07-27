// Service Worker MÍNIMO: no implementa ninguna funcionalidad offline real —
// solo existe porque Chrome/Edge de escritorio son más consistentes mostrando
// el prompt de "Instalar app" cuando hay un service worker registrado con un
// handler de "fetch", además del manifest.json. Cada request simplemente pasa
// derecho a la red, sin guardar ni servir nada desde caché.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
