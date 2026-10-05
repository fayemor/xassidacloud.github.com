/* Emplacement : app/livres/[slug]/opengraph-image.tsx
 * Génère automatiquement l'image d'aperçu de CHAQUE livre (WhatsApp, Facebook, X, Telegram…),
 * avec son titre. Next.js l'ajoute tout seul aux balises de partage de la page. */

import { ImageResponse } from 'next/og';
import { LIVRES, LIVRE_BY_SLUG, SITE_NAME, siteUrl } from '../../lib/catalog';
import { LOGO_DATA_URI } from '../../lib/logoData';

export const alt = 'Livre à lire et télécharger sur Xassida Cloud';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
    return LIVRES.map((x) => ({ slug: x.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const x = LIVRE_BY_SLUG[slug];
    const title = x?.title ?? 'Livre';
    const author = x?.author ?? 'Cheikh Ahmadou Bamba';
    const host = siteUrl().replace(/^https?:\/\//, '');
    const titleSize = title.length > 34 ? 56 : title.length > 22 ? 72 : 92;

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '64px 72px',
                    background: 'linear-gradient(135deg, #0F3D2E 0%, #041c14 60%, #020b08 100%)',
                    color: '#ffffff',
                    border: '2px solid rgba(251,191,36,0.45)',
                }}
            >
                {/* En-tête : logo + nom du site */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={LOGO_DATA_URI} width={88} height={88} alt="" />
                    <div style={{ display: 'flex', marginLeft: 22, fontSize: 38, color: '#fcd34d' }}>{SITE_NAME}</div>
                </div>

                {/* Titre de la xassida */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
                    <div style={{ display: 'flex', marginTop: 24, fontSize: 36, color: '#d1fae5' }}>{`Livre de ${author}`}</div>
                </div>

                {/* Pied : usage + adresse */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, color: '#a7f3d0' }}>
                    <div style={{ display: 'flex' }}>Lire en ligne · Télécharger en PDF</div>
                    <div style={{ display: 'flex' }}>{host}</div>
                </div>
            </div>
        ),
        { ...size }
    );
}
