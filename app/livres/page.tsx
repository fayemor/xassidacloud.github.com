"use client";

/* Emplacement : app/livres/page.tsx */

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
/*  DONNÉES : AJOUTEZ VOS LIVRES ICI (une ligne par livre)                    */
/* -------------------------------------------------------------------------- */
/*
  Format d'une ligne :
  ['Titre', 'ID_GOOGLE_DRIVE', 'id-unique', 'auteur', 'description (facultatif)'],

  L'ID Google Drive est la partie entre /d/ et /view dans le lien du fichier :
  https://drive.google.com/file/d/  1V8S93byxBrqcwSBpo41emWUP3MNY78Da  /view
  → Laissez '' si le fichier n'est pas encore prêt : la carte affichera « Bientôt disponible ».
  → Si l'auteur est vide, « Cheikh Ahmadou Bamba » est utilisé par défaut.
  → Si la description est vide, une description par défaut est générée.
  → Pour ajouter un livre : copiez une ligne, modifiez-la, et c'est tout.
  Le tri alphabétique et les filtres par lettre sont automatiques.
*/
type Raw = [title: string, fileId: string, id?: string, author?: string, desc?: string];

const RAW: Raw[] = [
    ['Alxuraan en Wolof', '1V8S93byxBrqcwSBpo41emWUP3MNY78Da', 'l1', 'ALLAH (SWT)'],
    ['Cheikh Ibra Fall', '1DMmk5X6Gpyf8QiwP20bO5IBqrtDG8cBC', 'l2', 'Sheikh Alassane Sène'],
    ['Xuratul Ayni', '1E4Orppn8JrgdTAzS3FvTx9QUjkoEHrz6', 'l3', 'Serigne Chouhaybou MBACKE'],
    ['Wird Maaxuuz', '1OvKKR2YWqXs86k4NwSD7cPQ8vSL81Z2_', 'l4', 'Cheikh Ahmadou Bamba'],
    ['Kàdduy Seriñ Mbay Jaxate (v2)', '1BFYghrqN4dx65RBFT9bF1Bc0LG_XjkMv', 'l5', 'Serigne Mbaye Diakhate'],
    ['Massalikul Jinaan', '1wj8e41e7VHQRLgS0F0Z67aN2SGhmOugs', 'l6', 'Cheikh Ahmadou Bamba'],
    ['Juzz 01', '180LvqEAYkNaLPIOj87yaNwd92v0B_D_z', 'l7', 'Serigne Samba Diagne'],
    ['Irwaa-u-nadiim', '1Gn2VBV60DnWsN2BhHT0AzKTu1a7pzP4G', 'l8-u', 'Sëriñ Muhammadu Lamin Jóob'],
    ['Jahwarun Nafiis', '17NE18JxqCOqkOp0if2RCnhZ8UswQ1mt_', 'l9', 'Cheikh Ahmadou Bamba'],
    ['Jawaabu Sokhna Penda DIOP', '11cS7_eeMk8XSMMq9RhKsnZ3x-7MKCcN5', 'l10', 'Cheikh Ahmadou Bamba'],
    ['Munawiru suduur (français)', '1Y5uV8PUF0ssfghgH-Zr4JnzWV5OsEVvf', 'l11', 'Cheikh Ahmadou Bamba'],
    ['Munawiru suduur (English)', '1OtlUNDnSuYETfMzbmVfAmtN7nVyRjwa3', 'l12', 'Cheikh Ahmadou Bamba'],
    ['Nahju (français)', '1AUzwgKFKNiFh3Td5JZB0l9n4jrSlhPRq', 'l13', 'Cheikh Ahmadou Bamba'],
    ['Nahju (wolof)', '1hXCKcZl383nhaYoNiFNtbzEKmcOJHlhj', 'l14', 'Cheikh Ahmadou Bamba'],
    ['Ndaxam ab murid', '1hEhGPjy1_SIcxt_NK4XVj4snzKs-MkXG', 'l15', 'Serigne Mbaye Diakhate'],
    ['Niaan guy andak Wirdul Manhuuz', '1jFcP1UXzTMGS752ll7GJlTI0z8btWKfq', 'l16', 'Cheikh Ahmadou Bamba'],
    ['Niaanu Serigne bi', '1Oh_4gaMBLSitgolxFl77Zuuv2_hkSz0V', 'l17', 'Cheikh Ahmadou Bamba'],
    ['Niaanuk nisfu shahbaan', '1lSl29kIrETsNmpu2gHD2rAZHSldP4PbO', 'l18', 'Cheikh Ahmadou Bamba'],
    ['Tanwiirus suduur', '1VAVoVLRBz0_TwA0AJCeXWGnlm9Sg8A0k', 'l19', 'Cheikh Ahmadou Bamba'],
    ['Tazawudu Shighar (arabe)', '17lqN34U0pQ3Q31U-YrytWgxPIhhoRyMF', 'l20', 'Cheikh Ahmadou Bamba'],
    ['Tazawudu Shighar (français)', '1kHgcoJ2nSYSp-W4x-Q5bW0dCz1n_N_yG', 'l21', 'Cheikh Ahmadou Bamba'],
    ['Tazawwudou Shubban (français)', '1Gn_gjZhZ-OMM5cbtB6b6sovRwwVvlNvv', 'l22', 'Cheikh Ahmadou Bamba'],
    ['Téere lénn ci ñaani att mi', '1k6k4Skd9UqYthgGO__bEU5etPXN66x8t', 'l23', 'Cheikh Ahmadou Bamba']
];

