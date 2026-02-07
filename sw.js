const CACHE_NAME = "victory-gym-cache-v2";

/**
 * Archivos esenciales para que la app cargue SIN internet
 * Usamos rutas reales (con espacio), NO %20
 */
const FILES_TO_CACHE = [
  "/victory-gym-web/",
  "/victory-gym-web/index.html",

  "/victory-gym-web/respaldo 5/index.html",
  "/victory-gym-web/respaldo 5/login.html",
  "/victory-gym-web/respaldo 5/pos.html",
  "/victory-gym-web/respaldo 5/registro.html",
  "/victory-gym-web/respaldo 5/usuarios.html",

  // (opcional pero recomendado)
  // agrega aquí CSS y JS críticos si los tienes
  // "/victory-gym-web/respaldo 5/css/styles.css",
  // "/victory-gym-web/respaldo 5/js/main.js",
];

// ======================
// INSTALACIÓN
// ======================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  // Fuerza a que el nuevo SW tome control
  self.skipWaiting();
});

// ======================
// ACTIVACIÓN
// ======================
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

// ======================
// FETCH (OFFLINE FIRST)
// ======================
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request);
    })
  );
});
