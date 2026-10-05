"use client";

/* Emplacement : app/xassidas/page.tsx */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider,
    signInWithPopup, onAuthStateChanged, signOut, updateProfile, setPersistence,
    browserLocalPersistence, Auth, User
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Link from 'next/link';
import { sendReport } from '@/lib/sendReport';
import { hrefFromDriveUrl } from '../lib/catalog';

/* -------------------------------------------------------------------------- */
/*  CONFIGURATION (identique à la page d'accueil)                             */
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
const { auth } = initFirebase();

const NOT_CONFIGURED_MSG = "Le service de connexion n'est pas configuré. Vérifiez les variables Firebase.";
const ARABIC_FONT = "'Amiri','Scheherazade New','Noto Naskh Arabic',serif";
const PAGE_SIZE = 24; // nombre de cartes affichées à la fois
const AUTHOR = 'Cheikh Ahmadou Bamba';

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
/*  DONNÉES : AJOUTEZ VOS 300+ XASSIDAS ICI (une ligne par document)          */
/* -------------------------------------------------------------------------- */
/*
  Format d'une ligne :
  ['Titre', 'العنوان بالعربية', 'ID_GOOGLE_DRIVE', 'id-unique', 'description', 'auteur (facultatif)'],

  L'ID Google Drive est la partie entre /d/ et /view dans le lien du fichier :
  https://drive.google.com/file/d/  1qP6z31dCZeDiBVYguCuk-XBOV3toonPn  /view
  → Laissez '' si le fichier n'est pas encore prêt : la carte affichera « Bientôt disponible ».
  → L'auteur est « Cheikh Ahmadou Bamba » par défaut ; ne le renseignez que s'il est différent.
  → Pour ajouter une xassida : copiez une ligne, modifiez-la, et c'est tout.
  Le tri alphabétique et les filtres par lettre sont automatiques.
*/
type Raw = [title: string, arabic: string, fileId: string, id?: string, desc?: string, author?: string];

