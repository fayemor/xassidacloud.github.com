"use client";

/* Emplacement : app/components/PageTransition.tsx
 *
 * Transition entre les pages + indicateur de chargement :
 *  - au clic sur un lien interne : une barre dorée apparaît en haut tout de suite (on voit que « ça charge »),
 *    la page actuelle s'efface en fondu, puis on navigue ;
 *  - si la nouvelle page tarde (connexion lente), un rond de chargement avec « Chargement… » s'affiche au centre ;
 *  - dès que la nouvelle page est là, le chargement disparaît et la page apparaît en fondu.
 * Seule l'opacité de la page est animée : le menu fixe, la barre de recherche fixe et le chat ne sont pas perturbés. */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const OUT_MS = 180;          // durée du fondu de sortie
const SPINNER_DELAY_MS = 350; // le rond n'apparaît que si la page tarde (évite un éclair sur les navigations rapides)
const GIVE_UP_MS = 20000;    // au-delà, on ré-affiche la page actuelle et on prévient

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const ref = useRef<HTMLDivElement>(null);
    const leaving = useRef(false);
    const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [loading, setLoading] = useState(false);
    const [dark, setDark] = useState(false);
    const [failed, setFailed] = useState(false);

    /* Nouvelle page arrivée : fin du chargement, fondu d'arrivée (posé avant l'affichage à l'écran) */
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (safety.current) clearTimeout(safety.current);
        leaving.current = false;
        setLoading(false);
        setFailed(false);
        el.classList.remove('xc-out', 'xc-in');
        void el.offsetWidth; // relance l'animation
        el.classList.add('xc-in');
    }, [pathname]);

    /* Intercepte les clics sur les liens internes */
    useEffect(() => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            const url = new URL(a.href, window.location.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname) return; // même page ou simple ancre (#section)
            if (leaving.current) { e.preventDefault(); return; }

            e.preventDefault();
            leaving.current = true;
            setDark(document.documentElement.classList.contains('dark'));
            setFailed(false);
            setLoading(true);
            if (!reduce) ref.current?.classList.add('xc-out');
            const target = url.pathname + url.search + url.hash;
            setTimeout(() => router.push(target), reduce ? 0 : OUT_MS);

            // Connexion vraiment trop lente : on ré-affiche la page actuelle et on le dit
            safety.current = setTimeout(() => {
                leaving.current = false;
                ref.current?.classList.remove('xc-out');
                setFailed(true);
                setTimeout(() => { setLoading(false); setFailed(false); }, 4000);
            }, GIVE_UP_MS);
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [router]);

    return (
        <>
            <style>{`
        @keyframes xcPageIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes xcBar { 0% { width: 0; } 30% { width: 55%; } 70% { width: 82%; } 100% { width: 92%; } }
        @keyframes xcShow { from { opacity: 0; } to { opacity: 1; } }
        @keyframes xcSpin { to { transform: rotate(360deg); } }
        .xc-wrap { transition: opacity ${OUT_MS}ms ease; }
        .xc-wrap.xc-in { animation: xcPageIn .45s ease-out backwards; }
        .xc-wrap.xc-out { opacity: 0; }
        .xc-bar { animation: xcBar 12s cubic-bezier(.1,.6,.3,1) forwards; }
        .xc-late { animation: xcShow .3s ease-out ${SPINNER_DELAY_MS}ms both; }
        .xc-ring { animation: xcSpin .9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .xc-wrap, .xc-wrap.xc-in { animation: none; transition: none; }
          .xc-ring { animation-duration: 2.4s; }
        }
      `}</style>

            <div ref={ref} className="xc-wrap flex flex-1 flex-col">
                {children}
            </div>

            {loading && (
                <>
                    {/* Barre de progression en haut : réaction immédiate au clic */}
                    <div className="fixed top-0 left-0 right-0 h-1 z-[90] pointer-events-none" aria-hidden="true">
                        <div className="xc-bar h-full rounded-r-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
                    </div>

                    {/* Rond de chargement : n'apparaît que si la page tarde */}
                    <div role="status" aria-live="polite" className="xc-late fixed inset-0 z-[85] flex items-center justify-center pointer-events-none">
                        <div className={`flex flex-col items-center gap-3 px-8 py-6 rounded-3xl border shadow-2xl backdrop-blur-md ${dark ? 'bg-[#0a2219]/90 border-emerald-800/70 text-white' : 'bg-white/90 border-emerald-900/10 text-[#0F3D2E]'}`}>
                            {failed ? (
                                <p className="text-sm font-semibold text-center max-w-[16rem]">La page met du temps à répondre. Vérifiez votre connexion puis réessayez.</p>
                            ) : (
                                <>
                                    <span className="xc-ring block w-10 h-10 rounded-full border-4 border-amber-400/30 border-t-amber-400" aria-hidden="true" />
                                    <p className="text-sm font-semibold">Chargement…</p>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}