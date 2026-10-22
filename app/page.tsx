"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  Auth,
  User
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import Link from "next/link";
import { sendReport } from '@/lib/sendReport';
import SearchResults from './components/SearchResults';

/* -------------------------------------------------------------------------- */
/*  CONFIGURATION                                                             */
/* -------------------------------------------------------------------------- */

// Les variables NEXT_PUBLIC_* doivent être lues avec leur nom complet
// (process.env.NEXT_PUBLIC_XXX) pour que Next.js les injecte au build.
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
  // Le composant est aussi évalué côté serveur : on n'initialise Firebase que dans le navigateur.
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

// TODO : renseigner les vrais comptes. Les liens vides ne sont pas affichés.
const SOCIAL_LINKS = { twitter: '', instagram: '', facebook: '' };

const NOT_CONFIGURED_MSG = "Le service de connexion n'est pas configuré. Vérifiez les variables Firebase.";
const ARABIC_FONT = "'Amiri','Scheherazade New','Noto Naskh Arabic',serif";

/* -------------------------------------------------------------------------- */
/*  DONNÉES                                                                   */
/* -------------------------------------------------------------------------- */

type DocType = 'xassida' | 'livre';

interface DocItem {
  driveUrl?: string;
  id: string;
  type: DocType;
  title: string;
  cat: string;
  author: string;
  arabic: string;
  desc: string;
  content?: string[]; // Ajouté pour éviter l'erreur TypeScript
  source?: string;    // Ajouté pour éviter l'erreur TypeScript
  verified?: boolean; // Ajouté pour éviter l'erreur TypeScript
}

interface VideoItem {
  id: string;
  title: string;
  desc: string;
  url: string;
}

const DOCUMENTS: DocItem[] = [
  // SECTION XASSIDAS
  {
    id: 'matlabou',
    type: 'xassida',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  },

  {
    id: 'matlabou1',
    type: 'xassida',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  },

  {
    id: 'livre-serigne1',
    type: 'xassida',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  },


  // SECTION LIVRES


  {
    id: 'livre1',
    type: 'livre',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  },

  {
    id: 'livre2',
    type: 'livre',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  },

  {
    id: 'livre3',
    type: 'livre',
    title: 'Matlabou Fawzeyni',
    cat: 'Xassida Majeur',
    author: 'Cheikh Ahmadou Bamba',
    driveUrl: 'https://drive.google.com/file/d/1qP6z31dCZeDiBVYguCuk-XBOV3toonPn/view',
    arabic: 'مَطْلَبُ الْفَوْزَيْنِ',
    desc: 'Le viatique des deux mondes, panégyrique fondamental pour la quête de l’agrément divin.',
    verified: true,
  }


];

// TODO : remplacer les recherches YouTube par les liens réels des vidéos.
const VIDEOS: VideoItem[] = [
  {
    id: 'magal',
    title: 'Rétrospective du Magal de Touba',
    desc: 'Documentaire sur l’histoire et la portée spirituelle du Grand Magal.',
    url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Magal de Touba documentaire')
  },
  {
    id: 'exil',
    title: 'Conférence sur l’exil de Cheikh Ahmadou Bamba',
    desc: 'Intervention d’érudits sur les épreuves et la victoire spirituelle de Khadim Rassoul.',
    url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent('exil Cheikh Ahmadou Bamba conférence')
  }
];

/* Chiffres des cartes « Domaines d'étude » = ceux affichés par les pages /xassidas, /livres et /videos.
   Mettez-les à jour quand vous ajoutez ou retirez un élément dans une de ces pages. */
const STATS = { xassidas: 344, livres: 23, videos: 40 };

// Corrigé avec les vraies routes du projet
const NAV_ITEMS = [
  { id: 'top', label: 'Accueil', href: '/' },
  { id: 'xassidas', label: 'Xassidas', href: '/xassidas' },
  { id: 'livres', label: 'Livres', href: '/livres' },
  { id: 'videos', label: 'Vidéos', href: '/videos' }
];

/* -------------------------------------------------------------------------- */
/*  UTILITAIRES                                                               */
/* -------------------------------------------------------------------------- */

// Recherche insensible à la casse, aux accents (é/e), à « œ » et aux voyelles arabes.
const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, '').replace(/œ/g, 'oe');

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const isArabic = (s: string) => /[\u0600-\u06FF]/.test(s);

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
    case 'auth/cancelled-popup-request': return ''; // annulation volontaire : pas d'erreur
    default: return 'Une erreur est survenue. Veuillez réessayer.';
  }
};

