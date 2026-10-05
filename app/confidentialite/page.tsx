/* Emplacement : app/confidentialite/page.tsx  →  /confidentialite */

import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell, { H2, P, UL } from '../components/LegalShell';
import { EDITOR_NAME, CONTACT_EMAIL, COUNTRY, LAST_UPDATE } from '../lib/legal';
import { siteUrl, SITE_NAME } from '../lib/catalog';

export const metadata: Metadata = {
    title: { absolute: `Politique de confidentialité | ${SITE_NAME}` },
    description: `Quelles données ${SITE_NAME} collecte, pourquoi, avec qui elles sont partagées (dont l’assistant automatisé) et comment exercer vos droits.`,
    alternates: { canonical: `${siteUrl()}/confidentialite` }
};

export default function ConfidentialitePage() {
    return (
        <LegalShell title="Politique de confidentialité" updated={LAST_UPDATE}>
            <P>
                Cette page explique, simplement, quelles informations {SITE_NAME} ({siteUrl()}) utilise, pourquoi, et quels
                sont vos droits. Nous ne vendons pas vos données et nous n’affichons aucune publicité.
            </P>

            <H2>1. Qui est responsable ?</H2>
            <P>
                Le site est édité par {EDITOR_NAME}. Contact pour toute question sur vos données :{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-semibold">{CONTACT_EMAIL}</a>.
            </P>

            <H2>2. Les données que nous traitons</H2>
            <UL>
                <li>
                    <strong>Votre compte (facultatif)</strong> : adresse email, nom affiché et identifiant de compte. La
                    connexion est assurée par Firebase Authentication (Google). Votre mot de passe est géré par ce service : nous
                    n’y avons pas accès. Si vous choisissez « Continuer avec Google », nous recevons le nom et l’email de
                    votre compte Google.
                </li>
                <li>
                    <strong>Vos favoris</strong> : enregistrés uniquement sur votre appareil (stockage local du navigateur),
                    et non envoyés à nos serveurs.
                </li>
                <li>
                    <strong>Vos préférences d’affichage</strong> (mode clair ou sombre) : enregistrées sur votre appareil.
                </li>
                <li>
                    <strong>Vos signalements d’erreur</strong> : le message que vous écrivez, la xassida ou le livre
                    concerné et, si vous êtes connecté, votre identifiant, votre nom ou votre email, pour pouvoir traiter
                    votre signalement.
                </li>
                <li>
                    <strong>L’assistant automatisé</strong> : les messages que vous lui envoyez (voir le point 4).
                </li>
                <li>
                    <strong>Statistiques de visite</strong> : pages consultées, pays approximatif, type d’appareil et de
                    navigateur, de façon anonymisée, pour savoir quels contenus sont utiles. Elles sont mesurées par
                    Vercel Web Analytics, qui fonctionne sans cookie.
                </li>
                <li>
                    <strong>Données techniques</strong> : adresse IP et informations du navigateur, traitées par notre
                    hébergeur pour servir le site, assurer sa sécurité et limiter le nombre de messages envoyés à l’assistant.
                </li>
            </UL>

            <H2>3. Pourquoi ces données ?</H2>
            <UL>
                <li>Vous permettre de créer un compte, de vous connecter et de retrouver vos favoris.</li>
                <li>Corriger les erreurs que vous nous signalez.</li>
                <li>Faire fonctionner l’assistant et éviter les abus.</li>
                <li>Mesurer la fréquentation du site pour l’améliorer.</li>
                <li>Assurer la sécurité et le bon fonctionnement du site.</li>
            </UL>

            <H2>4. L’assistant automatisé (intelligence artificielle)</H2>
            <P>
                Quand vous écrivez à l’assistant, votre message et l’historique récent de la conversation sont envoyés à
                l’API Gemini de <strong>Google</strong>, qui génère la réponse. Selon les conditions du service gratuit de
                Google, ces échanges peuvent être utilisés par Google pour améliorer ses produits.
            </P>
            <P>
                <strong>Pour cette raison, n’écrivez pas d’informations personnelles ou sensibles</strong> (mot de passe,
                numéro de téléphone, adresse, situation de santé ou familiale…) dans la conversation.
            </P>
            <P>
                De notre côté, nous ne conservons pas l’historique de vos conversations sur nos serveurs. Votre conversation
                reste dans votre navigateur le temps de la session, et vous pouvez l’effacer avec le bouton « Nouvelle conversation ».
            </P>

            <H2>5. Services tiers qui peuvent recevoir des données techniques</H2>
            <UL>
                <li><strong>Google (Firebase, Gemini)</strong> : connexion, signalements et assistant.</li>
                <li><strong>Google Drive</strong> : affichage et téléchargement des fichiers PDF. Google peut recevoir votre adresse IP lorsque vous ouvrez un document.</li>
                <li><strong>YouTube ou Google Drive</strong> : lecture des vidéos intégrées, selon la vidéo.</li>
                <li><strong>Notre hébergeur (Vercel)</strong> : diffusion du site, journaux techniques et statistiques de visite anonymisées.</li>
            </UL>
            <P>Ces services ont leurs propres politiques de confidentialité, sur lesquelles nous n’avons pas de contrôle.</P>

            <H2>6. Cookies et stockage local</H2>
            <P>
                Nous n’utilisons <strong>aucun cookie publicitaire ni outil de suivi publicitaire</strong>. Nos statistiques de visite sont anonymisées et fonctionnent sans cookie. Le site utilise uniquement le
                stockage de votre navigateur pour fonctionner : votre session de connexion, vos favoris, votre choix de
                mode clair ou sombre et votre conversation avec l’assistant. Vous pouvez les supprimer à tout moment dans les
                réglages de votre navigateur.
            </P>

            <H2>7. Combien de temps ?</H2>
            <UL>
                <li>Compte : tant que vous ne demandez pas sa suppression.</li>
                <li>Signalements : le temps nécessaire pour les traiter, puis ils sont supprimés ou anonymisés.</li>
                <li>Journaux techniques : selon la durée fixée par notre hébergeur, en général courte.</li>
                <li>Favoris, préférences et conversation : sur votre appareil, jusqu’à ce que vous les supprimiez.</li>
            </UL>

            <H2>8. Vos droits</H2>
            <P>
                Vous pouvez demander à accéder à vos données, à les corriger, à supprimer votre compte ou à vous opposer à un
                traitement, en écrivant à{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-semibold">{CONTACT_EMAIL}</a>. Nous
                répondrons dans un délai raisonnable.
            </P>
            <P>
                Au {COUNTRY}, la protection des données personnelles est encadrée par la loi n° 2008-12 du 25 janvier 2008. Si
                vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission de protection des
                Données Personnelles (CDP).
            </P>

            <H2>9. Sécurité</H2>
            <P>
                Les échanges avec le site sont chiffrés (HTTPS) et la gestion des mots de passe est confiée à Firebase. Aucun
                système n’est parfaitement infaillible : choisissez un mot de passe unique et ne le partagez pas.
            </P>

            <H2>10. Mineurs</H2>
            <P>
                Le site est accessible à tous. Nous invitons les enfants à demander l’accord d’un parent avant de créer un
                compte ou d’écrire à l’assistant.
            </P>

            <H2>11. Mises à jour</H2>
            <P>
                Nous pouvons modifier cette politique, par exemple si nous ajoutons un service. La date de mise à jour est
                indiquée en haut de la page. Voir aussi nos{' '}
                <Link href="/conditions" className="underline font-semibold">conditions d’utilisation</Link>.
            </P>
        </LegalShell>
    );
}
