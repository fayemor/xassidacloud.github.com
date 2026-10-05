/* Emplacement : app/manifest.ts  →  généré automatiquement sur /manifest.webmanifest
 * C'est ce fichier qui rend le site installable comme une application. */

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Xassida Cloud - Patrimoine & Sagesse',
        short_name: 'Xassida Cloud',
        description: "La bibliothèque numérique du patrimoine mouride : xassidas de Cheikh Ahmadou Bamba, livres et vidéos.",
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#041c14',
        theme_color: '#0F3D2E',
        categories: ['books', 'education', 'lifestyle'],
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        // Raccourcis affichés quand on garde le doigt appuyé sur l'icône (Android)
        shortcuts: [
            { name: 'Xassidas', url: '/xassidas', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Livres', url: '/livres', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Vidéos', url: '/videos', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] }
        ]
    };
}
