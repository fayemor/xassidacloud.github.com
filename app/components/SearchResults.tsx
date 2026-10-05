"use client";

/* Emplacement : app/components/SearchResults.tsx
 * Résultats de la recherche de la page d'accueil : xassidas ET livres, chaque résultat ouvre sa page. */

import React, { useMemo } from 'react';
import Link from 'next/link';
import { searchCatalog } from '../lib/catalog';

const ARABIC_FONT = "'Amiri','Scheherazade New','Noto Naskh Arabic',serif";
const MAX_SHOWN = 30; // par catégorie

export default function SearchResults({ query, dark }: { query: string; dark: boolean }) {
    const q = query.trim();
    const { xassidas, livres } = useMemo(() => searchCatalog(q), [q]);
    if (!q) return null;

    const total = xassidas.length + livres.length;
    const accent = dark ? 'text-amber-400' : 'text-amber-700';
    const soft = dark ? 'text-gray-400' : 'text-gray-500';
    const card = dark ? 'bg-[#0d261e] border-emerald-800/50' : 'bg-white border-emerald-900/10';
    const link = `flex items-center justify-between gap-3 p-5 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${card}`;

    return (
        <section id="resultats" aria-live="polite" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-24">
            <h2 className="text-xl font-bold font-serif mb-6">Résultats pour « {q} » ({total})</h2>

            {total === 0 && (
                <div className="space-y-3">
                    <p className={`text-sm ${soft}`}>
                        Aucun résultat. Essayez avec un seul mot du titre (par exemple « mawahibou »), ou avec le nom en arabe.
                    </p>
                    <p className={`text-sm ${soft}`}>
                        Vous pouvez aussi parcourir la liste complète des{' '}
                        <Link href="/xassidas" className={`underline font-semibold ${accent}`}>xassidas</Link> ou des{' '}
                        <Link href="/livres" className={`underline font-semibold ${accent}`}>livres</Link>, ou poser la question à l’assistant (la bulle verte en bas à droite).
                    </p>
                </div>
            )}

            {livres.length > 0 && (
                <div className="mb-10">
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${accent}`}>Livres ({livres.length})</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {livres.slice(0, MAX_SHOWN).map((l) => (
                            <li key={l.slug}>
                                <Link href={`/livres/${l.slug}`} className={link}>
                                    <span>
                                        <span className="block text-base font-bold font-serif">{l.title}</span>
                                        <span className={`block text-xs ${accent}`}>Par {l.author}</span>
                                    </span>
                                    <span className={`shrink-0 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-400/20 ${accent}`}>Livre</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {xassidas.length > 0 && (
                <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${accent}`}>Xassidas ({xassidas.length})</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {xassidas.slice(0, MAX_SHOWN).map((x) => (
                            <li key={x.slug}>
                                <Link href={`/xassidas/${x.slug}`} className={link}>
                                    <span>
                                        <span className="block text-base font-bold font-serif">{x.title}</span>
                                        <span className={`block text-xs ${accent}`}>Par {x.author}</span>
                                    </span>
                                    {x.arabic && (
                                        <span dir="rtl" lang="ar" className={`shrink-0 text-lg ${accent}`} style={{ fontFamily: ARABIC_FONT }}>{x.arabic}</span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(xassidas.length > MAX_SHOWN || livres.length > MAX_SHOWN) && (
                <p className={`text-xs mt-6 ${soft}`}>
                    Les {MAX_SHOWN} premiers résultats de chaque catégorie sont affichés. Précisez votre recherche ou ouvrez la liste complète des{' '}
                    <Link href="/xassidas" className="underline font-semibold">xassidas</Link>.
                </p>
            )}
        </section>
    );
}
