const CACHE_NAME = "victory-gym-cache-v3";

/**
 * Archivos esenciales para OFFLINE
 * Usamos rutas EXACTAS como las sirve GitHub Pages
 */
const FILES_TO_CACHE = [
  "/victory-gym-web/",
  "/victory-gym-web/index.html",

  "/victory-gym-web/respaldo%205/",
  "/victory-gym-web/respaldo%205/index.html",
  "/victory-gym-web/respaldo%205/login.html",
  "/victory-gym-web/respaldo%205/pos.html",
  "/victory-gym-web/respaldo%205/registro.html",
  "/victory-gym-web/respaldo%205/usuarios.html",

  // 👉 agrega aquí CSS y JS críticos si existen
  // "/victory-gym-web/respaldo%205/css/styles.css",
  // "/victory-gym-web/respaldo%205/js/main.js",
];

/* ======================
   INSTALACIÓN
====================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

/* ======================
   ACTIVACIÓN
====================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

/* ======================
   FETCH (OFFLINE FIRST)
====================== */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        // Fallback seguro
        return caches.match("/victory-gym-web/respaldo%205/index.html");
      });
    })
  );
});
