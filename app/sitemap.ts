/* Emplacement : app/sitemap.ts  →  généré automatiquement sur /sitemap.xml */

import type { MetadataRoute } from 'next';
import { XASSIDAS, LIVRES, siteUrl } from './lib/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
    const base = siteUrl();
    const now = new Date();

    return [
        { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
        { url: `${base}/xassidas`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/livres`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        { url: `${base}/videos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        ...XASSIDAS.map((x) => ({
            url: `${base}/xassidas/${x.slug}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.7
        })),
        ...LIVRES.map((l) => ({
            url: `${base}/livres/${l.slug}`,
            lastModified: now,
            changeFrequency: 'monthly' as const,
            priority: 0.7
        }))
    ];
}
