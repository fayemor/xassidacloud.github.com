"use client";

/* XassidaIntro.tsx — écran d'introduction de XassidaCloud (logo tracé, lueur, particules, rideau).
 *
 * - Le calque est rendu côté serveur : le contenu du site n'apparaît jamais avant lui.
 * - Une seule fois par onglet : c'est <XassidaIntroScript /> (dans <head>) qui décide, avant le premier affichage.
 * - Toute l'animation est en CSS (xassida-intro.css) ; le moteur ne fait que planifier l'ouverture.
 * Réglages : <XassidaIntro duration={3200} exitDuration={1400} particles />
 */

import { useEffect, useRef, useState } from "react";
import "./xassida-intro.css";
import { startIntro } from "./xassida-intro-engine";

const STORAGE_KEY = "xc-intro-played";

/* Structure de l'intro (identique à celle de index.html). Pour changer de logo, remplacez le <svg class="xc-svg">. */
const MARKUP = `<div class="xc-panel xc-panel--top"></div>
  <div class="xc-panel xc-panel--bottom"></div>
  <canvas class="xc-canvas" aria-hidden="true"></canvas>
  <div class="xc-stage" aria-hidden="true">
    <div class="xc-logo">
      <div class="xc-glow"></div>
      <span class="xc-ripple" style="--rd:1.5s"></span>
      <span class="xc-ripple" style="--rd:2.3s"></span>
      <span class="xc-ripple" style="--rd:3.1s"></span>
      <svg class="xc-svg" viewBox="0 0 36 36" focusable="false">
        <defs>
          <mask id="xc-m">
            <rect width="36" height="36" fill="#fff"/>
            <path d="M18 20.75 10.5 18.25v7.5l7.5 2.5zM18 20.75l7.5-2.5v7.5L18 28.25z" fill="#000"/>
            <path d="M18 20.75v7.5" stroke="#fff" stroke-width=".6"/>
          </mask>
          <clipPath id="xc-clip"><rect x="2" y="18.75" width="32" height="12" rx="6"/><circle cx="10" cy="19.25" r="7.5"/><circle cx="19.5" cy="15.25" r="10"/><circle cx="28" cy="20.25" r="7"/></clipPath>
          <linearGradient id="xc-shine-grad" gradientTransform="rotate(20)">
            <stop offset="0" stop-color="#fff" stop-opacity="0"/>
            <stop offset=".5" stop-color="#fff" stop-opacity=".65"/>
            <stop offset="1" stop-color="#fff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g class="xc-fill">
          <g mask="url(#xc-m)" fill="currentColor"><rect x="2" y="18.75" width="32" height="12" rx="6"/><circle cx="10" cy="19.25" r="7.5"/><circle cx="19.5" cy="15.25" r="10"/><circle cx="28" cy="20.25" r="7"/></g>
          <g mask="url(#xc-m)"><g clip-path="url(#xc-clip)"><rect class="xc-shine" x="-12" y="-4" width="12" height="44" fill="url(#xc-shine-grad)"/></g></g>
        </g>
        <path class="xc-draw" pathLength="1" d="M8 30.75A6 6 0 0 1 2.883 21.617A7.5 7.5 0 0 1 10.132 11.751A10 10 0 0 1 29.323 13.376A7 7 0 0 1 33.946 23.944A6 6 0 0 1 28 30.75Z"/>
        <path class="xc-draw xc-book" pathLength="1" d="M18 20.75L10.5 18.25V25.75L18 28.25Z"/>
        <path class="xc-draw xc-book" pathLength="1" d="M18 20.75L25.5 18.25V25.75L18 28.25Z"/>
      </svg>
    </div>
    <p class="xc-title"><span class="xc-word"><span class="xc-l" style="--i:0">X</span><span class="xc-l" style="--i:1">a</span><span class="xc-l" style="--i:2">s</span><span class="xc-l" style="--i:3">s</span><span class="xc-l" style="--i:4">i</span><span class="xc-l" style="--i:5">d</span><span class="xc-l" style="--i:6">a</span></span><span class="xc-word xc-gold"><span class="xc-l" style="--i:7">C</span><span class="xc-l" style="--i:8">l</span><span class="xc-l" style="--i:9">o</span><span class="xc-l" style="--i:10">u</span><span class="xc-l" style="--i:11">d</span></span></p>
    <p class="xc-tagline">La bibliothèque numérique du patrimoine mouride</p>
  </div>
  <span class="xc-seam"></span>
  <div class="xc-progress" aria-hidden="true"><i></i></div>
  <button type="button" class="xc-skip" data-xc-skip>Passer</button>`;

interface XassidaIntroProps {
  /** Durée minimale d'affichage avant l'ouverture, en ms (conseillé : 2000 à 3500). */
  duration?: number;
  /** Durée de l'ouverture du rideau, en ms. */
  exitDuration?: number;
  /** Particules lumineuses. */
  particles?: boolean;
}

export default function XassidaIntro({ duration = 3200, exitDuration = 1400, particles = true }: XassidaIntroProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const started = useRef(false); // survit au double-montage de React StrictMode (développement)
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!started.current) {
      // Le script de <head> a mis data-xc="on" (première visite) ou "skip" (déjà vue / pas de script)
      if (document.documentElement.getAttribute("data-xc") !== "on") {
        setDone(true);
        return;
      }
      started.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignoré */
      }
    }

    const controller = startIntro(root, { duration, exitDuration, particles, onDone: () => setDone(true) });
    return () => controller.destroy();
  }, [duration, exitDuration, particles]);

  if (done) return null;

  return (
    <div
      id="xc-intro"
      ref={rootRef}
      role="status"
      aria-label="Chargement de Xassida Cloud"
      dangerouslySetInnerHTML={{ __html: MARKUP }}
    />
  );
}
