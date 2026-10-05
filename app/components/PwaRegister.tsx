"use client";

/* Emplacement : app/components/PwaRegister.tsx
 * 1) Enregistre le service worker (en production uniquement).
 * 2) Propose d'installer l'application : bouton sur Android/ordinateur, explication sur iPhone. */

import React, { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const DISMISS_KEY = 'xassida_install_dismissed';

export default function PwaRegister() {
    const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
    const [showIosTip, setShowIosTip] = useState(false);

    useEffect(() => {
        // 1) Service worker : pas en développement, pour ne pas gêner le rechargement à chaud
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            navigator.serviceWorker.register('/sw.js').catch(() => { /* non bloquant */ });
        }

        // Déjà installée (ouverte comme une application) ou invitation déjà refusée : on ne dit rien
        const standalone = window.matchMedia?.('(display-mode: standalone)').matches
            || (navigator as Navigator & { standalone?: boolean }).standalone === true;
        let dismissed = false;
        try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignoré */ }
        if (standalone || dismissed) return;

        // 2a) Android / ordinateur (Chrome, Edge…)
        const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvent(e as InstallEvent); };
        const onInstalled = () => setInstallEvent(null);
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        // 2b) iPhone / iPad : pas de bouton possible, on explique le geste
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
        if (isIos && isSafari) setShowIosTip(true);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const dismiss = () => {
        setInstallEvent(null);
        setShowIosTip(false);
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignoré */ }
    };

    const install = async () => {
        if (!installEvent) return;
        await installEvent.prompt();
        await installEvent.userChoice.catch(() => undefined);
        setInstallEvent(null);
    };

    if (!installEvent && !showIosTip) return null;

    return (
        <div
            role="region"
            aria-label="Installer l'application"
            className="fixed bottom-5 left-5 right-24 sm:right-auto sm:max-w-xs z-[44] bg-[#0F3D2E] text-amber-100 border border-amber-400/40 shadow-2xl rounded-2xl pl-4 pr-2 py-2.5 flex items-center gap-3 text-xs"
        >
            {installEvent ? (
                <>
                    <span className="flex-1 leading-snug">Installer Xassida Cloud sur votre appareil</span>
                    <button type="button" onClick={install} className="shrink-0 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-bold px-3 py-2 rounded-xl transition-colors">Installer</button>
                </>
            ) : (
                <span className="flex-1 leading-snug">
                    Pour installer : touchez <strong>Partager</strong> puis <strong>« Sur l’écran d’accueil »</strong>.
                </span>
            )}
            <button type="button" onClick={dismiss} aria-label="Fermer" className="shrink-0 p-2 rounded-full hover:bg-white/10 text-emerald-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}
