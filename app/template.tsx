/* Emplacement : app/template.tsx
 *
 * Un « template » est recréé à chaque navigation : la nouvelle page apparaît en fondu doux
 * au lieu de surgir d'un coup. Le fondu n'utilise que l'opacité (pas de transform) pour ne pas
 * casser les éléments « sticky » et « fixed » (menu, barre de recherche fixe, chat). */

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <div className="xc-page flex flex-1 flex-col">
            <style>{`
        @keyframes xcPageIn { from { opacity: 0; } to { opacity: 1; } }
        .xc-page { animation: xcPageIn .35s ease-out backwards; }
        @media (prefers-reduced-motion: reduce) { .xc-page { animation: none; } }
      `}</style>
            {children}
        </div>
    );
}