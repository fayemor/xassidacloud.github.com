/* Emplacement : app/offline/page.tsx  →  /offline
 * Affichée quand la personne est hors connexion (voir public/sw.js). */

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: { absolute: 'Hors connexion | Xassida Cloud' },
    robots: { index: false, follow: false }
};

export default function OfflinePage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center bg-[#041c14] text-[#e2e8f0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={96} height={96} className="rounded-3xl shadow-lg" />
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">Vous êtes hors connexion</h1>
            <p className="max-w-md text-sm sm:text-base text-gray-300 leading-relaxed">
                Xassida Cloud a besoin d’internet pour afficher les textes. Vérifiez votre connexion puis réessayez.
            </p>
            {/* Lien classique (et non Link) : on veut un vrai rechargement une fois la connexion revenue */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-colors">
                Réessayer
            </a>
        </main>
    );
}
