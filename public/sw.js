/* Emplacement : public/sw.js
 * Service worker minimal et prudent :
 *  - les pages sont toujours demandées au réseau (contenu toujours à jour) ; hors connexion → page /offline ;
 *  - les fichiers statiques du site (versionnés par Next.js) sont gardés en cache pour aller plus vite ;
 *  - /api (chat, téléchargements) et les services externes (Google Drive, YouTube, Firebase) ne sont JAMAIS mis en cache.
 * Pour forcer une mise à jour du cache chez tous les utilisateurs, changez le numéro de CACHE.
 */
const CACHE = 'xassida-v1';
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;      // services externes : on ne touche à rien
    if (url.pathname.startsWith('/api/')) return;         // chat et téléchargements : jamais en cache

    // Pages : réseau d'abord, page hors-ligne en secours
    if (req.mode === 'navigate') {
        event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
        return;
    }

    // Fichiers statiques versionnés : cache d'abord
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.match(req).then((hit) => hit || fetch(req).then((res) => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then((cache) => cache.put(req, copy));
                }
                return res;
            }))
        );
    }
});
