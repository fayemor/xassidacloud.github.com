"use client";

/* Emplacement : app/videos/page.tsx */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider,
    signInWithPopup, onAuthStateChanged, signOut, updateProfile, setPersistence,
    browserLocalPersistence, Auth, User
} from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import Link from 'next/link';

/* -------------------------------------------------------------------------- */
/*  CONFIGURATION (identique à la page d'accueil et à la page Xassidas)       */
/* -------------------------------------------------------------------------- */

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

function initFirebase(): { auth: Auth | null; db: Firestore | null } {
    if (typeof window === 'undefined' || !isFirebaseConfigured) return { auth: null, db: null };
    try {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        setPersistence(authInstance, browserLocalPersistence).catch(() => { });
        return { auth: authInstance, db: getFirestore(app) };
    } catch (e) {
        console.warn('Firebase init warning:', e);
        return { auth: null, db: null };
    }
}
const { auth, db } = initFirebase();

const NOT_CONFIGURED_MSG = "Le service de connexion n'est pas configuré. Vérifiez les variables Firebase.";
const ARABIC_FONT = "'Amiri','Scheherazade New','Noto Naskh Arabic',serif";
const PAGE_SIZE = 6; // nombre de cartes affichées à la fois, dans chaque rubrique
const AUTHOR = 'Xassida Cloud';

const NAV_ITEMS = [
    { id: 'top', label: 'Accueil', href: '/' },
    { id: 'xassidas', label: 'Xassidas', href: '/xassidas' },
    { id: 'livres', label: 'Livres', href: '/livres' },
    { id: 'videos', label: 'Vidéos', href: '/videos' }
];

/* -------------------------------------------------------------------------- */
/*  UTILITAIRES                                                               */
/* -------------------------------------------------------------------------- */

