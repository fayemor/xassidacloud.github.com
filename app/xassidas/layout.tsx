/* Emplacement : app/xassidas/layout.tsx
 * Donne un titre et une description à la page de liste (qui est un composant client et ne peut pas les définir elle-même). */

import type { Metadata } from 'next';
import { siteUrl } from '../lib/catalog';

export const metadata: Metadata = {
    title: { absolute: 'Xassidas de Cheikh Ahmadou Bamba à lire et télécharger | Xassida Cloud' },
    description: 'Plus de 300 xassidas de Cheikh Ahmadou Bamba (Khadimou Rassoul) à lire en ligne et à télécharger en PDF : Midadi, Jazbul Quloob, Mawahibou Nafih, Matlaboul Fawzayni et bien d’autres.',
    alternates: { canonical: `${siteUrl()}/xassidas` }
};

export default function XassidasLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
