/* XassidaIntroScript.tsx — composant SERVEUR (pas de "use client").
 *
 * Script bloquant placé dans <head> : il s'exécute AVANT le premier affichage et pose sur <html>
 *   data-xc="on"   → première visite dans cet onglet : l'intro joue
 *   data-xc="skip" → intro déjà vue : le CSS masque aussitôt le calque (aucun flash, aucune relecture)
 * Les rechargements et changements de page ne la rejouent pas ; un nouvel onglet, si.
 */

export default function XassidaIntroScript() {
  return <script dangerouslySetInnerHTML={{ __html: "(function(){var d=document.documentElement;try{if(sessionStorage.getItem(\"xc-intro-played\")){d.setAttribute(\"data-xc\",\"skip\")}else{d.setAttribute(\"data-xc\",\"on\");window.__xcT0=performance.now()}}catch(e){d.setAttribute(\"data-xc\",\"on\");window.__xcT0=performance.now()}})();" }} />;
}