const getTheme = (dark: boolean) => ({
  page: dark ? 'bg-[#041c14] text-[#e2e8f0]' : 'bg-[#FCFCFA] text-[#0F3D2E]',
  pageBg: dark ? 'bg-[#041c14]' : 'bg-[#FCFCFA]',
  card: dark ? 'bg-[#0d261e] border-emerald-800/50' : 'bg-white border-emerald-900/10',
  accent: dark ? 'text-amber-400' : 'text-amber-700', // amber-700 : contraste AA sur fond clair
  muted: dark ? 'text-gray-300' : 'text-gray-600',
  softMuted: dark ? 'text-gray-400' : 'text-gray-500',
  title: dark ? 'text-white' : 'text-[#0F3D2E]',
  chip: dark ? 'bg-emerald-900/30 hover:bg-emerald-900/50' : 'bg-emerald-900/10 hover:bg-emerald-900/20',
  input: dark
    ? 'bg-[#041c14] border-emerald-900/60 text-white focus:border-amber-400'
    : 'bg-emerald-50/20 border-gray-200 text-black focus:border-emerald-700',
  modal: dark ? 'bg-[#0d1f18] border-emerald-800 text-white' : 'bg-white border-emerald-900/20 text-[#0F3D2E]',
  panel: dark ? 'bg-[#041c14] border-emerald-900/50' : 'bg-emerald-50/60 border-emerald-900/10',
  navIdle: dark ? 'text-gray-300 hover:text-white' : 'text-[#0F3D2E]/80 hover:text-[#0F3D2E]'
});
type Theme = ReturnType<typeof getTheme>;

/* -------------------------------------------------------------------------- */
/*  ICÔNES                                                                    */
/* -------------------------------------------------------------------------- */

const Icons = {
  Logo: ({ className = "w-8 h-8" }) => (
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
  ),
  User: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Sun: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  ArrowRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  Close: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Menu: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Google: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.19v3.15C3.18 21.3 7.22 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.4s.13-1.68.38-2.4V6.29H1.19C.43 7.82 0 9.55 0 11.84s.43 4.02 1.19 5.55l4.08-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.18 2.7 1.19 6.29l4.08 3.15c.95-2.85 3.6-4.69 6.73-4.69z" />
    </svg>
  ),
  Loader: ({ className = "w-5 h-5" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  Download: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Heart: ({ className = "w-4 h-4", filled = false }) => (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Play: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Twitter: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  ),
  Instagram: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
  ),
  Facebook: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
  ),
  Book: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Video: ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
};

/* -------------------------------------------------------------------------- */
/*  COMPOSANTS                                                                */
/* -------------------------------------------------------------------------- */

function SectionTitle({ eyebrow, title, subtitle, theme }: { eyebrow: string; title: string; subtitle: string; theme: Theme }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
      <span className={`text-xs font-bold uppercase tracking-widest ${theme.accent}`}>{eyebrow}</span>
      <h2 className="text-2xl sm:text-4xl font-bold font-serif">{title}</h2>
      <p className={`text-xs sm:text-sm ${theme.muted}`}>{subtitle}</p>
    </div>
  );
}

