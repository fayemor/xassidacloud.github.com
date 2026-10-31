/* Emplacement : app/components/XassidaIndex.tsx
 * Composant SERVEUR (pas de "use client") : tous les liens vers les xassidas sont dans le HTML initial,
 * sans clic sur « Afficher plus ». Google peut ainsi découvrir et suivre chaque page. */

import Link from 'next/link';
import { XASSIDAS } from '../lib/catalog';

const SORTED = [...XASSIDAS].sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

export default function XassidaIndex() {
    return (
        <nav aria-label="Index de toutes les xassidas" className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
            <h2 className="text-xl sm:text-2xl font-bold font-serif mb-2">Index de toutes les xassidas ({SORTED.length})</h2>
            <p className="text-xs opacity-70 mb-6">Accédez directement à la page de chaque xassida de Cheikh Ahmadou Bamba, à lire en ligne ou à télécharger.</p>
            <ul className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 text-sm leading-7">
                {SORTED.map((x) => (
                    <li key={x.slug} className="break-inside-avoid">
                        <Link href={`/xassidas/${x.slug}`} className="hover:underline">
                            {x.title}
                            {x.arabic && <span lang="ar" dir="rtl" className="opacity-60 ml-2 text-xs">{x.arabic}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}