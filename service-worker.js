// Nom du cache
const CACHE_NAME = "xassida-cache-v1";

// Fichiers à mettre en cache au premier chargement
const ASSETS = [
  "./",
  "./index.html",
  "./xc.png",
  "./logo.png",
  "./manifest.json",
  "https://cdn.tailwindcss.com"
];

// Installation : met en cache les fichiers statiques
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activation : nettoyage ancien cache
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Interception des requêtes réseau
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
