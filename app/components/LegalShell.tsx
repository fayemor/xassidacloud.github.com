"use client";

/* Emplacement : app/components/LegalShell.tsx
 * Habillage commun des pages légales (même design que le reste du site, mode sombre inclus). */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
    { id: 'top', label: 'Accueil', href: '/' },
    { id: 'xassidas', label: 'Xassidas', href: '/xassidas' },
    { id: 'livres', label: 'Livres', href: '/livres' },
    { id: 'videos', label: 'Vidéos', href: '/videos' }
];

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
const SUN = 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
const MOON = 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z';

/* ---- Éléments de texte réutilisables ---- */
export const H2 = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl sm:text-2xl font-bold font-serif mt-10 mb-3">{children}</h2>
);
export const P = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm sm:text-base leading-relaxed opacity-90 mb-3">{children}</p>
);
export const UL = ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-2 text-sm sm:text-base leading-relaxed opacity-90 mb-3">{children}</ul>
);

export default function LegalShell({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);

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

    const accent = dark ? 'text-amber-400' : 'text-amber-700';
    const chip = dark ? 'bg-emerald-900/30 hover:bg-emerald-900/50' : 'bg-emerald-900/10 hover:bg-emerald-900/20';
    const navIdle = dark ? 'text-gray-300 hover:text-white' : 'text-[#0F3D2E]/80 hover:text-[#0F3D2E]';

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col ${dark ? 'bg-[#041c14] text-[#e2e8f0]' : 'bg-[#FCFCFA] text-[#0F3D2E]'}`}>
            <header className={`sticky top-0 z-40 backdrop-blur-xl border-b ${dark ? 'bg-[#041c14]/90 border-emerald-900/30' : 'bg-[#FCFCFA]/90 border-emerald-900/10'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-3 group min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <Logo className="w-7 h-7 text-amber-300" />
                        </div>
                        <span className={`text-lg sm:text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#0F3D2E]'}`}>Xassida Cloud</span>
                    </Link>
                    <nav aria-label="Navigation principale" className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-full border ${dark ? 'bg-emerald-950/40 border-emerald-800/30' : 'bg-emerald-900/5 border-emerald-900/10'}`}>
                        {NAV_ITEMS.map((item) => (
                            <Link key={item.id} href={item.href} className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${navIdle}`}>{item.label}</Link>
                        ))}
                    </nav>
                    <button type="button" onClick={() => setDark(!dark)} className={`p-2.5 rounded-xl transition-colors shadow-sm ${chip} ${accent}`} aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={dark ? SUN : MOON} /></svg>
                    </button>
                </div>
            </header>

            <main className="flex-grow max-w-3xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
                <nav aria-label="Fil d’Ariane" className={`text-xs mb-6 flex items-center gap-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Link href="/" className="hover:underline">Accueil</Link>
                    <span aria-hidden="true">/</span>
                    <span className={accent} aria-current="page">{title}</span>
                </nav>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif mb-2">{title}</h1>
                <p className={`text-xs mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Dernière mise à jour : {updated}</p>
                <div>{children}</div>
            </main>

            <footer className={`border-t py-8 mt-auto ${dark ? 'bg-[#020e0a] border-emerald-900/40 text-gray-400' : 'bg-[#0F3D2E] border-emerald-900/40 text-emerald-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium">
                    <p>© {new Date().getFullYear()} Xassida Cloud. Version 3.0 Tous droits réservés.</p>
                    <div className="flex gap-6">
                        <Link href="/conditions" className="hover:text-amber-300 transition-colors">Conditions d’utilisation</Link>
                        <Link href="/confidentialite" className="hover:text-amber-300 transition-colors">Politique de confidentialité</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
