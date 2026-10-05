/* Emplacement : app/videos/layout.tsx
 * Donne un titre et une description à la page de liste (qui est un composant client et ne peut pas les définir elle-même). */

import type { Metadata } from 'next';
import { siteUrl } from '../lib/catalog';

export const metadata: Metadata = {
    title: { absolute: 'Vidéos, conférences et documentaires mourides | Xassida Cloud' },
    description: 'Récitations, conférences, causeries et documentaires sur Cheikh Ahmadou Bamba et le patrimoine mouride, à regarder directement en ligne.',
    alternates: { canonical: `${siteUrl()}/videos` }
};

export default function VideosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