const RAW: Raw[] = [
    ['Astahfiroulaha bihi', 'أَسْتَغْفِرُ اللَّهَ بِهِ', '1T3PMH2RzOWQLkogJT4p9ZO6uAaNGViwB', 'xb_astahfiru_ar', 'Prière de demande de pardon et de rémission des péchés.'],
    ['Jazbul Quloob Ar', 'جَذْبُ الْقُلُوبِ', '1sd0ZrFOdPyAuVgAeUc1Dwv8Tiz-bSRjP', 'xb_jazbu_ar', "L'attirance des cœurs, célèbre panégyrique dédié au Prophète (PSL)."],
    ['Midadi', 'مِدَادِي', '1qP6z31dCZeDiBVYguCuk-XBOV3toonPn', 'xb_midadi_ar', "Poème mystique sur l'encre divine et la louange."],
    ['Mafatikhoul Jinane Ar', 'مَفَاتِيحُ الْجِنَانِ', '1pd1Qrl9g7pH_4I_84kPON4edwVThHKqh', 'xb_mafatikhouljinan_ar', 'Les clés du paradis, recueil fondamental de prières et de recommandations.'],
    ['Wadjahtou Wajhiyajah', 'وَجَّهْتُ وَجْهِيَ', '1zXlKZl5HcS58m-0iud5mG-XJ18xiJNTt', 'xb_wadjah-wadj_ar', "J'ai orienté mon visage, prière de soumission totale au Créateur."],
    ['Adjabani Raboussama', 'أَجَابَنِي رَبُّ السَّمَاءِ', '1gS3U8Di-6nP7WfmhxbMnlu1V9b3v2z8_', 'xb_adjaraboussama_ar', "Le Seigneur du Ciel m'a répondu, hymne de gratitude divine."],
    ['Sindidi Ar', 'صِنْدِيدِي', '1l6H_cgOu0Oh-BYTkZegcz405AliTxMug', 'xb_sindidi_ar', 'Le courageux, poème épique de bravoure spirituelle et de foi.'],
    ['Yaqiini Kitaabulaahi', 'يَقِينِي كِتَابُ اللَّهِ', '1b9KTwspNf05pgNMPL5K5tKhRFQOHUlsD', 'xb_yaqinikitab_ar', "Ma certitude réside dans le Livre d'Allah, poème sur la foi inébranlable."],
    ['Touhfatoul Mutadarihiin', 'تُحْفَةُ الْمُتَضَرِّعِينَ', '1ybWMyBFfHk3w5y3CcOnh6PHkLc3-a0pz', 'xb_touhfatu_ar', "Le présent offert aux suppliants, prière d'invocation."],
    ['Matlaboul Fawzeyni Ar', 'مَطْلَبُ الْفَوْزَيْنِ', '1FVAdIRGOzOZW7xipZstsgCGFqwE5I1wl', 'xb_fawzeyni_ar', 'La quête du bonheur dans les deux mondes, panégyrique fondamental.'],
    ['Abreuvoir-du-commensal-irwanoun nadiim', 'إِرْوَاءُ النَّدِيمِ', '13nJseg2jivOGpaZ-UW81TFvapRMfcMDp', 'id_ab', "L'abreuvoir du commensal, poème de dévotion spirituelle."],
    ['Achkouroul laha', 'أَشْكُرُ اللَّهَ', '1DvI_wcyCViy2gzCC0IfTNSM8SfEyb_JU', 'id_achkouroulahah', 'Je rends grâce à Dieu, hymne de remerciement au Tout-Puissant.'],
    ['Ahmadu_Muhniyan', 'أَحْمَدُ مُغْنِيًا', '10AXIq5hMy4yU_OWhTirdVbkRMfTI6UK1', 'id_mughniyan', 'Ahmad, Celui qui enrichit. Panégyrique pour le Prophète.'],
    ['Ahnaniyal', 'أَغْنَانِي', '1xyZ8FyOA8bA-rh3d-w51UQ7OCDLA0ul4', 'id_ahnaniyal', "Il m'a enrichi, témoignage des bienfaits divins."],
    ['Ajabani Xayru baa', 'أَجَابَنِي خَيْرُ دَاعٍ', '1AhWmvmdQ7wTaJFdSJGkU9KE_xIH2QePT', 'id_ajabani xayru baxin', "Le meilleur des intercesseurs m'a répondu."],
    ['Al Baraka', 'الْبَرَكَةُ', '1DML-gxMMJxJRnE66z6XsLYiVmJnFuSWy', 'id_albaraka', 'La Bénédiction, prière pour attirer la grâce divine.'],
    ['Al Quraa', 'الْقُرْآنُ', '1XlpEh49HszA1sRMQABME5fg7SOtxG8n9', 'id_alquraan', 'Poème dédié à la noblesse et la grandeur du Saint Coran.'],
    ['Al Haqqu Min rabikum', 'الْحَقُّ مِنْ رَبِّكُمْ', '1chIamPTDvkvilWa1p7opIWRGZb9smmOL', 'id_alkhaqu', 'La vérité émanant de votre Seigneur.'],
    ['Ala inani Ousni', 'أَلَا إِنَّنِي', '1HtK2A115fzw8vAsxbl2Hi2Wpi_XWd7Vj', 'id_alionii', "Certes, je... Prière d'affirmation de la foi et de la soumission."],
    ['Alam Nashrah', 'أَلَمْ نَشْرَحْ', '18-DGSgyUJcOV1BdssFY0JOzNtVIBE0uP', 'id_nashrah', "Méditation et prière basées sur la sourate de l'Ouverture (Al-Inshirah)."],
    ['Al Baaqi', 'الْبَاقِي', '1I8T_iZLsaC2MlXy4yvgROEl2wRmT4g90', 'id_albaqii', "L'Éternel, invocation des attributs divins de pérennité."],
    ['Alhamdoulilahi Halaa Louha', 'الْحَمْدُ لِلَّهِ عَلَى', '1YPxtbZJ8umHqePu2qp3p5ExPaeX8eYvN', 'id_ahamdoullhl', 'Louange à Dieu, hymne de reconnaissance.'],
    ['Alhamdoulilahi Rabil Haalamiina', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', '18auHjhjYqBTfaYWjpL02Hctgj_g7uCoJ', 'id_alharhmn', 'Louange à Dieu, Seigneur des mondes.'],
    ['Alhamdoulilahi lezi mate zahab', 'الْحَمْدُ لِلَّهِ الَّذِي', '1DXi2FvO-1Z8qKKRISCeNQ-zmSq3ZYyrM', '50', 'Louange à Dieu qui a éloigné la peine.'],
    ['Allahu Ihfaz', 'اللَّهُ احْفَظْ', '1jAly_bWkRi7pqAcHjTLuAX3lWbqfNl_i', '51', 'Ô Allah, protège-nous. Prière de sauvegarde.'],
    ['Allahu', 'اللَّهُ', '1TilpRR7mc-dQbfy5P1p5BqXuQ9Bhn3wm', '52', 'Dieu. Évocation et louange du Nom suprême.'],
    ['Allahul Khariibu', 'اللَّهُ الْقَرِيبُ', '1-U0Rk6bMnrZ87Z7-Crc0PpuvrTanHcYn', '53', 'Dieu, Le Proche. Invocation de la proximité divine.'],
    ['Anta Rabbii_ar', 'أَنْتَ رَبِّي', '1d_eLfoC2Yj2Y4sAa_y2DdFIDuH805oX-', '54', "Tu es mon Seigneur, déclaration de foi et d'adoration."],
    ['Anta Rabii_fr', 'أَنْتَ رَبِّي', '18iKJbTz4DLexDS-QnFPg-kt41Q-Sk8qv', '55', 'Traduction ou explication de la prière "Tu es mon Seigneur".'],
    ['Ashinu Muhjamatan', 'أَشِينُ مُعْجَمَةً', '1_QlQ6lYMQ__yFtmxP5BZnr91UDhpk_of', '56', 'Poème didactique et mystique centré sur la lettre Shin.'],
    ['Asma-u-Ahli badrin-kiraam', 'أَسْمَاءُ أَهْلِ بَدْرٍ الْكِرَامِ', '1NsEi6EAwD9ZASHYdCaHYftC1JCKcx0B-', '57', 'Invocation par les noms bénis des nobles combattants de Badr.'],
    ['Asma-ul-lahi husnaa', 'أَسْمَاءُ اللَّهِ الْحُسْنَى', '14H8BQBI76A4g7asXT4IBWLGbgxlm-dh3', '58', "Prière par l'intercession des 99 Noms les plus beaux d'Allah."],
    ['Alhamdoulilahi lezi mate zahab', 'الْحَمْدُ لِلَّهِ الَّذِي', '1ZqVYGbxaSswXP8mNPlwSp61bTo0Fw9ej', '59', 'Action de grâce pour la dissipation des peines.'],
    ['Alif Laam miim zaalikal kitaabu', 'الم ذَلِكَ الْكِتَابُ', '1DXi2FvO-1Z8qKKRISCeNQ-zmSq3ZYyrM', '60', 'Méditation sur les premiers versets de la sourate Al-Baqarah.'],
    ['Allaahu_ihfaz', 'اللَّهُ احْفَظْ', '1jAly_bWkRi7pqAcHjTLuAX3lWbqfNl_i', '61', 'Demande de protection divine constante.'],
    ['Anta-Rabi-fr', 'أَنْتَ رَبِّي', '18iKJbTz4DLexDS-QnFPg-kt41Q-Sk8qv', '62', 'Version française/explicative de la prière de reconnaissance de la Seigneurie.'],
    ['Allaahu', 'اللَّهُ', '1TilpRR7mc-dQbfy5P1p5BqXuQ9Bhn3wm', '63', "Zikr et célébration du Nom Unique d'Allah."],
    ['Allahul Khariibu', 'اللَّهُ الْقَرِيبُ', '1-U0Rk6bMnrZ87Z7-Crc0PpuvrTanHcYn', '64', "L'invocation d'Allah, le Proche qui répond à l'appelant."],
    ['Anta_Rabbii Ar', 'أَنْتَ رَبِّي', '1d_eLfoC2Yj2Y4sAa_y2DdFIDuH805oX-', '65', 'Ode de soumission reconnaissant Dieu comme unique Maître.'],
    ['Ashinu muhjamatan', 'أَشِينُ مُعْجَمَةً', '1_QlQ6lYMQ__yFtmxP5BZnr91UDhpk_of', '66', 'Poème spirituel alphabétique, prière par les lettres.'],
    ['Asma-u_Alhli_badrine_Kiram', 'أَسْمَاءُ أَهْلِ بَدْرٍ الْكِرَامِ', '1NsEi6EAwD9ZASHYdCaHYftC1JCKcx0B-', '67', "Tawassul par l'évocation des compagnons de Badr."],
    ['Asma-ul_lahi_husnaa', 'أَسْمَاءُ اللَّهِ الْحُسْنَى', '1NsEi6EAwD9ZASHYdCaHYftC1JCKcx0B-', '68', "Litanie spirituelle glorifiant les Noms Sublimes d'Allah."],
    ['Asmaou_tahlil_1', 'أَسْمَاءُ التَّهْلِيلِ', '1AaDI5-SKXkAZbUfG_-fkuJXjahQT2HbR', '69', 'Évocation des noms divins associés au Tahlil (La ilaha illallah).'],
    ['Assiiru Ar', 'أَسِيرُ', '15K5iKpk1lAU6WeoYZBc6o9Iqq5vn-uMS', '70', 'Je chemine, panégyrique de voyage spirituel.'],
    ['Assiiru Fr', 'أَسِيرُ', '1f6pQB1i8HyBIjJBT_aRdNyyzryo91lah', '71', "Version française/explication de l'ode du cheminement spirituel."],
    ['Astahfirul_laha_bihi', 'أَسْتَغْفِرُ اللَّهَ بِهِ', '1C4CYz6SiyJtgwK3o2UWhIIhuZL2TbIJl', '72', 'Magnifique prière de repentir et de purification.'],
    ['Baayahtu Xayral-Waraa', 'بَايَعْتُ خَيْرَ الْوَرَى', '1-gh7lPeTIPG_rbpbzAWc5Cr115rSLiNc', '73', "J'ai prêté allégeance au Meilleur des Hommes."],
    ['Astahfirul_laha_bihi Ar', 'أَسْتَغْفِرُ اللَّهَ بِهِ', '1C4CYz6SiyJtgwK3o2UWhIIhuZL2TbIJl', '74', 'Texte arabe de la demande de pardon.'],
    ['Astahfirul_laha_bihi Wolof', 'أَسْتَغْفِرُ اللَّهَ بِهِ', '1UegGHLCvfLnn_p_IGXdtonJEdh1cBn_E', '75', "Commentaire ou traduction en Wolof de l'Istighfar."],
    ['Axiru_zaman-fr', 'آخِرُ الزَّمَانِ', '1kuh_Xg7Hb-vJRKyeMc1Z_FqI_yhsmUwn', '76', 'Mise en garde et conseils pour la fin des temps.'],
    ['Axiru_zaman-en', 'آخِرُ الزَّمَانِ', '152VpBK4XeSgWJw6XHZkEoZUxtqxUYpaH', '77', 'Enseignements sur la fin des temps (Version anglaise).'],
    ['Ayassa_Minilahu', 'أَيَأْسَى مِنَ اللَّهِ', '1YFkGs08KtwA0MAYhjUDsp3NMZTkEI_xm', '78', "Comment désespérer d'Allah ? Hymne à l'espoir."],
    ['Bah_bakhaa', 'بَخْ بَخَا', '1BArseXFEMH53eFinM8nPVPQWgXODnn84', '79', 'Exclamation de joie et de louange (Excellent !).'],
    ['Balsasin', 'بَلْصَصٍ', '1H6Vq8uOC_M0jHwC_Qgl-toCxN1ieR8Yt', '80', 'Poème aux rimes et rituels spécifiques pour la protection.'],
    ['Bi MUHAMMADIN_UNBIHTU', 'بِمُحَمَّدٍ أُنْبِهْتُ', '1-YfigoLSpWAcY4QKVNc2T-sY2tQjXZub', '81', "Par Muhammad j'ai été averti/éveillé, poème d'éveil."],
    ['Barakatul_Lezii', 'بَرَكَةُ الَّذِي', '13C5Os1ntwrxPNb2gBwmcUgVul82iHaJs', '82', 'La bénédiction de Celui qui... Prière de miséricorde.'],
    ['Bi Bismillaahi Rahmaanir Rahiimi', 'بِبِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', '1px6vKEL3Jc8raGwqZsQBxMwmKIRV6hA7', '83', 'Poème de sanctification basé sur la Basmala.'],
    ['Bi yawmil ahadi Safar', 'بِيَوْمِ الْأَحَدِ صَفَر', '1ksg9z-4lv1N1_7xVQBmPz24EXdNQubsL', '84', "Évocation d'un dimanche du mois béni de Safar."],
    ['Chahbanu Bamsachine-Kouniyyi', 'شَعْبَانُ', '140jFlHOJIfEXAyBpT3idcSrAxULwh8Ba', '85', "Prière et louanges durant le mois de Cha'ban."],
    ['BISMIL HANLIIMI', 'بِسْمِ الْحَلِيمِ', '13zuIs1vkggg1t2AiYGPI3fAplMZ17SMA', '86', "Au nom du Clément, poème d'espérance."],
    ['Bismil_ilaahi_ikfini_1', 'بِسْمِ الْإِلَهِ اكْفِنِي', '1awpkXaReQVWielEgdpCfaFaF05KmwW6Q', '87', 'Au nom de Dieu, suffis-moi. Prière de préservation.'],
    ['Bismilaahil_lezi', 'بِسْمِ اللَّهِ الَّذِي', '1iiFHZK_i-LIhSBgDVajJUucUm6Z0DRna', '88', "Au nom d'Allah qui... Protection et sanctification."],
    ['Bismillaahi madaytu bilaa waqfin', 'بِسْمِ اللَّهِ مَضَيْتُ بِلَا وَقْفٍ', '1EDYSa2Z8280mkoknBj-z9-8oS1m3FdKv', '89', "Au nom de Dieu, j'avance sans m'arrêter."],
    ['Bouchraa_lana', 'بُشْرَى لَنَا', '1nxqJ_d2vFbNGcHra_Tf_kmMap_YSsTna', '90', 'Bonne nouvelle pour nous, poème de réjouissance spirituelle.'],
    ['Busaaraatin', 'بُشَارَاتٍ', '15HxCpQyvj22wq2AMANy2DwoNWaVkADVE', '91', 'Annonces heureuses et promesses de la grâce divine.'],
    ['Bushraanaa jamsashunaa', 'بُشْرَانَا', '1fGeXzDvARlIU1TAjFq-CrSNfXdJKp2JG', '92', 'Notre bonne nouvelle, glorification des bienfaits du Créateur.'],
    ['Calendrier khassida', 'تَقْوِيمُ الْقَصَائِدِ', '1h9_O7YdPOB4T8SrH-2YQGOUHyKduiJw-', '93', 'Guide ou recueil organisé chronologiquement.'],
    ['Causeries Aspirant Veridique', 'مَوَاعِظُ الْمُرِيدِ الصَّادِقِ', '1UsP0ZBcA9vJhK8cOcDuvoDl8OFXnDtyf', '94', "Sermons et conseils destinés à l'aspirant sincère."],
    ['Chahrou Safar', 'شَهْرُ صَفَر', '1FRX185gdHw8XpEJpFOX5W2vDN5KVIrzI', '95', "Poème honorant le mois de Safar, symbole d'exil et de victoire."],
    ['Diamsachin', 'جَمْصَصٍ', '1mZ4CFMk9IGINgeUFTRBuO83QbG7RSBnn', '96', 'Code ou acrostiche mystique fréquemment utilisé dans les prières.'],
    ['Diazboul Murid-fr', 'جَذْبُ الْمُرِيدِ', '1pc2sU5CagvTsyb1snx31RGeEZ7zTblqz', '97', "L'attraction du disciple, explication de la quête spirituelle."],
    ['Jazbou-fr', 'جَذْبُ الْقُلُوبِ', '1jjCfO6r1L2jEw2GJitsj_RpSll_nSjgW', '98', "L'attirance des coeurs (traduction française)."],
    ['Dollu gammu', 'دُلُّو غَمُّ', '1kvPwOGzvHmox7_eQJYB0tfaAOZWF2S1f', '99', 'Chant et panégyrique dédié à la période du Maouloud.'],
    ['Durrussamin', 'الْدُّرُّ الثَّمِينُ', '1xtd9Sm_OTEJSd8XjctP6GYIx2ypBLyvP', '100', 'La perle précieuse, joyau de la louange.'],
    ['Faakha diamiha', 'فَاقَ جَمِيعَ', '1NFXGUSjjXBOc2oQgKsyHcJcQEwFwLjoS', '101', 'Celui qui a surpassé tous les autres (le Prophète PSL).'],
    ['FAATIHATUL KITAAB', 'فَاتِحَةُ الْكِتَابِ', '1C6yI6bAW8JROo6Faw_zm-TdHKjtg0MUS', '102', "Méditation et commentaire sur la Sourate d'ouverture."],
    ['Faazal_laziina_2', 'فَازَ الَّذِينَ', '1t_bfaCCQYXoQsgB6hm1oooc64ULb52go', '103', "Ils ont réussi ceux qui... Prière sur le salut de l'âme."],
    ['Faazat_qilaami_1', 'فَازَتْ قِلَامِي', '11HRuwMPUdkNfZHPOoPAgl4Ov8eO-1oB2', '104', 'Ma plume a triomphé dans la louange divine.'],
    ['Fajaa-ani', 'فَجَاءَنِي', '1dbDl8A1tqVcDaJk2d5MSb8tSkj-gQQEw', '105', "Et il m'est venu... Récit de grâce et d'inspiration."],
    ['Farixa Xayrul-mursali', 'فَرِحَ خَيْرُ الْمُرْسَلِينَ', '1TumkRFmcoEvvALz3jgqeYMfMd8KuSYou', '106', "Le Meilleur des Envoyés s'est réjoui."],
    ['Farixa Xayrul Bassari', 'فَرِحَ خَيْرُ الْبَشَرِ', '1W5yXHXeU9T7cgPm49rTj6DnZDxIg6b9w', '107', 'La joie du Meilleur des Humains, ode majestueuse.'],
    ['Farij_Bijahil_Mustafa', 'فَرِّجْ بِجَاهِ الْمُصْطَفَى', '1cK6e69BLSqRgD1nIHW9X1bGgNTme_O62', '108', "Dissipe (nos soucis) par la grâce de l'Élu."],
    ['Fathil fattah fii madhil miftah', 'فَتْحُ الْفَتَّاحِ فِي مَدْحِ الْمِفْتَاحِ', '1sgWGBYTKDLqg2PyyiqTpWWBaVgijuQQr', '109', "L'Ouverture de l'Ouvreur dans la louange de la Clé."],
    ['Fathoul Ghafar', 'فَتْحُ الْغَفَّارِ', '1c_fm4-FKXjZHmHSKG2HtTXsi6gp5mWzu', '110', "L'ouverture accordée par le Très-Pardonneur."],
    ['Fathoul-Moukarrimi-ar', 'فَتْحُ الْمُكَرِّمِ', '1lJvKn2iFPm3y4QRfTYMJYmkymgQFH5X6', '111', "L'ouverture venant du Très-Généreux."],
    ['Fathulmanan-fr', 'فَتْحُ الْمَنَّانِ', '1H5200Rzoh0G38FKFB8w77vsyNJGqx_Me', '112', "L'ouverture du Bienfaiteur (version et explication)."],
    ['Fihi_shifa un-lin_naas', 'فِيهِ شِفَاءٌ لِلنَّاسِ', '1CKflpLuDLoZOVFQ7kZ5befPlfILsZHFj', '113', 'En lui se trouve une guérison pour les gens.'],
    ['Fi cheuhri ramadaana haama alssachin', 'فِي شَهْرِ رَمَضَانَ', '1VL9KmWiLZHLrqu-rY-u_c8_Kh9yyTDoz', '114', 'Poème majestueux dédié aux bénédictions de Ramadan.'],
    ['FIri_Wasful_muriid_shifaatu shaadiqil_muriid_wolof-fr', 'وَصْفُ الْمُرِيدِ / صِفَاتُ الصَّادِقِ الْمُرِيدِ', '1hoP4McaFrqGeEmMQnUAvo2Ig9xaqhIgV', '115', "Description de l'aspirant sincère (Wolof/Français)."],
    ['Fuzti-Felicite-A-Toi-Marie', 'فُزْتِ', '1yjrC329Ci9G6jf0Vwo80pfKng1U_DRPX', '116', 'Félicité à toi, poème honorifique à la Vierge Marie (Maryam).'],
    ['Haajat_Khassa-idi', 'حَاجَاتُ قَصَائِدِي', '1CruNM8PQf_uefKHlSVReF48w9Y65mfwJ', '117', "L'objet de mes poèmes, dévouement exclusif."],
    ['Haama_Saxidnaa_bikaramin_2', 'هَامَ سَيِّدُنَا بِكَرَمٍ', '13oj1f-GiHwezwcezVYyrlbxEcXh3JPRL', '118', 'Notre Maître a débordé de générosité.'],
    ['Hadaanii-ar', 'هَدَانِي', '1irfifhaHJvsg6Pbw8tcMEi3_NIGgFNQN', '119', "Il m'a guidé, expression de la guidance divine."],
    ['Hadiyati', 'هَدِيَّتِي', '16Ph-B0Q8BcNp9nq2yduic83IVIb69VNb', '120', 'Mon présent, offrande spirituelle par la poésie.'],
    ['Halal_muntakha_Qayril_2', 'عَلَى الْمُنْتَقَى خَيْرِ', '1F3Z--1eDZyEBGVeche0N48gqz0Z1Lc8H', '121', "Sur l'Élu, le meilleur, panégyrique de louanges."],
    ['Halayka yaa moukhtarou', 'عَلَيْكَ يَا مُخْتَارُ', '1HpDxV2_2Yqs6fNH5TOQPqJOOgOfxv2Vl', '122', "Sur toi, Ô l'Élu, bénédictions et paix éternelles."],
    ['Hamat_Sulayma', 'هَامَتْ سُلَيْمَى', '1pVH8kos7CQdFWDX3x2im4nub2ytMSqwu', '123', 'Ode poétique de style classique.'],
    ['Hamidtou rabi', 'حَمِدْتُ رَبِّي', '1JucL-uyRnm1wKq4E6InHF0jSs0FkHHeU', '124', "J'ai loué mon Seigneur, célébration de la miséricorde."],
    ['hamndii_wa_sukri_liman', 'حَمْدِي وَشُكْرِي لِمَنْ', '1n5ulhrvU_SkwIfov7hxQI4sp4NYeg0Hc', '125', 'Ma louange et ma gratitude à Celui qui...'],
    ['Hasbounallaha - Hamdan', 'حَسْبُنَا اللَّهُ - حَمْدًا', '1NFIjBUzus01p6sHs8yP-Xbmp1x_mqLpM', '126', 'Allah nous suffit, action de grâce infinie.'],
    ['Hazal Hawli', 'هَذَا الْحَوْلِ', '1dH7wpwjL-fBzIQfcoxxGPYlVA3P-1XVK', '127', 'Prière évoquant la puissance (Hawl) exclusive de Dieu.'],
    ['Hijaabu daarayni', 'حِجَابُ الدَّارَيْنِ', '1yAM-AUXU2u8-YCAfR0feeFpSAwVvUK5R', '129', 'Le bouclier des deux demeures, protection spirituelle forte.'],
    ['Hisnoul Abrar', 'حِصْنُ الْأَبْرَارِ', '1imWLDrVNJrxg7q3msXQYREoyF9qyadaQ', '130', 'La forteresse des vertueux, poème de préservation.'],
    ['Huqal Bukaa wolof', 'حُقَّ الْبُكَاءُ', '1Gmd6lCcQx1uvNfj3QiKrdwR2yGGOXkqe', '131', 'Il est juste de pleurer (explication en Wolof).'],
    ['Huqqal_Bukaa_u', 'حُقَّ الْبُكَاءُ', '1dMgirzkx_AACIL3AybVURybPZBcisV5s', '132', 'Ode poignante appelant au repentir et aux larmes purificatrices.'],
    ['Huqqal bukaa-u-en', 'حُقَّ الْبُكَاءُ', '140pyP9Kf339f2KN0zJL1ODBEwq7mXPoi', '133', 'Il est juste de pleurer (Traduction et explications en Anglais).'],
    ['Huqqal Bukaa-u-fr', 'حُقَّ الْبُكَاءُ', '1xdz94szJyvi8ZzO9DFGpGKsb5OwDS7hU', '134', 'Il est juste de pleurer (Traduction et explications en Français).'],
    ['Ihdi jamihaanas wolof', 'اهْدِ جَمِيعَ النَّاسِ', '151MfAmdrCav1bTRFdj0wB9an3BdYWvCY', '135', "Guide l'humanité toute entière, invocation universelle (Wolof)."],
    ['Ihdi jamihaanas Ar', 'اهْدِ جَمِيعَ النَّاسِ', '1jxWqLJ-lQFgUB-eltRLkhKQ6pvCgYG5p', '136', "Guide l'humanité toute entière, prière de paix universelle."],
    ['Ikhlass-ar', 'الْإِخْلَاصُ', '1TEIVKm0yQYBxUIIhaQ1haUk5TQaDwXlO', '137', 'La sincérité du culte, méditation sur la pureté de la foi.'],
    ['Ila_khayrina', 'إِلَى خَيْرِنَا', '1mbQni-vf-j-tli213GTV5AEetjZ6ngzw', '138', "Vers le meilleur d'entre nous, poème d'orientation prophétique."],
    ['Ilal Mustafaa', 'إِلَى الْمُصْطَفَى', '1L6GR8lphii822D8fRwLei46l30Y-4b7I', '139', "Vers l'Élu, l'expression de l'amour prophétique."],
    ['Ilayka Yaa RABBAL waraa', 'إِلَيْكَ يَا رَبَّ الْوَرَى', '1UeIyp2fiM35KslcrJdRyMdtwZ5M71Tpk', '140', 'Vers Toi, Ô Seigneur des créatures, hymne de repentir.'],
    ['Ileyka Yaa - hadiyati', 'إِلَيْكَ يَا - هَدِيَّتِي', '1UNV8Kypqk-hhrmAHgb2XHSh0OqZ53AzY', '141', 'Mon présent vers Toi, offrande poétique.'],
    ['Ini oukhatiboul nasaaraa', 'إِنِّي أُخَاطِبُ النَّصَارَى', '1fi3Vndh9l8N3yqywLjBb3NfF_MMUXw2m', '142', "Je m'adresse aux Chrétiens, poème de dialogue et d'exhortation."],
    ['Innanii Huztu', 'إِنَّنِي حُزْتُ', '1DJP-QNNFtp6LEoWhpYAecvSOyCZyNvDH', '143', "J'ai acquis, affirmation des bienfaits spirituels."],
    ['Inni aqulu', 'إِنِّي أَقُولُ', '1ibWRQChICi-s6lN9k9tC2u18tMJDKvWm', '144', 'Je dis... expression des certitudes de la foi.'],
    ['Iqra_Wa_raboukal_Akramou', 'اقْرَأْ وَرَبُّكَ الْأَكْرَمُ', '1aw8hFI4Q5BPc_IzYy2W32aIi4lWdBBnQ', '145', 'Lis, et ton Seigneur est le Plus Généreux.'],
    ['Irwaawun_naddym ar', 'إِرْوَاءُ النَّدِيمِ', '18oiNq2wEx_YSySYpN8VhKU8s0XwXJCf9', '146', "L'abreuvoir du commensal, texte arabe."],
    ['Jaalibatul_Maraaxib', 'جَالِبَةُ الْمَرَاغِبِ', '1a4VKQesdxTIpO1qTm-qT6EMupoKcSVpT', '147', 'Celle qui attire les grâces et les bienfaits désirés.'],
    ['jalibatul_burur', 'جَالِبَةُ الْبُرُورِ', '1uDKE4PShXmeWYWRTOH4LSXfrIGKjyMkM', '148', 'Celle qui attire la piété et les bonnes actions.'],
    ['jalibatul_massarah', 'جَالِبَةُ الْمَسَرَّةِ', '1kIWPx43PH3yDiiXXgWH_gpETBjEUIzmn', '149', 'Celle qui attire la joie et la félicité.'],
    ['janatul_hajilah', 'جَنَّةُ الْعَاجِلَةِ', '1CkZj3kQEqddGabJpw2OU_bgVrabQ4Uk2', '150', 'Le paradis terrestre, poème de consolation.'],
    ['Jawartu-En', 'جَاوَرْتُ', '1U6rodNimdulCBAyi-BVUq8a2RYwTALQM', '151', "J'ai été le voisin de... poème exprimant la proximité spirituelle."],
    ['Jazbatus-Sikhaar-ar', 'جَذْبَةُ الصِّغَارِ', '1je1NAneNelJwxUOdfkK3_LtZBpwFJUD5', '152', "L'attirance des jeunes coeurs vers la droiture."],
    ['Karamu-ManKhalakha-ar', 'كَرَمُ مَنْ خَلَقَ', '1-usvY8f1CvDYkJPKbzmPwUy1-DEMOeRf', '153', 'La noblesse du Créateur.'],
    ['Kawine_liyal', 'كَوِّنْ لِيَ', '1UbyOu-HLRc3_fMb6VynpdkO0tTAgJRZW', '154', 'Rends pour moi... Prière pour un destin favorable.'],
    ['Kazu RAJAB', 'كَزُ رَجَب', '1cPjICq4K5UqJg8IPKgc4gosxLPNkVpo2', '155', "L'anniversaire glorieux célébré le 27 Rajab."],
    ['Khaatimatu Munaajaatii', 'خَاتِمَةُ مُنَاجَاتِي', '1Wurf7UDTuO4SL9KYkTP3Uv-bTv6GRksz', '156', 'Le sceau de mes apartés avec Dieu, ultime supplique.'],
    ['Khalo liyarkane', 'قَالُوا لِيَرْكَنَ', '1Xynxp93jqUNsAJ1W5iYFHjMMHVr5B_dp', '157', 'Ils ont dit de se plier, poème sur la résistance par la foi.'],
    ['Khamsatou Ridjal', 'خَمْسَةُ رِجَالٍ', '1bHdjC0dVJyoyNJixZFJNcpr1sCp-vV1P', '158', 'Les cinq hommes illustres de la foi.'],
    ['xd', 'قَصِيدَةٌ', '1bHdjC0dVJyoyNJixZFJNcpr1sCp-vV1P', '159', "Document poétique associé à l'œuvre du Cheikh."],
    ['Khassida taani', 'قَصِيدَتَانِ', '1XMdl1QWD21xnY9dntOtrb3Et7t5ex3Sk', '160', 'Deux poèmes entrelacés de louange.'],
    ['Khassida_Mawlidi_Nabii', 'قَصِيدَةُ مَوْلِدِ النَّبِيِّ', '1wlzbGnIic9jdQaO_yqrIWMC__cHmxkYh', '161', 'Poème grandiose célébrant la naissance du Prophète (Mawlid).'],
    ['Khassida_ramadane', 'قَصِيدَةُ رَمَضَانَ', '1raRK4SnTsl24a9DlshtYFZ2WADWigu3h', '162', 'Hymne à la sacralité du mois de Ramadan.'],
    ['Khatimatu-Munajati-fr', 'خَاتِمَةُ مُنَاجَاتِي', '1Upg7mj0kRj6JZts2GaSiFcXMyEaNjAT8', '163', 'La conclusion de mes prières secrètes (Traduction FR).'],
    ['Khatmoul_khur-ane', 'خَتْمُ الْقُرْآنِ', '1cLmESsO52MKFYLtnAKZ10VwZeMYziD1L', '164', 'Prière récitée à la clôture de la lecture du Saint Coran.'],
    ['Khoulnaa yaa naarou kunii', 'قُلْنَا يَا نَارُ كُونِي', '1M_cfDfjL8CuEUS_40_Se5W0mVEQ04wOV', '165', "Nous dîmes : Ô feu, sois une fraîcheur. Méditation sur la préservation d'Abraham."],
    ['Khoutbay Aldjuma yi', 'خُطْبَةُ الْجُمُعَةِ', '1COCrqnmFW41RPVK9nHEax84Ugk2XKixD', '166', 'Sermons de la prière canonique du Vendredi.'],
    ['Kufitu', 'كُفِيتُ', '1pdyOeANTBYSwQpFUGN9DY-8hi0rBf-Xt', '167', "J'ai été préservé, poème de protection divine."],
    ['Kun Kaatiman', 'كُنْ كَاتِمًا', '17p9ca8xbc2wOwXPuEcuQK-Bg1rlqN87P', '168', 'Sois discret, poème sur la sagesse du silence et de la retenue.'],
    ['Kun-Kaatiman-fr', 'كُنْ كَاتِمًا', '14iFFUkLDmd22jNYi6GW_lCCdLCpLsbA8', '169', 'Traduction et sagesse du poème sur le silence.'],
    ['La ilaha ila anta subhaanaka inni kuntu mina-zaalimine', 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', '1-8eKilIc3WdKknaONXd49qq_3DILMu8M', '170', "Prière de Jonas, l'invocation de repentir par excellence."],
    ['La shaka xassida', 'لَا شَكَّ', '1bRyFJkNPmT3YJJLP5e9ZFRsjzzm1EmzB', '171', 'Sans aucun doute, expression de la certitude absolue.'],
    ['Laa rayba fiixi', 'لَا رَيْبَ فِيهِ', '1v_XU_0R0Z7ZPa_o6TclwnCCHYYlr33oC', '172', "Où il n'y a point de doute, ode à la foi ferme."],
    ['Laa taxaf.', 'لَا تَخَفْ', '12H0lQwmXFwLBnc6ODXeT9cEBRuvOgUDP', '173', "N'aies pas peur, appel au courage et à la confiance en Dieu."],
    ['Laa yaatuuna', 'لَا يَأْتُونَ', '1bY897E3l76YgK5UkMflFsVHouPr5fKiu', '174', "Ils ne viendront pas à bout... poème de l'invincibilité divine."],
    ['Laa zamtu qabla yawmii', 'لَازَمْتُ قَبْلَ يَوْمِي', '1r8hopRxLNhW0ngysPTGtBgwaKKpExlGY', '175', 'Je me suis attaché avant mon jour... prière de prévoyance spirituelle.'],
    ['Lahum daaru salaam', 'لَهُمْ دَارُ السَّلَامِ', '1bd-dbg3oqb4vEDk-YZh5VTE3IQAXZm_N', '176', 'À eux la demeure de la Paix, évocation du Paradis.'],
    ['Lainchakartum-ar', 'لَئِنْ شَكَرْتُمْ', '1t2eR81P88rQb05P4xR-f5fMUTVxYNEFe', '177', "Si vous êtes reconnaissants... hymne sur l'augmentation des grâces."],
    ['Lam yabdu Mislul MUSTAFAA', 'لَمْ يَبْدُ مِثْلُ الْمُصْطَفَى', '1H3Z-lUhMEvzflXriY3cQu-somrf809Re', '178', "Nul n'est apparu tel que l'Élu, éloge incomparable du Prophète."],
    ['Lam-yabdou-ar', 'لَمْ يَبْدُ', '1gkGEiSIWvFt2ed5Jb7eHiHa0z2htyjm6', '179', "Poème majestueux sur l'unicité de la perfection prophétique."],
    ['Layantahi', 'لَا يَنْتَهِي', '1xMxI7mS-HBSnaW9u1jK0LSenDtUrhet9', '180', "Ce qui ne s'épuise jamais, sur les trésors de Dieu."],
    ['Laylatoul khadr', 'لَيْلَةُ الْقَدْرِ', '1GQ6U42NCJZ939b-rFGwzHgyEQoqwGI1L', '181', 'La nuit du Destin, poème célébrant sa noblesse.'],
    ['Laylatul qadr xayrun min alfi saxrin', 'لَيْلَةُ الْقَدْرِ خَيْرٌ مِنْ أَلْفِ شَهْرٍ', '1L6sLCKCUc1hynWtU7BPMwsnDo28HSwJp', '182', 'La Nuit du Destin est meilleure que mille mois.'],
    ['Laysal-birru-ar', 'لَيْسَ الْبِرَّ', '1LDYV2X4SUUGAm4dbUPbXVkA91WRGYdTy', '183', 'La vraie piété, enseignement tiré du verset coranique.'],
    ['Lil Moustapha', 'لِلْمُصْطَفَى', '1SCWgFBrvzIrIqWPeABTHxG2R5u81AFBI', '184', "Dédié à l'Élu, pur panégyrique de louange."],
    ['Lil Mustafa nawaytuma yujadidu', 'لِلْمُصْطَفَى نَوَيْتُ مَا يُجَدِّدُ', '1PGsDCGHzQSBLfqFr2ipqgcjqnf_zEncr', '185', "Pour l'Élu, j'ai l'intention d'une louange qui renouvelle."],
    ['Lil-Lahi Rabil leuzi', 'لِلَّهِ رَبِّ الَّذِي', '1ByGeAFFwNjtCaBVOnR5XaTMIVZ4UmWcR', '186', "À Dieu, Seigneur qui... déclaration d'humilité."],
    ['LILLAAHI Saxru ramadaana', 'لِلَّهِ شَهْرُ رَمَضَانَ', '1iI3MrxEOV2y8APvb7JPDNcAlsIJgafoH', '187', 'À Dieu appartient le mois de Ramadan.'],
    ['Lillahi kouli yati', 'لِلَّهِ كُلِّيَّتِي', '1g07BHzMxNTgOwMwbOB0as1SFvf7xgca5', '188', 'Mon entièreté appartient à Dieu, don de soi spirituel.'],
    ['Limaahin Bachiirin', 'لِمَاحٍ بَشِيرٍ', '1xX219dnUQSBLi3v_2AFJFJO2AXVHBSJU', '189', 'Pour Celui qui efface les péchés et porte la bonne nouvelle.'],
    ['Lirabbin Ghaforin', 'لِرَبٍّ غَفُورٍ', '1hmZZY2Z4YOX3lTCIpaFZFAqD3KwsNX68', '190', 'À un Seigneur Clément, supplique de pardon.'],
    ['Liyan khaada', 'لِيَنْقَادَ', '1Ki0DV6r-_AYA6E8srKW6zVHQb_bn5A-S', '191', "Afin qu'il se soumette, poème d'orientation divine."],
    ['Mabdaaloul khira-aati', 'مَبْدَأُ الْقِرَاءَاتِ', '1pRh6jGITSvcsRbmIbsGm1LsOPl-n_Hnl', '192', 'Le principe des lectures, éloge des saintes Écritures.'],
    ['Madahtou', 'مَدَحْتُ', '1d7-mxlQJZSd-424v8lLW3LdPmLCTKCPK', '193', "J'ai fait les louanges, poème de dévotion intense."],
    ['Madahtu', 'مَدَحْتُ', '1Hz4taBXkfWUARtn7r3gUwRwHCf-isPOG', '194', "J'ai loué le Prophète, ode magnifique au bien-aimé."],
    ['Madal Xabiru Lissanu Chukri', 'مَدَّ الْخَبِيرُ لِسَانَ الشُّكْرِ', '1SvAJwqYA1ykcdpC7aIQr9Iwnt04SELaT', '195', "L'Expert m'a accordé la langue de la gratitude."],
    ['Madaytu wa sarahtu shahbaana bisriya', 'مَضَيْتُ وَسَرَيْتُ شَعْبَانَ', '1Uwld_KiK-tMG2LXiXnBADqDAk29D50jX', '196', "Poème de voyage nocturne et d'élévation durant Cha'ban."],
    ['Madhu Nabiyil Muntaqa', 'مَدْحُ النَّبِيِّ الْمُنْتَقَى', '1SuE0RtHTQFtGykuhfRHdo7B9Ivqv6spA', '197', "La louange du Prophète, l'Élu, par excellence."],
    ['Massaatikul_Jinaan_fr', 'مَسَالِكُ الْجِنَانِ', '1a_Zm87OT8VL8tZ180nty-NRm6-eifiqy', '198', "Les itinéraires des Paradis, l'encyclopédie du soufisme (version française)."],
    ['Mafatihul_Bichri_ar', 'مَفَاتِيحُ الْبِشْرِ', '1ClbW_SHj7ACJAWSgCsslW3BClf8vxYlQ', '199', 'Les clés de la bonne nouvelle et de la joie.'],
    ['Maghaliqu_niraan', 'مَغَالِقُ النِّيرَانِ', '1UBbEjst_RskS7hsqaPcsrZidPHcq10Kh', '200', 'Les verrous des enfers, invocations protectrices.'],
    ['Maghaliun niiraan wa mafatikhoul jinaan_fr', 'مَغَالِقُ النِّيرَانِ وَمَفَاتِيحُ الْجِنَانِ', '1JzubNH6SBg5csRbfGv8RK0UJWIASfUKh', '201', 'Les verrous des enfers et les clés des paradis (version française).'],
    ['Maha huyobi', 'مَحَا عُيُوبِي', '10XbYtTHnQ8Mq6pVz3wA64_q18DJFAn3I', '202', 'Il a effacé mes défauts, ode sur le pardon de Dieu.'],
    ['Mahawta', 'مَحَوْتَ', '1i0St-0w5aYS8L-4vxc9iUFeaemR9j73T', '203', "Tu as effacé, louange adressée à l'Absoluteur des fautes."],
    ['Majmahou Noreyni', 'مَجْمَعُ النُّورَيْنِ', '188PbZLazpNEPCgVk9_iO9mx-gfdHLlDO', '204', 'Le confluent des deux lumières, joyau de la littérature mouride.'],
    ['Majmouatou Moubaraka', 'الْمَجْمُوعَةُ الْمُبَارَكَةُ', '1JNayEQOvKJq6Mfi6_xqwUMvElU5HFclp', '205', 'Le recueil béni de prières et recommandations.'],
    ['Wajaba Hamdou', 'وَجَبَ الْحَمْدُ', '13pG6Cy0sk4FAXmRT4UwoP3j3oRPCOjmc', '206', 'La louange est une obligation, chant de gratitude.'],
    ['Makhal-Moustapha Hannile', 'مَعَ الْمُصْطَفَى', '1mBfrX2F4bYsC9L6UfEpVrBsVXO27etZR', '207', "En compagnie de l'Élu, panégyrique affectueux."],
    ['Malaktou ahmada midaadi wakhilam', 'مَلَكْتُ أَحْمَدَ مِدَادِي', '1_3pePXV05lWILPcU7FoVOaNYx6CCONmA', '208', "J'ai pris l'encre de Ahmad, métaphore poétique."],
    ['Man Jaa a Bil Hasanati', 'مَنْ جَاءَ بِالْحَسَنَةِ', '1BCRBj0LlwlQJvXi35aGXV0zC11xC-JEH', '209', 'Quiconque vient avec une bonne action...'],
    ['Manezanani', 'مَنْ ظَنَّنِي', '1WAuJ7tcUiE11uU0lesA6yFuWBZtCej3w', '210', 'Celui qui me croit... Poème de clarification spirituelle.'],
    ['Maraamiya Indal LAAHI', 'مَرَامِي عِنْدَ اللَّهِ', '1vqkUveiPpDSc_Wt18h3YymdUAgIXp3w7', '211', "Mon aspiration suprême auprès d'Allah."],
    ['Mashrabu_Saafi', 'الْمَشْرَبُ الصَّافِي', '14pFUxT31zy6RD7trkBHOmvkBLJ6n7a_c', '212', "La source pure, l'abreuvoir spirituel sans tache."],
    ['Massalik', 'مَسَالِكُ الْجِنَانِ', '1TOPnRBw6O7GfWO5lQPOhWz9eg3gnxb4k', '213', "Massalikul Jinaan, l'ouvrage majeur du soufisme mouride."],
    ['Matlaboul fawzayni-fr', 'مَطْلَبُ الْفَوْزَيْنِ', '16Hd3h4vkyTvkV0nbgU2BCWab_-NVW67a', '214', 'La quête du bonheur (Traduction française).'],
    ['matlabu_taqabul', 'مَطْلَبُ التَّقَبُّلِ', '1qZ8u1uZ728oA2e6r2Zim0Ut51m37sDAp', '215', "La demande de l'acceptation divine des œuvres."],
    ['Matlabul Hafiyah', 'مَطْلَبُ الْعَافِيَةِ', '1CNZ_ikYgLuHpEvFsVt5si8a5YKkb4dI3', '216', 'La quête de la santé et du salut complet.'],
    ['Matlabul Magharil Asna', 'مَطْلَبُ الْمَغَارِ الْأَسْنَى', '1zLtmXDCHsKpu4gAkHjg4zE2MlrTgw_CC', '217', 'La quête des stations les plus sublimes.'],
    ['Matlabul_Fawzeyni', 'مَطْلَبُ الْفَوْزَيْنِ', '1IevQZdaXY1SdBrsBAonn3MAyZ1y9Wz7w', '218', 'Le viatique des deux mondes, prière inestimable.'],
    ['Matlabus_Shifa-i_fr_', 'مَطْلَبُ الشِّفَاءِ', '1OFpkN6TBFCIvVjhcbOrKwyahuZH0rrU6', '219', 'La quête de la guérison (Traduction française).'],
    ['Matlabush_Shifa-i', 'مَطْلَبُ الشِّفَاءِ', '15yTl0SXGy89qXhKh03SVYczXLcYD7Z8g', '220', "L'invocation pour obtenir la guérison divine absolue."],
    ['Mawahibal khadiimi', 'مَوَاهِبُ الْخَدِيمِ', '1LMAfcyCnctZq1eZUmcjH5dc9FpQgPkJP', '221', 'Les dons accordés au Serviteur (Khadim).'],
    ['Mawahibu_nafih-ar-1', 'مَوَاهِبُ النَّافِعِ', '1s8-KcoFD89SZf2DSEQifDenIrJfbWwo6', '222', 'Les dons de Celui qui est Utile (Dieu).'],
    ['Mawahibou nafih-ar', 'مَوَاهِبُ النَّافِعِ', '15BeL6aKGbYwkIg75P0WteoPp9S-2gQ-Y', '223', 'Louange magnifiant les dons de Celui qui accorde tout profit.'],
    ['Mawahibou_nafih_fr', 'مَوَاهِبُ النَّافِعِ', '1ZdZ_Dx3fuFoM-hQCfB6rERgMqH6ITOse', '224', 'Les dons de Celui qui profite (Traduction française).'],
    ['Mawahibou-r Rahmaane', 'مَوَاهِبُ الرَّحْمَنِ', '1RL2pSoHtv-ghE5rBn8wGmq7cmlhIMrOM', '225', 'Les dons infinis du Très-Miséricordieux.'],
    ['Mawahiboul Xuduus-fr', 'مَوَاهِبُ الْقُدُّوسِ', '1X-M0PRifR-yVighBQVdFOo3pzaHqwpiy', '226', 'Les dons du Très-Saint (Traduction française).'],
    ['Mawahiboul Xuduus-ar', 'مَوَاهِبُ الْقُدُّوسِ', '19uXSfKjQE4A_pY_acDouWVBwKo3z8v0x', '227', 'Les dons sacrés du Très-Saint.'],
    ['Midaadi_fr', 'مِدَادِي', '1fDkJpvUe3qpnSFvMo0SJHYFlRz3P-Ugf', '228', "Poème sur l'encre de l'éloge divin (Explication en français)."],
    ['Miftahun_nasri_ar', 'مِفْتَاحُ النَّصْرِ', '1SfdkA6JASrcxjz8zj7Qd1ll9Np0GYspn', '229', "La clé de la victoire, puissante prière d'ouverture."],
    ['Miikaayil', 'مِيكَائِيل', '1M8C1uCDapBocW4OqF9Ptv8CzStX8YiuS', '230', "L'archange Mikhaïl, ode invoquant les grâces célestes."],
    ['Miim Raa Shiin', 'م ر ش', '1uZMfmjNZxA5lrVIsdiTZpExy5uyoBbTQ', '231', 'Poème mystique centré sur des lettres saintes.'],
    ['Mimiya_ar', 'مِيمِيَّةُ', '1fIrZEXjT1ZFO2FJjxs378xm1FnVgyyDI', '232', 'Panégyrique dont les vers se terminent par la lettre Mim.'],
    ['Min Saxri ramadaana hanmi jamsasin..', 'مِنْ شَهْرِ رَمَضَانَ', '1W1O3q0CqZdXUuowX39a73Hiudj7nGlbY', '233', 'Le grand don du mois de Ramadan.'],
    ['Min Shawwaali hanmi jamsasin', 'مِنْ شَوَّالٍ', '1FfzH4oLUl31eyEoxa6cl0qEFYS9ECuHf', '234', 'Grâce divine descendue en ce mois de Shawwal.'],
    ['Minal lawhil Mahfuuzi', 'مِنَ اللَّوْحِ الْمَحْفُوظِ', '1XTZeTC5Q_mlQHVr8L70gJRJEQ_SK6Ix6', '235', 'Depuis la Table Gardée, sur la pré-éternité des décrets divins.'],
    ['Minal_ilahi_bi_rassouli', 'مِنَ الْإِلَهِ بِالرَّسُولِ', '1s4asTjU6y35J4bxPpswyjvRO5lW7k9Um', '236', 'De par Dieu, à travers le Messager.'],
    ['Minal-Khadiimi ilal Mahdumi-miizaanu', 'مِنَ الْخَدِيمِ إِلَى الْمَخْدُومِ', '1IivAM_EMu2koD69XI5aYv-w9Y1gj_Cqd', '237', 'Du Serviteur au Maître Servi.'],
    ['Minal-Haqqi', 'مِنَ الْحَقِّ', '1Jzr06GlElsftZu5GYf0r3T595i2V7Xbc', '238', 'Émanant de La Vérité, poème de guidée absolue.'],
    ['Minanul_Baaqil_Qadiim', 'مِنَنُ الْبَاقِي الْقَدِيمِ', '1JWWx3xy_dmyZl72BEEQ9ueUpRSBVQDE3', '239', "Les faveurs de l'Éternel et l'Ancien des jours."],
    ['Moukhadimatoul Amdah', 'مُقَدِّمَةُ الْأَمْدَاحِ', '1dOPqcYcDM2xDBYDImvX3TrVQE0E98eno', '240', "L'introduction aux panégyriques de louanges prophétiques."],
    ['Mudda Xayaatii', 'مُدَّةَ حَيَاتِي', '1Dy5LGlaa9wPtEvqbZ4maJlXyTfq7-pCp', '241', 'Tant que je vivrai, hymne de constance.'],
    ['Muhadimatul qidmah ar', 'مُقَدِّمَةُ الْخِدْمَةِ', '1WVYn1c3H8N1cweoei5pqlHG6TY3jALrc', '242', 'Le préambule au service, principes fondateurs du mouridisme.'],
    ['Muhamadun Rasul', 'مُحَمَّدٌ رَسُولُ', '1lEl7Kdjq8bdHgcJNlwMtAE98cqGIF2XZ', '243', "Muhammad est l'Envoyé, l'affirmation sublime du Message."],
    ['Muhammadikal Jamiil', 'مُحَمَّدِكَ الْجَمِيلِ', '1nXMsDFbMKwyhRYMI9cF4j6tLQxy1Ru-9', '244', "Ton si beau Muhammad, ode d'une profonde beauté."],
    ['Mumittu kuffa', 'مُمِيتُ الْكُفَّارِ', '1upzTepbybgUhSi9B2VL9WkXZt9SOyvSN', '245', 'Celui qui anéantit la mécréance, poème de triomphe de la foi.'],
    ['Muqadammatul_xidma Ar', 'مُقَدِّمَةُ الْخِدْمَةِ', '19cdMbakz1xfh-KZhaq8yj3DrBBXJPpYX', '245_b', "Préface au service de l'Islam (Texte en arabe)."],
    ['Nafahanii', 'نَفَعَنِي', '1U2DkAjwMoh4pdCEzeA5Chm5AU93YBYD_', '246', "Il m'a été utile, reconnaissance des bienfaits de Dieu."],
    ['Nuru', 'نُورُ', '13DNNkCq4thKpp92buSZPYkwji8CeUQyd', '247', "Lumière, célébration de l'illumination spirituelle."],
    ['Oubikhtou', 'أُبِحْتُ', '1zImMbRHXGqXgE5VuwwK0wTxeyNsxRzqQ', '248', "J'ai été gracié et honoré."],
    ['Qasida-Taani-ar', 'قَصِيدَتَانِ', '12B7R9WyxuFyTkAngI8CUmuQKsv5jqglW', '249', 'Poème de haute portée mystique.'],
    ['Ra-i-Ya', 'رَائِيَّةُ', '1y3jkd8xLkw7twqGMYqbEX48cQQXoJD1Q', '250', 'Poème se terminant par la lettre Raa.'],
    ['Rabana taqabal minna', 'رَبَّنَا تَقَبَّلْ مِنَّا', '1ei0c6N0Q-E23Hl0Rlxzx6WcrNqAbcWWU', '251', "Ô notre Seigneur, accepte de nous, prière d'exaucement.", 'Serigne Abdu Rahman Mbacke'],
    ['Rabbi_Kariimine', 'رَبِّ كَرِيمٍ', '1E_hV16OFHBKjubVIfjCZ0jrL5fvq_jG8', '252', 'Mon Seigneur Généreux, appel à la clémence.'],
    ['Rabbii bimaa yasrahu', 'رَبِّي بِمَا يَشْرَحُ', '1vncfqmRKsK5ZX4dwnhjZjMZ8AIdO_joB', '253', 'Mon Seigneur par ce qui réjouit et élargit le cœur.'],
    ['Rabiihul awwalu liya', 'رَبِيعُ الْأَوَّلِ لِي', '1oz0KVs58QZEUiQTcyXrJlkoFpBBSvuzn', '254', "Poème dédié au mois béni de la naissance du Prophète (Rabi' al-Awwal)."],
    ['Rabiya-ahmadou', 'رَبِّي أَحْمَدُ', '1QUFcy_kBWeCot4b-8UPcw-F8Ob9ZtRQk', '255', 'Mon Seigneur, je loue. Chant de reconnaissance éternelle.'],
    ['Radiitu', 'رَضِيتُ', '1iRimWQQ4WKs2wLEkiKJowDNBWU0R9NYt', '256', "J'agrée, poème sur l'agrément absolu des décrets divins."],
    ['Rafahnaa-ar', 'رَفَعْنَا', '1GuJumM1pfDYoQ2quywqwGCErjNdBgeIl', '257', "Nous avons élevé, méditation sur l'élévation du nom prophétique."],
    ['Rafakhna liyankhada-Ar', 'رَفَعْنَا لِيَنْقَادَ', '1zcPBhg1n1aUkVQwNwP-w8dgbNKFBfMNV', '258', 'Élévation pour la soumission parfaite.'],
    ['Rajab Saxrul Akrami', 'رَجَبُ شَهْرُ الْأَكْرَمِ', '19mnFPh2qnALEETNajp2JEHMzzduvFoh7', '259', 'Rajab, le mois du Très Généreux.'],
    ['Rajab_rabistajib', 'رَجَب رَبِّ اسْتَجِبْ', '1dQncnIcLjtKHNVyIWbIqV0OHR2f49MpA', '260', 'Seigneur, exauce-nous en ce mois de Rajab.'],
    ['Rajab', 'رَجَب', '104WamoPSOvn9SAiVE0p6rb1d0tVY2AhU', '261', 'Ode aux bénédictions du mois sacré de Rajab.'],
    ['Ramadaanu Hanmi balsasin', 'رَمَضَانُ عَمِّ', '1bmfp3MUZ4dcaqY4gSnhTwVIwfTzTvJz6', '262', 'Poème de célébration du mois de jeûne et de clémence.'],
    ['Receuil_Khassaides-1', 'مَجْمُوعَةُ قَصَائِدَ ١', '1vPwaJGwUHkBqvlfPxOYuO4mTSSOCyqZY', '263', 'Un majestueux recueil de panégyriques.'],
    ['Receuil_Khassaides-2', 'مَجْمُوعَةُ قَصَائِدَ ٢', '1YV-yTBYwNJnLHeYua-OCgMTfZzcKcr3i', '264', 'Second tome du recueil des éloges écrits par le Cheikh.'],
    ['Recueil Sermons', 'مَجْمُوعَةُ خُطَبٍ', '1xKjw6fF5wnNFae9t8sV0UjZpeN14HCXH', '265', 'Recueil des sermons spirituels (Khutbas).', 'Serigne Saalihu MBACKE'],
    ['Recueils Sermons', 'مَجْمُوعَةُ خُطَبٍ', '1-s8kR_7Fyfxh7IIP5g9zOt3r3jXI22VL', '266', 'Précieux recueil de sermons (Khutbas).', 'Cheikh Moustapha MBACKE'],
    ['Rumnaa_shukur', 'رُمْنَا شُكْرًا', '1ppTirxzVydozxgWD9xLsUlF8xjEyL13u', '267', 'Nous avons visé la gratitude suprême.'],
    ['Jotaayu Texe P1', 'مَجَالِسُ النَّجَاةِ ١', '10VzKzhBnBJsBMNNbvrxmwOKbVhCCXE97', '268', 'Les assises de la félicité, enseignements du Mouridisme.', 'Serigne Aladji MBACKE'],
    ['Jotaayu Texe P1', 'مَجَالِسُ النَّجَاةِ ١', '1y5_K0e1atVQMNcfarokcKdS9paEMAImS', '269', "Épisode ou partie des assises de l'élévation spirituelle.", 'Serigne Aladji MBACKE'],
    ['Wakhi Serigne bi', 'كَلَامُ الشَّيْخِ', '1dmm6abO50VwDzRYf9BhvO6qU93g3PoTa', '270', 'Les paroles lumineuses du guide spirituel.', 'Serigne Aladji MBACKE'],
    ['Yoonou Mouride', 'طَرِيقَةُ الْمُرِيدِ', '1DE87Vpm1UP4A7MH91ruCVenvba5cnapk', '271', 'La voie du Mouride, enseignements de droiture.', 'Serigne Aladji MBACKE'],
    ['Yoonu Ga ngu baax gna', 'طَرِيقُ الصَّالِحِينَ', '1h7UfWO-IVHawv3mTdHYXmlRhhY7Jrn-S', '272', 'Le chemin des hommes pieux et droits.', 'Serigne Alaadji MBACKE'],
    ['Yoonou jaam', 'طَرِيقُ السَّلَامِ / طَرِيقُ الْعَبْدِ', '1w-rfu7vSM03eW4unQoNfo32RPFBA0taC', '273', "La voie du serviteur, sur l'humilité devant le Créateur.", 'Serigne Alaadji MBACKE'],
    ['ziyaara Serigne Touba', 'زِيَارَةُ شَيْخِ طُوبَى', '1xSFk9SU-HG-dYJxLy4JcPB4jzwz3o195', '274', "Le grand pèlerinage et l'hommage à Serigne Touba.", 'Serigne Alaadji MBACKE'],
    ['Miftahul_Huyob', 'مِفْتَاحُ الْغُيُوبِ', '1spgMMdibUWXRSRXpeAmd79hdu_apq4bc', '275', "La clé de l'Inconnaissable (du mystère).", 'Serigne Alaadji MBACKE'],
    ['Sabhun Taqii-ar', 'سَبْحُ التَّقِيِّ', '1poV_KWSTHsUbRtFz9PRQxvWjLqcXKD5E', '276', 'Le cheminement du Pieux, adoration profonde.'],
    ['Sabhun Taqii-fr', 'سَبْحُ التَّقِيِّ', '17yExITd7_fxLOWhU7n1wRATEw2oJgLrs', '277', 'La marche spirituelle du saint homme (Version française).'],
    ['Safaa ul qalbi', 'صَفَاءُ الْقَلْبِ', '1dyhq-B7QyzB_nCkwCta3YN_7HNEn1rhM', '278', 'La pureté du cœur, poème sur la purification intérieure.'],
    ['Safar_Saffaa', 'صَفَر صَفَا', '19tjDUoSc0Z1Rfj13ttmISi2yQEKB-MVl', '279', 'Safar a purifié... Poème honorant les grâces de ce mois.'],
    ['Safar_salaatu', 'صَفَر صَلَاةُ', '1un_v1RDG7TqTN7nVsRCX9mY8ISeGlrbM', '280', 'Les prières ferventes du mois de Safar.'],
    ['Safar Safar Safar', 'صَفَر صَفَر صَفَر', '1snI5Li77cYezTEx4uG4vFz1eKHNhNDtA', '281', "Triple évocation pour magnifier le mois de l'exil triomphal."],
    ['Safaru Bamsashine Junatun manuscrit S Abdu Rahman MBACKE', 'صَفَر جُنَّةٌ', '1evt-jKUyi1wUH0KA0uieUSqVv6sb178R', '282', 'Safar est un bouclier, poème de protection.'],
    ['Safaru_Hamsachine', 'صَفَر خَمْسَةُ', '165BLF-YOHxstp0tU-WF1QNuqoXdUA5n2', '283', 'Prière et célébration rattachées au mois de Safar.'],
    ['sahadatu_tulaab', 'سَعَادَةُ الطُّلَّابِ', '1pWYq_LGDrLrKbxJGn4_bOUa7E16umPf6', '284', 'Le bonheur des étudiants (aspirants spirituels).'],
    ['Sahbaan-Shakartu', 'شَعْبَانُ شَكَرْتُ', '16qDUSaVftCZhuJiXKhfGfuadEGmO6lKd', '285', "Cha'ban, j'ai rendu grâce, louange lors du 8e mois lunaire."],
    ['Sahbaan', 'شَعْبَانُ', '1A7qf7Nw5qOAGR8pBeVMGGSbXi1D9ZirS', '286', "Poème de sanctification et de prières pour le mois de Cha'ban."],
    ['Sakuuru Raafihu Wolof', 'شَكُورٌ رَافِعٌ', '1a8ohanZTXbb2OEzfl_kvgKgUFsQ8q7tZ', '287', "Le Très-Reconnaissant, l'Élévateur (Commentaire Wolof)."],
    ['Sakuuru Raafihu Ar', 'شَكُورٌ رَافِعٌ', '1tYqKLBzVRQw8K7Afh7X2ff1-r76tSbQj', '288', "Prière appelant les attributs divins de Gratitude et d'Élévation."],
    ['Salaatu Rahiimin', 'صَلَاةُ رَحِيمٍ', '10ffH7fgwosaIyR3MNnNfrZgCTAjdcRlZ', '289', "La prière d'un Être miséricordieux."],
    ['Salaatul-Awliyaahi-ar', 'صَلَاةُ الْأَوْلِيَاءِ', '10P0qlB_gFUur77-OYDzMWSz1pygGumHx', '290', "La prière des saints, hymne d'amour divin."],
    ['Salahi bi fadlilla', 'صَلَاحِي بِفَضْلِ اللَّهِ', '1yNDXmvpLFytr09a5XqKhxpG9ZEmrAdlH', '291', "Ma vertu vient de la grâce d'Allah."],
    ['Salatun wa taslimun', 'صَلَاةٌ وَتَسْلِيمٌ', '15Vfhh_uUCJ82fBWX8qfbVY5egFvS_r5Q', '292', 'Prière et paix, salutations ininterrompues sur le Prophète.'],
    ['Sanuqrihuka-ar', 'سَنُقْرِئُكَ', '1-2UFNDzcFrc_VQylXbGIn3tWqBkwD3AA', '293', 'Nous te ferons réciter, poème évoquant la promesse coranique.'],
    ['Saxru Ramadaan', 'شَهْرُ رَمَضَانَ', '1-Gh15Zzs6VjLvuMo-Ssyd5RZTZIeGK8Z', '294', 'Le mois de Ramadan, bénédiction du jeûne.'],
    ['Saxru ramadaana_sakartu rabbiya', 'شَهْرُ رَمَضَانَ شَكَرْتُ رَبِّي', '1HCeLZDJfJhGcRW5WQnO46rzQfkgLQyUb', '295', "Au mois de Ramadan, j'ai rendu grâce à mon Seigneur."],
    ['Shahbaanu bamsasin kuniya', 'شَعْبَانُ', '1tZJu3b63ufsXQ2wZihOdrgIqBSNejYDL', '296', "Prière nocturne et bénédictions de Cha'ban."],
    ['Shahbaanu_Shaxidati', 'شَعْبَانُ شَهِدَتِ', '1_0lfVlsNlJvPg002PEHlGcOiBPn3ikh4', '297', "Cha'ban a été témoin, attestation de foi."],
    ['Shakawtu', 'شَكَوْتُ', '1d9E35UzEcX7qm5XyRdrJINh7TJnfeSkw', '298', 'Je me suis plaint à Toi, plainte mystique vers Dieu.'],
    ['Shifa-an min kuli da-in', 'شِفَاءً مِنْ كُلِّ دَاءٍ', '1zSol3grXSAvcOfo7dnYNe5IV0fw3v0f_', '299', 'Une guérison pour tout mal, poème protecteur.'],
    ['Sifaatu Saadiqil Murid', 'صِفَاتُ الصَّادِقِ الْمُرِيدِ', '1j4iLEDziyRp_wQ6VqeEnz7lYnPguiBks', '300', "Les qualités de l'aspirant véridique, éducation spirituelle."],
    ['Silkul-Jawahir-fr', 'سِلْكُ الْجَوَاهِرِ', '1hq-MZvg48l6R_TbdmxTFeHpW-OtMWlNy', '301', 'Le collier de joyaux, sublime recueil (Traduction FR).'],
    ['Sullamul Firdawsi', 'سُلَّمُ الْفِرْدَوْسِ', '1c97GSW65lzELuYcMXYy587Tq_xaYiKWx', '302', "L'échelle du Paradis, pour l'ascension spirituelle."],
    ['Sultaanun', 'سُلْطَانٌ', '1Q9Jet-4NccsjAtolMyF4BuAIdF_EGh-y', '303', 'Autorité et puissance de Dieu.'],
    ['Sulumul Fat-hi', 'سُلَّمُ الْفَتْحِ', '1oVACdXA5dhYudvfWmiSyTI5h4jg4GCoL', '304', "L'échelle de l'ouverture spirituelle."],
    ['Suratul Kahf', 'سُورَةُ الْكَهْفِ', '1wlM0B5fk9W5lulEAxI9Kqb4j0Fi3_Sec', '305', 'Célébration et bienfaits de la lecture de la Caverne.'],
    ['Taqriibul-Aqsaa-ar', 'تَقْرِيبُ الْأَقْصَى', '1xShlxdz5wUO-9Ks6ObyDcB2VJCTLNzb4', '306', 'Le rapprochement de ce qui est éloigné.'],
    ['Tawbatun_nasuuh', 'تَوْبَةٌ نَصُوحٌ', '139mB-APzy_ruky3qxKzGShfzH_viTXWB', '307', 'Un repentir sincère, invocation poignante.'],
    ['Taysiir', 'تَيْسِيرُ', '1cBKZ0NI2pPJq4GmCCfn4T7451sifHN3N', '308', "La facilitation, prière d'aplanissement des difficultés."],
    ['Taysirul Hafaar fi jawaabi habdil khaadiri', 'تَيْسِيرُ الْغَفَّارِ فِي جَوَابِ عَبْدِ الْقَادِرِ', '1rQqqdrLAdoANiCr1s6JYyPx9ZPw31plo', '309', 'La facilitation du Pardonneur en réponse à Abdou Khadr.'],
    ['Taysirul_Assir', 'تَيْسِيرُ الْعَسِيرِ', '1ScxkQ4VB0Afl2oL6xgHvH_kHVVT4AMY-', '310', 'La facilitation de ce qui est difficile.'],
    ['Tuhfatul_awaa_Taxmiss', 'تُحْفَةُ ... تَخْمِيسٌ', '161LdM_hkWTHx216ZMOaB8Rbe-S-jddk2', '311', 'Le présent (Takhmis), poème structuré en quintil.'],
    ['Wa alkhaytu halayka', 'وَأَلْقَيْتُ عَلَيْكَ', '1svYBiLYOJewwG8gjiONCjp_gyYqJ5OVS', '312', "Et J'ai répandu sur toi... ode à l'amour divin."],
    ['Wa Ibaadu RAHMAANI', 'وَعِبَادُ الرَّحْمَنِ', '1CCnqNVgs6qCkVPjVgol8trEvg8vI-e9T', '313', 'Les serviteurs du Tout-Miséricordieux.'],
    ['Wa innaka lahala', 'وَإِنَّكَ لَعَلَى', '1C5e_iMyfe5XdgE_RxCaKLf1EPqvRl8bn', '314', "Et tu es certes d'un caractère éminent (sur le Prophète)."],
    ['Wa Innaxoo lakitaabun hanziizun', 'وَإِنَّهُ لَكِتَابٌ عَزِيزٌ', '1YCVoQpcMb3BfFYfih0tJGNJqtjMyo4BW', '315', "C'est certes un Livre Puissant."],
    ['wa ufawwidu amriya ilal LAAHI', 'وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ', '1BZ--y-2q-OoIwkwj0ZvZL41RMp0wPNWs', '316', 'Je confie mon sort à Allah, summum de la remise à Dieu.'],
    ['Wa wasaynaal Insaana bi waalidayxi husnan', 'وَوَصَّيْنَا الْإِنْسَانَ بِوَالِدَيْهِ حُسْنًا', '1yl8grZBbnOxGsrIem9_yzLy2qqSH-Mzi', '316_b', "Et nous avons enjoint à l'homme la bonté envers ses parents."],
    ['Wa Wassaynal Insaana', 'وَوَصَّيْنَا الْإِنْسَانَ', '1Ibn2Fq2E53HdTG7lZZF1khIha27J43Xg', '317', "Rappel poétique de l'injonction de la bonté."],
    ['Wa yakhlukhu maalaa tahlamouna', 'وَيَخْلُقُ مَا لَا تَعْلَمُونَ', '1Yu6yX_gASJkIeA4FmKGRV0oErA0yjRIz', '318', 'Et Il crée ce que vous ne savez pas, sur les mystères de la Création.'],
    ['Wadieuhtou_lilahi_hamdane', 'وَجَّهْتُ لِلَّهِ حَمْدًا', '1Rd-NCa7ok83ALmCYHlGw_QMy_IWNP1Kq', '319', "J'ai dirigé ma louange vers Allah."],
    ['Wadjahatnis', 'وَجَّهَتْنِي', '1qVkWZ6Ds5-5wX9-ltE6aeGNcWaogGRcR', '320', "Elle m'a orienté... Prière de direction."],
    ['Wadjahtou lil Haadi', 'وَجَّهْتُ لِلْهَادِي', '19jBU2zm8u22AZ71KIrzvc3YZRpT5mZZw', '321', 'Je me suis tourné vers Le Guide.'],
    ['Wadjahtou Lillahi Hamdane', 'وَجَّهْتُ لِلَّهِ حَمْدًا', '13pK5BAn7la3XCgp3ftD9dY0R7ahajkuN', '322', "J'ai orienté ma louange purement vers Dieu."],
    ['Wajabahamdoul lahi wa salatou', 'وَجَبَ الْحَمْدُ لِلَّهِ وَالصَّلَاةُ', '11hbiTcOw6wc3yNfvBOktgYef6KXwLywe', '323', 'Il est obligatoire de louer Dieu et de prier (sur le Prophète).'],
    ['Wajabahamdourabbiyal hanziimi', 'وَجَبَ حَمْدُ رَبِّيَ الْعَظِيمِ', '19LtlMnG5yzkGDAPxeM9Ww9s_qis2oep_', '324', "La louange à mon Seigneur, L'Immense, est impérative."],
    ['Wajahtu abkara amdahi liman fudala', 'وَجَّهْتُ أَبْكَارَ أَمْدَاحِي لِمَنْ فُضِّلَ', '1N3ruXi2bqbnpIR4Fs0oRLsZ1u8xc6qkp', '325', "J'ai dédié les prémices de mes louanges à Celui qui a été préféré."],
    ['Wakaana_haqan_haleyna', 'وَكَانَ حَقًّا عَلَيْنَا', '14vuoTYtbV_Jb6Rz8cjA9CUpLTERDFHwD', '326', 'Et il est de Notre devoir de secourir les croyants.'],
    ['Walaqad_karamna', 'وَلَقَدْ كَرَّمْنَا', '1lMDl4Kr6SdCwJObow5TIymFN5CYql4_K', '327', "Certes, Nous avons honoré (les fils d'Adam)."],
    ['Wallaahu yahsimuka minan naasi_Waqaanii', 'وَاللَّهُ يَعْصِمُكَ مِنَ النَّاسِ / وَقَانِيَ', '11Q_VB7QSxIDQk5gJxcpJ45NFhz9RZZkm', '328', 'Dieu te protégera des gens. Poème de la sauvegarde inébranlable.'],
    ['Wasful Muriidi', 'وَصْفُ الْمُرِيدِ', '1wibkoqs66ibM0X6TvCBEk2S1ab60WvsD', '329', 'La description du Mouride, guide de conduite.'],
    ['wasilatu_rubohi', 'وَسِيلَةُ الرُّبُوعِ', '10f97xT-yePoSGpI4568ZlIT9Q6pTh1Pj', '330', "Le moyen d'atteindre les demeures célestes."],
    ['Wattaquul LAAHA', 'وَاتَّقُوا اللَّهَ', '1QSx3JxQ-NU8023HCeB1gsYd4rgPW97aw', '331', "Et craignez Allah, poème d'exhortation à la piété."],
    ['wazkuruu LAAHA fii Ayyaamin Mahduudaatin', 'وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ', '1GEwyLfeqbqNLQr3BhSktZXR0A9QUjvwb', '332', 'Évoquez Dieu pendant des jours comptés.'],
    ['Widaadi wa shoukri - Muraadiya qad kammalta', 'وِدَادِي وَشُكْرِي - مُرَادِيَ قَدْ كَمَّلْتَ', '1zxITFxK2q8Ekrhbpb4bQhzcaxJPdqFXF', '333', 'Mon amour et ma gratitude - Tu as exaucé tous mes vœux.'],
    ['Wird Mahuz - Al Kaamil', 'وِرْدُ مَحُوظٍ - الْكَامِلِ', '1PvS7H11GXxcW6yMAZ6usOag7Nloqgjia', '334', 'Le Wird complet, formule de prières régulières.'],
    ['Wird Mahuz - Al khatam v3', 'وِرْدُ مَحُوظٍ - الْخَتْمِ', '1u7URHVzG2RWMWpM1wchNtbx7-83qW2uE', '335', "Le Wird (Clôture v3), formule d'achèvement."],
    ['Woudohou', 'وُضُوءُ', '1U_IwlFJ-RXgzBOc8V-dy3kaMkLv2AfZU', '336', 'Poème didactique sur les ablutions purificatrices.'],
    ['Xaazal qawla', 'هَذَا الْقَوْلَ', '1_ENxrOoHeon4JMts1Mra1tcyCu-zeYJX', '337', 'Cette parole, méditation et transmission de sagesse.'],
    ['Xarnu-BI-wolof', 'قَرْنُ بِي', '1wlatS__jlMOQI-Zj3F7gh9YHefzDXtxi', '338', 'Le siècle (en Wolof), avertissements sur son époque.'],
    ['Xasida Ataaba Lil mamarra', 'أَطَابَ لِلْمَمَرِّ', '1UuJIpw6J13pPVta7Q1iDkqQaDqD-X3ix', '339', 'Il a rendu le passage agréable, hymne du voyage éternel.'],
    ['Xasida KUN', 'قَصِيدَةُ كُنْ', '19B2_p3j_ql8Sdj9kYu-JBj7KefB-t0ug', '340', 'Le poème du "Sois" (Kun), sur la toute-puissance de la volonté divine.'],
    ['Xasida_Yasurru', 'قَصِيدَةُ يَسُرُّ', '1EsJGedu_N71L_v4gxMrTxu2Rt0zyQOrv', '341', "Le poème qui réjouit l'âme."],
    ['Xassida Ayatul kursiyu', 'آيَةُ الْكُرْسِيِّ', '1qmtOLRQqOIcKWropn1wyelBpjSCZc1Mg', '342', 'Méditation et prière autour du Verset du Trône.'],
    ['Xassidatani', 'قَصِيدَتَانِ', '1FmZfnai9fwSEWgg_wOPB83q-NKKXwQFa', '343', 'Deux odes de glorification.'],
    ['Xurratul_ayni', 'قُرَّةُ الْعَيْنِ', '1RMsIvI1qYcYDEt3yiZXCRxel12UFr3ea', '344', "La joie des yeux (l'apaisement), panégyrique de bonheur."],
    ['Ya Rabi', 'يَا رَبِّ', '1hFdaGG_pG3Bhs1DRiBXcP0QgAM1VSoUE', '345', 'Ô mon Seigneur, appel plein de ferveur.'],
    ['Yaa Joumlatane', 'يَا جُمْلَةً', '1j60UbXNrgLSH14ExRLLNE33UMVu6hxZ7', '346', "Invocation par l'ensemble des perfections."],
    ['Yaa kitaabal Kariimi', 'يَا كِتَابَ الْكَرِيمِ', '11fNufMCEGc3YOt2dPgH8VpHsCmKKlb25', '347', 'Ô Livre du Très-Généreux, hommage au Coran.'],
    ['Yaa man kafaanii', 'يَا مَنْ كَفَانِي', '1vA5wT4bCK4zDJl5crRO3aYtbQwsGqoxP', '348', 'Ô Celui qui me suffit en toute chose.'],
    ['Yaa Moukrimaa-Yaa Khayra', 'يَا مُكْرِمًا - يَا خَيْرَ', '1Ye-5uSf6Ypk7MD2w0Noafm1XfH_cOpqb', '349', 'Ô Celui qui honore, Ô Meilleur...'],
    ['Yaa mukrimad dayfi', 'يَا مُكْرِمَ الضَّيْفِ', '1MA5dbCTle8B8d20uIFT4zIZ8UXdqv_ZP', '350', "Ô Celui qui honore l'Hôte (l'Eternel accueillant)."],
    ['Yaa rabbi bil Mustafaa', 'يَا رَبِّ بِالْمُصْطَفَى', '1VdWfdVQKKGpWwlfNIGcV3Z9tZb2iuC_f', '351', "Ô Seigneur, par l'intercession de l'Élu."],
    ['Yaa xayra dayfin', 'يَا خَيْرَ ضَيْفٍ', '13sc4ABMVtZB43KAAcTknVC9ml67A9wBR', '352', 'Ô le Meilleur des hôtes, ode au Prophète ou au Ramadan.'],
    ['Yaa Zal Hantaayaa', 'يَا ذَا الْعَطَايَا', '1uarSniJ7wgGGs3DbV_rThqJI90wzGmtU', '353', 'Ô Détenteur des dons incommensurables.'],
    ['Yaa zal wujuudi', 'يَا ذَا الْوُجُودِ', '1YTw83vqgf9zkgCQ_oXgCG5Shla6hhGuX', '354', "Ô Maître de l'Existence."],
    ['yaa_zal_busharati', 'يَا ذَا الْبُشَارَاتِ', '17E3Wa_lIBoJe_jTh-9uDPhIQ6yPLCX1y', '355', 'Ô Détenteur des annonces de bonne nouvelle.'],
    ['YaaKhayraDayfine-fr', 'يَا خَيْرَ ضَيْفٍ', '1pkK9LxgmCasayFI2f_bgsoxcTszg1oYy', '356', 'Ô le Meilleur des hôtes (Traduction française).'],
    ['Yakhini kitabul Lahi', 'يَقِينِي كِتَابُ اللَّهِ', '1Z31XyH8kzLnHGoH1tc6Y202dztDKUWnG', '357', "Ma certitude absolue est le Livre d'Allah."],
    ['Yaqiini', 'يَقِينِي', '156slwzZimf1_Jo4mexXHY8KIo4DVrRxw', '358', "Ma certitude, l'affirmation forte de la foi."],
    ['Yaquulu hanbdul Laahi', 'يَقُولُ عَبْدُ اللَّهِ', '1RK_63cUwKhnVxzAkg9xMdaQCtGzkIsGH', '359', "Le serviteur d'Allah dit... introduction classique."],
    ['Yarahmanou-Yarahimou', 'يَا رَحْمَنُ يَا رَحِيمُ', '1ntAa3dPxauz_hpX3A9zC_H5As34W7Yr6', '360', 'Ô Tout-Miséricordieux, Ô Très-Miséricordieux.'],
    ['YassaraLil Akramou', 'يَسَّرَ لِيَ الْأَكْرَمُ', '1ErtGrjCyK9EvtAf_dTjrdF6NkKt-1Grd', '361', 'Le Plus Généreux a facilité pour moi.'],
    ['Yawma Arbuhaan i rajab', 'يَوْمَ الْأَرْبِعَاءِ رَجَب', '1K32O1KIbqDv1u-HrqC0S8qzD0W5ckgxo', '362', 'Le jour de mercredi du mois de Rajab.'],
    ['Yawma Hanshuraa a liya', 'يَوْمَ عَاشُورَاءَ لِي', '1LcukxBXJk8jVQ1uOMuJ3t0kNxI8YTu5-', '363', "Poème de ferveur pour le jour d'Achoura."],
    ['Yawma hanshuraa a yawmii', 'يَوْمَ عَاشُورَاءَ يَوْمِي', '1-s4tFjuCsZPqFsy6gfvXP9S6yyFq44Jr', '363_b', "Le jour d'Achoura est mon jour, d'élévation spirituelle."],
    ['Yawmal Arbuhaan i', 'يَوْمَ الْأَرْبِعَاءِ', '159M7MKzxEA1lKZIEMKesAzIqTl5xuvGw', '364', 'Le mercredi de bénédiction.'],
    ['Yawmi nisfu shahbaanixii', 'يَوْمَ نِصْفِ شَعْبَانِهِ', '11na258PpNatbKa8bXgFrG6ZyHlfipnlc', '365', "Le jour de la mi-Cha'ban, célébration de pardon."],
    ['Zalat', 'زَالَتْ', '1UQcomE2wbFQhXWdDblkM4yqQWFxilsJH', '366', 'A disparu, poème sur la fin des maux et des peines.'],
    ['Zul hijjati busharun', 'ذُو الْحِجَّةِ بُشَرٌ', '1xBAgVV6kHtvIzH6c_kZXtvl0wMFf7q_3', '367', 'Dhul Hijjah, une bonne nouvelle et joie spirituelle.'],
    ['Zul hijjati', 'ذُو الْحِجَّةِ', '1xlFyk9TXq2Dj_24nvA344vFYs5K83_m7', '368', 'Célébration du mois sacré du Pèlerinage (Hajj).']
];

interface DocItem {
    id: string;
    title: string;
    arabic: string;
    author: string;
    desc: string;
    driveUrl?: string;
    letter: string; // lettre pour le filtre A–Z
    hay: string;    // texte normalisé pour la recherche
}

const seenIds = new Set<string>();
const DOCUMENTS: DocItem[] = RAW.map(([rawTitle, arabic, fileId, idOverride, descOverride, authorOverride]) => {
    const title = rawTitle.trim();
    const author = authorOverride || AUTHOR;
    const base = idOverride || slugify(title) || 'xassida';
    let id = base;
    let n = 2;
    while (seenIds.has(id)) id = `${base}_${n++}`; // garantit des identifiants uniques (favoris, signalements)
    seenIds.add(id);
    const desc = descOverride || `Xassida de ${author}, à lire en ligne ou à télécharger.`;
    return {
        id, title, arabic, author, desc,
        driveUrl: fileId ? `https://drive.google.com/file/d/${fileId}/view` : undefined,
        letter: normalize(title).replace(/[^a-z]/g, '').charAt(0).toUpperCase() || '#',
        hay: normalize([title, arabic, author, desc].join(' '))
    };
}).sort((a, b) => a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' }));

const LETTERS = Array.from(new Set(DOCUMENTS.map((d) => d.letter))).sort();

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
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
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
/*  CARTE (même design que l'accueil)                                         */
/* -------------------------------------------------------------------------- */

function DocCard({ doc, theme, isFav, onToggleFav, onRead, onDownload }: {
    doc: DocItem; theme: Theme; isFav: boolean;
    onToggleFav: () => void; onRead: () => void; onDownload: () => void;
}) {
    const ok = Boolean(doc.driveUrl);
    const pageHref = hrefFromDriveUrl(doc.driveUrl); // page dédiée /xassidas/<nom> (indexée par Google)
    return (
        <article className={`p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1 ${theme.card}`}>
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-400/20 ${theme.accent}`}>
                        {ok ? 'Texte vérifié' : 'Bientôt disponible'}
                    </span>
                    <span dir="rtl" lang="ar" className={`text-lg leading-snug ${theme.accent}`} style={{ fontFamily: ARABIC_FONT }}>{doc.arabic}</span>
                </div>
                <h3 className="text-xl font-bold font-serif">
                    {pageHref ? <Link href={pageHref} className="hover:underline">{doc.title}</Link> : doc.title}
                </h3>
                <p className={`text-xs font-medium ${theme.accent}`}>Par {doc.author}</p>
                <p className={`text-xs leading-relaxed ${theme.muted}`}>{doc.desc}</p>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-500/20 flex gap-2">
                <button
                    type="button"
                    onClick={onRead}
                    disabled={!ok}
                    className="flex-1 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span>{ok ? 'Lire maintenant' : 'Bientôt disponible'}</span>
                    {ok && <I d={P.arrow} />}
                </button>
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={!ok}
                    aria-label={`Télécharger ${doc.title}`}
                    title="Télécharger"
                    className={`p-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${theme.accent}`}
                >
                    <I d={P.download} />
                </button>
                <button
                    type="button"
                    onClick={onToggleFav}
                    aria-pressed={isFav}
                    aria-label={isFav ? `Retirer ${doc.title} des favoris` : `Ajouter ${doc.title} aux favoris`}
                    title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`p-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 transition-colors ${theme.accent}`}
                >
                    <I d={P.heart} fill={isFav} />
                </button>
            </div>
        </article>
    );
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function XassidasPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [heroError, setHeroError] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [query, setQuery] = useState('');
    const [letter, setLetter] = useState('');
    const [onlyFavs, setOnlyFavs] = useState(false);
    const [visible, setVisible] = useState(PAGE_SIZE);

    const [user, setUser] = useState<User | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authError, setAuthError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [activeReaderItem, setActiveReaderItem] = useState<DocItem | null>(null);
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

    /* ---- Favoris (partagés avec la page d'accueil, par compte) ---- */
    useEffect(() => {
        if (!uid) { setFavorites([]); setOnlyFavs(false); return; }
        try {
            const raw = localStorage.getItem(`xassida_favs_${uid}`);
            setFavorites(raw ? JSON.parse(raw) : []);
        } catch { setFavorites([]); }
    }, [uid]);

    /* ---- Retour en haut de liste quand le filtre change ---- */
    useEffect(() => { setVisible(PAGE_SIZE); }, [query, letter, onlyFavs]);

    /* ---- Échap ferme la couche la plus haute ---- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (reportModalOpen) setReportModalOpen(false);
            else if (isLoginModalOpen) setIsLoginModalOpen(false);
            else if (activeReaderItem) setActiveReaderItem(null);
            else if (mobileMenuOpen) setMobileMenuOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [reportModalOpen, isLoginModalOpen, activeReaderItem, mobileMenuOpen]);

    /* ---- Bloque le défilement derrière une modale ---- */
    const overlayOpen = Boolean(activeReaderItem) || isLoginModalOpen || reportModalOpen || mobileMenuOpen;
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
        try { localStorage.setItem(`xassida_favs_${user.uid}`, JSON.stringify(next)); } catch { /* ignoré */ }
    };

    const toggleOnlyFavs = () => {
        if (!user) {
            showToast('Connectez-vous pour voir vos favoris.');
            openAuth('login');
            return;
        }
        setOnlyFavs((v) => !v);
    };

    const handleDownload = async (doc: DocItem) => {
        const match = doc.driveUrl?.match(/\/d\/([^/]+)/);
        if (!match) { showToast("Ce document n'est pas encore disponible."); return; }
        const filename = `${slugify(doc.title)}.pdf`;
        try {
            const res = await fetch(`/api/download?id=${encodeURIComponent(match[1])}&name=${encodeURIComponent(filename)}`);
            if (!res.ok) throw new Error('download');
            const url = URL.createObjectURL(await res.blob());
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast(`Téléchargement de « ${doc.title} » lancé.`);
        } catch {
            showToast('Le téléchargement du document a échoué.');
        }
    };

    const handleReportSubmit = async () => {
        const text = reportText.trim();
        if (!text || !activeReaderItem) return;
        setReportSending(true);
        const ok = await sendReport({
            docId: activeReaderItem.id,
            docTitle: activeReaderItem.title,
            message: text,
            userName: user ? userLabel : null,
            userEmail: user?.email ?? null,
        });
        setReportSending(false);
        if (ok) {
            showToast('Merci, votre signalement a bien été envoyé.');
            setReportModalOpen(false);
            setReportText('');
        } else {
            showToast('Envoi impossible pour le moment. Réessayez plus tard.');
        }
    };

    /* ---- Données dérivées ---- */
    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        return DOCUMENTS.filter((d) =>
            (!letter || d.letter === letter) &&
            (!onlyFavs || favorites.includes(d.id)) &&
            (!q || d.hay.includes(q))
        );
    }, [query, letter, onlyFavs, favorites]);

    const shown = filtered.slice(0, visible);
    const availableCount = DOCUMENTS.filter((d) => d.driveUrl).length;
    const hasFilter = Boolean(query.trim() || letter || onlyFavs);
    const resetFilters = () => { setQuery(''); setLetter(''); setOnlyFavs(false); };

    const inputClass = `w-full px-4 py-3 rounded-2xl border text-xs outline-none transition-all ${t.input}`;
    const labelClass = `block text-[11px] font-semibold mb-1 uppercase tracking-wider ${t.accent}`;
    const letterBtn = (active: boolean) =>
        `shrink-0 min-w-9 h-9 px-3 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : `${t.chip} ${t.muted}`}`;

    return (
        <div id="top" className={`min-h-screen font-sans transition-colors duration-300 flex flex-col justify-between ${t.page}`}>
            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn .25s ease-out both; }
        @media (prefers-reduced-motion: reduce) { .animate-fadeIn { animation: none; } }
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
                                aria-current={item.id === 'xassidas' ? 'page' : undefined}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${item.id === 'xassidas' ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : t.navIdle}`}
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
                            className={`py-3 px-4 rounded-xl text-base font-medium ${item.id === 'xassidas' ? 'bg-[#0F3D2E] text-amber-300 font-semibold' : ''}`}
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
                            {DOCUMENTS.length} xassida{DOCUMENTS.length > 1 ? 's' : ''} · {availableCount} disponible{availableCount > 1 ? 's' : ''}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif drop-shadow-md">Xassidas de Cheikh Ahmadou Bamba</h1>
                        <p className="text-emerald-50 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
                            Lisez en ligne ou téléchargez chaque xassida. Une erreur dans un texte ? Signalez-la depuis le lecteur.
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
                                <label htmlFor="search-input" className="sr-only">Rechercher une xassida</label>
                                <input
                                    id="search-input"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher une xassida (titre, arabe, auteur)…"
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

                        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrer par lettre">
                            <button type="button" onClick={() => setLetter('')} aria-pressed={letter === ''} className={letterBtn(letter === '')}>Toutes</button>
                            {LETTERS.map((l) => (
                                <button key={l} type="button" onClick={() => setLetter(letter === l ? '' : l)} aria-pressed={letter === l} className={letterBtn(letter === l)}>{l}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LISTE */}
                <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-40">
                    <p aria-live="polite" className={`text-xs mb-8 ${t.softMuted}`}>
                        {filtered.length} xassida{filtered.length > 1 ? 's' : ''}
                        {query.trim() && <> pour « {query.trim()} »</>}
                        {letter && <> · lettre {letter}</>}
                        {onlyFavs && <> · dans vos favoris</>}
                    </p>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16 space-y-4">
                            <p className={`text-sm ${t.muted}`}>
                                {onlyFavs && !query.trim() && !letter
                                    ? 'Vous n’avez pas encore de favori. Touchez le cœur d’une carte pour en ajouter.'
                                    : 'Aucune xassida ne correspond à votre recherche. Essayez un autre titre ou retirez un filtre.'}
                            </p>
                            {hasFilter && (
                                <button type="button" onClick={resetFilters} className="bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-semibold px-6 py-3 rounded-xl text-xs shadow-md transition-colors">
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {shown.map((doc) => (
                                    <DocCard
                                        key={doc.id}
                                        doc={doc}
                                        theme={t}
                                        isFav={favorites.includes(doc.id)}
                                        onToggleFav={() => toggleFavorite(doc.id)}
                                        onRead={() => setActiveReaderItem(doc)}
                                        onDownload={() => handleDownload(doc)}
                                    />
                                ))}
                            </div>

                            {filtered.length > shown.length && (
                                <div className="text-center mt-12 space-y-3">
                                    <p className={`text-xs ${t.softMuted}`}>{shown.length} sur {filtered.length} affichées</p>
                                    <button
                                        type="button"
                                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                        className="bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-bold px-8 py-3.5 rounded-xl text-xs shadow-md transition-colors"
                                    >
                                        Afficher {Math.min(PAGE_SIZE, filtered.length - shown.length)} de plus
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </main>

            {/* LECTEUR */}
            {activeReaderItem?.driveUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={() => setActiveReaderItem(null)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reader-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border relative ${t.modal}`}
                    >
                        <button type="button" onClick={() => setActiveReaderItem(null)} aria-label="Fermer le lecteur" className="absolute top-5 right-5 p-2 rounded-full bg-emerald-900/10 hover:bg-emerald-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <I d={P.close} c="w-5 h-5" />
                        </button>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-400/20 mb-3 ${t.accent}`}>Texte vérifié</span>
                        <h2 id="reader-title" className="text-xl sm:text-2xl font-bold font-serif mb-1 pr-10">{activeReaderItem.title}</h2>
                        <p className={`text-xs font-medium mb-4 ${t.accent}`}>Auteur : {activeReaderItem.author}</p>

                        <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-900/20 bg-black">
                            <iframe
                                src={activeReaderItem.driveUrl.replace(/\/view.*$/, '/preview')}
                                className="w-full h-[65vh] sm:h-[75vh]"
                                allow="autoplay"
                                title={`Lecture de ${activeReaderItem.title}`}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => handleDownload(activeReaderItem)} className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-semibold py-3.5 rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2">
                                <I d={P.download} />
                                <span>Télécharger</span>
                            </button>
                            <button type="button" onClick={() => setReportModalOpen(true)} className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-medium transition-colors">
                                Signaler une erreur
                            </button>
                            <button type="button" onClick={() => setActiveReaderItem(null)} className="px-6 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-medium py-3.5 rounded-xl text-xs sm:text-sm transition-colors">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIGNALEMENT D'ERREUR (au-dessus du lecteur) */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={() => setReportModalOpen(false)}>
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-title"
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md rounded-3xl p-6 border ${darkMode ? 'bg-[#0d1f18] border-emerald-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                    >
                        <h3 id="report-title" className="text-lg font-bold font-serif mb-2">Signaler une correction</h3>
                        <p className={`text-xs mb-4 ${t.softMuted}`}>
                            Document concerné : <strong>{activeReaderItem?.title}</strong>. Aidez-nous à maintenir une rigueur textuelle irréprochable en signalant une coquille ou une erreur de source.
                        </p>
                        <label htmlFor="report-text" className="sr-only">Description de l’erreur</label>
                        <textarea
                            id="report-text"
                            rows={4}
                            maxLength={2000}
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            placeholder="Décrivez l’erreur constatée (page, ligne, correction proposée)…"
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
                    <p>© {new Date().getFullYear()} Xassida Cloud. Tous droits réservés.</p>
                    <div className="flex gap-6">
                        <Link href="/conditions" className="hover:text-amber-300 transition-colors">Conditions d’utilisation</Link>
                        <Link href="/confidentialite" className="hover:text-amber-300 transition-colors">Politique de confidentialité</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
