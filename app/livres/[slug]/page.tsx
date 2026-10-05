/* Emplacement : app/livres/[slug]/page.tsx
 *
 * Une page par livre : /livres/cheikh-ibra-fall, /livres/nahju-francais, …
 * Rendue côté serveur : Google lit directement le titre, l'auteur et la description.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { LIVRES, LIVRE_BY_SLUG, SITE_NAME, siteUrl, closestLivreSlug } from '../../lib/catalog';
import LivreView from './LivreView';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
    return LIVRES.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const x = LIVRE_BY_SLUG[slug];
    if (!x) return { title: 'Livre introuvable', robots: { index: false } };

    const url = `${siteUrl()}/livres/${x.slug}`;
    const title = `${x.title} — lire et télécharger | ${SITE_NAME}`;
    const description = `${x.desc} Lisez « ${x.title} » de ${x.author} en ligne ou téléchargez-le en PDF sur ${SITE_NAME}.`;

    return {
        title: { absolute: title },
        description,
        alternates: { canonical: url },
        // L'image d'aperçu vient de opengraph-image.tsx (propre à chaque livre)
        openGraph: { type: 'book', url, title, description, siteName: SITE_NAME, locale: 'fr_FR' },
        twitter: { card: 'summary_large_image', title, description }
    };
}

export default async function LivrePage({ params }: Props) {
    const { slug } = await params;
    const x = LIVRE_BY_SLUG[slug];

    if (!x) {
        // Petite faute dans l'adresse (ex. lien généré par le chatbot) : on redirige vers le livre le plus proche
        const near = closestLivreSlug(slug);
        if (near) redirect(`/livres/${near}`);
        notFound();
    }

    // Livres liés (même début de nom, ex. toutes les versions de « Munawiru suduur »)
    const idx = LIVRES.findIndex((i) => i.slug === x.slug);
    const prefix = x.slug.slice(0, 5);
    const related = LIVRES.filter((i) => i.slug !== x.slug && i.slug.startsWith(prefix)).slice(0, 8);
    const prev = idx > 0 ? LIVRES[idx - 1] : null;
    const next = idx < LIVRES.length - 1 ? LIVRES[idx + 1] : null;

    const url = `${siteUrl()}/livres/${x.slug}`;
    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'Book',
            name: x.title,
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
                { '@type': 'ListItem', position: 2, name: 'Livres', item: `${siteUrl()}/livres` },
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
            <LivreView
                x={x}
                related={related.map(({ slug, title, author }) => ({ slug, title, author }))}
                prev={prev ? { slug: prev.slug, title: prev.title } : null}
                next={next ? { slug: next.slug, title: next.title } : null}
            />
        </>
    );
}
