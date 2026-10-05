/* Emplacement : app/livres/layout.tsx
 * Donne un titre et une description à la page de liste (qui est un composant client et ne peut pas les définir elle-même). */

import type { Metadata } from 'next';
import { siteUrl } from '../lib/catalog';

export const metadata: Metadata = {
    title: { absolute: 'Livres et ouvrages du patrimoine mouride | Xassida Cloud' },
    description: 'Livres, traductions et ouvrages sur Cheikh Ahmadou Bamba et le mouridisme, à lire en ligne ou à télécharger gratuitement.',
    alternates: { canonical: `${siteUrl()}/livres` }
};

export default function LivresLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
