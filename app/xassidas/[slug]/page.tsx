/* Emplacement : app/xassidas/[slug]/page.tsx
 *
 * Une page par xassida : /xassidas/midadi, /xassidas/mawahibou-nafih-ar, …
 * Rendue côté serveur : Google lit directement le titre, le texte arabe et la description.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { XASSIDAS, XASSIDA_BY_SLUG, SITE_NAME, siteUrl, closestSlug } from '../../lib/catalog';
import XassidaView from './XassidaView';

type Props = { params: Promise<{ slug: string }> };

// Génère les 333 pages au moment du build (rapides et bien indexées)
export function generateStaticParams() {
    return XASSIDAS.map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const x = XASSIDA_BY_SLUG[slug];
    if (!x) return { title: 'Xassida introuvable', robots: { index: false } };

    const url = `${siteUrl()}/xassidas/${x.slug}`;
    const title = `${x.title}${x.arabic ? ` (${x.arabic})` : ''} — lire et télécharger | ${SITE_NAME}`;
    const description = `${x.desc} Lisez « ${x.title} » de ${x.author} en ligne ou téléchargez-la en PDF sur ${SITE_NAME}.`;

    return {
        title: { absolute: title },
        description,
        alternates: { canonical: url },
        // L'image d'aperçu vient de opengraph-image.tsx (propre à chaque xassida)
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME, locale: 'fr_FR' },
        twitter: { card: 'summary_large_image', title, description }
    };
}

export default async function XassidaPage({ params }: Props) {
    const { slug } = await params;
    const x = XASSIDA_BY_SLUG[slug];

    if (!x) {
        // Petite faute dans l'adresse (ex. lien généré par le chatbot) : on redirige vers la xassida la plus proche
        const near = closestSlug(slug);
        if (near) redirect(`/xassidas/${near}`);
        notFound();
    }

    // Xassidas liées (même début de nom, ex. toutes les « Mawahibou… »), sinon voisines dans l'ordre alphabétique
    const idx = XASSIDAS.findIndex((i) => i.slug === x.slug);
    const prefix = x.slug.slice(0, 6);
    const related = XASSIDAS.filter((i) => i.slug !== x.slug && i.slug.startsWith(prefix)).slice(0, 8);
    const prev = idx > 0 ? XASSIDAS[idx - 1] : null;
    const next = idx < XASSIDAS.length - 1 ? XASSIDAS[idx + 1] : null;

    const url = `${siteUrl()}/xassidas/${x.slug}`;
    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: x.title,
            alternateName: x.arabic || undefined,
            description: x.desc,
            author: { '@type': 'Person', name: x.author },
            url,
            isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: siteUrl() }
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl() },
                { '@type': 'ListItem', position: 2, name: 'Xassidas', item: `${siteUrl()}/xassidas` },
                { '@type': 'ListItem', position: 3, name: x.title, item: url }
            ]
        }
    ];

    return (
        <>
            <script
                type="application/ld+json"
                // "<" échappé pour éviter toute injection dans la balise script
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            <XassidaView
                x={x}
                related={related.map(({ slug, title, arabic }) => ({ slug, title, arabic }))}
                prev={prev ? { slug: prev.slug, title: prev.title } : null}
                next={next ? { slug: next.slug, title: next.title } : null}
            />
        </>
    );
}
