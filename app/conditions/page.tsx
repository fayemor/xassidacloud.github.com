/* Emplacement : app/conditions/page.tsx  →  /conditions */

import type { Metadata } from 'next';
import Link from 'next/link';
import LegalShell, { H2, P, UL } from '../components/LegalShell';
import { EDITOR_NAME, CONTACT_EMAIL, COUNTRY, LAST_UPDATE } from '../lib/legal';
import { siteUrl, SITE_NAME } from '../lib/catalog';

export const metadata: Metadata = {
    title: { absolute: `Conditions d’utilisation | ${SITE_NAME}` },
    description: `Les règles d’utilisation du site ${SITE_NAME} : accès gratuit, propriété des contenus, assistant automatisé, responsabilités.`,
    alternates: { canonical: `${siteUrl()}/conditions` }
};

export default function ConditionsPage() {
    return (
        <LegalShell title="Conditions d’utilisation" updated={LAST_UPDATE}>
            <P>
                Bienvenue sur {SITE_NAME}, la bibliothèque numérique du patrimoine mouride. En utilisant ce site
                ({siteUrl()}), vous acceptez les conditions ci-dessous. Si vous n’êtes pas d’accord, merci de ne pas l’utiliser.
            </P>

            <H2>1. Éditeur du site</H2>
            <P>
                Le site est édité par {EDITOR_NAME}. Pour toute question, vous pouvez nous écrire à{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-semibold">{CONTACT_EMAIL}</a>.
            </P>

            <H2>2. Objet du site</H2>
            <P>
                {SITE_NAME} met à disposition, gratuitement, des xassidas de Cheikh Ahmadou Bamba, des livres, des
                traductions et des vidéos, à lire ou à regarder en ligne et, pour les textes, à télécharger.
            </P>

            <H2>3. Accès et compte</H2>
            <UL>
                <li>La consultation du site est libre et ne demande aucun compte.</li>
                <li>Un compte (email ou Google) est proposé pour enregistrer vos favoris.</li>
                <li>Vous êtes responsable de la confidentialité de votre mot de passe et des actions faites depuis votre compte.</li>
                <li>Les informations fournies à l’inscription doivent être exactes.</li>
            </UL>

            <H2>4. Utilisation autorisée</H2>
            <P>Vous vous engagez à utiliser le site de façon respectueuse. Il est notamment interdit de :</P>
            <UL>
                <li>tenter de perturber le fonctionnement du site ou d’en contourner les protections ;</li>
                <li>extraire massivement les contenus de façon automatisée (aspiration, robots) sans autorisation ;</li>
                <li>utiliser le signalement ou l’assistant pour envoyer des contenus injurieux, illicites ou mensongers ;</li>
                <li>présenter les contenus modifiés comme s’ils étaient les textes originaux.</li>
            </UL>

            <H2>5. Contenus et propriété intellectuelle</H2>
            <P>
                Les textes de Cheikh Ahmadou Bamba appartiennent au patrimoine spirituel et culturel commun. Les
                traductions, ouvrages, mises en forme, vidéos et autres contenus peuvent en revanche être protégés par
                les droits de leurs auteurs ou de leurs éditeurs, qui conservent leurs droits.
            </P>
            <P>
                Vous pouvez lire et télécharger les contenus pour un usage personnel, familial, d’étude ou de prière, et les
                partager sans modification et en citant leur source. Toute vente ou réutilisation commerciale nécessite l’accord préalable des
                titulaires de droits.
            </P>
            <P>
                Si vous êtes auteur ou titulaire de droits et estimez qu’un contenu est publié sans votre accord, écrivez-nous à{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-semibold">{CONTACT_EMAIL}</a> en précisant
                le contenu concerné : nous l’examinerons rapidement et le retirerons si nécessaire.
            </P>

            <H2>6. Exactitude des textes</H2>
            <P>
                Nous nous efforçons de présenter des textes fidèles, mais des erreurs de saisie, de numérisation ou de
                traduction peuvent subsister. Pour un usage de référence, comparez toujours avec une édition reconnue ou
                demandez conseil à une personne qualifiée. Vous pouvez nous signaler une erreur depuis le lecteur de chaque texte.
            </P>

            <H2>7. Assistant automatisé</H2>
            <P>
                Le site propose un assistant conversationnel fondé sur l’intelligence artificielle. Il aide à trouver des
                contenus et à utiliser le site. Il peut se tromper, ne connaît pas le contenu détaillé des textes et{' '}
                <strong>ne donne aucun avis religieux ou juridique</strong> (fatwa, licite ou illicite). Pour ces
                questions, adressez-vous à un érudit ou à un guide religieux qualifié. Le traitement de vos messages est expliqué dans la{' '}
                <Link href="/confidentialite" className="underline font-semibold">politique de confidentialité</Link>.
            </P>

            <H2>8. Services et liens tiers</H2>
            <P>
                Certains contenus sont affichés ou téléchargés via des services extérieurs (par exemple Google Drive ou
                YouTube). Leur disponibilité et leurs conditions ne dépendent pas de nous. Si un fichier ou une vidéo est
                indisponible, vous pouvez nous le signaler.
            </P>

            <H2>9. Disponibilité et responsabilité</H2>
            <P>
                Le site est fourni « en l’état », sans garantie de disponibilité permanente. Nous pouvons le modifier,
                l’interrompre ou retirer des contenus à tout moment. Dans la limite permise par la loi, nous ne
                pouvons être tenus responsables des dommages résultant de l’utilisation du site ou de l’impossibilité d’y accéder.
            </P>

            <H2>10. Modification des conditions</H2>
            <P>
                Ces conditions peuvent évoluer. La date de dernière mise à jour figure en haut de cette page ; continuer à
                utiliser le site après une modification vaut acceptation de la nouvelle version.
            </P>

            <H2>11. Droit applicable</H2>
            <P>
                Les présentes conditions sont soumises au droit du {COUNTRY}. En cas de litige, nous vous invitons d’abord à
                nous contacter pour trouver une solution à l’amiable.
            </P>

            <H2>12. Contact</H2>
            <P>
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-semibold">{CONTACT_EMAIL}</a>
            </P>
        </LegalShell>
    );
}