const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/œ/g, 'oe');
const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const formatDuration = (total: number) => {
    if (!Number.isFinite(total) || total <= 0) return '';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

const getErrorMessage = (code?: string) => {
    switch (code) {
        case 'auth/email-already-in-use': return 'Cet email est déjà associé à un compte.';
        case 'auth/invalid-credential': return 'Identifiants incorrects.';
        case 'auth/invalid-email': return 'Adresse email invalide.';
        case 'auth/user-not-found': return 'Aucun compte trouvé.';
        case 'auth/wrong-password': return 'Mot de passe incorrect.';
        case 'auth/weak-password': return 'Le mot de passe doit contenir au moins 6 caractères.';
        case 'auth/too-many-requests': return 'Trop de tentatives. Réessayez dans quelques minutes.';
        case 'auth/network-request-failed': return 'Problème de connexion. Vérifiez votre réseau.';
        case 'auth/popup-blocked': return 'La fenêtre de connexion a été bloquée par votre navigateur.';
        case 'auth/unauthorized-domain': return "Ce domaine n'est pas autorisé dans la console Firebase.";
        case 'auth/operation-not-allowed': return "Cette méthode de connexion n'est pas activée.";
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request': return '';
        default: return 'Une erreur est survenue. Veuillez réessayer.';
    }
};

const getTheme = (dark: boolean) => ({
    page: dark ? 'bg-[#041c14] text-[#e2e8f0]' : 'bg-[#FCFCFA] text-[#0F3D2E]',
    pageBg: dark ? 'bg-[#041c14]' : 'bg-[#FCFCFA]',
    card: dark ? 'bg-[#0d261e] border-emerald-800/50' : 'bg-white border-emerald-900/10',
    accent: dark ? 'text-amber-400' : 'text-amber-700',
    muted: dark ? 'text-gray-300' : 'text-gray-600',
    softMuted: dark ? 'text-gray-400' : 'text-gray-500',
    title: dark ? 'text-white' : 'text-[#0F3D2E]',
    chip: dark ? 'bg-emerald-900/30 hover:bg-emerald-900/50' : 'bg-emerald-900/10 hover:bg-emerald-900/20',
    input: dark
        ? 'bg-[#041c14] border-emerald-900/60 text-white focus:border-amber-400'
        : 'bg-emerald-50/20 border-gray-200 text-black focus:border-emerald-700',
    modal: dark ? 'bg-[#0d1f18] border-emerald-800 text-white' : 'bg-white border-emerald-900/20 text-[#0F3D2E]',
    navIdle: dark ? 'text-gray-300 hover:text-white' : 'text-[#0F3D2E]/80 hover:text-[#0F3D2E]'
});
type Theme = ReturnType<typeof getTheme>;

/* -------------------------------------------------------------------------- */
/*  SOURCES VIDÉO                                                             */
/* -------------------------------------------------------------------------- */
/*
  Trois types de sources sont acceptés dans la colonne « source » de RAW :

  1. YouTube     →  'yt:ID_VIDEO'   ou le lien complet (youtube.com/watch?v=…, youtu.be/…, shorts/…)
                    Aperçu automatique (miniature YouTube) + lecture intégrée au site.
  2. Google Drive →  'drive:ID_FICHIER'  ou le lien complet drive.google.com/file/d/…/view
                    (le fichier doit être partagé « Toute personne disposant du lien »).
  3. Fichier direct → 'https://…/video.mp4' (mp4/webm hébergé chez vous, Firebase Storage, Cloudinary…)
                    L'aperçu est la première image de la vidéo, la durée est détectée toute seule.

  → Laissez '' si la vidéo n'est pas encore prête : la carte affichera « Bientôt disponible ».
*/
type Kind = 'youtube' | 'drive' | 'file';
interface VideoSource { kind: Kind; ref: string }

function parseSource(input: string): VideoSource | null {
    const s = (input || '').trim();
    if (!s) return null;
    if (s.startsWith('yt:')) return { kind: 'youtube', ref: s.slice(3).trim() };
    if (s.startsWith('drive:')) return { kind: 'drive', ref: s.slice(6).trim() };
    const yt = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
    if (yt) return { kind: 'youtube', ref: yt[1] };
    const dr = s.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (dr) return { kind: 'drive', ref: dr[1] };
    if (/^https?:\/\//i.test(s)) return { kind: 'file', ref: s };
    return null;
}

const embedUrl = (src: VideoSource) =>
    src.kind === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${src.ref}?autoplay=1&rel=0&modestbranding=1`
        : `https://drive.google.com/file/d/${src.ref}/preview`;

const autoThumb = (src: VideoSource) =>
    src.kind === 'youtube' ? `https://i.ytimg.com/vi/${src.ref}/hqdefault.jpg`
        : src.kind === 'drive' ? `https://drive.google.com/thumbnail?id=${src.ref}&sz=w640`
            : undefined;

/* -------------------------------------------------------------------------- */
/*  DONNÉES : AJOUTEZ VOS VIDÉOS ICI (une ligne par vidéo)                    */
/* -------------------------------------------------------------------------- */
/*
  Les vidéos sont rangées PAR RUBRIQUE : ajoutez chaque vidéo dans la liste de sa rubrique
  (waxtaan, reference, kureel ou rajass). Pour créer une nouvelle rubrique, ajoutez-la dans SECTIONS
  (plus haut), dans le type SectionId, puis ajoutez sa liste ci-dessous.

  Format d'une ligne :
  ['Titre', 'العنوان بالعربية (facultatif)', 'SOURCE', 'id-unique', 'description', 'auteur (facultatif)', 'durée (facultatif)', 'miniature (facultatif)'],

  Exemples :
  ['Mon titre', '', 'yt:dQw4w9WgXcQ', 'v_exemple1', 'Description…'],
  ['Mon titre', '', 'https://www.youtube.com/watch?v=XXXXXXXXXXX', 'v_exemple2', 'Description…'],
  ['Mon titre', '', 'drive:1AbCdEfGhIjKlMnOp', 'v_exemple3', 'Description…'],
  ['Mon titre', '', 'https://monsite.com/videos/ma-video.mp4', 'v_exemple4', 'Description…', 'Auteur', '12:30', '/miniatures/ma-video.jpg'],

  → La durée et la miniature sont facultatives (détectées automatiquement quand c'est possible).
  → Le tri alphabétique (dans chaque rubrique) et les filtres par lettre sont automatiques.

  ⚠ Les 40 lignes ci-dessous sont des EXEMPLES : elles utilisent des vidéos de démonstration publiques
    pour que vous voyiez le rendu. Remplacez simplement la source, le titre et la description.
*/
/* -------------------------------------------------------------------------- */
/*  RUBRIQUES (modifiez les noms et descriptions ici)                         */
/* -------------------------------------------------------------------------- */

type SectionId = 'waxtaan' | 'reference' | 'kureel' | 'rajass';

const SECTIONS: { id: SectionId; label: string; short: string; desc: string }[] = [
    {
        id: 'waxtaan',
        label: 'Conferences - Causeries',
        short: 'Waxtaan',
        desc: 'Causeries, conférences et échanges autour de Cheikh Ahmadou Bamba et du patrimoine mouride.'
    },
    {
        id: 'reference',
        label: 'Référence — Njagum Mag ñi',
        short: 'Référence',
        desc: 'Les voix et les images de référence : récits historiques, documentaires et paroles des anciens.'
    },
    {
        id: 'kureel',
        label: 'Prestation Kureel',
        short: 'Prestation Kureel',
        desc: 'Récitations collectives, zikr et chants des kureel (groupes de disciples).'
    },
    {
        id: 'rajass',
        label: 'Rajass Xassida',
        short: 'Rajass',
        desc: 'Récitations et chants poétiques psalmodiés.'
    }
];

type Raw = [title: string, arabic: string, source: string, id?: string, desc?: string, author?: string, duration?: string, thumb?: string];

const DEMO_BASE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';

/**
 * Accepte les deux formats utilisés dans RAW :
 * - un identifiant YouTube de 11 caractères → vraie URL YouTube intégrable ;
 * - un nom de vidéo de démonstration (Sintel, BigBuckBunny, etc.) → fichier MP4 de démonstration.
 *
 * IMPORTANT : pour vos propres vidéos, privilégiez 'yt:ID_YOUTUBE',
 * 'drive:ID_FICHIER' ou une URL directe vers un fichier .mp4/.webm.
 */
const demo = (file: string) =>
    /^[\w-]{11}$/.test(file)
        ? `https://www.youtube.com/watch?v=${file}`
        : `${DEMO_BASE}${file}.mp4`;

const RAW_BY_SECTION: Record<SectionId, Raw[]> = {
    /* ----- Waxtaan : causeries, conférences, échanges ----- */
    waxtaan: [


        // --- SERIGNE SAM MBAYE (25 vidéos) ---
        ['SERIGNE SAM MBAYE : CONFÉRENCE MOUDJADID MBACKÉ BAOL 1987', '', demo('e_diTzlxw_c'), 'v_11', 'Conférence majeure de Serigne Sam Mbaye.', 'Serigne Sam Mbaye'],
        ['SERIGNE SAM MBAYE | MUJADIDD : Le Rénovateur de la Religion en Islam | Mbacké Baol (1987)', '', demo('Islz7fe36Qo'), 'v_12', 'Rénovateur de la religion en Islam.', 'Serigne Sam Mbaye'],
        ['Kan moy sunu borom ( la vérité absolue sur DIEU par Serigne Sam Mbaye', '', demo('ZSkrE9QuQfY'), 'v_13', 'La vérité absolue sur Dieu.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye : Conference a Lyon, France 1991', '', demo('QQ-wSHyfEK4'), 'v_14', 'Conférence à Lyon, France 1991.', 'Serigne Sam Mbaye'],
        ['Conférence  sur le soufisme par Serigne Sam MBAYE', '', demo('7eBkNAcfM0E'), 'v_15', 'Conférence sur le soufisme.', 'Serigne Sam Mbaye'],
        ['SERIGNE SAM MBAYE : LE SOUFISME 1987', '', demo('e_diTzlxw_c'), 'v_16', 'Enseignements soufis.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Conférence intégrale', '', demo('Islz7fe36Qo'), 'v_17', 'Conférence intégrale.', 'Serigne Sam Mbaye'],
        ['Causerie sur la piété par Serigne Sam Mbaye', '', demo('ZSkrE9QuQfY'), 'v_18', 'Causerie spirituelle.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Le Rappel', '', demo('QQ-wSHyfEK4'), 'v_19', 'Rappel et orientations.', 'Serigne Sam Mbaye'],
        ['Conférence historique de Serigne Sam Mbaye', '', demo('7eBkNAcfM0E'), 'v_20', 'Conférence historique.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Conférence sur l’éducation', '', demo('e_diTzlxw_c'), 'v_21', 'Éducation des enfants.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Le Coran et la Sunna', '', demo('Islz7fe36Qo'), 'v_22', 'Le Coran et la Sunna.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Enseignements sur la foi', '', demo('ZSkrE9QuQfY'), 'v_23', 'Foi et certitude.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Le soufisme pratique', '', demo('QQ-wSHyfEK4'), 'v_24', 'Pratique soufie.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Rappel spirituel', '', demo('7eBkNAcfM0E'), 'v_25', 'Rappel général.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Xam-xamu yoonu Mouride', '', demo('e_diTzlxw_c'), 'v_97', 'Sagesse et éveil spirituel.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Jikko yu baax', '', demo('Islz7fe36Qo'), 'v_98', 'Rappels sur la pratique.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Tawfekh bi', '', demo('ZSkrE9QuQfY'), 'v_99', 'Humilité du talibé.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Kooru Ramadane', '', demo('QQ-wSHyfEK4'), 'v_100', 'Spiritualité du jeûne.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Mbindu Serigne Touba', '', demo('7eBkNAcfM0E'), 'v_101', 'Confiance en Dieu.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Conférence sur l’éthique du talibé', '', demo('e_diTzlxw_c'), 'v_116', 'Respect des recommandations.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - La quête de la connaissance', '', demo('Islz7fe36Qo'), 'v_117', 'Élévation de l’âme.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Patience et endurance', '', demo('ZSkrE9QuQfY'), 'v_118', 'Résilience spirituelle.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - La pureté du cœur', '', demo('QQ-wSHyfEK4'), 'v_119', 'Purification intérieure.', 'Serigne Sam Mbaye'],
        ['Serigne Sam Mbaye - Lumière de la foi (Nour)', '', demo('7eBkNAcfM0E'), 'v_120', 'Éclairement spirituel.', 'Serigne Sam Mbaye'],

        // --- SERIGNE MBACKÉ BOUSSO (15 vidéos) ---
        ['Serigne Mbacké Bousso', '', demo('7bUBsLN7BuY'), 'v_26', 'Présentation et aperçu de Serigne Mbacké Bousso.', 'Serigne Mbacké Bousso'],
        ['L’histoire Mystique de Serigne Mbacké Bousso et sa relation avec Serigne Touba', '', demo('D-W9X8iVt6M'), 'v_27', 'L’histoire mystique et relation avec Serigne Touba.', 'Serigne Mbacké Bousso'],
        ['La vie et l\'oeuvre de Serigne Mbacké BOUSSO Par (Serigne Cherif Assane BOUSSO)', '', demo('zsVEevXoF9w'), 'v_28', 'La vie et l\'œuvre par Serigne Cherif Assane Bousso.', 'Serigne Mbacké Bousso'],
        ['XAMLEE SERIGNE MBACKE BOUSSO', '', demo('CpdTGXpfEmU'), 'v_29', 'Xamlee Serigne Mbacké Bousso.', 'Serigne Mbacké Bousso'],
        ['wolofal serigne mbacke bousso par s. moussa ka chanteur : s.ab. ah. tour', '', demo('1xb67vdfimA'), 'v_30', 'Wolofal par S. Moussa Ka.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Conférence sur la voie', '', demo('7bUBsLN7BuY'), 'v_31', 'Conférence sur la voie.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - L’amour du Prophète', '', demo('D-W9X8iVt6M'), 'v_32', 'Amour du Prophète (PSL).', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Étude des poèmes', '', demo('zsVEevXoF9w'), 'v_33', 'Étude poétique.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Sagesse et enseignement', '', demo('CpdTGXpfEmU'), 'v_34', 'Sagesse transmise.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Récit historique', '', demo('1xb67vdfimA'), 'v_35', 'Récit historique.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Jën bu mag bi', '', demo('7bUBsLN7BuY'), 'v_102', 'Éducation morale.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Magal Touba ak taariix', '', demo('D-W9X8iVt6M'), 'v_103', 'Architecture et foi.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Jàng Al Quran', '', demo('zsVEevXoF9w'), 'v_104', 'Connexion au Livre saint.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Daairai Mouride', '', demo('CpdTGXpfEmU'), 'v_105', 'Vivre en communauté.', 'Serigne Mbacké Bousso'],
        ['Serigne Mbacké Bousso - Ligueey Serigne Touba bi', '', demo('1xb67vdfimA'), 'v_106', 'Dévotion sincère.', 'Serigne Mbacké Bousso'],

        // --- SERIGNE ABDOURAHMANE MBACKÉ (15 vidéos) ---
        ['S MBACKÉ ABDOURAHMANE " Lan mooy yoonu Mouride " | c', '', demo('R3k2KUJnjOU'), 'v_41', 'C\'est quoi le Mouridisme (1ère partie).', 'Serigne Abdourahmane Mbacké'],
        ['🔸️Ndiarignou Bismillahi Rahmani Rahim | les bienfaits de Basmalah par Serigne Abdou Rahmane mbacke', '', demo('7Gm7_bVjjy0'), 'v_42', 'Les bienfaits de Basmalah.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké : Ñian pour jiguen ju tollou diguenté', '', demo('UmORQo8ITYs'), 'v_43', 'Ñian pour jiguen ju tollou diguenté.', 'Serigne Abdourahmane Mbacké'],
        ['SERIGNE MBACKÉ ABDOURAHMANE "Lan mooy yoonu Mouride| c\'est quoi le Mouridisme', '', demo('R3k2KUJnjOU'), 'v_44', 'Série Tazawoudou Sikhar.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Les vertus de la Basmalah', '', demo('7Gm7_bVjjy0'), 'v_45', 'Vertus de la Basmalah.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Causerie sur la prière', '', demo('UmORQo8ITYs'), 'v_46', 'Prière et dévotion.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Le rôle du talibé', '', demo('7Gm7_bVjjy0'), 'v_47', 'Rôle du talibé.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Sens du Wird et du Zikr', '', demo('7Gm7_bVjjy0'), 'v_48', 'Pratique spirituelle quotidienne.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Salat ala Nabi', '', demo('R3k2KUJnjOU'), 'v_49', 'Salat sur le Prophète.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Daaira ak mbolo', '', demo('UmORQo8ITYs'), 'v_50', 'Cohésion communautaire.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Serigne Touba ci Mbacke Baol', '', demo('R3k2KUJnjOU'), 'v_107', 'Racines de la voie.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Maye ak dégg', '', demo('7Gm7_bVjjy0'), 'v_108', 'Partage et charité.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Wax ju am njariñ', '', demo('UmORQo8ITYs'), 'v_109', 'Sagesse verbale.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Asraru Salat', '', demo('7Gm7_bVjjy0'), 'v_121', 'Secrets spirituels.', 'Serigne Abdourahmane Mbacké'],
        ['Serigne Abdourahmane Mbacké - Yoonu Mouride', '', demo('UmORQo8ITYs'), 'v_122', 'Enseignements généraux.', 'Serigne Abdourahmane Mbacké'],

        // --- SERIGNE AHMADOU MBACKÉ (20 vidéos) ---
        ['Jataayu Mouride: Wird Makhuz | Serigne Ahmadou Mbacké', '', demo('KUosHwWqUj4'), 'v_56', 'Jataayu Mouride: Wird Makhuz.', 'Serigne Ahmadou Mbacké'],
        ['Se débarrasser des énergies négatives (RAXAS SA XOOL ) /Par Serigne Ahmadou Mbacké Darou Mouhty', '', demo('fOONzXHmnV0'), 'v_57', 'Se débarrasser des énergies négatives.', 'Serigne Ahmadou Mbacké'],
        ['Conférence de S. Ahmadou Mbacké DM : Le Rôle Crucial de la Jeunesse en Période de Crises', '', demo('sqw_k5i1ePs'), 'v_58', 'Le rôle crucial de la jeunesse en période de crises.', 'Serigne Ahmadou Mbacké'],
        ['🟠Wakhtane wu am Solo ci Murid Bi | Serigne Ahmadou Mbacké | Journée Xassida Touba Keur Moussa 2025', '', demo('-SLyTO6MqZM'), 'v_59', 'Journée Xassida Touba Keur Moussa.', 'Serigne Ahmadou Mbacké'],
        ['Waxtaanu Wu am solo Serigne Ahmadou Mbacké Darou Mouhty - Waajal Moo Magal - Safar 1448h', '', demo('m3_M60Kxk6E'), 'v_60', 'Waajal Magal.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Raxas sa xool', '', demo('fOONzXHmnV0'), 'v_61', 'Purification du cœur.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Jeunesse et crises', '', demo('sqw_k5i1ePs'), 'v_62', 'Jeunesse et société.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Journée Xassida', '', demo('-SLyTO6MqZM'), 'v_63', 'Récitation des Xassida.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Waajal Magal', '', demo('m3_M60Kxk6E'), 'v_64', 'Préparation du Magal.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Dévotion et droiture', '', demo('sqw_k5i1ePs'), 'v_65', 'Dévotion et droiture.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Valeurs islamiques', '', demo('KUosHwWqUj4'), 'v_66', 'Ancrage et modernité.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Fraternité mouride', '', demo('fOONzXHmnV0'), 'v_67', 'Solidarité confrérique.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Patrimoine écrit', '', demo('-SLyTO6MqZM'), 'v_68', 'Étude des manuscrits.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Akhera', '', demo('m3_M60Kxk6E'), 'v_69', 'Rappel de l’au-delà.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Jigeen ñi ci Islam', '', demo('KUosHwWqUj4'), 'v_70', 'Rôle des femmes.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Sëriñ bi ak ndigal', '', demo('KUosHwWqUj4'), 'v_110', 'Discipline spirituelle.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Xel mu sell', '', demo('fOONzXHmnV0'), 'v_111', 'Vigilance spirituelle.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Daara yi ak taariix', '', demo('sqw_k5i1ePs'), 'v_112', 'Transmission intergénérationnelle.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Teranga ak lëndëm', '', demo('fOONzXHmnV0'), 'v_123', 'Hospitalité et don.', 'Serigne Ahmadou Mbacké'],
        ['Serigne Ahmadou Mbacké - Ndigelu Serigne Touba', '', demo('-SLyTO6MqZM'), 'v_124', 'Recommandations majeures.', 'Serigne Ahmadou Mbacké'],

        // --- SERIGNE BASSIROU MBACKÉ KHÉLCOM (25 vidéos) ---
        ['AB Talibé / Par Serigne Bassirou Mbacké Khélcom', '', demo('u7k8HogqzXY'), 'v_76', 'Enseignements sur le comportement du talibé.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Xelcom  (Magal 11 novembre ) Thème : la famille', '', demo('GRuXupFWpXk'), 'v_77', 'Conférence sur la famille.', 'Serigne Bassirou Mbacké Khélcom'],
        ['LA VIE ET L\'OEUVRE DE SERIGNE BASSIROU MBACKE PARTIE 1', '', demo('9oD2x-hq_hI'), 'v_78', 'La vie et l\'œuvre de Serigne Bassirou Mbacké.', 'Serigne Bassirou Mbacké Khélcom'],
        ['🙏La Patiente ( Mougne ) / par Serigne Bassirou Mbacké khélcom', '', demo('CsT2BjqqbS8'), 'v_79', 'Enseignements sur la patience (Mougne).', 'Serigne Bassirou Mbacké Khélcom'],
        ['🔑La sérénité et les Secrets Pour Réussire Dans La Vie / Par Serigne Bassirou Mbacké Khelcom', '', demo('fEALWBy1mBQ'), 'v_80', 'La sérénité et les secrets pour réussir.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Conférence sur le travail', '', demo('u7k8HogqzXY'), 'v_81', 'Valeur du travail (Sengal).', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Causerie sur la piété', '', demo('GRuXupFWpXk'), 'v_82', 'Piété et dévotion.', 'Serigne Bassirou Mbacké Khélcom'],
        ['La vie et l\'œuvre de Serigne Bassirou Mbacké Partie 2', '', demo('9oD2x-hq_hI'), 'v_83', 'Suite de la biographie.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - La reconnaissance envers Dieu', '', demo('CsT2BjqqbS8'), 'v_84', 'Reconnaissance (Shukr).', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Le comportement du disciple', '', demo('fEALWBy1mBQ'), 'v_85', 'Éthique mouride.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Borom xam xam yi', '', demo('GRuXupFWpXk'), 'v_86', 'Modèles spirituels.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Ligueey Serigne Touba', '', demo('u7k8HogqzXY'), 'v_87', 'Sengal et spiritualité.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Ndamu talibe', '', demo('CsT2BjqqbS8'), 'v_88', 'Gratitude envers le Créateur.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Baax lu baax', '', demo('fEALWBy1mBQ'), 'v_89', 'Réussite globale.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Waajur yi', '', demo('9oD2x-hq_hI'), 'v_90', 'Droits des parents.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Taqwa ak yila', '', demo('u7k8HogqzXY'), 'v_91', 'Conscience d’Allah.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Fitna nafsi', '', demo('CsT2BjqqbS8'), 'v_92', 'Lutte contre le Nafs.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Istighfar', '', demo('fEALWBy1mBQ'), 'v_93', 'Istighfar et Douaa.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Rahma Yallah', '', demo('9oD2x-hq_hI'), 'v_94', 'Miséricorde divine.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Xam xam bu njëkk', '', demo('u7k8HogqzXY'), 'v_95', 'Science religieuse.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Jamu Yallah ak jàmm', '', demo('CsT2BjqqbS8'), 'v_96', 'Paix intérieure.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Jàmm ji ci xol', '', demo('CsT2BjqqbS8'), 'v_113', 'Paix de l’esprit.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Yërmande ak coobare', '', demo('fEALWBy1mBQ'), 'v_114', 'Dévotion prophétique.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Waxtan wu mujj ci yoonu Mouride', '', demo('u7k8HogqzXY'), 'v_115', 'Synthèse spirituelle finale.', 'Serigne Bassirou Mbacké Khélcom'],
        ['Serigne Bassirou Mbacké Khélcom - Teunku yoonu Mouride', '', demo('GRuXupFWpXk'), 'v_125', 'Résumé des enseignements.', 'Serigne Bassirou Mbacké Khélcom']
    ],
    /* ----- Référence : documentaires, récits historiques ----- */
    reference: [


        ['SERIGNE OMAR DIOUF', '', demo('j05Miz4PS2E'), 'v_001', 'Prestation authentique.', 'Abdou Khadre Mbacke'],
        ['Jazbu S. Ablaye Niang (Part 1)', '', demo('BSwyp7Ep88g'), 'v_002', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Jazbu S. Ablaye Niang (Part 2)', '', demo('iBloR-2Fbjk'), 'v_003', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Khassida: S. Omar Diouf & S. Ablaye Niang', '', demo('h0ONr89c-9Y'), 'v_004', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Matlaboul Fawzeyni', '', demo('avGGfrtKgy4'), 'v_006', 'Serigne Bassirou Sene (Kaolack) chants Fawzeyni...', 'Jalibatoul Maziyah'],
        ['Compilation S. Abdoulaye Niang', '', demo('YTkcH8nQRTk'), 'v_007', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Salatoun feat. S. Abdou Khadre Gassama', '', demo('10bgE93otTo'), 'v_008', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Jazbu feat. S. Abdoulaye Niang', '', demo('gnpqqoe64KI'), 'v_009', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Serigne Omar Diouf', '', demo('NMHFUOxao0A'), 'v_010', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Matlabu Shifaai  S. Abdou Diouf', '', demo('vybeEmRShak'), 'v_011', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Khassida- Mathlaboul Chifaa-i:- "The Research for The Remedy"', '', demo('2Uy2hL4r2Is'), 'v_012', '"The Research for The Remedy" :- Cures any disease, to be recited morning and ev...', 'Jalibatoul Maziyah'],
        ['ASSIROU - Baye Khaly Sèye', '', demo('D9rZDT5eiak'), 'v_013', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['Compilation feat. Baye Cheikh Lo (Old School)', '', demo('LlpX-xqjamE'), 'v_014', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Compilation feat. Baye Cheikh Fall Khattaba (Chapter 1)', '', demo('VAwYd9ySqdM'), 'v_015', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Compilation feat. Baye Cheikh Fall Khattaba (Chapter 2)', '', demo('_be2iSU-uDM'), 'v_016', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Muqaddimaat feat  S  Ablaye Niang (Chapter 2)', '', demo('KOIdXooyeII'), 'v_017', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Muqaddimaat feat S  Ablaye Niang (Chapter 1)', '', demo('yvF7dbCi1kw'), 'v_018', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Alaman Alaya ak Baye Cheikh Lo / عَلَى مَنْ عَلَيَّ', '', demo('wxL31OMLcfg'), 'v_019', 'Baye Cheikh Lo...', 'SantBoromTouba'],
        ['Ayallahou Ya Rahmanou ak Baye Cheikh Lo / آياالله ياالرحمن', '', demo('mMf4zaA0pJo'), 'v_020', 'Baye Cheikh Lo...', 'SantBoromTouba'],
        ['Rahiya_ Ya Rahmanou-Rahimou_ Matlaboul Shifahi_ Mawahibou Serigne Ndongo Thiam : ', '', demo('nPD0fSvQmbI'), 'v_021', 'Benefits in Religious songs on the works of Sheikh Ahmadou Bamba Mbacke {R.A}...', 'Jalibatoul Maziyah'],
        ['Rahiya_ Ya Rahmanou-Rahimou_ Matlaboul Shifahi_ Serigne Ndongo Thiam .', '', demo('jb5MNPq447M'), 'v_022', 'VIDEO SUVENIR  SALIOU MBACKE TUBAB  WA TOUBA BRESCIA ITALY ....', 'Micky Tech'],
        ['Abdoulaye Niang   Mawahibou  - carrapide.com', '', demo('7Kn0-cRegc8'), 'v_023', 'Plus de khassidas sur http://carrapide.com/news/zikroulah...', 'carrapidereligion'],
        ['Rajaz Khassaïdes Serigne Touba : S. Abdou DIOP', '', demo('OnbxmjdZeNs'), 'v_024', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['Khassida: Sindidi feat. Par Baye Serigne Wade', '', demo('x9muUPJcshw'), 'v_025', 'Baye Serigne WadeChant Sindidi  un Khassida \'Ecrit par khadimou Rassoul...', 'Al Khadimiyyah TV'],
        ['Khasida Rabi bima yasrahou. feet par Serigne Cheikh Lo', '', demo('G9mg-EEcjZA'), 'v_026', 'Khasida Rabi bima yasrahou par Serigne Cheikh lo...', 'Al Khadimiyyah TV'],
        ['Alaman Alayaa / عَلَى مَنْ عَلَيَّ', '', demo('Tp5vVUHverk'), 'v_027', 'Khassida "ALAMAN \'ALAYYA" feat Serigne Abdou Khadre Seye. قصيدة \'\'عَلَى مَنْ...', 'SantBoromTouba'],
        ['Rajaz Khassaïdes S. Oumar DIOUF', '', demo('WZ9QP4gV52w'), 'v_028', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['Rajass jalibatoul Marakhib par Serigne Mbacké Diakhaté', '', demo('myC8y4K7xH4'), 'v_029', 'Rajass Xassida jalibatoul Marakhib par Serigne Mbacké Diakhaté...', 'Al Khadimiyyah TV'],
        ['SERIGNE OMAR DIOUF', '', demo('YNiwWCGJC44'), 'v_030', 'Radiass...', 'ibrahima seck'],
        ['Khassaide - Sérigne Abdou Diouf - Lamyadou', '', demo('_GCixAqKxmc'), 'v_031', 'Prestation authentique.', 'carrapidereligion'],
        ['Touba Khassida - Bismil E Laahi Ikfini', '', demo('y4Lw7wyxmW4'), 'v_032', 'Written By Shaykh Ahmadou Bamba. -Haddimou Rassoul- The Servant Of The Prophet M...', 'Husnul Ma-ab'],
        ['Midaadii Baay Youssou ndaw Original', '', demo('R2S2i1CuKvc'), 'v_033', 'Created with http://www.mp32tube.com...', 'Dieng Serigne'],
        ['Mag gni barabou Kou tedKi à Touba', '', demo('pxCrUfcvdNo'), 'v_034', 'kourel mak gni ak serigne cheikh gueye ak serigne mbacke fall...', 'Paap'],
        ['Ndongo Thiam Wakana haqqan', '', demo('k-Gq2JTgl8g'), 'v_035', 'Prestation authentique.', 'SORAYA TV'],
        ['Al Barakah (Alhamdoulilah)', '', demo('Np0iEPdDuuY'), 'v_036', 'Serigne Abdou Diop...', 'Jalibatoul Maziyah'],
        ['S. Abdoulaye Niang - Recitations of Qassaids de Khadimou Rassoull', '', demo('RYGB9h3vObk'), 'v_037', 'Benefits in religious songs on the works of Sheikh Ahmadou Bamba Mbacke {R.A}...', 'Jalibatoul Maziyah'],
        ['Khassida : TAYSIIRU-MU\'ASIIR RAJAZ BAYE OUMAR DIOUF', '', demo('PxSW8lXZMDo'), 'v_038', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['mag gni', '', demo('3lsVIEwR1RE'), 'v_039', 'matlaboul afia...', 'DARADJI INFO'],
        ['Rajaz Khassaïdes Serigne Touba : S. Ndongo Thiam', '', demo('sBUsGzGzoT8'), 'v_040', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['Xasaaïdes :  ( لبسم الإلله إكفنى) BISMILLAHI IKFINI  Rajazz Serigne  Moustapha Sy', '', demo('QOf5euRlSxc'), 'v_041', 'Xasaaïdes :  ( لبسم الإلله إكفنى) BISMILLAHI IKFINI  Rajazz Serigne  Moustapha S...', 'Xassaïdes Yi'],
        ['Xasaaïdes :  (على المنتقى خير البرايا محمّد) HALALL MOUNTAKHA  Rajazz Serigne Moustapha Sy', '', demo('Ie4W2TFSOvU'), 'v_042', 'Xasaaïdes :  (على المنتقى خير البرايا محمّد) HALALL MOUNTAKHA  Rajazz Serigne Mo...', 'Xassaïdes Yi'],
        ['SINDIDI Ablaye Niang Ndar', '', demo('KOnSkYR6iP4'), 'v_043', 'mamounesindidi.org...', 'Modou Fall'],
        ['LAYSAL BIRRU RAJAZZ BAYE OUMAR DIOUF', '', demo('xy_TfG2rg9E'), 'v_044', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['MÂFÂÂTIHOUL BICHRI AL KUBRA (Baye Oumar Diouf ak Baye Moustapha Kébé)', '', demo('blxDHpapFok'), 'v_045', 'Baye Oumar Diouf ak Baye Moustapha Kébé...', 'Jalibatoul Maziyah'],
        ['Karamna complet serigne elhadji cisse', '', demo('4PEW6ySTsQM'), 'v_046', 'Karamna complet serigne elhadji cisse...', 'Bassirou Diop'],
        ['Bara\'ani (Minanu\'l Bâqi\'l Qadîm) par Serigne Abdoul Ahad Gueye (Magal XASSIDA 2014 )', '', demo('Q_YzAu8BekU'), 'v_047', 'Bar\'ani par Serigne Abdoul Ahad Gueye (Magal XASSIDA 2014 à Touba Dialibatoul M...', 'Al Khadimiyyah TV'],
        ['Khassida : BIDAAYATUL KHIDMA', '', demo('K3BcYXM6P_Y'), 'v_048', 'Baye Oumar Diouf...', 'Jalibatoul Maziyah'],
        ['Lillahi Rabbil Leuzi - Serigne Mahib', '', demo('rLaKE8lIyq0'), 'v_049', 'http://www.bayeabdou.blogspot.com Blog du Dahira Mafatihoul Bichri Guédiawaye- C...', 'Papa Abdou MBENGUE'],
        ['Sindidi - Serigne Moustapha Diop', '', demo('0-k27j03K4c'), 'v_050', 'http://www.bayeabdou.blogspot.com/ Blog du Dahira Mafatihoul Bichri Guédiawaye C...', 'Papa Abdou MBENGUE'],
        ['Bouchra Lana - Serigne Mahib', '', demo('dDHwEPIOUzc'), 'v_051', 'http://www.bayeabdou.blogspot.com/ Blog du Dahira Mafatihoul Bichri Guédiawaye C...', 'Papa Abdou MBENGUE'],
        ['Jangoum Mag ni Serigne Mbacke Fall Mawahibou', '', demo('vh_8us7OGDU'), 'v_052', 'Jangoum Mag ni Serigne Mbacke Fall Mawahibou...', 'Istikhama TV'],
        ['Ndiangoum Mag ni Serigne Mbacke Fall Mafatihul Jinnan', '', demo('YVu2F2DdFXM'), 'v_053', 'Ndiangoum Mag ni Serigne Mbacke Fall, Cheikh Guèye Maib et Baye Talla Dia Mafati...', 'Istikhama TV'],
        ['Khassida : WAKANA HAKHAN ALAYNA NASRULMUHMININ', '', demo('19JcGHxRWgo'), 'v_054', 'Baye Oumar Diouf...', 'Jalibatoul Maziyah'],
        ['Khassida : SAFAROU BAMSACHIN JUNATUN', '', demo('9-DCh3sevqs'), 'v_055', 'Baye Oumar DIOUF...', 'Jalibatoul Maziyah'],
        ['[VIDEO] Serigne Moustapha Kébé: Khassida wala qad Karamna', '', demo('kjKO5_4ZUOE'), 'v_056', 'Serigne Moustapha Kébé Yal nafi yag tewer Barke Borom Touba  Cliquez sur le lien...', 'Al Khadimiyyah TV'],
        ['Mafatihoul Jinan WKSM Keur S FatDia71', '', demo('GAXMY6e2o24'), 'v_057', 'Niangoum Kourel MakGnii Wakeur Serigne Massamba keur Sokhna FatDia Mbacké 1971(...', 'Paap'],
        ['jazbou oubite jumaji wksm 1963', '', demo('YsQVKqJlILg'), 'v_058', 'Niangoum Kourel MakGnii Wakeur Serigne Massamba OUbitek Dioumajii 1963...', 'Paap'],
        ['Karamna  Serigne Elhadji Cissé', '', demo('EF9NUvCqzug'), 'v_059', 'وَلَقَدۡ كَرَّمۡنَا بَنِىٓ ءَادَمَ وَحَمَلۡنَـٰهُمۡ فِى ٱلۡبَرِّ وَٱلۡبَحۡرِ وَر...', 'Moustapha Seck'],
        ['Khassida : AL KHOURAAN Rajaz Serigne Daramé', '', demo('R5kGNUE_ydQ'), 'v_060', 'Baye Daramé...', 'Jalibatoul Maziyah'],
        ['Qaalu Liyarkan   Serigne Cissé Original', '', demo('P9NMdttWPvg'), 'v_061', 'Prestation authentique.', 'Abdoul ahad Fall'],
        ['DIÂLIBATAL MARÂKHIBI RAJAZ BAYE OUMAR DIOUF', '', demo('6kMMLNPM_os'), 'v_062', 'Prestation authentique.', 'Jalibatoul Maziyah'],
        ['MUXADAMATU-L- XIDMA (BAYE OUMAR DIOUF) {1/3}', '', demo('tPbf4Fz7Bc0'), 'v_063', 'Serigne Baye Oumar Diouf...', 'Jalibatoul Maziyah'],
        ['MÂFÂÂTIHOUL BICHRI AL KUBRA RAJAZ BAYE MOUSTAPHA KÉBÉ [3/3]', '', demo('sKAZS_6VB7M'), 'v_064', 'S. Baye Moustapha Kébé...', 'Jalibatoul Maziyah'],
        ['Muqadimat Serigne Cheikh Gueye Mayib', '', demo('PpGCkEXAoMs'), 'v_065', 'Kurel à la grande mosquée de Touba après la prière du Vendredi...', 'Khadimou DIAW'],
        ['Bara\'ani (Minanu\'l Bâqi\'l Qadîm) S. Abdoul Ahad Say Gueye', '', demo('L9zYmfwCu30'), 'v_066', '"Bara\'ani" Serigne Abdoul Ahad Say Gueye (Yal nako sunu Borom dolli ay ngeureum...', 'Al Khadimiyyah TV'],
        ['Serigne Ndongo Thiam :Mawahibou', '', demo('knvp4k6FlP4'), 'v_067', 'Salaam Mbokk talibéyi. La commission culturelle de Keur Serigne Touba Aulnay vou...', 'Touba Aulnay (toubaaulnay)'],
        ['Walam Yakoune Jazbu78', '', demo('icnXClPkUNk'), 'v_068', 'Prestation authentique.', 'Paap'],
        ['Takhmiss S Moustapha Diop', '', demo('d_L40bIvGR0'), 'v_069', 'Touxfatul Awâhu Fi Taxmisî Astaghfrullah (extrait)...', 'Paap'],
        ['MINANOUL BAKHIL KHADIM Rajazz S. Abdou Lahad Say Gueye', '', demo('J6Kt7D4fw7I'), 'v_070', 'S. Abdou Lahad Say Gueye, S. Bollé Mbaye & S. Mourtalla Lo...', 'Jalibatoul Maziyah'],
        ['Archive Serigne Ablaye Niang', '', demo('1H5ZYGuDTiI'), 'v_071', 'Rejoignez-nous sur : http://www.toubamajalis.com...', 'Toubamajalis'],
        ['WAXTAAN SERIGNE YOUSSOU NDAO CI KHASSIDA YI', '', demo('F4uGcpAFZzw'), 'v_072', 'WAXTAAN SERIGNE YOUSSOU NDAO CI KHASSIDA YI...', 'KHELCOMTV SERIGNE SALIOU'],
        ['WAKANA HAKHAN Rajazz S. Abdou Lahad Say Gueye', '', demo('8IXl2KJzTiQ'), 'v_073', '"For it is Our duty to help the believers"-  Composed in Acrostic of the latter...', 'Jalibatoul Maziyah'],
        ['Braa \'Ani: Par Abdoul Ahad Saye Gueye', '', demo('U5eNeI-dhYQ'), 'v_074', 'Nako niepp niaanal  Yalla Yobouko Firdawsi ci Barkepp Serigne Touba....', '@CheikhIbraFall-TV'],
        ['Jangum Mag Gni - MAWAHIBOU 1971', '', demo('WIXpKzYisOk'), 'v_075', 'Prestation authentique.', 'Jangum Mag Gni'],
        ['Ndiangoum Baye Saliou Thiam', '', demo('IPQy7_Lob20'), 'v_076', 'Barabou Serigne Fallou Mbacké -Ramadan 2015- ag gni dane awwou baye Saliou THIAM...', 'Mourtada AMAR'],
        ['Mawâhibou Nâfih Daaju original Bi Baye Dame LÔ Diange', '', demo('RrT3EI5kcVI'), 'v_077', 'Mawâhibou Nâfih chanté par Baye Dam LO Barzane  Abonnez-vous gratuitement à la c...', 'Al Khadimiyyah TV'],
        ['Mouwahibou Kourel  mag gni Daroul Mouhty 2016', '', demo('nfMVBj0qR00'), 'v_078', 'Prestation khassaide du kourel des anciens à l\' occasion des funèrailles de Ser...', '@CheikhIbraFall-TV'],
        ['Serigne Cissé - Wajahtu lilahi hamdan', '', demo('z2W1yDySLjg'), 'v_079', 'Khassidas Magg gni...', 'Papa Abdou MBENGUE'],
        ['Wajahtou lilahi wadjhi - Serigne Cissé - Magg gni', '', demo('1slk1bTjam8'), 'v_080', 'Dahira Mafatihoul Bichri Guédiawaye Cité Dioukhom - En face terrain ONU Contacts...', 'Papa Abdou MBENGUE'],
        ['GAMOU DAROU MOUHTY NDIANGOUM MAG GNI', '', demo('QTn1TmDWYpw'), 'v_081', 'Prestation authentique.', 'Aidara Diagne Khassida'],
        ['KHASSIDA : Original Mawahibou Nafih Baye Moustapha DIOP', '', demo('ZTpqPbtBi7E'), 'v_082', 'Baye Moustapha DIOP...', 'Xassaïdes Yi'],
        ['INCROYABLE SERIGNE MBACKE FALL FOND EN LARMES', '', demo('5YDEO19Ssuw'), 'v_083', 'YOUBOU HADIYA SI MAGOU DIANGKATE YI   INCROYABLE SERIGNE MBACKE FALL FOND EN LAR...', 'EUTOUB WKSM'],
        ['Sindidi feat. S. Ablaye Niang | Khassida', '', demo('u8BQ1K4DAww'), 'v_084', 'Sponsored by: ⁠www.imphex.com   Abonnez-vous gratuitement à la chaîne Murid Life...', 'Murid Life'],
        ['Khassida IKFINI par S Moustapha Diop', '', demo('AxPYPNXqBY8'), 'v_085', 'Khassida IKFINI par S Moustapha Diop...', 'Khairawane'],
        ['Khassida Transcrit MIDADI par Serigne Aliou Fall', '', demo('NVQ5vmrNE6k'), 'v_086', 'Khassida Transcrit MIDADI par Serigne Aliou Fall...', 'Khairawane'],
        ['Khassida MATLABOUL FAWZAYNI par Serigne Matar Mbaye', '', demo('UUPGMmDOUbY'), 'v_087', 'Khassida MATLABOUL FAWZAYNI par Serigne Matar Mbaye...', 'Khairawane'],
        ['Khassida  MOUKHADIMAT par Serigne  ALIOU FALL', '', demo('ZSsRuJ-jPX8'), 'v_088', 'Khassida  MOUKHADIMAT par Serigne  ALIOU FALL...', 'Khairawane'],
        ['Khassida transcrit DIAZBOU par Serigne Ablaye Niang', '', demo('kKUuk-TA_KU'), 'v_089', 'Khassida transcrit DIAZBOU par Serigne Ablaye Niang...', 'Khairawane'],
        ['Khassida ASHANBOUL DJANATI par Serigne Samba Wade', '', demo('EqiuGx5xrzI'), 'v_090', 'Khassida ASHANBOUL DJANATI par Serigne Samba Wade...', 'Khairawane'],
        ['Khassida transcrit TOUHFATOU par Serigne Samba Wade', '', demo('aWo5xi117ng'), 'v_091', 'Khassida transcrit TOUHFATOU par Serigne Samba Wade...', 'Khairawane'],
        ['Khassida transcrit MOUWAHIBOU par Serigne Wade', '', demo('cp1l_MxLjJc'), 'v_092', 'Khassida transcrit MOUWAHIBOU par Serigne Wade...', 'Khairawane'],
        ['Alaa innanii ardju Serigne Abdou Khadre Seye', '', demo('OSG0T8UyoWE'), 'v_093', 'Déclamation du khassaides Alaa innanii Ardju par Serigne Abdou Khadre Seye...', 'Hizboul Khadim Communication'],
        ['Khassida KAWINE par Serigne Matar Mbaye', '', demo('rCF6I6iG3Hc'), 'v_094', 'Khassida KAWINE par Serigne Matar Mbaye...', 'Khairawane'],
        ['Khassida RAHIYA par Serigne Matar Mbaye', '', demo('pZjHdBO6qQg'), 'v_095', 'Khassida RAHIYA par Serigne Matar Mbaye...', 'Khairawane'],
        ['Khassida MAWAHIBOU  ANTAL KARIMOU  par Serigne Matar Mbaye', '', demo('KJWZcBK5YDw'), 'v_096', 'Khassida MAWAHIBOU  ANTAL KARIMOU  par Serigne Matar Mbaye...', 'Khairawane'],
        ['Baye Omar Diouf safarou bamesasine diounatoune', '', demo('uKYj26PMZpM'), 'v_097', 'Baye fall bi...', 'Abdou Boye'],
        ['Khassida SINDIDI par Serigne Moustapha Diop', '', demo('VMbmKbD9r1Q'), 'v_098', 'Khassida SINDIDI par Serigne Moustapha Diop...', 'Khairawane'],
        ['Daaju Mag Gni | Khassida Yaman bi Amdahihi + Ajabani et Wajahtou Lilahi (Par S. El Hadji Cissé)', '', demo('DjnHqJhqjzY'), 'v_099', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Li YanQâda + Rafahnâ (Par S. Mahib Gueye)', '', demo('wRjscP9f5xs'), 'v_100', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Qad Tâba et Takhmis (Par Serigne Moustapha Diop)', '', demo('crgDvToN9XU'), 'v_101', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Diazbou (Par S. Mahibe Gueye)', '', demo('5va7FixUG5A'), 'v_102', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Halaman (Par S. Moustapha Diop)', '', demo('fUg3kmi96mY'), 'v_103', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Matlaboul chifai (Par S. Abdou Diouf)', '', demo('5__YxrbmjnE'), 'v_104', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Rahmani, Rahim (Par S. Moustapha Diop)', '', demo('ykMB6IpAzqQ'), 'v_105', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Ikfinî (Par S. Moustapha Diop)', '', demo('VD_akAUt8f8'), 'v_106', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida  Hammat Soulayma (Par S. Moustapha Diop)', '', demo('6gho7yhOnyU'), 'v_107', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Walakhad Karramna (Par S. Moustapha Diop)', '', demo('D66-_YkAjMI'), 'v_108', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Daaju Mag Gni | Khassida Mawahibou (Par Serigne Ablaye Niang )', '', demo('3AcJlYsTpK4'), 'v_109', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Mag gni wks mawahibou 78', '', demo('1hct20kS9J4'), 'v_110', 'Wa keur Serigne Massamba 1978, melodie original...', 'TV Ahloul Khassiida'],
        ['Daaju Mag Gni | Khassida kAWIN (Par S. Moustapha Diop)', '', demo('-9fCehaUasc'), 'v_111', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['baye abdou khadre seye takhmiss original . realise by moustapha mbathie 77 781 49 81', '', demo('Xe25iHR8KNc'), 'v_112', 'baye abdou khadre seye takhmiss original . realise by moustapha mbathie 77 781 4...', 'Mbathie tv officiel'],
        ['Baye cheikh lo halamane original / réalisé by moustapha mbathie contact 77 781 49 81', '', demo('CGJ-TsGfoy0'), 'v_113', 'Baye cheikh lo halamane...', 'Mbathie tv officiel'],
        ['Serigne Mahib gueye', '', demo('YXTP7xyplRY'), 'v_114', 'Mak gni...', 'MOURIDE TV'],
        ['Mak gni', '', demo('26X0-8qf9EU'), 'v_115', 'Prestation authentique.', 'MOURIDE TV'],
        ['Ala Innani Arju (Serigne Abdou Khadre Seye)', '', demo('UkUrPwhRAEU'), 'v_116', 'Serigne Abdou Khadre Seye...', 'Sunu Thiante'],
        ['Baye cheikh lo', '', demo('7ub0kqD6vAc'), 'v_117', 'Touba...', 'MOUNA VISION'],
        ['KHASSIDA Madahtu nabii en image', '', demo('n9tPJgq0WG4'), 'v_118', 'Serigne mahib gueye...', 'Aliou Badara'],
        ['Midadi tawil wakeur S Massamba, Mak Gni', '', demo('cgu61nZud9s'), 'v_119', '-Video Upload powered by https://www.TunesToTube.com...', 'Elhadji Seck'],
        ['ABDOU KHADRE SEYE ALAMAN ALAYYA   عَلَى مَنْ عَلَيَّ', '', demo('p2q-I2rRrus'), 'v_120', 'ABDOU KHADRE SEYE ALAMAN ALAYYA   عَلَى مَنْ عَلَيَّ...', 'djibi top jr'],
        ['Mag gni wksm- basit', '', demo('GCB_UyHy70Y'), 'v_121', 'Basit 1978 -keur Serigne Abdoulahi Diakhate...', 'TV Ahloul Khassiida'],
        ['S FALLOU GAMOU MAWAHUBOU', '', demo('jFbHoJHtD7E'), 'v_122', 'Prestation authentique.', 'GAMOU . TV'],
        ['Baye Mbacke Fall et son kourel: Mawahibou Touba Belel', '', demo('0wZYzqALt44'), 'v_123', 'Que dieu l\'accueille dans ces plus haute  paradis......', 'TV Ahloul Khassiida'],
        ['Rabbi karimoune: B. Cheikh lo', '', demo('uQ5OQG8I0Fo'), 'v_124', 'Melodie original...', 'TV Ahloul Khassiida'],
        ['Halaman: S. A. Khardy Seye', '', demo('wfEZzDOZN4Q'), 'v_125', 'Melodie original...', 'TV Ahloul Khassiida'],
        ['Mawahibou - B. Saliou Thiam', '', demo('K4uf3zh1mgg'), 'v_126', 'Melodie original...', 'TV Ahloul Khassiida'],
        ['Serigne Abdoulaye Niang   Moqddimatul Amdahi', '', demo('4knwrGGhAKI'), 'v_127', 'Serigne Abdoulaye Niang   Moqddimatul Amdahi Vous suivez Touba Pro, merci de vou...', 'Touba Production'],
        ['Original Mawahibou Wakeur Serigne Massamba Touba Mbéllé Chanté par Kourel Mag Gni', '', demo('Xd4uUSlxcWQ'), 'v_128', 'Original Mawahibou Wakeur Serigne Massamba Touba Mbéllé Chanté par Kourel Mag Gn...', 'Xassida24 PRO'],
        ['Alamane Dadju Serigne Abdou khadre Seye - Original', '', demo('kd07dzgDlt0'), 'v_129', 'Alamane Dadju Serigne Abdou khadre Seye - Original...', 'Xassida24 PRO'],
        ['Mawahibou original 71 wksm', '', demo('tX0uCN9fLYI'), 'v_130', 'ba kérok niouy guiss louko dakh...', 'Mourtada AMAR'],
        ['Mag gni wksm - mafatihul jinan 71', '', demo('GTHAFJh5Fjc'), 'v_131', 'Melodie original - wksm...', 'TV Ahloul Khassiida'],
        ['Halaman : Baye Cheikh lo', '', demo('srNvFG7p5VQ'), 'v_132', 'Melodie original...', 'TV Ahloul Khassiida'],
        ['Dieuzbou Serigne Cheikh Fall KHATABA', '', demo('wA4U7BaVkis'), 'v_133', 'Prestation authentique.', 'Matlaboul Fawzeyni TV'],
        ['Moukhadimat | Baye Saliou Thiam ( Original)', '', demo('xZtPr4rGu_w'), 'v_134', 'Moukhadimat Baye Saliou Thiam Première Version...', 'Jangat Xassida'],
        ['Serigne Samba Wade Saha Alahou Raboul Harsi', '', demo('boDs59Fiyjk'), 'v_135', 'Abonnez vous gratuitement a votre chaine preferee B C M NEWS pour plus de videos...', 'B.C.M TV-HD'],
        ['Compilation Baye Cheikh Fall Khad Taba', '', demo('gxFEr1FVduM'), 'v_136', 'Innani houztou - Jazbul Khouloob - Mawaahibou Naafih...', 'Mourtada AMAR'],
        ['Ikfini baye moustapha kébé', '', demo('4q-RAo_eHj4'), 'v_137', 'partager les œuvres de serigne Touba...', 'NOUROUDARAYNI GUEDIAWAYE SHAM'],
        ['khassida mouxadimat ft BAYE SALIOU THIAM', '', demo('3D0Ud4OZ-r0'), 'v_138', 'WANé jangum mag gni...', 'NOUROUDARAYNI GUEDIAWAYE SHAM'],
        ['Khassida Rahmani Rahim par S. Baye Moustapha KEBE', '', demo('1c7jkp9t1uI'), 'v_139', 'Abonnez-vous gratuitement à notre chaîne Youtube et Activer la Cloche, pour rest...', 'Al Khadimiyyah TV'],
        ['Baye Dame Lo - Mawahibou  Original', '', demo('WBW63TytphY'), 'v_140', 'Prestation authentique.', 'Elhadji Seck'],
        ['Dieuzbou Darou Mouhty Original Mak Gni', '', demo('fNRcprvmKuE'), 'v_141', 'Prestation authentique.', 'Elhadji Seck'],
        ['Baye Youssou NDAW  Midadi nawaytou Original', '', demo('N3TDo57gYVM'), 'v_142', 'Prestation authentique.', 'Elhadji Seck'],
        ['Baye Youssou NDAW Midadi Yaroudou Original', '', demo('qxkCroCk2ZQ'), 'v_143', 'Prestation authentique.', 'Elhadji Seck'],
        ['Serigne  Mbacké  DIAGNE Mawahibou Original', '', demo('_g-wKP4JPlk'), 'v_144', 'Prestation authentique.', 'Elhadji Seck'],
        ['KHASSIDA : Bismillilâhi Ikfinî SERIGNE Moustapha SY', '', demo('1si6aYHtOKs'), 'v_145', 'Bismillilâhi Ikfinî SERIGNE Moustapha SY...', 'Xassaïdes Yi'],
        ['Moukhadimat tawil Wakeur S Massamba Mak gni', '', demo('C1K0V4wPMvo'), 'v_146', 'Prestation authentique.', 'Elhadji Seck']

    ],



    /* ----- Prestation Kureel : récitations collectives, zikr, chants ----- */


    kureel: [
        ['Jâlibatul Marâghib Kurel Cheikh Abdoul Ahad Mbacke Hizbut-Tarqiyyah 29e Jour Ramadan 2026/1447.H', '', demo('pE9d1Fzg7ok'), 'v_01', 'Prestation officielle du Kurel Cheikh Abdoul Ahad Mbacke Hizbut-Tarqiyyah.', 'Al Mouridiyyah Tv'],
        ['Muxaddamâtul Amdâh Kurel Cheikh Abdoul Ahad Mbacke Hizbut-Tarqiyyah Gamou 2026/1448H.', '', demo('pywLkPqYRwI'), 'v_02', 'Récitation de Muxaddamâtul Amdâh lors du Gamou.', 'Al Mouridiyyah Tv'],
        ['Intégral Prestation Kurel Nûrud Dârayni Touba Hizbut-Tarqiyyah Gamou 2026/1448H.', '', demo('384wDz6ETKk'), 'v_03', 'Prestation intégrale du Kurel Nûrud Dârayni.', 'Al Mouridiyyah Tv'],
        ['[NOUVEAU] : daadj Khassida - Wakana Haqqan par Kourél 1HT Touba (lyrics)', '', demo('LE7W8T69yX4'), 'v_04', 'Interprétation magnifique de Wakana Haqqan par le Kourél 1HT Touba.', 'DAROU XASSIDA TV'],
        ['Nouvauté Mawaahibou 71😭 – Kourel Tréviso Italy Live 2026 (Voix Exceptionnelle)', '', demo('wfYsMIFA2gM'), 'v_05', 'Prestation exceptionnelle du Kourel Tréviso Italy.', 'Hizbou Digital_Vision'],
        ['MOUKHADIMAT / GAMOU 2026-1448/ KOUREL SERIGNE ABDOU LAHD HT', '', demo('gkkTm14hwW8'), 'v_06', 'Récitation de Moukhadimat pour le Gamou 2026.', 'UNIVERS KOUREL KHASSIDA'],
        ['KHASSIDA - MOUKHADIMAT OUL-AMDÂH FÎ MAZÂYÂ MIFTAH HTDKH MAGAL 2006', '', demo('yOeJElqfhn4'), 'v_07', 'Archive magique de la prestation Moukhadimat Oul-Amdâh.', 'Mouride Touba'],
        ['MOUKHADAMATOUL AMDAH KOUREL 1 MAFATIHOUL BICHRI TOUBA GAMMOU 2026 KEUR S MOUSTAPHA MAHMADAN ', '', demo('FVAZY-kZQA8'), 'v_08', 'Prestation de Moukhadamatoul Amdah par le Kurel 1 Mafatihoul Bichri.', 'DMB TV HD'],
        ['Cëy😭🥰Mawahibou Kurel Mafatihul bichri Touba DUNDAL KOOR HTDKH - - RAMADAN 2026/1447H - Jour 25', '', demo('E8-Gb7ePDGg'), 'v_09', 'Récitation émouvante de Mawahibou lors du Dundal Koor.', 'My Channel'],
        ['MAWAHIBI Kurel Mafatihul bichri  Touba HT  Magal Porokhane 2026-1447h ', '', demo('OHuZxjf78pc'), 'v_10', 'Prestation du Kurel Mafatihul bichri au Magal de Porokhane.', 'My Channel'],
        ['Prestation Kurel Mafatihul Bichri Touba 17 SAFAR 1448H 2026', '', demo('lyV-uoib_XQ'), 'v_11', 'Prestation du Kurel Mafatihul Bichri Touba le 17 Safar.', 'My Channel'],
        ['KHASSIDA MAFATIHOUL BICHRI SERIGNE MADINA LO', '', demo('ZpAisSw0s_s'), 'v_12', 'Khassida Mafatihoul Bichri interprété sous la direction de Serigne Madina Lo.', 'Mouride Touba'],
        ['Yamankassani (Mawahibou) Kourel Ndonga Tarbiyya Khelcom; Ndeysann ako nio dég Maggni', '', demo('tgxbVIj6FfY'), 'v_13', 'Interprétation de Yamankassani par le Kourel Ndonga Tarbiyya Khelcom.', 'Khassidayi Rek!'],
        ['Thieuy😍 bii moukhadimatt kawena lool | par kourel ndongo tarbiyah S.Modou Samb', '', demo('9mOuPaqJj60'), 'v_14', 'Prestation de Moukhadimat par le kourel ndongo tarbiyah de S. Modou Samb.', 'Al Bichri HD'],
        ['Raditou Kourel Adolescents Hizbou Tarqiyyah 29 mars Vivification du mois de Ramadan 2023 Touba Jour7', '', demo('4WxrB4rnrJc'), 'v_15', 'Vivification du mois de Ramadan par le Raditou Kourel Adolescents.', 'Khelcom Production'],
        ['Thiey😭 Assirou Ikfini, houkhal boukaou, Prestassion Kourel Tout tank HTDKH Grand Magal de Touba 2026', '', demo('lbz5iRaXu8Q'), 'v_16', 'Prestation de Assirou Ikfini par le Kourel Tout tank HTDKH.', 'Khelcom Production'],

    ],

    /* ----- Rajass ----- */
    rajass: [


        ['🟠THIEUY 🥹 NOUROU DARAYNI BII NEX NA LOLL  | RAJASS SÉRIGNE MBAYE NDIAYE MECKHE LAMBAAY', '', demo('zJqeCNWumYk'), 'v_01', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['WAKANA HAKHAN |Rajas Serigne Mbaye Ndiaye', '', demo('ZL9c2Tc3HaU'), 'v_02', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['CEY😢JANGUE MU YEEME- NOROU DARAYNI- RAJAS SERIGNE MBAYE NDIAYE', '', demo('8t9yfhk14JM'), 'v_03', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['Ahmadu Muhniyan| Rajas Serigne Mbaye Ndiaye', '', demo('Gi2kLoeXBDw'), 'v_04', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['S. Mbaye Ndiaye Marakhib : Thiant Annuel Dahira Mafaatihoul Bichri Ugb 2026', '', demo('OB4ynvn5Ijc'), 'v_05', 'S. Mbaye Ndiaye Marakhib : Thiant Annuel Dahira Mafaatihoul Bichri Ugb 2026 L\'a...', 'Mourides Tv HD'],
        ['Khassida MATLABOUL MAGHRIL ASNAA SERIGNE MBAYE NDIAYE MECKHE LAMBAYE', '', demo('5_C15O5mUUs'), 'v_06', 'Abonner vous sur notre chaine et activer la cloche de notification pour ne rien...', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['🟢 Rajass Serigne Mbaye Ndiaye Thiant Annuel Dahira Mafaatihul Bichri UGB (vidéo originale)', '', demo('rFqrPB5r2TQ'), 'v_07', 'Vidéo originale de la prestation de Serigne Mbaye Ndiaye Xassida au Thiant Annue...', 'MAFAATIHUL BICHRI UGB'],
        ['Ay wadjile 😭❤️Jazboul khuloob Rajas Serigne Mbaye Ndiaye', '', demo('QqNHUyxEqvA'), 'v_08', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Mawahibou naafih rajas s mbaye ndiaye', '', demo('w_gpGvIpgtg'), 'v_09', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Cëyy 😭 Nourou Darayni Bi Serigne Mbaye Ndiaye Gamou 2026 | Daaju Serigne Touré bi', '', demo('qwddyhk4ih0'), 'v_10', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['MATLABOULFAWZEYNI RAJASS SERIGNE MBAYE NDIAYE ALBUM 2026', '', demo('h0TQg8f35j0'), 'v_11', 'Abonner vous sur notre chaine et activer la cloche de notification pour ne rien...', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['[NOUVEAUTÉ] Khassida : Norou Daarayni #lyrics - par Serigne Mbaye Ndiaye Mekhe😭❤️', '', demo('_9DLT2MNHh4'), 'v_12', 'Xassida: Norou Daarayni Interpretation: Serigne Mbaye Mekhe Ecrivain: Serigne To...', 'DAROU XASSIDA TV'],
        ['DIALIBATOUL MARAHIB RAJASS SÉRIGNE MBAYE NDIAYE ALBUM 2026', '', demo('MTkHoe386t4'), 'v_13', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Cey🥹Bismil ilaahi ikfini rajas s mbaye Ndiaye', '', demo('_Gzsyn2F564'), 'v_14', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Salaatu taaji liruhyaan nabiyis siraaji Rajas Serigne Mbaye ndiaye', '', demo('YWijx1udCX4'), 'v_15', 'Nourou Tv Suivez nous sur nos differents reseaux pour recevoir nos nouvelles vid...', 'Nourou Tv'],
        ['🟢 Wolofal Serigne Touba par Serigne Mbaye Ndiaye Thiant Annuel Dahira Mafaatihul Bichri UGB', '', demo('zNHTwSikl94'), 'v_16', 'A travers cette vidéo vous allez découvrir les mots de Serigne Djily Kosso Mback...', 'MAFAATIHUL BICHRI UGB'],
        ['MATLABOU MUXARI ASNAA SERIGNE MBAYE NDIAYE', '', demo('B5Nr31bKYZs'), 'v_17', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['WOLOFAL SERIGNE TOUBA PAR SERIGNE MBAYE NDIAYE KHASSIDA', '', demo('F4F4vDKd_44'), 'v_18', 'Prestation authentique de khassida.', 'MIFTAHUN NASRI TV'],
        ['NOUROU DARAYNI SERIGNE MBAYE NDIAYE ALBUM 2026', '', demo('LGxc5c24iw0'), 'v_19', 'Abonner vous sur notre chaine et activer la cloche de notification pour ne rien...', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Ndesaan😭 Extrait Norou Rajas Serigne Mbaye Ndiaye Thiante Cheikh Ahmadou Diaw Pakha Ngelamou 2026', '', demo('eKnit7AUqJA'), 'v_20', 'Ndesaan   Rajass Serigne Mbaye Ndiaye Thiante Cheikh Ahmadou Diaw Pakha Ngelamou...', 'Khelcom Production'],
        ['Xassida Ayatul kursiyu Rajass Serigne Mbaye Ndiaye', '', demo('MVTi1tdZerc'), 'v_21', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['NOUVEAUTÉ NOUROU DARAYNI 2 ÉME DAADJ SEGN SALIOU TOURE 😭 RAJASS SERIGNE MBAYE NDIAYE', '', demo('iuBSfEdccWI'), 'v_22', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['AS SINDIDI SÉRIGNE MBAYE NDIAYE ALBUM 2026', '', demo('UCafw398-oU'), 'v_23', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['😭TAWBATOUN NASOOh Rajas Serigne Mbaye Ndiaye', '', demo('hBDHdyqI8Nw'), 'v_24', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Xassida Yakhayra Dayfin  Rajas Serigne Mbaye Ndiaye', '', demo('KuS-FZDyijs'), 'v_25', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['FATHOUL FATAH/ RAJAS SERIGNE MBAYE NDIAYE', '', demo('WR2h_Z-H9Vg'), 'v_26', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['MAFATIHOUL BICHRI SERIGNE MBAYE ALBUM 2026', '', demo('ow_Dw6H2bUo'), 'v_27', 'Abonner vous sur notre chaine et activer la cloche de notification pour ne rien...', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['🥹|JAALIBATUL MARAAXIB / Rajas Serigne Mbaye Ndiaye', '', demo('eVeXKOsb11c'), 'v_28', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['Touhfatou Moutadarihin Rajass Serigne Mbaye Ndiaye', '', demo('IGP4VlLTSeQ'), 'v_29', 'Nourou Tv Suivez nous sur nos differents reseaux pour recevoir nos nouvelles vid...', 'Nourou Tv'],
        ['2ÉME NOUROU DARAYNI/ RAJAS🎙 SERIGNE MBAYE NDIAYE', '', demo('VceXQvRHja4'), 'v_30', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Fajaa anii Rajas Serigne Mbaye Ndiaye', '', demo('0TvdS0eHoeM'), 'v_31', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['KHÔL DIEURIGNOU : Serigne Mbaye Ndiaye Ismoulahi Azam N°3', '', demo('aAphKgIw4MA'), 'v_32', 'Ancien adjudant chef de l\'armée Sénégalaise à la retraite, serigne Mbaye Ndiaye...', 'Académie Asrar'],
        ['Cey😭bi mawahibou nafih Rajas Serigne Mbaye Ndiaye', '', demo('Xbr1kakQTxg'), 'v_33', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Touhfatou Rajaas Serigne mbaye ndiaye', '', demo('DTp2mcmCCRc'), 'v_34', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['🟠Ndeysaan Cëyy 😭Nourou Darrayni Serigne mbaye ndiaye Mekhe lamabaye', '', demo('awtgLUC-lDo'), 'v_35', 'Visitez Notre Chaine Youtube et Abonnez vous Gratuitement. N\'oubliez pas de cli...', 'Bichri Production'],
        ['Khassida Matlabul Maqar&#39;ril Asnaa -Serigne Mbaye Ndiaye', '', demo('u42Kf4C5g8A'), 'v_36', 'Pour une couverture médiatique d\'exception Faites vivre vos événements religieu...', 'As-Samadiyya TV'],
        ['Cëy🥹SINDIIDI Rajas Serigne Mbaye Ndiaye', '', demo('A9GvyfgUM20'), 'v_37', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Rajass Serigne Mbaye Ndiaye 😢Bou Yèmè Thiey Serigne Touba Mo Yèmè biisup xassida daray dialibatoul m', '', demo('Nnf7j71Z3yM'), 'v_38', 'Rajass Serigne Mbaye Ndiaye Bou Yèmè Thiey Serigne Touba Mo Yèmè #senegal #etoil...', 'ETOILE DIAMONO TV 4K'],
        ['Innabna Abdillahi', '', demo('jRyxnn76XE8'), 'v_39', 'Provided to YouTube by ONErpm Innabna Abdillahi · Serigne Mbaye Ndiaye Marakhib...', 'Serigne Mbaye Ndiaye Marakhib - Topic'],
        ['Khassida Fuzty Bizar Fil Hassanaat: Serigne Mbaye Ndiaye Marakhib', '', demo('Z038wcwd-Fk'), 'v_40', 'L\'actualité de la Communauté Mouride du Senegal - La vulgarisation de l\'œuvre...', 'Mourides Tv HD'],
        ['Rajass Khassida: Wakana Hakhane - Serigne Mbaye Ndiaye Nuru Darayni', '', demo('1xl3WABcR2A'), 'v_41', 'Rajass Khassida: Wakana Hakhane - Serigne Mbaye Ndiaye Nuru Darayni....', 'Daara Mafatihul Bichri Mékhé Lambaye'],
        ['LIMAHINE BACHIRINE SERIGNE MBAYE NDIAYE ALBUM 2026', '', demo('L4bgTS4NYgg'), 'v_42', 'Abonner vous sur notre chaine et activer la cloche de notification pour ne rien...', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Matlabou Makharil Asna', '', demo('8WkxQisptKU'), 'v_43', 'Provided to YouTube by ONErpm Matlabou Makharil Asna · Serigne Mbaye Ndiaye Mara...', 'Serigne Mbaye Ndiaye Marakhib - Topic'],
        ['🔴NOROU DARAYNI  Rajass Serigne Abdou Lahat Touré &amp; Serigne Mbaye Ndiaye Goudy ajjuma Porokhane 2026', '', demo('CsIf0Cgdeuw'), 'v_44', 'https://www.youtube.com/watch?v=cwjaOhbOXGg --~-- Visitez Notre Chaine YouTube e...', 'Khelcom Production'],
        ['Matlabul Makharil Asna', '', demo('LGkymXoKvSQ'), 'v_46', 'Provided to YouTube by ONErpm Matlabul Makharil Asna · Serigne Mbaye Ndiaye Mara...', 'Serigne Mbaye Ndiaye Marakhib - Topic'],
        ['INABNA HBDILLAHI ak CHAKUURU RAAFIHU rajas s mbaye ndiaye', '', demo('25tre3s-8Hs'), 'v_47', 'Prestation authentique de khassida.', 'Serigne Mbaye Ndiaye Khassida'],
        ['Thieyy Khassida Lii Dawna Yaram 😭 Rajass Serigne Mbaye Moukaramou | Journée Khassida Touba Koul 2023', '', demo('t7N_Xrun1rI'), 'v_48', 'Thieyy Ndeysaan Mbaye Moukaramou Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhou...', 'Xidma Tv'],
        ['Mafatihoul Bishri', '', demo('rvixtka5rUo'), 'v_49', 'Provided to YouTube by ONErpm Mafatihoul Bishri · Serigne Mbaye Ndiaye Marakhib...', 'Serigne Mbaye Ndiaye Marakhib - Topic'],
        ['Nuru Darayni S. Mbaye Ndiaye: Bissou Sant Serigne Touba Dahira Matlabul Fawzeyni  Pikine Cite Police', '', demo('0QIe8dFsoP8'), 'v_50', 'L\'actualité de la Communauté Mouride du Senegal - La vulgarisation de l\'œuvre...', 'Mourides Tv HD'],

        ['Cëy 🥹 Wakana Hakhan/ Rajas Mame Thierno Yally Thies', '', demo('519vsPVKO9Q'), 'v_01', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['Euw 😭 ceey RAHIYA BII RAJASS SÉRIGNE MAME THIERNO YALLY', '', demo('-YInUv_E-so'), 'v_02', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Nourou Darayni complet Serigne Mame Thierno Yally', '', demo('WjG0yP7Pm3M'), 'v_03', 'Nanga abonné ndax nga mana doundou xassida yi....', 'Ci Xassida Yi Rekk'],
        ['😢{BISMIL ILAAHI IKFINI} Rajas Mame Thierno Yally Thies', '', demo('7bIb0-HQczw'), 'v_04', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['😭Allahu Akbar Thieyy 😭 Nourou Darayni Mame Thierno Yally | Journée Xassida Touba Koul | Edition 2026', '', demo('EcvFDJqnryc'), 'v_05', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['MAWAHIBOU NAFIH 🥹RAJASS MAME THIERNO YALLY THIES', '', demo('w_j0BAq2cVU'), 'v_06', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['NOUROU DARAYNI SERIGNE MAME THIERNO YALLY NOUVEL ALBUM', '', demo('CsV0vIomcIQ'), 'v_07', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Serigne Mame Thierno Yally', '', demo('de-hGJdPJ5I'), 'v_08', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['😭😭 Nuurud Daareyni MAME THIERNO YALLY  MAGALOU &quot;Nuurud Daareyni&quot; TOUBA ALIEU', '', demo('zdyzAl6NVXA'), 'v_09', 'Abonnez-vous gratuitement à notre chaîne YouTube et Activer la Cloche, pour rest...', 'Al Burur Média'],
        ['EXTRAIT NUURUD DAAREYNI MAME THIERNO YALLY - BISSOUP XASSIDA THIES 2025', '', demo('QUnSOhV74-s'), 'v_10', 'majmahunnuraynitv #mouride #Abonnez-vous gratuitement à notre chaîne YouTube et...', 'Al Burur Média'],
        ['Cey😭Raa-iya rajas mame thierno yally thies', '', demo('AtT3CE4ZyH8'), 'v_11', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['😭Allahu Akbar Thieyy Nourou Darayni Mame Thierno Yally | Journée Xassida Touba Risso | Édition 2025', '', demo('u2v9XT-x1A4'), 'v_12', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🔴Ceÿ🥺😭 Nuurud Daareyni / Nouvelle Album / Mame Thierno Yally : Avril 2026', '', demo('45jlB-R7fpA'), 'v_13', 'majmahunnuraynitv #mouride #Abonnez-vous gratuitement à notre chaîne YouTube et...', 'Al Burur Média'],
        ['Serigne Mame Thierno Yally', '', demo('M8axOZlfklU'), 'v_14', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['ASTAKHFIRULLAHA BIHII MAME THIERNO YALLY THIES', '', demo('fM20MGzK4GU'), 'v_15', 'voralshort....', 'XIDMAY SERIGNE BITV'],
        ['Serigne Abdou Samad ak Serigne Mame Thierno Yally', '', demo('8MqLc0NwFEM'), 'v_16', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['Serigne Mame Thierno Yally', '', demo('CuE-1SvmW2Y'), 'v_17', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['[Nouveauté] RAHIYA😭Rajass Mame Thierno Yally', '', demo('PFnDwmj5Ka0'), 'v_18', 'Prestation authentique de khassida.', 'ETTU_XASSIDA'],
        ['Cey😭 Qasida  Alif laam miim Rajas Mame Thierno Yally', '', demo('769b-j5-fPA'), 'v_19', 'Prestation authentique de khassida.', '𝗚𝗙 𝗧𝗩 𝗢𝗳𝗳𝗶𝗰𝗶𝗲𝗹'],
        ['Mawahibou Nafih Mame Thierno Yally', '', demo('9Y6Oyxh9udk'), 'v_20', 'MuridAcademy....', 'Murid Academy'],
        ['TOUKHFATOU RAJASS SÉRIGNE MAME THIERNO YALLY NOUVEL ALBUM', '', demo('YFeMtCX3gFc'), 'v_21', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Serigne Mame Thierno Yally thies rajas khassida', '', demo('BMdDbn12NL4'), 'v_22', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['TAYSIROUL HASSIR RAJASS SÉRIGNE MAME THIERNO YALLY NOUVEL ALBUM', '', demo('3viwqyn8Fhc'), 'v_23', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Mawahibou Rajass Mame Thierno Yally ( Album 2026)', '', demo('AvAJRlYTbwI'), 'v_24', 'Prestation authentique de khassida.', 'Wakana Haqqan Tv'],
        ['😭Ndeysaan Cëyy Nourou Darayni😭 Mame Thierno Yally | Dundal Guddig Nisfu Shahban Keur S. Ahmadou', '', demo('RKU93Btgf84'), 'v_25', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Lii Diooylona Kounei😭 Nourou Darayni Mame Thierno Yally | Bissu Xassida Touba Koul', '', demo('RCF2ivfljD8'), 'v_26', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Astakhfiroul laaha bihii mame Thierno yally thies Ndeyesan 🥹🙏🏿♥️', '', demo('thTQDekJScM'), 'v_27', 'Astakhfirou laaha bihii Cëy toute tank bi mame Thierno yally thies....', 'Teewlu Qassida tv'],
        ['Nourou Darayni Mame Thierno Yally Thies ak S Abdou Samad', '', demo('pGkbTFuXMrU'), 'v_28', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['Mame Thierno Yally Ak Serigne Abdou Samad', '', demo('RIRj6xU-sPA'), 'v_29', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['Thieuy !! 😭 KHASSIDA FATHUL FATAH PAR MAME THIERNO YALY', '', demo('At7jipkrqMM'), 'v_30', 'Prestation authentique de khassida.', 'MAME THIERNO YALY OFFICIEL 🎙️'],
        ['NORUD DAARAYNI MAME THIERNO YALLY #khassida', '', demo('FIHid6wyJ5g'), 'v_31', 'Prestation authentique de khassida.', 'Heure Xassida TV'],
        ['MAWAHIBOU NAFIHAN SERIGNE MAME THIERNO YALLY NOUVEL ALBUM', '', demo('QYCwWSuY2mU'), 'v_32', 'Prestation authentique de khassida.', '𝐂𝐡𝐢𝐟𝐚𝐢 𝐓𝐯 𝐀𝐮𝐝𝐢𝐨𝐯𝐢𝐬𝐮𝐞𝐥'],
        ['Nouveau (RAJASS) Mame thierno yally Thiès [Astaghfirullah bihi]', '', demo('FyCET-Jbn_8'), 'v_33', 'astaghfirullahbihi #mourides #serignemountakhambacke #cheikhahmadoubamba #wakana...', 'Mbecte Xassida Yi'],
        ['Ndysane😭 Xassida Raiya Rajass Serigne Mame Thierno Yally Alboum 2026 #xassidayirek', '', demo('6yA12LBSdsI'), 'v_34', 'xassida #XassidaMouride #Khassida #SerigneTouba #Touba #KhadimouRassoul #Mouride...', 'Touba Wakana Tv officiel'],
        ['Serigne Mame Thierno Yally joylo na niepeu', '', demo('LS_b8pEuexQ'), 'v_35', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['Cëy Wakana hakkane Rajass mame thierno yally khasida', '', demo('-jSvQoNZmJw'), 'v_36', 'Bienvenue sur MurideStudio, la chaîne dédiée aux meilleurs chanteurs de Qasida e...', 'Muride Studio'],
        ['ASTAXHFIRULLAHA BIHI (YAZAL WUJOODI) YASSARALI ]SAKOORU RAAFUHU😢 MAME THIERNO YALLY', '', demo('RcpqkCq5_Mc'), 'v_37', 'Prestation authentique de khassida.', 'As-Samadiyya TV'],
        ['NDAYSSAN ❤️😭 KHASSIDA AR RAA&#39;IYA NOUVEAU ALBUM PAR MAME THIERNO YALY', '', demo('561_fR7TQR8'), 'v_38', 'Prestation authentique de khassida.', 'MAME THIERNO YALY OFFICIEL 🎙️'],
        ['NOUVEAU TOUHFATOU SERIGNE MAME THIERNO YALLY', '', demo('-DzJctlo7kI'), 'v_39', 'Bienvenue dans ce récital spirituel consacré à Touhfatoul Moutadarihin, un momen...', 'Mouridullah'],
        ['Mame Thierno Yally Thiès Chez Serigne Abdou samad Mbacké', '', demo('zmYP-GXYCO4'), 'v_40', 'Pour une couverture médiatique d\'exception Faites vivre vos événements religieu...', 'As-Samadiyya TV'],
        ['Mame thierno yally thies #khassaïdes', '', demo('KvLr_NPZ8-E'), 'v_41', 'Prestation authentique de khassida.', 'Islam Senegal'],
        ['Khassida Nourou Daareyni - Rajas Mame Thierno Yally Thiès', '', demo('GR1lr3RmvGg'), 'v_42', 'Pour une couverture médiatique d\'exception Faites vivre vos événements religieu...', 'As-Samadiyya TV'],
        ['Touhfatou Serigne Mame Thierno Yally Ndeysaan lii yéémé na', '', demo('YUSQOS2twMQ'), 'v_43', 'Nanga abonné ndax nga mana doundou xassida yi....', 'Ci Xassida Yi Rekk'],
        ['Nouveau : Toukhfatou Moutadarihina - Mame Thierno Yally', '', demo('HE_cItSA2iw'), 'v_44', 'Prestation authentique de khassida.', 'Al Burur Média'],
        ['🟠Thiey😭 Radias Mame Thierno Yally Ngontum Xassida Dahia Jalibatu Maraxip Touba Ndande Ed 2026/1447H', '', demo('fDJ9xkW7haQ'), 'v_45', 'Visitez notre chaîne YouTube et abonnez-vous gratuitement n\'oubliez pas de cliq...', 'Taysir Tv L\'Officiel'],
        ['NOUROU DARAYNI MAME THIERNO YALLY 🥹😭', '', demo('0K994IH7fX8'), 'v_46', 'Prestation authentique de khassida.', 'Djiotaye Mouride'],
        ['Serigne Mame Thierno Yally lakassoukori', '', demo('ByHkm0JrcR8'), 'v_47', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['DIALIBATOUL MARAKHIB S MAME THIERNO YALLY / Gouddig Xassida Dahira Touba Nguinth:1447h/2025', '', demo('bDgROtv6pl4'), 'v_48', 'Abonnez-vous gratuitement à notre chaîne YouTube et Activer la Cloche, pour rest...', 'Al Burur Média'],
        ['XASSIDA AHMADOU MOUHNIYANE S MAME THIERNO YALLY / Gouddig Xassida Dahira Touba Nguinth:1447h/2025', '', demo('MlIEENazxOo'), 'v_49', 'Abonnez-vous gratuitement à notre chaîne YouTube et Activer la Cloche, pour rest...', 'Al Burur Média'],
        ['Mame Thierno yally Xassida', '', demo('bAQt9vaLnIM'), 'v_50', 'Prestation authentique de khassida.', 'Talibe Bamba'],

        //Moustapha Niang Koul

        ['Dialibatoul Marakhib Serigne Moustapha Niang Koul | Journée Xassida Touba Koul | Édition 2024', '', demo('fu5-xF1vWCI'), 'v_01', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['WOLOFALOU BOROOM BOU NÉKH LOOL : SERIGNE MOUSTAPHA NIANG KOUL |XIDMA TV', '', demo('fD3aXP0tXTs'), 'v_02', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Allahu Akbar Cëyy 😭 Mafatihoul Bichri Ser Moustapha Niang Koul | Journée Xassida Touba Risso 2025', '', demo('R_398g7-ZT8'), 'v_03', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['THIEUY LII😭 WOLOFALOU BOROM TOUBA ak MAME CHEIKH IBRA | S. MOUSTAPHA NIANG KOUL | JX KHANDANE 2021', '', demo('S5Ajzt4KQ-o'), 'v_04', 'THIEUY LII YEEMÉ NA TA DAW YARAM THIEYY SERIGNE BI Abonnez-vous Xidma Tv Chaîne...', 'Xidma Tv'],
        ['THIEUY LII... RABBI BI KAWÉNA SERIGNE MOUSTAPHA NIANG KOUL', '', demo('naGl7ZtZGyI'), 'v_05', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Allahu Akbar 😭 Thieyy Minanu | Rajass Serigne Moustapha Niang Koul | Magal 14 Zul-Qihda...', '', demo('HUAukWf-N_E'), 'v_06', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['⭕Radiass mafatihul bichri par Serigne moustapha niang koul', '', demo('t8OeLHsvxqM'), 'v_07', 'Radiass Mafatihul bichri par Serigne Moustapha Niang Bichri video en lyrics yaln...', 'BichridigitalAgency'],
        ['😭 FAWZEYNI S Moustapha NIANG KOUL- Prokhane 2025', '', demo('tMqWb8NpI8c'), 'v_08', 'Abonnez-vous gratuitement à notre chaîne YouTube et Activer la Cloche, pour rest...', 'Al Burur Média'],
        ['#Nouveaute Dialibatoul Marakhibe | Serigne Moustapha Niang | Fajaru Bissu Xassida Touba Koul 2022', '', demo('ce1bAny8FKU'), 'v_09', 'DIALIBATOUL MARAKHIBE RAJASS SERIGNE MOUSTAPHA NIANG KOUL JOURNÉE KHASSIDA TOUBA...', 'Xidma Tv'],
        ['Serigne Moustapha Niang Koul', '', demo('pF9NzeYVwIs'), 'v_10', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['🟠Foulkoul Mashoun Touba Koul | Serigne Moustapha Niang Koul | Jour 01 Ramadane 1447H-2026', '', demo('srjWPExrr5Q'), 'v_11', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Mawahibou Bou Yeemé 😭 SERIGNE MOUSTAPHA NIANG KOUL BISSU 14 ZOUL QIHDA TOUBA NGAYE ÉDITION 2021', '', demo('pwvjAay2-L4'), 'v_12', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Ndeysaan Cëyy 😭 Serigne Moustapha Niang Koul | Journée Xassida Touba Ucad | Edition 2026', '', demo('-BkZay8iMf8'), 'v_13', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🟠Foulkoul Mashoun Touba Koul | Serigne Moustapha Niang Koul | Jour 02 Ramadane 1447H-2026', '', demo('aZOXn2U5WXk'), 'v_14', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🟠Nouveauté Cëyy😭 Nourou Darayni Serigne Moustapha Niang Koul | Ngontum Nourou Darayni Touba Ritta...', '', demo('jSWS_1QGeWg'), 'v_15', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Thieyy Khassida 😭 Ndeysane Serigne Moustapha Niang Koul Journée Khassida Touba Ngaye Edition 2023', '', demo('rHiDq7HIuuI'), 'v_16', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Thieyy Ndeysaan 😭 Rajass S. Moustapha Niang Koul | Journée Xassida Touba Keur Moussa Edition 2026', '', demo('FG1Kzckxzd0'), 'v_17', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['MAWAHIBOU S. MOUSTAPHA NIANG KOUL | XIDMA TV', '', demo('wXak4c9iXcQ'), 'v_18', 'Mawahibou Nafih Rajass SERIGNE MOUSTAPHA NIANG KOUL Abonnez-vous Xidma Tv Chaîne...', 'Xidma Tv'],
        ['Lii Tam Yéména 🤔 Segn Moustapha Niang Koul | Journée Xassida Touba Risso Édition 2022', '', demo('t7VWI8dcFXY'), 'v_19', 'Rajass Serigne Moustapha Niang Koul Journée Khassida Touba Risso Abonnez-vous Xi...', 'Xidma Tv'],
        ['Moustapha Niang Koul', '', demo('58ANuXk5PYY'), 'v_20', 'Prestation authentique de khassida.', 'ALMAHARIF TV'],
        ['😭Thieyy Xassida😭 Serigne Moustapha Niang Koul | Ngontum Xassida Touba Sakh | Edition 2026', '', demo('zPIUDmIXOno'), 'v_21', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🟠WAKAANA QAHAN FULKU | Serigne Moustapha Niang Koul | Xidma Tv', '', demo('1jEomUW986E'), 'v_22', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Cëyy Ndeysaan 😭 Serigne Moustapha Niang Koul | Journée Xassida Kebemer Édition 2026', '', demo('edZIEmlmG_E'), 'v_23', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🟠Dialibatoul Marakhib | Serigne Moustapha Niang Koul | Bissou Xassida Touba Koul Edition 2025', '', demo('_O6RoQ834gI'), 'v_24', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭 NDAYYSANE WAKANA BI DAWNA YARAM 😭 Rajass Serigne Moustapha Niang Koul THIANTE S MOURTADA MBACKÉ', '', demo('RqeD4zmmMpI'), 'v_25', 'Retrouvez toutes nos vidéos sur notre chaîne youtube . #albachirtv#actualités Re...', 'AL BACHIR TV'],
        ['🟡New NOROU DARAYNI MOUSTAPHA NIANG KOUL XASSIDA', '', demo('hGudYTK4lXw'), 'v_26', 'Rejoignez cette chaîne pour bénéficier d\'avantages exclusifs ......', 'Khelcom Production'],
        ['Thieyy Minanou Bi 💫 Sëgn Moustapha Niang Koul | Journée Khassida Touba Khandane Édition 2022', '', demo('6-aUambnJhs'), 'v_27', 'Rajass Serigne Moustapha Niang Koul Abonnez-vous Xidma Tv Chaîne Serviteur Cheik...', 'Xidma Tv'],
        ['Minanoul Baakhil Khadiim SRG Moustapha NIANG KOUL: Guddi Adiouma Wajaal  MAGAL 1447H-2025', '', demo('a3yMhPL2V8g'), 'v_28', 'Abonnez-vous gratuitement à notre chaîne YouTube et Activer la Cloche, pour rest...', 'Al Burur Média'],
        ['S.Moustapha Niang Koul ||Wakana Hackane', '', demo('ST65FbtCGCw'), 'v_29', 'Abonnez-vous gratuitement sur la chaine youtube tassawoudou soubanemedia....', 'Tazawudus Shubbaan TV'],
        ['😭Thieyy Ndeysaan Rajass Segn Moustapha Niang Koul | Journée Khassida Touba Risso | Édition 2023', '', demo('CpF2ZfWFEtQ'), 'v_30', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Allahu Akbar  Dioylo na Nièpp 😭 Serigne Moustapha  Niang Koul | Journée Xassida Touba Koul |  2024', '', demo('CqmTb4fpClo'), 'v_31', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭Cëyy Dialibatou S. Moustapha Niang Koul S.  Abdoul Khadiim Niang | Journée Xassida Touba Koul 2026', '', demo('5-OMcRCnAZs'), 'v_32', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🔴 Duo Bou Nékh Lool Segn Moustapha Niang Koul et Segn Mouhamed Thiam | Keur S. Khadim Ndiour Taysiir', '', demo('4q1c3Q-OXDM'), 'v_33', 'Duo Serigne Moustapha Niang Koul et Serigne Mouhamed Thiam Khassida Keur Serigne...', 'Xidma Tv'],
        ['🟠Nouveauté 😭 Nourou Darayni | Serigne Moustapha Niang Koul | Ngontum Nourou Darayni Touba Ritte Diaw', '', demo('R-tSJK-b0cE'), 'v_34', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['WOLOFAL MAME CHEIKH IBRAHIMA FALL SERIGNE MOUSTAPHA NIANG KOUL | XIDMA TV', '', demo('yWSgN8vEkkI'), 'v_35', 'Wolofalu Mame Cheikh Ibrahima Fall Rajass Serigne Moustapha Niang Koul Abonnez-v...', 'Xidma Tv'],
        ['😭Thieyy Attaba 😭 Serigne Moustapha Niang Koul  | Grande Journée Xassida Al Quraan Zikrulaah 1448H', '', demo('wNR4PeIa2YU'), 'v_36', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['😭THIEYY SERIGNE TOUBA RAJASS S.MOUSTAPHA NIANG KOUL JOURNÉE KHASSIDA 2024 NOUROU DAARAYNI CITEDOUANE', '', demo('lhDvjh1xkuM'), 'v_37', 'TAWFEKH PRODUCTION Tél 77 251 04 05 /76 023 13 82....', 'TAWFEKH PRODUCTION INTERNATIONAL HD'],
        ['Thieyy 😭 Rajass S.Moustapha Niang Koul | Journée Xassida UCAD  Université Cheikh Anta Diop 2026', '', demo('cHPh5fXESFY'), 'v_38', 'TAWFEKH PRODUCTION Tél 77 251 04 05 /76 023 13 82....', 'TAWFEKH PRODUCTION INTERNATIONAL HD'],
        ['Thiay!😭 Rajass S. Moustapha Niang Koul  | Magal Cheikh Ahmadou Diaw pakha : Edition 2026', '', demo('M0wAqNoemeo'), 'v_39', 'Thiay!   Rajass S. Moustapha Niang Koul Magal Cheikh Ahmadou Diaw pakha : Editio...', 'Khelcom Production'],
        ['Wakana hakhane_S MOUSTAPHA NIANG KOUL', '', demo('1gUn-u7Qpu0'), 'v_40', 'Khassida....', 'Baye Fall'],
        ['Thieyy Wolofal Bi Diooylo 😭 Trio Segn Moustapha Niang Koul Segn Yanda Gueye Segn Mouhamed Thiam', '', demo('OWUgINiyIZk'), 'v_41', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['4 Wolofal You Nékh Lool | Rajass Serigne Moustapha Niang Koul | Xidma Tv', '', demo('w2dj6ME0bfI'), 'v_42', '4 Wolofal You Nékh Lool | Serigne Moustapha Niang Koul | Xidma Tv....', 'Xidma Tv'],
        ['Thieyy 😭 Rajass Serigne Moustapha Niang Koul | Journée Xassida  Touba Khandane | Édition 2023', '', demo('M3mmb_CV3uo'), 'v_43', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['DIALIBATOUL MARAKHIBE RAJASS PAR SERIGNE MOUSTAPHA NIANG KOUL | XIDMA TV', '', demo('9sexBnilJTE'), 'v_44', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['ALLAHOU AKBAR 😱😭|RAJASS SERIGNE MOUSTAPHA NIANG KOUL BOU YEME…..THIANT ANNUEL DKK', '', demo('WIaqZPgRkZ8'), 'v_45', 'MAGUI SAKOU MBOKK TALIBE ABONNER CI CHAINE SUNU YITTE MOY YATAL LIGUEYE SERIGNE...', 'AL KHITMAH TV'],
        ['(EXTRAIT MAFATIKHOUL BICHRI# PAR SERIGNE MOUSTAPHA NIANG KOUL', '', demo('kPMAia97J4s'), 'v_46', 'DADJI BOU YESS EXTRAIT MAFATIKHOUL BICHRI....', 'MOUKHADIMAT TV OFFiCiEL'],
        ['😭 Ndaysan  Rajass Serigne Moustapha Niang Koul Journée Khassida Touba Résidence Cheikhoul Khadim', '', demo('cpSmKSwciac'), 'v_47', 'TAWFEKH PRODUCTION Tél 77 251 04 05 /76 023 13 82....', 'TAWFEKH PRODUCTION INTERNATIONAL HD'],
        ['😭Thieyy Borom Touba Amoul Moroom | Serigne Moustapha Niang Koul | Magal Porokhane 2026', '', demo('QXs5xwJXJwk'), 'v_48', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['S MOUSTAPHA NIANG KOUL TAYSIIRUL HASIIR', '', demo('TvXBEVV_1PU'), 'v_49', 'moustaphakoul....', 'Ceey Xassidayi!'],
        ['Ndesaan😭 Wakana Haqqan S Moustapha niang koul Journée Khassida Fondation Sop S  Saliou F3s Dakar', '', demo('Vmcx2_TAkos'), 'v_50', 'Rejoignez cette chaîne pour bénéficier d\'avantages exclusifs ......', 'Khelcom Production'],

        //serigne saliou asissy, bolle mbaye, ibra gueye, etc...

        ['Radiass serigne Saliou Aissy', '', demo('lIlnvDdfTDw'), 'v_01', 'Voici le canal telegram pour telecharger facilment nos videos Canal Telegram : h...', 'Minute xassida tv officiel'],
        ['😭Extrait Nourou Darayni Rajas Serigne Saliou Aissy ( Wallahi li sa biir Xol lay dugu', '', demo('ccStgm7EaFM'), 'v_02', 'Prestation authentique de khassida.', '𝗚𝗙 𝗧𝗩 𝗢𝗳𝗳𝗶𝗰𝗶𝗲𝗹'],
        ['Magal Darou Salam 2026 || Extrait Nourou Dareyni Serigne Saliou Aissy', '', demo('Kz9uASfYAm8'), 'v_03', 'Prestation authentique de khassida.', 'Darou Salam TV'],
        ['Radiass Serigne Saliou Aissy xassida Tanwirous Soudour', '', demo('D6OEHyje8n0'), 'v_04', 'RAJASS – Serigne Saliou Aissy Plongez dans une atmosphère spirituelle profonde à...', 'Mouride craque'],
        ['AHMADU MUGHNIYANE - SËRIÑ SALIOU AÏSSY', '', demo('9mK9xuUWhHY'), 'v_05', 'toubacakanam #khassida #bayefall #live #duet #mouride #capcut #fyp - - - - - Bie...', 'Ëhlu Qaçîda'],
        ['🟠 NOUROU DARAYNI | Rajass Serigne Saliou Aissy | XidmaTv | Extr... Nourou Darayni', '', demo('0KTxp746pCU'), 'v_06', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Wakana Haqqan Rajaz  Serigne Saliou Aissy (Lyric)', '', demo('MGeUh6pu9ww'), 'v_07', 'Abonnez-vous, likez et partagez!!! Les Plus Belles Déclamations de Khassida. "Ay...', 'Khassidayi Rek!'],
        ['Khassida - Matlaboul Fawzayni Rajaz Par Serigne Saliou Aissy 2025', '', demo('4V0Yz2r_a4o'), 'v_08', 'Bienvenue dans nôtre chaîne TOUBA XASSIDA La Chaîne Des Mourid Nous vous des Inf...', 'TOUBA XASSIDA TV'],
        ['XASSIDA MAWAHIBOU NAFIH Radiass Serigne Saliou Aissy 😭', '', demo('m97c_r9JS9s'), 'v_09', 'Prestation authentique de khassida.', 'AS SALIH TV'],
        ['🔴Cëy😭 Radjas Serigne Saliou Aissy Thiante Cheikh Ahmadou Diaw Pakha Touba Ngelamou 2026', '', demo('o9PdAp1GJxQ'), 'v_10', 'Rejoignez cette chaîne pour bénéficier d\'avantages exclusifs ......', 'Khelcom Production'],
        ['[🛑NOUVEAU] Khassida Jazbul Quluub Rajass Serigne Saliou Aissy', '', demo('BGV5P5ulG_0'), 'v_11', 'NOUVEAU] Khassida Jazbul Quluub Rajass Serigne Saliou Aissy #mouridoulahi_nation...', 'MOURIDOULAHI_NATION TV'],
        ['Khassida Midadi : par Serigne Saliou Aissy', '', demo('80mY8u6sKGs'), 'v_12', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['QASSIDA : TOUHFATOU, MAGNIFIQUE PRESTATION DE SALIOU AISSY', '', demo('AkvsfzFF_CY'), 'v_13', 'C\'est tout simplement sublime, la voix de S. Saliou AISSY. Yalla nako sunu Boro...', 'THE MURID WORLD'],
        ['Nourrou Darayni Serigne Saliou Aïssy 🎙️❤️', '', demo('2jrQfOAgu74'), 'v_14', 'Prestation authentique de khassida.', 'Touba Touhfatou'],
        ['🚨 KHASSIDA WAKANA HAQQAN SERIGNE SALIOU AISSY (VERSION 2)', '', demo('FRLrccnyR1Y'), 'v_15', 'Khassida wakana haqqan radias par Serigne saliou Aissy [ version 2 ]explication...', 'Only xassida Tv'],
        ['RAJAAS XASIIDA Taysirul Assir  Serigne Saliou Aïssy', '', demo('wwHYscEMTWY'), 'v_16', 'Prestation authentique de khassida.', 'Diawartou Visuel'],
        ['Magnifique Prestation S.Saliou Aissy |Anniversaire S.moussa Seye', '', demo('tpW46u1m7vA'), 'v_17', 'Moussa Seye Disponilble sur Instagramm / moussa seye l"officiel Whatsapp +221 77...', 'Moussa Seye L\'officiel'],
        ['Thiey Serigne Touba: Serigne Saliou AISSY chante les khassaides avec sa voix d&#39;or', '', demo('Me0uESLg5Vc'), 'v_18', 'N\'oubliez pas de vous abonnez sur DAKAR INSTANT youtube et facebook . ✆:(+221)...', 'dakar instant'],
        ['Rajass Serigne Saliou Aissy _ Guddi Ajjuma UCAD', '', demo('qPV8DGA4cU4'), 'v_19', 'tdisenegal #tdiinternationale #tditv Suivez nous sur toutes les plateformes digi...', 'TDi'],
        ['😭😭😭😭Rajass Serigne Saliou Aissy', '', demo('Wg6SgvQqOTM'), 'v_20', 'Prestation authentique de khassida.', 'DAROU KHOUDOSS TV'],
        ['Bindoum khassida par serigne saliou aissy', '', demo('Y2tbigLltd8'), 'v_21', 'Prestation authentique de khassida.', 'xassaid TV  Officiel'],
        ['Serigne Saliou Aissy |le génie à la voix d&#39;or❤️radiass xassidaTouhfatou(CHEIKH AHMADOU BAMBA)🔥..!!', '', demo('9UT7hkNwwxA'), 'v_22', 'Prestation authentique de khassida.', 'Ahmadou221'],
        ['Walahad Karamna S  Saliou Aissy', '', demo('lImE0-jARhE'), 'v_23', 'Prestation authentique de khassida.', 'M.Vision'],
        ['Tanwiru S Sudur Wa Tasshiloul Umour 1', '', demo('uUGNRRB65iQ'), 'v_24', 'Provided to YouTube by TuneCore Tanwiru S Sudur Wa Tasshiloul Umour 1 · Kiraamay...', 'Kiraamay Ahmadou - Topic'],
        ['😭Li Dawna yaram😭Rajass Xassida S. Saliou Aissy TANWIROUL SOUDOOR', '', demo('DNijYdnJoOU'), 'v_25', 'Prestation authentique de khassida.', 'Wakana Haqqan Tv'],
        ['Serigne Ibra Gueye 27ém jour Ramadan 2019 Jangum Fajar Jumay Touba', '', demo('T1OFduNeK5s'), 'v_26', 'ramadan_touba_koor_....', 'Gouye Mbinde TV HD'],
        ['Xassida Wakana haqqan Par Serigne Ibrahima gueye Fajar Touba 2026', '', demo('M_5RrisrlPQ'), 'v_27', 'Prestation authentique de khassida.', 'AS SALIH TV'],
        ['Khassida - NUURUD- DAARAYNI - Serigne Ibrahima GUEYE', '', demo('oHAB3Iz5zr4'), 'v_28', 'mouride #serignetouba #khassida....', 'Murid Academy'],
        ['Cëyy 😭 Foulkoul Mashoune Thies | Serigne Ibrahima Gueye | Jour 8 | Ramadan 1446H ○ 2025', '', demo('ivpMR4PK_rc'), 'v_29', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Hajj 2023: Jazbu Serigne Ibrahima Gueye', '', demo('zwm9HGedzyc'), 'v_30', 'Abonnez-vous pour plus de vidéos et n\'oubliez pas d\'activer la cloche de notif...', 'Gouye Mbinde TV HD'],
        ['🟠MAGAL POROKHANE 2026 | Rajass Serigne Ibrahima Gueye | Njàngum Fajar Keur Serigne Mountakha Mbacké', '', demo('uApCdYmOoSM'), 'v_31', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Khassasïd: Diaalibatou Maraxib interpréter par Serigne Ibrahima Gueye', '', demo('nyY5PUoKu2M'), 'v_32', 'Au nom d\'Allah, le créateur de l\'univers Nous sommes une organisation islamiqu...', 'Murid Academy'],
        ['😭Cëyy Ndeysaan Mawahibou bi😭 Yéména Serigne Ibrahima Gueye | Journée Xassida Touba Koul Edition 2026', '', demo('JvOzeMrQj3M'), 'v_33', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Moukhadimat Serigne Ibra Gueye bi lepp tawfekh kassé la', '', demo('fdFrbI3r-6E'), 'v_34', 'Nanga abonné ci chaine YouTube bi ndax nga mana doundou xassida yi....', 'Ci Xassida Yi Rekk'],
        ['Wakan Haqan par Serign ibra Gueye MAGAL POROKHANE 2026 : Njangum Qaça&#39;ids Fajar - Kër Sëriñ Muntaqaa', '', demo('tgP9WnWxH0c'), 'v_35', 'Bienvenue sur Al Khadimiyyah TV, la chaîne dédiée à la diffusion des enseignemen...', 'Al Khadimiyyah TV'],
        ['🟠 Foulkoul Mashoune Thies | Serigne Ibrahima Gueye | Jour 1 | Ramadan 1446H 2025', '', demo('ypc22JBmRgM'), 'v_36', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['MAGAL POROKHANE 2026 : Serigne Ibra Gueye - Xassida Minanu - Njangum Fajar - Kër Sëñ Muntaqaa', '', demo('ULfC4induE4'), 'v_37', 'Bienvenue sur Al Khadimiyyah TV, la chaîne dédiée à la diffusion des enseignemen...', 'Al Khadimiyyah TV'],
        ['Thiey Nourou daarayni serigne Ibrahima Gueye joylana Narbi', '', demo('QYWD3GD6dBQ'), 'v_38', 'Pour plus de vidéos abonnez-vous sur votre chaine Youtube préférée, en cliquant...', 'As-Samadiyya TV'],
        ['Matlaboul Fawzeyni serigne ibrahima Gueye', '', demo('Qw5EWkwLDSM'), 'v_39', 'Provided to YouTube by DistroKid Matlaboul Fawzeyni serigne ibrahima Gueye · Mur...', 'Murid Academy - Topic'],
        ['😭Thieyy  Wakaana Haqan 😭 Serigne Ibrahima Gueye | Nganouk Serigne Mame Cheikh Mbacke Mourtada', '', demo('n0YAEvTbS_E'), 'v_40', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['🔴En Direct 🔴Foulkou Thiès - Serigne Ibrahima GUEYE Jour 8 Ramadan 1447H /2026', '', demo('Wmf86wK6_A8'), 'v_41', 'TAWFEKH PRODUCTION Tél 77 251 04 05 /76 023 13 82....', 'TAWFEKH PRODUCTION INTERNATIONAL HD'],
        ['Ramadan 2021 1ER jour jangum fajar gui joumay Touba Serigne Ibrahima Gueye', '', demo('Ve2D-XqihAw'), 'v_42', 'ramadan 2021 JANGUM AVEC SERIGNE IBRAHIMA GUEYE A LA GRANDE MOSQUEE DE TOUBA abo...', 'xassaid TV  Officiel'],
        ['Rajass Serigne Ibra GUEYE Khassida', '', demo('vUGzawrKdo8'), 'v_43', 'Abonnez-vous pour plus de vidéos et n\'oubliez pas d\'activer la cloche de notif...', 'Gouye Mbinde TV HD'],
        ['HAJJ 2023: TAYSIROUL ASSIR SERIGNE IBRAHIMA GUEYE', '', demo('sTKqG3f8U0E'), 'v_44', 'Abonnez-vous pour plus de vidéos et n\'oubliez pas d\'activer la cloche de notif...', 'Gouye Mbinde TV HD'],
        ['La prestation de S. Ibra GUEYE (Vivification du Ramadan à la Grande Mosquée de Touba - Episode 4 )', '', demo('pg91pqaXANo'), 'v_45', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['🔴Oh! Touhfatou 😢 Serigne ibra gueye Hajj Makkah si Kaaba gui Thiey! Serigne Bi ak Khassida Yi😭', '', demo('jwUOZY8lABs'), 'v_46', 'https://www.youtube.com/watch?v=cwjaOhbOXGg --~-- Visitez Notre Chaine Youtube e...', 'Khelcom Production'],
        ['Radiass khassida Mafatihul Bichri Serigne Ibra Guéye ❤️🤲🏾🙏🏾', '', demo('_-a198uuYkY'), 'v_47', 'Prestation authentique de khassida.', 'Matlabuch-Chifaa-i TV'],
        ['Khassida :Wakaana Haqqan S Ibrahima Gueye', '', demo('gKHpu6knKHk'), 'v_48', 'mouride #serignetouba #khassida....', 'Murid Academy'],
        ['Rajass Serigne Ibrahima Gueye | Journée Xassida Touba Koul | Édition 2024', '', demo('KT6kZalZ5hc'), 'v_49', 'Abonnez-vous Xidma Tv Chaîne Serviteur Cheikhoul Xadiim Suivez -Direct : Événeme...', 'Xidma Tv'],
        ['Xassida Matlabul Fawzeyni par S. Ibra GUEYE | Jangum Fajar Touba Ramadan 2020', '', demo('A2_BQnq2LjE'), 'v_50', 'Pour plus de vidéos abonnez-vous sur votre chaine Youtube préférée, en cliquant...', 'My Channel'],
        ['Rétro : Xassida Mafatihoul Djinane - Rajaz par S. Bollé Mbaye (audio)', '', demo('JOV5vli0Uhk'), 'v_51', 'Prestation authentique de khassida.', 'Taarou Mouride TV - HD'],
        ['Rajass Serigne Bollé Mbaye Journée Khassida Touba Ngaye 1442 H 2021', '', demo('Yy9tnNvaxzA'), 'v_52', 'VISITEZ NOTRE SITE WEB/ http://toubavision.com RETROUVEZ NOUS SUR LES RÉSEAUX SO...', 'ToubaVision ToubaVision'],
        ['Jazbou | Serigne Bollé Mbaye', '', demo('Dln_oDkSiI4'), 'v_53', 'Khassida Jazboul Khouloub de Cheikh Ahmadou Bamba interprété par Serigne Bollé M...', 'MahwaVision'],
        ['Khassida Maramiya Hinda Lahi (Par Serigne Bolle Mbaye)', '', demo('e6v8T4mkATE'), 'v_54', 'Pensez à laisser un J\'aime et un Commentaire ! Si vous avez vraiment aimé la vi...', 'Al Khadimiyyah TV'],
        ['Serigne Bolle MBAYE Magal Darou Rahman 2022', '', demo('ZhJJioCx7G8'), 'v_55', 'Abonnez-vous pour plus de vidéos et n\'oubliez pas d\'activer la cloche de notif...', 'Gouye Mbinde TV HD'],
        ['Magal Touba 2024 | MAFATIHUL JINANE Serigne Bollé Mbaye', '', demo('yVBD0jy1KNk'), 'v_56', 'Prestation authentique de khassida.', 'Kanzoul Mouhtadine tv'],
        ['Maramiya - Serigne Bolle Mbaye  -  Studio', '', demo('BP_FzO58BRo'), 'v_57', 'Serigne Bolle Mbaye: Yalla naka yalla Weral te yaggal koffi. ENregistre par Almi...', 'Al Midaad TV قناة المداد'],
        ['Rajass Khassida Serigne Bolle Mbaye:Grande Journée Qacida du 13 Juillet 2023', '', demo('Q_RyxxvMKEM'), 'v_58', 'Chers téléspectateurs, n\'oublie jamais participer à cette cagnotte pour souteni...', 'Al Khadimiyyah TV'],
        ['Serigne Bolle Mbaye   Dialibatoul Marakhib 1', '', demo('DtFcNKbkbSQ'), 'v_59', 'Nous remercions de votre intérêt pour cette vidéo. La Base de données de Dialiba...', 'LA BASE DE DONNÉES DE DIALIBATOUL MARAKHIB'],
        ['KHASSIDA  ATABALIL MAMARA 2    SERIGNE BOLLE MBAYE', '', demo('_De-wSDdNw4'), 'v_60', 'Niou Fatalikou Serigne Souhaibou Mbacké Ak Serigne Salihou Mbacké Yalla Na Yalla...', 'ASSADOUL KHADIM'],
        ['Alhamdoulilah leuzi youdiasi _SERIGNE BOLLE MBAYE', '', demo('NRJm-aXGBaY'), 'v_61', 'Suivez-nous sur tous les réseaux sociaux https://www.facebook.com/marakhitv http...', 'Marakhib Tv'],
        ['Attaba Serigne Bollé Mbaye | Kourel Tazawoudou Sighar HT Dakar | Al Mashrabou Shafi Ramadan 2026 J20', '', demo('5Vc7AJM3mAs'), 'v_62', 'Khassida Attaba Serigne Bollé Mbaye par Kourel Tazawudus Sighar HT Dakar au 20èm...', 'Diawartoulah TV'],
        ['#La Voix D&#39;or Du Khassida par Serigne Bollé Mbaye Lou daw yaram❤️😭', '', demo('ymhKOnGmNSQ'), 'v_63', 'Abonnez-vous et activité la cloche dem notification info : (+221) 768211426 #kha...', 'XASSIDA STUDIO HD'],
        ['Serigne Bollé MBAYE Khassida MAWAHIBOU', '', demo('ID1lBT-JlLg'), 'v_64', 'Khassaides de Serigne Touba #RADIASS #khassida #touba #xasiida....', 'Sunu Thiante'],
        ['Magal Magal Daroul Mouhty 2016: Rajass Khassida par Serigne Bollé Mbaye', '', demo('-957xuurmqc'), 'v_65', 'Abonnez-vous gratuitement à la chaîne Alkhadimiyyah.Com pour rester informé chaq...', 'Al Khadimiyyah TV'],
        ['Serigne Bollé Mbaye : &quot;DIAALIBATOUL MARÂKHIB&quot;', '', demo('fGJ47Fd6X1Y'), 'v_66', 'Prestation authentique de khassida.', 'Jalibatoul Maziyah'],
        ['Khassida  Athaba, Huqqal Bukka U   Lil Mustafa Nawaytu par Serigne Bollé Mbaye', '', demo('mnteKmzb_p0'), 'v_67', 'Prestation authentique de khassida.', 'mor thiam'],
        ['Serigne Bollé Mbaye', '', demo('lgl5Z7PfOXM'), 'v_68', 'FND....', 'Fallou Ndiaye'],
        ['Ataaba Serigne Bolle Mbaye bi dalay diooyloo ndeysaan', '', demo('vE9FMwmpbQQ'), 'v_69', 'Nanga abonné ndax nga mana doundou xassida yi....', 'Ci Xassida Yi Rekk'],
        ['Khassida: Hamat Soulayma (Serigne Bollé Mbaye)', '', demo('9QlEYMe8alQ'), 'v_70', 'Khassida Hamat Soulayma (Un poeme de Cheikh Ahmadou Bamba Chanté par Serigne Bol...', 'Al Khadimiyyah TV'],
        ['Mafatihoul Jinane (S.Bollé Mbaye - S.Mbacke Diakhaté) Kourel Serigne Saliou HT 25 Jour Ramadan 2026', '', demo('ptjoZceoky0'), 'v_71', 'KOUREL 1 TOUTANK HTDKH MA FIERTÉ....', 'Mbacké Ndiaye Seck'],
        ['Midadi Serigne Bollé Mbaye BOU DAW YARAM AK ARAF YOU LER', '', demo('GaBAJJAnIas'), 'v_72', 'Ndiangue mou nekh TE TAWFEKHE BOU SERIGNE BOLLE MBAYE....', 'PASTEF TV'],
        ['Ahbabtou Serigne Bollé Mbaye', '', demo('NY0ji5AP1ZA'), 'v_73', 'Prestation authentique de khassida.', 'Soppey Seydina Hassan Salam Canada'],
        ['Khassida-MOUKHADIMAT par Serigne Bollé Mbaye', '', demo('mg2QGMLkSPE'), 'v_74', 'Xamsamreewtoutehistoiredusenegal     E-mail : mbayegueyesyll@gmail.com Téléphone...', 'Xam Sam Réew Tv'],
        ['XASSIDA AHBABTOU AK FATAHA SERIGNE BOLLE MBAYE K2 HT DAKAR J22 RAMADAN 2021', '', demo('BVLfHc4s13s'), 'v_75', 'XASSIDA AHBABTOU AK FATAHA SERIGNE BOLLE MBAYE K2 HT DAKAR J22 RAMADAN 2021....', 'Diawartoulah TV']


    ]



};

interface VideoItem {
    id: string;
    section: SectionId;
    title: string;
    arabic: string;
    author: string;
    desc: string;
    source: VideoSource | null;
    thumb?: string;
    duration?: string;
    letter: string; // lettre pour le filtre A–Z
    hay: string;    // texte normalisé pour la recherche
}

const seenIds = new Set<string>();
const VIDEOS: VideoItem[] = SECTIONS.flatMap((sec) => RAW_BY_SECTION[sec.id].map(([rawTitle, arabic, rawSource, idOverride, descOverride, authorOverride, duration, thumbOverride]) => {
    const title = rawTitle.trim();
    const author = authorOverride || AUTHOR;
    const base = idOverride || slugify(title) || 'video';
    let id = base;
    let n = 2;
    while (seenIds.has(id)) id = `${base}_${n++}`; // garantit des identifiants uniques (favoris, signalements)
    seenIds.add(id);
    const desc = descOverride || `Vidéo de ${author}, à regarder directement en ligne.`;
    const source = parseSource(rawSource);
    return {
        id, section: sec.id, title, arabic: arabic || '', author, desc, source,
        thumb: thumbOverride || (source ? autoThumb(source) : undefined),
        duration: duration || undefined,
        letter: normalize(title).replace(/[^a-z]/g, '').charAt(0).toUpperCase() || '#',
        hay: normalize([title, arabic, author, desc].join(' '))
    };
})).sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

const SECTION_COUNT = Object.fromEntries(SECTIONS.map((sec) => [sec.id, VIDEOS.filter((v) => v.section === sec.id).length])) as Record<SectionId, number>;

const LETTERS = Array.from(new Set(VIDEOS.map((v) => v.letter))).sort();

/* -------------------------------------------------------------------------- */
/*  ICÔNES                                                                    */
/* -------------------------------------------------------------------------- */

const P = {
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
    moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    arrow: 'M14 5l7 7m0 0l-7 7m7-7H3',
    close: 'M6 18L18 6M6 6l12 12',
    menu: 'M4 6h16M4 12h16M4 18h16',
    play: 'M8 5v14l11-7z',
    heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
};

const I = ({ d, c = 'w-4 h-4', fill = false }: { d: string; c?: string; fill?: boolean }) => (
    <svg className={c} fill={fill ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const Logo = ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <defs>
            <mask id="xc-logo-mask">
                <rect width="36" height="36" fill="white" />
                <path d="M18 20.75 10.5 18.25v7.5l7.5 2.5zM18 20.75l7.5-2.5v7.5L18 28.25z" fill="black" />
                <path d="M18 20.75v7.5" stroke="white" strokeWidth="0.6" />
            </mask>
        </defs>
        <g mask="url(#xc-logo-mask)" fill="currentColor">
            <rect x="2" y="18.75" width="32" height="12" rx="6" />
            <circle cx="10" cy="19.25" r="7.5" />
            <circle cx="19.5" cy="15.25" r="10" />
            <circle cx="28" cy="20.25" r="7" />
        </g>
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.18 21.3 7.22 24 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.4s.13-1.68.38-2.4V6.29H1.19C.43 7.82 0 9.55 0 11.84s.43 4.02 1.19 5.55l4.08-3.15z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.18 2.7 1.19 6.29l4.08 3.15c.95-2.85 3.6-4.69 6.73-4.69z" />
    </svg>
);

const Loader = ({ className = "w-4 h-4" }) => (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

/* -------------------------------------------------------------------------- */
/*  APERÇU (miniature) D'UNE VIDÉO                                            */
/* -------------------------------------------------------------------------- */

function VideoPreview({ video }: { video: VideoItem }) {
    const [imgFailed, setImgFailed] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    const [detected, setDetected] = useState('');
    const src = video.source;
    const label = video.duration || detected;

    let media: React.ReactNode = null;
    if (video.thumb && !imgFailed) {
        media = (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
        );
    } else if (src?.kind === 'file' && !videoFailed) {
        // Aperçu = première image de la vidéo (aucune miniature à fournir)
        media = (
            <video
                src={`${src.ref}#t=1`}
                muted
                playsInline
                preload="metadata"
                tabIndex={-1}
                aria-hidden="true"
                onLoadedMetadata={(e) => setDetected(formatDuration(e.currentTarget.duration))}
                onError={() => setVideoFailed(true)}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
        );
    } else {
        media = (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-950">
                <Logo className="w-16 h-16 text-amber-300/60" />
            </div>
        );
    }

    return (
        <>
            {media}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
            {src && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-amber-400/95 text-[#0F3D2E] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                        <I d={P.play} c="w-6 h-6 ml-0.5" fill />
                    </span>
                </span>
            )}
            {label && (
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[11px] font-semibold tabular-nums">{label}</span>
            )}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  CARTE (même design que l'accueil et la page Xassidas)                     */
/* -------------------------------------------------------------------------- */

function VideoCard({ video, theme, isFav, onToggleFav, onWatch }: {
    video: VideoItem; theme: Theme; isFav: boolean;
    onToggleFav: () => void; onWatch: () => void;
}) {
    const ok = Boolean(video.source);
    return (
        <article className={`rounded-3xl border shadow-lg flex flex-col justify-between overflow-hidden transition-all hover:-translate-y-1 ${theme.card}`}>
            <div>
                <button
                    type="button"
                    onClick={onWatch}
                    disabled={!ok}
                    aria-label={ok ? `Regarder ${video.title}` : `${video.title} : bientôt disponible`}
                    className="group relative block w-full aspect-video overflow-hidden bg-black cursor-pointer disabled:cursor-not-allowed"
                >
                    <VideoPreview video={video} />
                </button>

                <div className="p-6 sm:p-8 space-y-4">
                    <div className="flex justify-between items-start gap-3">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-400/20 ${theme.accent}`}>
                            {ok ? 'Vidéo' : 'Bientôt disponible'}
                        </span>
                        {video.arabic && (
                            <span dir="rtl" lang="ar" className={`text-lg leading-snug ${theme.accent}`} style={{ fontFamily: ARABIC_FONT }}>{video.arabic}</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold font-serif">{video.title}</h3>
                    <p className={`text-xs leading-relaxed ${theme.muted}`}>{video.desc}</p>
                </div>
            </div>

            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="pt-6 border-t border-gray-500/20 flex gap-2">
                    <button
                        type="button"
                        onClick={onWatch}
                        disabled={!ok}
                        className="flex-1 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{ok ? 'Regarder maintenant' : 'Bientôt disponible'}</span>
                        {ok && <I d={P.arrow} />}
                    </button>
                    <button
                        type="button"
                        onClick={onToggleFav}
                        aria-pressed={isFav}
                        aria-label={isFav ? `Retirer ${video.title} des favoris` : `Ajouter ${video.title} aux favoris`}
                        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        className={`p-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 transition-colors ${theme.accent}`}
                    >
                        <I d={P.heart} fill={isFav} />
                    </button>
                </div>
            </div>
        </article>
    );
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function VideosPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [heroError, setHeroError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [query, setQuery] = useState('');
    const [letter, setLetter] = useState('');
    const [onlyFavs, setOnlyFavs] = useState(false);
    const [section, setSection] = useState<SectionId | ''>('');
    const [visibleMap, setVisibleMap] = useState<Record<string, number>>({}); // nombre de cartes affichées par rubrique

    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authError, setAuthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
    const [readerLoading, setReaderLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportText, setReportText] = useState('');
    const [reportSending, setReportSending] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const t = getTheme(darkMode);
    const uid = user?.uid ?? null;
    const userLabel = displayName || user?.email?.split('@')[0] || 'Utilisateur';

    /* ---- Thème (même clé de stockage que l'accueil) ---- */
    useEffect(() => {
        let initial = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
        try {
            const saved = localStorage.getItem('xassida_dark');
            if (saved !== null) initial = JSON.parse(saved) === true;
        } catch { /* stockage indisponible */ }
        setDarkMode(initial);
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        document.documentElement.classList.toggle('dark', darkMode);
        try { localStorage.setItem('xassida_dark', JSON.stringify(darkMode)); } catch { /* ignoré */ }
    }, [darkMode, isMounted]);

    /* ---- Authentification ---- */
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setDisplayName(u?.displayName ?? null); });
        return () => unsubscribe();
    }, []);

    /* ---- Favoris vidéos (par compte, clé distincte des xassidas) ---- */
    useEffect(() => {
        if (!uid) { setFavorites([]); setOnlyFavs(false); return; }
        try {
            const raw = localStorage.getItem(`xassida_video_favs_${uid}`);
            setFavorites(raw ? JSON.parse(raw) : []);
        } catch { setFavorites([]); }
    }, [uid]);

    /* ---- Retour au nombre de cartes par défaut quand un filtre change ---- */
    useEffect(() => { setVisibleMap({}); }, [query, letter, onlyFavs, section]);

    /* ---- Échap ferme la couche la plus haute ---- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (reportModalOpen) setReportModalOpen(false);
            else if (isLoginModalOpen) setIsLoginModalOpen(false);
            else if (activeVideo) setActiveVideo(null);
            else if (mobileMenuOpen) setMobileMenuOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [reportModalOpen, isLoginModalOpen, activeVideo, mobileMenuOpen]);

    /* ---- Bloque le défilement derrière une modale ---- */
    const overlayOpen = Boolean(activeVideo) || isLoginModalOpen || reportModalOpen || mobileMenuOpen;
    useEffect(() => {
        document.body.style.overflow = overlayOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [overlayOpen]);

    useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

    const showToast = useCallback((msg: string) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToastMessage(msg);
        toastTimer.current = setTimeout(() => setToastMessage(''), 3500);
    }, []);

    const openAuth = (mode: 'signup' | 'login') => {
        setAuthMode(mode);
        setAuthError('');
        setMobileMenuOpen(false);
        setIsLoginModalOpen(true);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) { setAuthError(NOT_CONFIGURED_MSG); return; }
        setAuthError('');
        setIsLoading(true);
        try {
            if (authMode === 'signup') {
                const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
                const cleanName = name.trim();
                if (cleanName) { await updateProfile(cred.user, { displayName: cleanName }); setDisplayName(cleanName); }
                showToast('Compte créé avec succès ! Bienvenue.');
            } else {
                await signInWithEmailAndPassword(auth, email.trim(), password);
                showToast('Connexion réussie !');
            }
            setIsLoginModalOpen(false);
            setEmail(''); setPassword(''); setName('');
        } catch (error) {
            setAuthError(getErrorMessage((error as { code?: string })?.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) { setAuthError(NOT_CONFIGURED_MSG); return; }
        setAuthError('');
        setIsLoading(true);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        try {
            await signInWithPopup(auth, provider);
            setIsLoginModalOpen(false);
            showToast('Connecté avec succès via Google !');
        } catch (error) {
            setAuthError(getErrorMessage((error as { code?: string })?.code));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            setMobileMenuOpen(false);
            showToast('Déconnexion réussie.');
        } catch {
            showToast('La déconnexion a échoué. Réessayez.');
        }
    };

    const toggleFavorite = (id: string) => {
        if (!user) {
            showToast('Connectez-vous pour ajouter des favoris.');
            openAuth('login');
            return;
        }
        const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
        setFavorites(next);
        try { localStorage.setItem(`xassida_video_favs_${user.uid}`, JSON.stringify(next)); } catch { /* ignoré */ }
    };

    const toggleOnlyFavs = () => {
        if (!user) {
            showToast('Connectez-vous pour voir vos favoris.');
            openAuth('login');
            return;
        }
        setOnlyFavs((v) => !v);
    };

    // Ouvre le lecteur ; le loader reste affiché jusqu'à ce que la vidéo soit prête à jouer
    const openVideo = (video: VideoItem) => {
        setReaderLoading(Boolean(video.source));
        setActiveVideo(video);
    };

    const handleReportSubmit = async () => {
        const text = reportText.trim();
        if (!text || !activeVideo) return;
        if (!db) { showToast("Envoi impossible : le service n'est pas configuré."); return; }
        setReportSending(true);
        try {
            await Promise.race([
                addDoc(collection(db, 'reports'), {
                    type: 'video',
                    docId: activeVideo.id,
                    docTitle: activeVideo.title,
                    message: text,
                    uid,
                    createdAt: serverTimestamp()
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
            ]);
            showToast('Merci, votre signalement a bien été enregistré.');
            setReportModalOpen(false);
            setReportText('');
        } catch {
            showToast('Envoi impossible pour le moment. Réessayez plus tard.');
        } finally {
            setReportSending(false);
        }
    };

    /* ---- Données dérivées ---- */
    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        return VIDEOS.filter((v) =>
            (!letter || v.letter === letter) &&
            (!onlyFavs || favorites.includes(v.id)) &&
            (!q || v.hay.includes(q))
        );
    }, [query, letter, onlyFavs, favorites]);

    const bySection = useMemo(
        () => Object.fromEntries(SECTIONS.map((sec) => [sec.id, filtered.filter((v) => v.section === sec.id)])) as Record<SectionId, VideoItem[]>,
        [filtered]
    );
    const hasFilter = Boolean(query.trim() || letter || onlyFavs);
    // Quand une recherche ou un filtre est actif, on masque les rubriques vides
    const sectionsToShow = SECTIONS.filter((sec) => (!section || sec.id === section) && (!hasFilter || bySection[sec.id].length > 0));
    const totalShown = sectionsToShow.reduce((n, sec) => n + bySection[sec.id].length, 0);
    const availableCount = VIDEOS.filter((v) => v.source).length;
    const resetFilters = () => { setQuery(''); setLetter(''); setOnlyFavs(false); };

    const inputClass = `w-full px-4 py-3 rounded-2xl border text-xs outline-none transition-all ${t.input}`;
    const labelClass = `block text-[11px] font-semibold mb-1 uppercase tracking-wider ${t.accent}`;
    const sectionBtn = (active: boolean) =>
        `shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${active ? 'bg-amber-400 text-[#0F3D2E] shadow-md' : `${t.chip} ${t.muted}`}`;
    const letterBtn = (active: boolean) =>
        `shrink-0 min-w-9 h-9 px-3 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : `${t.chip} ${t.muted}`}`;

    return (
        <div id="top" className={`min-h-screen font-sans transition-colors duration-300 flex flex-col justify-between ${t.page}`}>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn .25s ease-out both; }
        @keyframes logoPulse { 0%, 100% { transform: scale(0.8); opacity: .7; } 50% { transform: scale(1.25); opacity: 1; } }
        .animate-logoPulse { animation: logoPulse 1.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn { animation: none; }
          .animate-logoPulse { animation: none; }
        }
      `}</style>

            {/* TOAST */}
            {toastMessage && (
                <div role="status" aria-live="polite" className="fixed bottom-6 right-6 left-6 sm:left-auto z-[70] bg-[#0F3D2E] text-amber-300 px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/40 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                    {toastMessage}
                </div>
            )}

            {/* NAVIGATION */}
            <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${darkMode ? 'bg-[#041c14]/90 border-emerald-900/30' : 'bg-[#FCFCFA]/90 border-emerald-900/10'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-3 group min-w-0">
                        <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <Logo className="w-7 h-7 text-amber-300" />
                        </div>
                        <div className="min-w-0">
                            <span className={`text-lg sm:text-xl font-bold tracking-tight block ${t.title}`}>Xassida Cloud</span>
                            <span className={`hidden sm:block text-[11px] tracking-wide font-semibold truncate ${t.accent}`}>La bibliothèque numérique du patrimoine mouride</span>
                        </div>
                    </Link>

                    <nav aria-label="Navigation principale" className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-full border ${darkMode ? 'bg-emerald-950/40 border-emerald-800/30' : 'bg-emerald-900/5 border-emerald-900/10'}`}>
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.id}
                                href={item.href}
                                aria-current={item.id === 'videos' ? 'page' : undefined}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${item.id === 'videos' ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : t.navIdle}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2.5 rounded-xl transition-colors shadow-sm ${t.chip} ${t.accent}`}
                            aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
                            title="Basculer le mode d'affichage"
                        >
                            <I d={darkMode ? P.sun : P.moon} c="w-5 h-5" />
                        </button>

                        {user ? (
                            <div className={`hidden sm:flex items-center gap-3 py-1 px-3 rounded-2xl border border-emerald-900/10 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-900/10'}`}>
                                <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0F3D2E] flex items-center justify-center font-bold text-xs">{userLabel.charAt(0).toUpperCase()}</div>
                                <div className="flex flex-col">
                                    <span className={`text-xs font-semibold ${t.title}`}>{userLabel}</span>
                                    <button type="button" onClick={handleLogout} className="text-[11px] text-red-500 hover:underline text-left">Déconnexion</button>
                                </div>
                            </div>
                        ) : (
                            <button type="button" onClick={() => openAuth('signup')} aria-label="Se connecter" className="bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 px-3 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-md transition-all flex items-center gap-2">
                                <I d={P.user} />
                                <span className="hidden sm:inline">Se connecter</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                            aria-expanded={mobileMenuOpen}
                            className={`md:hidden p-2.5 rounded-xl ${t.chip} ${t.title}`}
                        >
                            <I d={mobileMenuOpen ? P.close : P.menu} c="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* MENU MOBILE */}
            {mobileMenuOpen && (
                <div className={`md:hidden fixed inset-x-0 top-20 bottom-0 z-40 p-6 flex flex-col gap-2 overflow-y-auto ${t.pageBg}`}>
                    {NAV_ITEMS.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`py-3 px-4 rounded-xl text-base font-medium ${item.id === 'videos' ? 'bg-[#0F3D2E] text-amber-300 font-semibold' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {user ? (
                        <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-3 ${t.card}`}>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 shrink-0 rounded-full bg-amber-400 text-[#0F3D2E] flex items-center justify-center font-bold text-sm">{userLabel.charAt(0).toUpperCase()}</div>
                                <span className="text-sm font-semibold truncate">{userLabel}</span>
                            </div>
                            <button type="button" onClick={handleLogout} className="text-xs text-red-500 font-medium hover:underline">Déconnexion</button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => openAuth('signup')} className="w-full bg-amber-400 text-[#0F3D2E] py-3.5 rounded-xl font-bold text-center mt-4 shadow-md">
                            Créer un compte / Se connecter
                        </button>
                    )}
                </div>
            )}

            <main className="flex-grow">
                {/* EN-TÊTE */}
                <section className="relative text-white overflow-hidden py-14 sm:py-20">
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0F3D2E] to-[#020b08]">
                        {!heroError && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="/mosque-touba.png" alt="" className="w-full h-full object-cover object-center filter brightness-[0.35]" onError={() => setHeroError(true)} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-[#020b08]/80 via-[#0a291d]/60 to-[#0a291d]/80"></div>
                    </div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 text-center space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-600/50 text-amber-300 text-xs font-medium tracking-wide shadow-sm backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            {VIDEOS.length} vidéo{VIDEOS.length > 1 ? 's' : ''} · {availableCount} disponible{availableCount > 1 ? 's' : ''}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif drop-shadow-md">Vidéos</h1>
                        <p className="text-emerald-50 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
                            Regardez chaque vidéo directement sur le site, classée par rubrique : Waxtaan, Référence, Prestation Kureel et Rajass. Un problème avec une vidéo ? Signalez-le depuis le lecteur.
                        </p>
                    </div>
                </section>

                {/* BARRE DE RECHERCHE FIXE */}
                <div className={`sticky top-20 z-30 backdrop-blur-xl border-b transition-colors ${darkMode ? 'bg-[#041c14]/95 border-emerald-900/30' : 'bg-[#FCFCFA]/95 border-emerald-900/10'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 space-y-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link href="/" aria-label="Retour à l'accueil" className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3.5 rounded-2xl bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 text-xs font-semibold shadow-md transition-colors">
                                <I d={P.arrow} c="w-4 h-4 rotate-180" />
                                <span className="hidden sm:inline">Retour à l’accueil</span>
                            </Link>

                            <div role="search" className={`flex-1 min-w-0 flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border shadow-sm ${t.card}`}>
                                <I d={P.search} c={`w-5 h-5 ml-2 shrink-0 ${t.accent}`} />
                                <label htmlFor="search-input" className="sr-only">Rechercher une vidéo</label>
                                <input
                                    id="search-input"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher une vidéo (titre, arabe, auteur)…"
                                    className={`w-full min-w-0 bg-transparent border-none outline-none text-xs sm:text-sm placeholder-gray-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                />
                                {query && (
                                    <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="text-xs text-gray-500 hover:text-red-500 px-2 shrink-0">Effacer</button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={toggleOnlyFavs}
                                aria-pressed={onlyFavs}
                                aria-label="Afficher uniquement mes favoris"
                                title="Mes favoris"
                                className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-3.5 rounded-2xl text-xs font-semibold transition-colors shadow-sm ${onlyFavs ? 'bg-amber-400 text-[#0F3D2E]' : `${t.chip} ${t.accent}`}`}
                            >
                                <I d={P.heart} fill={onlyFavs} />
                                <span className="hidden sm:inline">Favoris</span>
                            </button>
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrer par rubrique">
                            <button type="button" onClick={() => setSection('')} aria-pressed={section === ''} className={sectionBtn(section === '')}>
                                Toutes <span className="opacity-70">{VIDEOS.length}</span>
                            </button>
                            {SECTIONS.map((sec) => (
                                <button key={sec.id} type="button" onClick={() => setSection(section === sec.id ? '' : sec.id)} aria-pressed={section === sec.id} className={sectionBtn(section === sec.id)}>
                                    {sec.short} <span className="opacity-70">{SECTION_COUNT[sec.id]}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrer par lettre">
                            <button type="button" onClick={() => setLetter('')} aria-pressed={letter === ''} className={letterBtn(letter === '')}>Toutes</button>
                            {LETTERS.map((l) => (
                                <button key={l} type="button" onClick={() => setLetter(letter === l ? '' : l)} aria-pressed={letter === l} className={letterBtn(letter === l)}>{l}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LISTE PAR RUBRIQUE */}
                <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-40">
                    <p aria-live="polite" className={`text-xs mb-8 ${t.softMuted}`}>
                        {totalShown} vidéo{totalShown > 1 ? 's' : ''}
                        {section && <> · rubrique {SECTIONS.find((sec) => sec.id === section)?.short}</>}
                        {query.trim() && <> pour « {query.trim()} »</>}
                        {letter && <> · lettre {letter}</>}
                        {onlyFavs && <> · dans vos favoris</>}
                    </p>

                    {hasFilter && totalShown === 0 ? (
                        <div className="text-center py-16 space-y-4">
                            <p className={`text-sm ${t.muted}`}>
                                {onlyFavs && !query.trim() && !letter
                                    ? 'Vous n’avez pas encore de favori. Touchez le cœur d’une carte pour en ajouter.'
                                    : 'Aucune vidéo ne correspond à votre recherche. Essayez un autre titre ou retirez un filtre.'}
                            </p>
                            <button type="button" onClick={resetFilters} className="bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-semibold px-6 py-3 rounded-xl text-xs shadow-md transition-colors">
                                Réinitialiser les filtres
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {sectionsToShow.map((sec) => {
                                const items = bySection[sec.id];
                                const limit = visibleMap[sec.id] ?? PAGE_SIZE;
                                const shown = items.slice(0, limit);
                                return (
                                    <section key={sec.id} id={`rubrique-${sec.id}`} aria-labelledby={`titre-${sec.id}`} className="scroll-mt-48">
                                        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-gray-500/20">
                                            <div>
                                                <h2 id={`titre-${sec.id}`} className="text-2xl sm:text-3xl font-bold font-serif">{sec.label}</h2>
                                                <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${t.muted}`}>{sec.desc}</p>
                                            </div>
                                            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 ${t.accent}`}>
                                                {items.length} vidéo{items.length > 1 ? 's' : ''}
                                            </span>
                                        </header>

                                        {items.length === 0 ? (
                                            <p className={`text-sm ${t.softMuted}`}>Aucune vidéo dans cette rubrique pour le moment.</p>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    {shown.map((video) => (
                                                        <VideoCard
                                                            key={video.id}
                                                            video={video}
                                                            theme={t}
                                                            isFav={favorites.includes(video.id)}
                                                            onToggleFav={() => toggleFavorite(video.id)}
                                                            onWatch={() => openVideo(video)}
                                                        />
                                                    ))}
                                                </div>

                                                {items.length > shown.length && (
                                                    <div className="text-center mt-10 space-y-3">
                                                        <p className={`text-xs ${t.softMuted}`}>{shown.length} sur {items.length} affichées</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisibleMap((m) => ({ ...m, [sec.id]: limit + PAGE_SIZE }))}
                                                            className="bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-bold px-8 py-3.5 rounded-xl text-xs shadow-md transition-colors"
                                                        >
                                                            Afficher {Math.min(PAGE_SIZE, items.length - shown.length)} de plus
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* LECTEUR VIDÉO (lecture directement sur le site) */}
            {activeVideo?.source && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={() => setActiveVideo(null)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reader-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border relative ${t.modal}`}
                    >
                        <button type="button" onClick={() => setActiveVideo(null)} aria-label="Fermer le lecteur" className="absolute top-5 right-5 p-2 rounded-full bg-emerald-900/10 hover:bg-emerald-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <I d={P.close} c="w-5 h-5" />
                        </button>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-400/20 mb-3 ${t.accent}`}>Vidéo</span>
                        <h2 id="reader-title" className="text-xl sm:text-2xl font-bold font-serif mb-1 pr-10">{activeVideo.title}</h2>
                        <p className={`text-xs font-medium mb-4 ${t.accent}`}>Par {activeVideo.author}</p>

                        <div className="relative mb-4 rounded-2xl overflow-hidden border border-emerald-900/20 bg-black aspect-video">
                            {readerLoading && (
                                <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 ${darkMode ? 'bg-[#0d1f18]' : 'bg-white'}`}>
                                    <div className="animate-logoPulse text-amber-500">
                                        <Logo className="w-20 h-20" />
                                    </div>
                                    <p className={`text-sm font-medium ${t.accent}`}>Chargement...</p>
                                </div>
                            )}
                            {activeVideo.source.kind === 'file' ? (
                                <video
                                    key={activeVideo.id}
                                    src={activeVideo.source.ref}
                                    controls
                                    autoPlay
                                    playsInline
                                    preload="metadata"
                                    controlsList="nodownload"
                                    poster={activeVideo.thumb}
                                    onLoadedData={() => setReaderLoading(false)}
                                    onError={() => setReaderLoading(false)}
                                    className="w-full h-full"
                                >
                                    Votre navigateur ne peut pas lire cette vidéo.
                                </video>
                            ) : (
                                <iframe
                                    key={activeVideo.id}
                                    src={embedUrl(activeVideo.source)}
                                    className="w-full h-full"
                                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                    allowFullScreen
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    title={`Lecture de ${activeVideo.title}`}
                                    onLoad={() => setReaderLoading(false)}
                                />
                            )}
                        </div>

                        <p className={`text-xs leading-relaxed mb-6 ${t.muted}`}>{activeVideo.desc}</p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => toggleFavorite(activeVideo.id)}
                                aria-pressed={favorites.includes(activeVideo.id)}
                                className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-semibold py-3.5 rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                <I d={P.heart} fill={favorites.includes(activeVideo.id)} />
                                <span>{favorites.includes(activeVideo.id) ? 'Dans mes favoris' : 'Ajouter aux favoris'}</span>
                            </button>
                            <button type="button" onClick={() => setReportModalOpen(true)} className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-medium transition-colors">
                                Signaler un problème
                            </button>
                            <button type="button" onClick={() => setActiveVideo(null)} className="px-6 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-medium py-3.5 rounded-xl text-xs sm:text-sm transition-colors">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIGNALEMENT (au-dessus du lecteur) */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setReportModalOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md rounded-3xl p-6 border ${darkMode ? 'bg-[#0d1f18] border-emerald-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                    >
                        <h3 id="report-title" className="text-lg font-bold font-serif mb-2">Signaler un problème</h3>
                        <p className={`text-xs mb-4 ${t.softMuted}`}>
                            Vidéo concernée : <strong>{activeVideo?.title}</strong>. Aidez-nous à améliorer la bibliothèque en signalant une erreur de titre, un problème de lecture ou un contenu inapproprié.
                        </p>
                        <label htmlFor="report-text" className="sr-only">Description du problème</label>
                        <textarea
                            id="report-text"
                            rows={4}
                            maxLength={2000}
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Décrivez le problème constaté (minute, erreur, correction proposée)…"
                            className={`w-full p-3 rounded-xl border text-xs mb-4 outline-none ${darkMode ? 'bg-[#041c14] border-emerald-900 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
                        ></textarea>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleReportSubmit}
                                disabled={reportSending || !reportText.trim()}
                                className="flex-1 bg-amber-400 text-[#0F3D2E] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {reportSending && <Loader />}
                                <span>Envoyer</span>
                            </button>
                            <button type="button" onClick={() => setReportModalOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs bg-gray-500/10 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTHENTIFICATION */}
            {isLoginModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={() => setIsLoginModalOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[36px] p-6 sm:p-8 shadow-2xl border relative text-center ${darkMode ? 'bg-[#0a2219] border-emerald-800/80 text-white' : 'bg-white border-emerald-900/10 text-[#0F3D2E]'}`}
                    >
                        <button type="button" onClick={() => setIsLoginModalOpen(false)} aria-label="Fermer" className="absolute top-5 right-5 p-2 rounded-full bg-emerald-900/10 hover:bg-emerald-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <I d={P.close} />
                        </button>

                        <div className="mb-6 space-y-1.5 mt-2">
                            <h3 id="auth-title" className="text-2xl font-bold font-serif tracking-tight">{authMode === 'login' ? 'Connexion' : 'Créer un compte'}</h3>
                            <p className={`text-xs leading-relaxed ${t.softMuted}`}>
                                {authMode === 'login' ? 'Connectez-vous pour retrouver vos favoris.' : 'Inscrivez-vous pour enregistrer vos favoris.'}
                            </p>
                        </div>

                        {authError && (
                            <div role="alert" className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium text-center">{authError}</div>
                        )}

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all mb-4 shadow-sm hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${darkMode ? 'bg-[#041c14] border-emerald-800 hover:border-amber-400 text-white' : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-800'}`}
                        >
                            <GoogleIcon />
                            <span>Continuer avec Google</span>
                        </button>

                        <div className="relative flex py-2 items-center my-3">
                            <div className="flex-grow border-t border-gray-500/20"></div>
                            <span className={`flex-shrink mx-3 text-[11px] uppercase tracking-widest font-medium ${t.softMuted}`}>Ou avec email</span>
                            <div className="flex-grow border-t border-gray-500/20"></div>
                        </div>

                        <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-left mb-4">
                            {authMode === 'signup' && (
                                <div>
                                    <label htmlFor="auth-name" className={labelClass}>Nom complet</label>
                                    <input id="auth-name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Serigne Mbacké" className={inputClass} />
                                </div>
                            )}
                            <div>
                                <label htmlFor="auth-email" className={labelClass}>Email</label>
                                <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.com" className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="auth-password" className={labelClass}>Mot de passe</label>
                                <input id="auth-password" type="password" required minLength={6} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-bold py-3.5 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                                {isLoading && <Loader />}
                                <span>{authMode === 'signup' ? 'Créer un compte' : 'Se connecter'}</span>
                            </button>
                        </form>

                        <div className="text-center pt-2 border-t border-gray-500/10">
                            <p className={`text-xs ${t.softMuted}`}>
                                {authMode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                                <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} className="text-amber-500 font-bold hover:underline">
                                    {authMode === 'login' ? "S'inscrire" : 'Se connecter'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* PIED DE PAGE */}
            <footer className={`border-t py-10 transition-colors mt-auto ${darkMode ? 'bg-[#020e0a] border-emerald-900/40 text-gray-400' : 'bg-[#0F3D2E] border-emerald-900/40 text-emerald-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-md">
                            <Logo className="w-6 h-6 text-amber-300" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Xassida Cloud</span>
                    </div>
                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.id}><Link href={item.href} className="hover:text-amber-300 transition-colors">{item.label}</Link></li>
                        ))}
                    </ul>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 pt-8 border-t border-emerald-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium text-emerald-200/70">
                    <p>© {new Date().getFullYear()} Xassida Cloud. Version 3.0 Tous droits réservés.</p>
                    <div className="flex gap-6">
                        <Link href="/conditions" className="hover:text-amber-300 transition-colors">Conditions d’utilisation</Link>
                        <Link href="/confidentialite" className="hover:text-amber-300 transition-colors">Politique de confidentialité</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}