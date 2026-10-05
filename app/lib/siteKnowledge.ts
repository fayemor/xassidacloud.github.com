/* Emplacement : app/lib/siteKnowledge.ts
 *
 * Base de connaissances du chatbot. Les XASSIDAS viennent de app/lib/catalog.ts (source unique) :
 * chaque ajout là-bas est automatiquement connu du chatbot, avec le lien vers sa page.
 * Les LIVRES viennent aussi du catalogue. Seules les VIDÉOS se mettent à jour ci-dessous.
 */

import { XASSIDAS, LIVRES, SITE_NAME } from './catalog';

/** [titre, description] — à remplir avec vos vraies vidéos */
const VIDEOS: [string, string][] = [
    // ['Titre de la vidéo', 'Courte description'],
];

export { SITE_NAME };

export function buildCatalog(): string {
    const x = XASSIDAS.map((i) => `- ${i.title}${i.arabic ? ` (${i.arabic})` : ''} → /xassidas/${i.slug}${i.desc ? ` : ${i.desc}` : ''}`).join('\n');
    const l = LIVRES.map((i) => `- ${i.title} — ${i.author} → /livres/${i.slug}`).join('\n');
    const v = VIDEOS.length
        ? VIDEOS.map(([t, d]) => `- ${t}${d ? ` : ${d}` : ''}`).join('\n')
        : "(La liste des vidéos n'est pas fournie à l'assistant.)";
    return [
        `## XASSIDAS (${XASSIDAS.length}) — chaque xassida a sa propre page, dont le chemin est donné après la flèche →`,
        x,
        '',
        `## LIVRES (${LIVRES.length}) — chaque livre a sa propre page, dont le chemin est donné après la flèche →`,
        l,
        '',
        '## VIDÉOS — page /videos',
        v
    ].join('\n');
}