interface DocItem {
    id: string;
    title: string;
    author: string;
    desc: string;
    driveUrl?: string;
    letter: string; // lettre pour le filtre A–Z
    hay: string;    // texte normalisé pour la recherche
}

const seenIds = new Set<string>();
const DOCUMENTS: DocItem[] = RAW.map(([rawTitle, fileId, idOverride, authorOverride, descOverride]) => {
    const title = rawTitle.trim();
    const author = authorOverride || AUTHOR;
    const base = idOverride || slugify(title) || 'livre';
    let id = base;
    let n = 2;
    while (seenIds.has(id)) id = `${base}_${n++}`; // garantit des identifiants uniques (favoris, signalements)
    seenIds.add(id);
    const desc = descOverride || `Livre de ${author}, à lire en ligne ou à télécharger.`;
    return {
        id, title, author, desc,
        driveUrl: fileId ? `https://drive.google.com/file/d/${fileId}/view` : undefined,
        letter: normalize(title).replace(/[^a-z]/g, '').charAt(0).toUpperCase() || '#',
        hay: normalize([title, author, desc].join(' '))
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
    const pageHref = hrefFromDriveUrl(doc.driveUrl);
    return (
        <article className={`p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1 ${theme.card}`}>
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-400/20 ${theme.accent}`}>
                        {ok ? 'Livre' : 'Bientôt disponible'}
                    </span>
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

export default function LivresPage() {
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

    /* ---- Favoris livres (par compte, clé distincte des xassidas) ---- */
    useEffect(() => {
        if (!uid) { setFavorites([]); setOnlyFavs(false); return; }
        try {
            const raw = localStorage.getItem(`xassida_book_favs_${uid}`);
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
        try { localStorage.setItem(`xassida_book_favs_${user.uid}`, JSON.stringify(next)); } catch { /* ignoré */ }
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
        if (!match) { showToast("Ce livre n'est pas encore disponible."); return; }
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
            showToast('Le téléchargement du livre a échoué.');
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
                                aria-current={item.id === 'livres' ? 'page' : undefined}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${item.id === 'livres' ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : t.navIdle}`}
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
                            className={`py-3 px-4 rounded-xl text-base font-medium ${item.id === 'livres' ? 'bg-[#0F3D2E] text-amber-300 font-semibold' : ''}`}
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
                            {DOCUMENTS.length} livre{DOCUMENTS.length > 1 ? 's' : ''} · {availableCount} disponible{availableCount > 1 ? 's' : ''}
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-serif drop-shadow-md">Livres</h1>
                        <p className="text-emerald-50 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
                            Lisez en ligne ou téléchargez chaque livre : écrits de Cheikh Ahmadou Bamba, ouvrages de ses disciples et traductions. Une erreur ? Signalez-la depuis le lecteur.
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
                                <label htmlFor="search-input" className="sr-only">Rechercher un livre</label>
                                <input
                                    id="search-input"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher un livre (titre, auteur)…"
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
                        {filtered.length} livre{filtered.length > 1 ? 's' : ''}
                        {query.trim() && <> pour « {query.trim()} »</>}
                        {letter && <> · lettre {letter}</>}
                        {onlyFavs && <> · dans vos favoris</>}
                    </p>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16 space-y-4">
                            <p className={`text-sm ${t.muted}`}>
                                {onlyFavs && !query.trim() && !letter
                                    ? 'Vous n’avez pas encore de favori. Touchez le cœur d’une carte pour en ajouter.'
                                    : 'Aucun livre ne correspond à votre recherche. Essayez un autre titre ou retirez un filtre.'}
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
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-400/20 mb-3 ${t.accent}`}>Livre</span>
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
                                Signaler un problème
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
                        <h3 id="report-title" className="text-lg font-bold font-serif mb-2">Signaler un problème</h3>
                        <p className={`text-xs mb-4 ${t.softMuted}`}>
                            Livre concerné : <strong>{activeReaderItem?.title}</strong>. Aidez-nous à améliorer la bibliothèque en signalant une coquille, une erreur de titre ou un fichier illisible.
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
