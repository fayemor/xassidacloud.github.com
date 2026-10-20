/* xassida-intro-engine.ts — moteur de l'intro (aucune dépendance, ~4 Ko).
 *
 * Rôle : planifier l'ouverture du rideau et animer les particules.
 * Toute l'animation visuelle (tracé du logo, lueur, lettres…) est faite en CSS (intro.css) :
 * propriétés transform / opacity uniquement, donc exécutées par le GPU à 60 images/s.
 *
 * Ce fichier est la source unique : intro.js (version « HTML pur ») en est généré.
 */

export interface IntroOptions {
  /** Durée minimale d'affichage avant l'ouverture, en ms (conseillé : 2000 à 3500). */
  duration?: number;
  /** Durée de l'ouverture du rideau, en ms. */
  exitDuration?: number;
  /** Attente maximale du chargement complet de la page (polices, images), en ms. */
  maxWait?: number;
  /** Active les particules lumineuses (désactivées automatiquement si « réduire les animations »). */
  particles?: boolean;
  /** Appelé quand l'intro est entièrement terminée (retirer le calque, mettre à jour un état…). */
  onDone?: () => void;
}

export interface IntroController {
  /** Lance l'ouverture immédiatement (bouton « Passer »). */
  skip: () => void;
  /** Annule les minuteurs et écouteurs (démontage du composant). */
  destroy: () => void;
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Se résout quand la page et les polices sont prêtes, ou après `maxWait` ms au plus. */
function waitForPageReady(maxWait: number): Promise<void> {
  return new Promise((resolve) => {
    const cap = window.setTimeout(resolve, maxWait);
    const finish = () => {
      window.clearTimeout(cap);
      resolve();
    };
    const waitFonts = () => (document.fonts?.ready ?? Promise.resolve()).then(finish, finish);
    if (document.readyState === "complete") waitFonts();
    else window.addEventListener("load", waitFonts, { once: true });
  });
}

/* -------------------------------------------------------------------------- */
/*  Particules : petites lumières dorées qui montent doucement                */
/* -------------------------------------------------------------------------- */

interface Particle {
  x: number;
  y: number;
  r: number; // rayon de la lueur (px)
  vy: number; // vitesse verticale (px/s)
  sway: number; // amplitude du balancement horizontal (px)
  phase: number;
  alpha: number;
}

/** Sprite lumineux pré-dessiné une seule fois : drawImage() est bien plus rapide que shadowBlur. */
function makeSprite(): HTMLCanvasElement {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const c = s.getContext("2d");
  if (c) {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,244,200,1)");
    g.addColorStop(0.25, "rgba(252,211,77,.55)");
    g.addColorStop(1, "rgba(252,211,77,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  }
  return s;
}

function startParticles(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  const sprite = makeSprite();
  let width = 0;
  let height = 0;
  let particles: Particle[] = [];
  let raf = 0;
  let last = 0;
  let stopped = false;

  const spawn = (anywhere: boolean): Particle => ({
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + 12,
    r: 1.5 + Math.random() * 3.2,
    vy: 9 + Math.random() * 22,
    sway: 6 + Math.random() * 16,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.3 + Math.random() * 0.6,
  });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // plafonné : économise le GPU sur mobile
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(46, Math.max(14, (width * height) / 30000))); // moins sur petit écran
    particles = Array.from({ length: count }, () => spawn(true));
  };

  const frame = (time: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, (time - last) / 1000 || 0.016);
    last = time;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.y -= p.vy * dt;
      p.phase += dt * 0.8;
      const x = p.x + Math.sin(p.phase) * p.sway;
      const twinkle = 0.6 + 0.4 * Math.sin(p.phase * 2.3);
      const edge = Math.max(0, Math.min(1, p.y / (height * 0.25), (height - p.y) / (height * 0.2)));
      ctx.globalAlpha = p.alpha * twinkle * edge;
      const size = p.r * 6;
      ctx.drawImage(sprite, x - size / 2, p.y - size / 2, size, size);
      if (p.y < -20) Object.assign(p, spawn(false));
    }
    raf = window.requestAnimationFrame(frame);
  };

  const onVisibility = () => {
    window.cancelAnimationFrame(raf);
    if (!document.hidden && !stopped) {
      last = 0;
      raf = window.requestAnimationFrame(frame);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", onVisibility);
  raf = window.requestAnimationFrame(frame);

  return () => {
    stopped = true;
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", onVisibility);
    ctx.clearRect(0, 0, width, height);
  };
}

/* -------------------------------------------------------------------------- */
/*  Intro                                                                     */
/* -------------------------------------------------------------------------- */

export function startIntro(root: HTMLElement, options: IntroOptions = {}): IntroController {
  const reduced = prefersReducedMotion();
  const duration = reduced ? Math.min(options.duration ?? 3200, 1500) : (options.duration ?? 3200);
  const exitDuration = reduced ? Math.min(options.exitDuration ?? 1400, 500) : (options.exitDuration ?? 1400);
  const maxWait = options.maxWait ?? 5000;
  const html = document.documentElement;

  root.style.setProperty("--xc-duration", `${duration}ms`);
  root.style.setProperty("--xc-exit", `${exitDuration}ms`);

  let finished = false;
  let cancelled = false;
  let leaving = false;
  const timers: number[] = [];

  // Les animations CSS démarrent au premier affichage ; on compte le temps depuis ce moment.
  const t0 = (window as Window & { __xcT0?: number }).__xcT0 ?? performance.now();

  const canvas = root.querySelector<HTMLCanvasElement>(".xc-canvas");
  let stopParticles: () => void = () => undefined;
  if (canvas) {
    if ((options.particles ?? true) && !reduced) stopParticles = startParticles(canvas);
    else canvas.style.display = "none";
  }

  const cleanupListeners = () => {
    window.removeEventListener("keydown", onKey);
    skipButton?.removeEventListener("click", leave);
  };

  const finish = () => {
    if (finished || cancelled) return;
    finished = true;
    stopParticles();
    cleanupListeners();
    html.setAttribute("data-xc", "done");
    options.onDone?.();
  };

  function leave() {
    if (leaving || finished || cancelled) return;
    leaving = true;
    root.classList.add("is-leaving"); // déclenche l'ouverture du rideau (CSS)
    html.setAttribute("data-xc", "leaving"); // crochet pour animer l'entrée du site
    timers.push(window.setTimeout(stopParticles, exitDuration * 0.45));
    timers.push(window.setTimeout(finish, exitDuration + 120));
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") leave();
  }

  const skipButton = root.querySelector<HTMLElement>("[data-xc-skip]");
  skipButton?.addEventListener("click", leave);
  window.addEventListener("keydown", onKey);

  // Ouverture quand : durée minimale écoulée ET page chargée
  const minimum = new Promise<void>((resolve) =>
    timers.push(window.setTimeout(resolve, Math.max(0, duration - (performance.now() - t0))))
  );
  Promise.all([minimum, waitForPageReady(maxWait)]).then(leave);

  return {
    skip: leave,
    destroy: () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      stopParticles();
      cleanupListeners();
    },
  };
}
