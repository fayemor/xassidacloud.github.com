const CACHE_NAME = 'xassida-cloud-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/xc.png',
  '/manifest.json',
  // ajoute ici tous tes fichiers CSS / JS / images nécessaires
];

// 🧩 Installation : mise en cache initiale
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  console.log('✅ Xassida Cloud installé et mis en cache');
});

// 🌀 Activation : nettoyage ancien cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// ⚡ Interception des requêtes réseau
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/index.html'))
  );
});
