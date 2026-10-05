"use client";

/* Emplacement : app/xassidas/[slug]/XassidaView.tsx */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Xassida } from '../../lib/catalog';

const ARABIC_FONT = "'Amiri','Scheherazade New','Noto Naskh Arabic',serif";

const NAV_ITEMS = [
    { id: 'top', label: 'Accueil', href: '/' },
    { id: 'xassidas', label: 'Xassidas', href: '/xassidas' },
    { id: 'livres', label: 'Livres', href: '/livres' },
    { id: 'videos', label: 'Vidéos', href: '/videos' }
];

interface Props {
    x: Xassida;
    related: { slug: string; title: string; arabic: string }[];
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
}

const Logo = ({ className = 'w-8 h-8' }) => (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <defs>
            <mask id="xc-logo-mask">
                <rect width="36" height="36" fill="white" />
                <path d="M18 20.75 10.5 18.25v7.5l7.5 2.5zM18 20.75l7.5-2.5v7.5L18 28.25z" fill="black" />
                <path d="M18 20.75v7.5" stroke="white" strokeWidth="0.6" />
            </mask>
        </defs>
        <g mask="url(#xc-logo-mask)" fill="currentColor">
            <rect x="2" y="18.75" width="32" height="12" rx="6" />
            <circle cx="10" cy="19.25" r="7.5" />
            <circle cx="19.5" cy="15.25" r="10" />
            <circle cx="28" cy="20.25" r="7" />
        </g>
    </svg>
);

const Icon = ({ d, c = 'w-4 h-4' }: { d: string; c?: string }) => (
    <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);
const SUN = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
const MOON = 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z';
const DOWNLOAD = 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4';