function DocCard({ doc, theme, isFav, onToggleFav, onRead, onDownload }: {
  doc: DocItem;
  theme: Theme;
  isFav: boolean;
  onToggleFav: () => void;
  onRead: () => void;
  onDownload: () => void;
}) {
  return (
    <article className={`p-6 sm:p-8 rounded-3xl border shadow-lg flex flex-col justify-between transition-all hover:-translate-y-1 ${theme.card}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-3">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-400/20 ${theme.accent}`}>
            {doc.verified ? 'Xassida' : 'Extrait à vérifier'}
          </span>
          <span dir="rtl" lang="ar" className={`text-lg leading-snug ${theme.accent}`} style={{ fontFamily: ARABIC_FONT }}>{doc.arabic}</span>
        </div>
        <h3 className="text-xl font-bold font-serif">{doc.title}</h3>
        <p className={`text-xs font-medium ${theme.accent}`}>Par {doc.author}</p>
        <p className={`text-xs leading-relaxed ${theme.muted}`}>{doc.desc}</p>
      </div>

      <div className="pt-6 mt-6 border-t border-gray-500/20 flex gap-2">
        <button
          type="button"
          onClick={onRead}
          className="flex-1 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <span>Lire maintenant</span>
          <Icons.ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDownload}
          aria-label={`Télécharger ${doc.title}`}
          title="Télécharger"
          className={`p-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 transition-colors ${theme.accent}`}
        >
          <Icons.Download className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFav}
          aria-pressed={isFav}
          aria-label={isFav ? `Retirer ${doc.title} des favoris` : `Ajouter ${doc.title} aux favoris`}
          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`p-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 transition-colors ${theme.accent}`}
        >
          <Icons.Heart className="w-4 h-4" filled={isFav} />
        </button>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroError, setHeroError] = useState(false);
  const activeSection = 'top'; // l'onglet « Accueil » reste surligné, il ne bouge plus au défilement

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  /* ---- Thème : préférence enregistrée, sinon préférence système ---- */
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setDisplayName(currentUser?.displayName ?? null);
    });
    return () => unsubscribe();
  }, []);

  /* ---- Favoris (enregistrés sur l'appareil, par compte) ---- */
  useEffect(() => {
    if (!uid) { setFavorites([]); return; }
    try {
      const raw = localStorage.getItem(`xassida_favs_${uid}`);
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch { setFavorites([]); }
  }, [uid]);

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

  /* ---- Bloque le défilement de la page derrière une modale ---- */
  const overlayOpen = Boolean(activeReaderItem) || isLoginModalOpen || reportModalOpen || mobileMenuOpen;
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [overlayOpen]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current); // évite qu'un ancien timer efface le nouveau message
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
        if (cleanName) {
          await updateProfile(cred.user, { displayName: cleanName });
          setDisplayName(cleanName); // onAuthStateChanged ne se redéclenche pas après updateProfile
        }
        showToast('Compte créé avec succès ! Bienvenue.');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        showToast('Connexion réussie !');
      }
      setIsLoginModalOpen(false);
      setEmail('');
      setPassword('');
      setName('');
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
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-blocked') {
        try { await signInWithRedirect(auth, provider); return; } catch (err) {
          setAuthError(getErrorMessage((err as { code?: string })?.code));
        }
      } else {
        setAuthError(getErrorMessage(code));
      }
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

  const handleDownload = async (doc: DocItem) => {
    // Si le document possède un fichier Google Drive,
    // on télécharge le fichier original via notre API.
    if (doc.driveUrl) {
      try {
        const match = doc.driveUrl.match(/\/d\/([^/]+)/);

        if (!match) {
          showToast('Lien Google Drive invalide.');
          return;
        }

        const fileId = match[1];

        const response = await fetch(
          `/api/download?id=${encodeURIComponent(fileId)}&name=${encodeURIComponent(`${slugify(doc.title)}.pdf`)}`
        );

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${slugify(doc.title)}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        showToast(`Téléchargement de « ${doc.title} » lancé.`);
        return;
      } catch (error) {
        console.error(error);
        showToast('Le téléchargement du document a échoué.');
        return;
      }
    }

    // Comportement actuel pour les documents sans fichier Drive
    const lines = [
      doc.title,
      `Auteur : ${doc.author}`,
      `Source : ${doc.source || 'Inconnue'}`,
      `Statut : ${doc.verified ? 'Texte vérifié' : 'Extrait non vérifié — ne pas citer comme référence'}`,
      '',
      ...(doc.content || [])
    ];

    const blob = new Blob(
      ['\uFEFF' + lines.join('\n')],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${slugify(doc.title)}_XassidaCloud.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast(`Téléchargement de « ${doc.title} » lancé.`);
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
  const xassidaDocs = DOCUMENTS.filter((d) => d.type === 'xassida');
  const livreDocs = DOCUMENTS.filter((d) => d.type === 'livre');
  const favoriteDocs = DOCUMENTS.filter((d) => favorites.includes(d.id));
  const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

  const socials = [
    { key: 'twitter', label: 'Twitter / X', url: SOCIAL_LINKS.twitter, icon: <Icons.Twitter /> },
    { key: 'instagram', label: 'Instagram', url: SOCIAL_LINKS.instagram, icon: <Icons.Instagram /> },
    { key: 'facebook', label: 'Facebook', url: SOCIAL_LINKS.facebook, icon: <Icons.Facebook /> }
  ].filter((s) => s.url);

  const renderCards = (list: DocItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {list.map((doc) => (
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
  );

  const inputClass = `w-full px-4 py-3 rounded-2xl border text-xs outline-none transition-all ${t.input}`;
  const labelClass = `block text-[11px] font-semibold mb-1 uppercase tracking-wider ${t.accent}`;

  return (
    <div id="top" className={`min-h-screen font-sans transition-colors duration-300 flex flex-col justify-between ${t.page}`}>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn .25s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .animate-fadeIn { animation: none; }
        }
      `}</style>

      {/* TOAST */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 left-6 sm:left-auto z-[70] bg-[#0F3D2E] text-amber-300 px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/40 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
          {toastMessage}
        </div>
      )}

      {/* NAVIGATION */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${darkMode ? 'bg-[#041c14]/90 border-emerald-900/30' : 'bg-[#FCFCFA]/90 border-emerald-900/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-2">

          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Icons.Logo className="w-7 h-7 text-amber-300" />
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
                aria-current={activeSection === item.id ? 'true' : undefined}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeSection === item.id ? 'bg-[#0F3D2E] text-amber-300 shadow-md' : t.navIdle}`}
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
              {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className={`hidden sm:flex items-center gap-3 py-1 px-3 rounded-2xl border border-emerald-900/10 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-900/10'}`}>
                <div className="w-8 h-8 rounded-full bg-amber-400 text-[#0F3D2E] flex items-center justify-center font-bold text-xs">
                  {userLabel.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-semibold ${t.title}`}>{userLabel}</span>
                  <button type="button" onClick={handleLogout} className="text-[11px] text-red-500 hover:underline text-left">Déconnexion</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuth('signup')}
                aria-label="Se connecter"
                className="bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 px-3 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Icons.User className="w-4 h-4" />
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
              {mobileMenuOpen ? <Icons.Close className="w-6 h-6" /> : <Icons.Menu className="w-6 h-6" />}
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
              className={`py-3 px-4 rounded-xl text-base font-medium ${activeSection === item.id ? 'bg-[#0F3D2E] text-amber-300 font-semibold' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between gap-3 ${t.card}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-full bg-amber-400 text-[#0F3D2E] flex items-center justify-center font-bold text-sm">
                  {userLabel.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold truncate">{userLabel}</span>
              </div>
              <button type="button" onClick={handleLogout} className="text-xs text-red-500 font-medium hover:underline">Déconnexion</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="w-full bg-amber-400 text-[#0F3D2E] py-3.5 rounded-xl font-bold text-center mt-4 shadow-md"
            >
              Créer un compte / Se connecter
            </button>
          )}
        </div>
      )}

      <main className="flex-grow">
        {/* HERO */}
        <section className="relative text-white overflow-hidden pt-16 pb-32 lg:py-28">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0F3D2E] to-[#020b08]">
            {!heroError && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/mosque-touba.png"
                alt="Grande Mosquée de Touba"
                className="w-full h-full object-cover object-center filter brightness-[0.45]"
                onError={() => setHeroError(true)}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[#020b08]/80 via-[#0a291d]/60 to-[#0a291d]/80"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-20 space-y-8 flex flex-col items-center text-center">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-600/50 text-amber-300 text-xs font-medium tracking-wide shadow-sm backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                La bibliothèque numérique du patrimoine mouride
              </div>
              <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight font-serif drop-shadow-md text-white">
                Préserver l’Œuvre, <br />
                <span className="text-amber-300">Éclairer les Cœurs</span>
              </h1>
              <p className="text-emerald-50 text-sm sm:text-lg max-w-xl mx-auto font-light leading-relaxed drop-shadow">
                Accédez aux textes et aux écrits de Cheikh Ahmadou Bamba, avec la source de chaque document clairement indiquée.
              </p>
            </div>

            <div role="search" className={`w-full max-w-2xl mx-auto backdrop-blur-xl p-2 sm:p-3 rounded-2xl shadow-2xl border border-amber-400/30 flex items-center gap-2 ${darkMode ? 'bg-[#0d261e]/90' : 'bg-white/90'}`}>
              <Icons.Search className={`w-5 h-5 ml-2 shrink-0 ${t.accent}`} />
              <label htmlFor="search-input" className="sr-only">Rechercher un document</label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, auteur ou catégorie (ex : Matlabou)…"
                className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm placeholder-gray-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} aria-label="Effacer la recherche" className="text-xs text-gray-500 hover:text-red-500 px-2 shrink-0">Effacer</button>
              )}
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 h-16 z-20 [mask-image:radial-gradient(ellipse_at_top,transparent_50%,black_50%)] ${t.pageBg}`}></div>
        </section>

        {/* RÉSULTATS DE RECHERCHE (xassidas + livres du catalogue) */}
        <SearchResults query={searchQuery} dark={darkMode} />

        {/* FAVORIS */}
        {user && favoriteDocs.length > 0 && (
          <section id="favoris" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 scroll-mt-24">
            <h2 className="text-xl font-bold font-serif mb-2">Mes favoris</h2>
            <p className={`text-xs mb-6 ${t.softMuted}`}>Enregistrés sur cet appareil.</p>
            {renderCards(favoriteDocs)}
          </section>
        )}

        {/* DOMAINES D'ÉTUDE */}
        <section id="domaines" className="max-w-7xl mx-auto px-4 sm:px-8 py-16 relative z-20 scroll-mt-24">
          <SectionTitle eyebrow="Domaines d’étude" title="Explorez les trésors de Xassida Cloud" subtitle="Accédez directement à chaque rubrique." theme={t} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Xassidas', desc: 'Poèmes de Cheikh Ahmadou Bamba.', count: count(STATS.xassidas, 'texte disponible', 'Xassidas disponibles'), link: '/xassidas', icon: <Icons.Book className="w-8 h-8 text-amber-400" /> },
              { title: 'Livres & Ouvrages', desc: 'Études islamiques et biographies.', count: count(STATS.livres, 'livre disponible', 'livres disponibles'), link: '/livres', icon: <Icons.Book className="w-8 h-8 text-amber-400" /> },
              { title: 'Videos', desc: 'Kourel, Rajass, Causerie, Njagum Mag gni etc', count: count(STATS.videos, 'vidéo', 'vidéos disponibles'), link: '/videos', icon: <Icons.Video className="w-8 h-8 text-amber-400" /> }
            ].map((item) => (
              <Link
                href={item.link}
                key={item.link}
                className={`rounded-[80px_80px_20px_20px] p-6 text-center border transition-all duration-300 hover:-translate-y-2 shadow-lg flex flex-col items-center justify-between min-h-[320px] group ${darkMode ? 'bg-[#0d261e] border-emerald-800/50 hover:border-amber-400/50' : 'bg-white border-emerald-900/10 hover:border-amber-500/50'}`}
              >
                <div className="w-20 h-20 rounded-full bg-[#0F3D2E] flex items-center justify-center shadow-md mt-6 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="space-y-2 px-2">
                  <h3 className="text-xl font-bold font-serif">{item.title}</h3>
                  <p className={`text-xs ${t.muted}`}>{item.desc}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 mt-2 ${t.accent}`}>{item.count}</span>
                </div>
                <div className="w-full bg-amber-400 text-[#0F3D2E] font-bold py-3 rounded-xl text-xs uppercase tracking-wider mt-6 group-hover:bg-amber-300 transition-colors">
                  Explorer
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* XASSIDAS */}
        <section id="xassidas" className={`py-20 border-y scroll-mt-20 transition-colors ${darkMode ? 'bg-[#071711] border-emerald-900/30' : 'bg-emerald-50/40 border-emerald-950/10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <SectionTitle eyebrow="Bibliothèque de référence" title="Xassidas & poèmes" subtitle="Textes de Cheikh Ahmadou Bamba, avec leur source et leur statut de vérification." theme={t} />
            {xassidaDocs.length === 0 ? <p className={`text-center text-sm ${t.softMuted}`}>Aucun texte disponible pour le moment.</p> : renderCards(xassidaDocs)}
          </div>
        </section>

        {/* LIVRES */}
        <section id="livres" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 scroll-mt-20">
          <SectionTitle eyebrow="Ouvrages" title="Livres & biographies" subtitle="Études islamiques et récits sur la vie du fondateur du Mouridisme." theme={t} />
          {livreDocs.length === 0 ? <p className={`text-center text-sm ${t.softMuted}`}>Aucun livre disponible pour le moment.</p> : renderCards(livreDocs)}
        </section>

        {/* VIDÉOS */}
        <section id="videos" className={`py-20 border-t scroll-mt-20 transition-colors ${darkMode ? 'bg-[#071711] border-emerald-900/30' : 'bg-emerald-50/40 border-emerald-950/10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <SectionTitle eyebrow="Médiathèque" title="Conférences & documentaires" subtitle="Visionnez des émissions et reportages sur le patrimoine mouride." theme={t} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {VIDEOS.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block p-6 rounded-3xl border shadow-lg transition-all hover:-translate-y-1 ${t.card}`}
                >
                  <div className="aspect-video bg-black/80 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-950/40"></div>
                    <span className="relative w-14 h-14 rounded-full bg-amber-400 text-[#0F3D2E] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Icons.Play className="w-6 h-6 ml-0.5" />
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-serif mb-1">{v.title}</h3>
                  <p className={`text-xs mb-3 ${t.softMuted}`}>{v.desc}</p>
                  <span className={`text-xs font-semibold ${t.accent}`}></span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* LECTEUR */}
      {activeReaderItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveReaderItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border relative ${t.modal}`}
          >
            <button
              type="button"
              onClick={() => setActiveReaderItem(null)}
              aria-label="Fermer le lecteur"
              className="absolute top-5 right-5 p-2 rounded-full bg-emerald-900/10 hover:bg-emerald-900/20 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-400/20 mb-3 ${t.accent}`}>
              {activeReaderItem.verified ? 'Texte vérifié' : 'Extrait à vérifier'}
            </span>
            <h2 id="reader-title" className="text-xl sm:text-2xl font-bold font-serif mb-1 pr-10">{activeReaderItem.title}</h2>
            <p className={`text-xs font-medium mb-4 ${t.accent}`}>Auteur : {activeReaderItem.author}</p>

            {activeReaderItem.driveUrl ? (
              <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-900/20 bg-black">
                <iframe
                  src={activeReaderItem.driveUrl.replace(/\/view.*$/, '/preview')}
                  className="w-full h-[65vh] sm:h-[75vh]"
                  allow="autoplay"
                  title={`Lecture de ${activeReaderItem.title}`}
                />
              </div>
            ) : (
              <div className={`p-6 sm:p-8 rounded-2xl border mb-6 text-sm sm:text-base leading-loose ${t.panel} ${darkMode ? 'text-emerald-100' : 'text-gray-800'}`}>
                <div
                  dir="rtl"
                  lang="ar"
                  className="text-center text-3xl text-amber-500 mb-6"
                  style={{ fontFamily: ARABIC_FONT }}
                >
                  {activeReaderItem.arabic}
                </div>

                <div className="space-y-4 font-serif">
                  {/* Utilisation de l'optional chaining `?.` au cas où content soit vide */}
                  {activeReaderItem.content?.map((paragraph, i) =>
                    isArabic(paragraph) ? (
                      <p
                        key={i}
                        dir="rtl"
                        lang="ar"
                        className="text-center text-2xl"
                        style={{ fontFamily: ARABIC_FONT }}
                      >
                        {paragraph}
                      </p>
                    ) : (
                      <p key={i} className="text-left">
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleDownload(activeReaderItem)}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] font-semibold py-3.5 rounded-xl text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Icons.Download className="w-4 h-4" />
                <span>Télécharger</span>
              </button>
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-medium transition-colors"
              >
                Signaler une erreur
              </button>
              <button
                type="button"
                onClick={() => setActiveReaderItem(null)}
                className="px-6 bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-medium py-3.5 rounded-xl text-xs sm:text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNALEMENT D'ERREUR (z-[60] : au-dessus du lecteur) */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-3xl p-6 border ${darkMode ? 'bg-[#0d1f18] border-emerald-800 text-white' : 'bg-white border-gray-200 text-black'}`}
          >
            <h3 id="report-title" className="text-lg font-bold font-serif mb-2">Signaler une correction</h3>
            <p className={`text-xs mb-4 ${t.softMuted}`}>Aidez-nous à maintenir une rigueur textuelle irréprochable en signalant une coquille ou une erreur de source.</p>
            <label htmlFor="report-text" className="sr-only">Description de l’erreur</label>
            <textarea
              id="report-text"
              rows={4}
              maxLength={2000}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Décrivez l’erreur constatée…"
              className={`w-full p-3 rounded-xl border text-xs mb-4 outline-none ${darkMode ? 'bg-[#041c14] border-emerald-900 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}
            ></textarea>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={reportSending || !reportText.trim()}
                className="flex-1 bg-amber-400 text-[#0F3D2E] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportSending && <Icons.Loader className="w-4 h-4" />}
                <span>Envoyer</span>
              </button>
              <button type="button" onClick={() => setReportModalOpen(false)} className={`px-4 py-2.5 rounded-xl text-xs ${darkMode ? 'bg-gray-500/10 text-gray-300' : 'bg-gray-500/10 text-gray-600'}`}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTIFICATION */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[36px] p-6 sm:p-8 shadow-2xl border relative text-center ${darkMode ? 'bg-[#0a2219] border-emerald-800/80 text-white' : 'bg-white border-emerald-900/10 text-[#0F3D2E]'}`}
          >
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(false)}
              aria-label="Fermer"
              className="absolute top-5 right-5 p-2 rounded-full bg-emerald-900/10 hover:bg-emerald-900/20 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icons.Close className="w-4 h-4" />
            </button>

            <div className="mb-6 space-y-1.5 mt-2">
              <h3 id="auth-title" className="text-2xl font-bold font-serif tracking-tight">
                {authMode === 'login' ? 'Connexion' : 'Créer un compte'}
              </h3>
              <p className={`text-xs leading-relaxed ${t.softMuted}`}>
                {authMode === 'login' ? 'Connectez-vous pour retrouver vos favoris.' : 'Inscrivez-vous pour enregistrer vos favoris.'}
              </p>
            </div>

            {authError && (
              <div role="alert" className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium text-center">
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all mb-4 shadow-sm hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${darkMode ? 'bg-[#041c14] border-emerald-800 hover:border-amber-400 text-white' : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-800'}`}
            >
              <Icons.Google className="w-5 h-5 shrink-0" />
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
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Serigne Mbacké"
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label htmlFor="auth-email" className={labelClass}>Email</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="auth-password" className={labelClass}>Mot de passe</label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 font-bold py-3.5 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading && <Icons.Loader className="w-4 h-4" />}
                <span>{authMode === 'signup' ? 'Créer un compte' : 'Se connecter'}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-gray-500/10">
              <p className={`text-xs ${t.softMuted}`}>
                {authMode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                  className="text-amber-500 font-bold hover:underline"
                >
                  {authMode === 'login' ? "S'inscrire" : 'Se connecter'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PIED DE PAGE */}
      <footer className={`border-t py-12 transition-colors mt-auto ${darkMode ? 'bg-[#020e0a] border-emerald-900/40 text-gray-400' : 'bg-[#0F3D2E] border-emerald-900/40 text-emerald-100'}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 gap-10 mb-10 ${socials.length ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shadow-md">
                <Icons.Logo className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Xassida Cloud</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-200/80 font-light">
              La bibliothèque numérique dédiée à la préservation et au rayonnement de l’œuvre de Cheikh Ahmadou Bamba.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">Navigation</h4>
            <ul className="space-y-2 text-xs">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}><Link href={item.href} className="hover:text-amber-300 transition-colors">{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {socials.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">Réseaux sociaux</h4>
              <div className="flex gap-4">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-10 h-10 rounded-xl bg-emerald-900/50 hover:bg-amber-400 hover:text-[#0F3D2E] flex items-center justify-center text-white transition-all shadow-sm"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-4">Communauté</h4>
            {user ? (
              <p className="text-xs text-emerald-200/80">Connecté en tant que {userLabel}. Vos favoris sont enregistrés sur cet appareil.</p>
            ) : (
              <>
                <p className="text-xs mb-3 text-emerald-200/80">Créez votre compte pour enregistrer vos documents favoris.</p>
                <button type="button" onClick={() => openAuth('signup')} className="w-full bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] px-4 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md">
                  S’inscrire gratuitement
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 border-t border-emerald-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-medium text-emerald-200/70">
          <p>© {new Date().getFullYear()} Xassida Cloud. <strong>Version 3.0</strong> Tous droits réservés.</p>
          <div className="flex gap-6">
            {/* Remplacés ici par <Link> */}
            <Link href="/conditions" className="hover:text-amber-300 transition-colors">Conditions d’utilisation</Link>
            <Link href="/confidentialite" className="hover:text-amber-300 transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}