export default function XassidaView({ x, related, prev, next }: Props) {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    /* Même préférence de thème que les autres pages */
    useEffect(() => {
        let initial = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        try {
            const saved = localStorage.getItem('xassida_dark');
            if (saved !== null) initial = JSON.parse(saved) === true;
        } catch { /* ignoré */ }
        setDark(initial);
        setMounted(true);
    }, []);
    useEffect(() => {
        if (!mounted) return;
        document.documentElement.classList.toggle('dark', dark);
        try { localStorage.setItem('xassida_dark', JSON.stringify(dark)); } catch { /* ignoré */ }
    }, [dark, mounted]);

    const t = {
        page: dark ? 'bg-[#041c14] text-[#e2e8f0]' : 'bg-[#FCFCFA] text-[#0F3D2E]',
        card: dark ? 'bg-[#0d261e] border-emerald-800/50' : 'bg-white border-emerald-900/10',
        accent: dark ? 'text-amber-400' : 'text-amber-700',
        muted: dark ? 'text-gray-300' : 'text-gray-600',
        soft: dark ? 'text-gray-400' : 'text-gray-500',
        title: dark ? 'text-white' : 'text-[#0F3D2E]',
        chip: dark ? 'bg-emerald-900/30 hover:bg-emerald-900/50' : 'bg-emerald-900/10 hover:bg-emerald-900/20',
        navIdle: dark ? 'text-gray-300 hover:text-white' : 'text-[#0F3D2E]/80 hover:text-[#0F3D2E]'
    };

    const downloadHref = `/api/download?id=${encodeURIComponent(x.fileId)}&name=${encodeURIComponent(`${x.slug}.pdf`)}`;

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col ${t.page}`}>
            {/* NAVIGATION */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${dark ? 'bg-[#041c14]/90 border-emerald-900/30' : 'bg-[#FCFCFA]/90 border-emerald-900/10'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-3 group min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <Logo className="w-7 h-7 text-amber-300" />
                        </div>
                        <span className={`text-lg sm:text-xl font-bold tracking-tight ${t.title}`}>Xassida Cloud</span>
                    </Link>

                    <nav aria-label="Navigation principale" className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-full border ${dark ? 'bg-emerald-950/40 border-emerald-800/30' : 'bg-emerald-900/5 border-emerald-900/10'}`}>
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                aria-current={item.id === 'xassidas' ? 'page' : undefined}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${item.id === 'xassidas' ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : t.navIdle}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <button
                        type="button"
                        onClick={() => setDark(!dark)}
                        className={`p-2.5 rounded-xl transition-colors shadow-sm ${t.chip} ${t.accent}`}
                        aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
                    >
                        <Icon d={dark ? SUN : MOON} c="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
                {/* Fil d'Ariane */}
                <nav aria-label="Fil d’Ariane" className={`text-xs mb-6 flex flex-wrap items-center gap-2 ${t.soft}`}>
                    <Link href="/" className="hover:underline">Accueil</Link>
                    <span aria-hidden="true">/</span>
                    <Link href="/xassidas" className="hover:underline">Xassidas</Link>
                    <span aria-hidden="true">/</span>
                    <span className={t.accent} aria-current="page">{x.title}</span>
                </nav>

                {/* En-tête de la xassida */}
                <article>
                    <header className="space-y-3 mb-8">
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif">{x.title}</h1>
                        {x.arabic && (
                            <p dir="rtl" lang="ar" className={`text-3xl sm:text-4xl leading-relaxed ${t.accent}`} style={{ fontFamily: ARABIC_FONT }}>{x.arabic}</p>
                        )}
                        <p className={`text-sm font-medium ${t.accent}`}>Par {x.author}</p>
                        <p className={`text-sm sm:text-base leading-relaxed ${t.muted}`}>{x.desc}</p>
                    </header>

                    {/* Lecteur intégré */}
                    <section aria-label={`Lecture de ${x.title}`} className="mb-6 rounded-2xl overflow-hidden border border-emerald-900/20 bg-black">
                        <iframe
                            src={`https://drive.google.com/file/d/${x.fileId}/preview`}
                            className="w-full h-[70vh] sm:h-[80vh]"
                            loading="lazy"
                            allow="autoplay"
                            title={`Lecture de ${x.title}`}
                        />
                    </section>

                    <div className="flex flex-col sm:flex-row gap-3 mb-12">
                        <a
                            href={downloadHref}
                            download={`${x.slug}.pdf`}
                            className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-semibold py-3.5 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            <Icon d={DOWNLOAD} />
                            <span>Télécharger en PDF</span>
                        </a>
                        <Link href="/xassidas" className="px-6 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-medium py-3.5 rounded-xl text-sm transition-colors text-center">
                            Toutes les xassidas
                        </Link>
                    </div>

                    <section className={`mb-12 text-sm leading-relaxed ${t.muted}`}>
                        <h2 className={`text-lg font-bold font-serif mb-2 ${t.title}`}>À propos de cette xassida</h2>
                        <p>
                            « {x.title} » est un texte de {x.author}. Vous pouvez le lire directement sur cette page, ou le télécharger au format PDF pour le garder sur votre appareil.
                            Si vous remarquez une erreur dans le texte, signalez-la depuis la page <Link href="/xassidas" className={`underline font-semibold ${t.accent}`}>Xassidas</Link>.
                        </p>
                    </section>
                </article>

                {/* Xassidas liées */}
                {related.length > 0 && (
                    <section aria-labelledby="related-title" className="mb-12">
                        <h2 id="related-title" className="text-lg font-bold font-serif mb-4">Dans la même famille</h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={`/xassidas/${r.slug}`} className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${t.card}`}>
                                        <span className="text-sm font-semibold">{r.title}</span>
                                        {r.arabic && <span dir="rtl" lang="ar" className={`text-base ${t.accent}`} style={{ fontFamily: ARABIC_FONT }}>{r.arabic}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Précédente / suivante */}
                <nav aria-label="Autres xassidas" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prev ? (
                        <Link href={`/xassidas/${prev.slug}`} className={`p-4 rounded-2xl border text-sm ${t.card}`}>
                            <span className={`block text-[11px] uppercase tracking-wider ${t.soft}`}>← Précédente</span>
                            <span className="font-semibold">{prev.title}</span>
                        </Link>
                    ) : <span />}
                    {next && (
                        <Link href={`/xassidas/${next.slug}`} className={`p-4 rounded-2xl border text-sm sm:text-right ${t.card}`}>
                            <span className={`block text-[11px] uppercase tracking-wider ${t.soft}`}>Suivante →</span>
                            <span className="font-semibold">{next.title}</span>
                        </Link>
                    )}
                </nav>
            </main>

            <footer className={`border-t py-8 mt-auto ${dark ? 'bg-[#020e0a] border-emerald-900/40 text-gray-400' : 'bg-[#0F3D2E] border-emerald-900/40 text-emerald-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium">
                    <p>© {new Date().getFullYear()} Xassida Cloud. Tous droits réservés.</p>
                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.id}><Link href={item.href} className="hover:text-amber-300 transition-colors">{item.label}</Link></li>
                        ))}
                    </ul>
                </div>
            </footer>
        </div>
    );
}
