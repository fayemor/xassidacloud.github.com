"use client";

/* Emplacement : components/ChatWidget.tsx */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
    'Comment ajouter une xassida à mes favoris ?',
    'Quels livres sont disponibles ?',
    'Je cherche une xassida de remerciement à Dieu',
    'Comment télécharger un livre ?'
];

const WELCOME = "Salam ! Je suis l’assistant de Xassida Cloud. Je peux vous aider à trouver une xassida, un livre ou une vidéo, et à utiliser le site. Que cherchez-vous ?";

/* ---- Icônes ---- */
const Icon = ({ d, c = 'w-5 h-5', fill = false }: { d: string; c?: string; fill?: boolean }) => (
    <svg className={c} fill={fill ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);
const ICONS = {
    chat: 'M8 10h8M8 14h5m-9 6l3-3h10a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v13z',
    close: 'M6 18L18 6M6 6l12 12',
    send: 'M12 19V5m0 0l-6 6m6-6l6 6',
    stop: 'M7 7h10v10H7z',
    reset: 'M4 4v5h5M20 20v-5h-5M5.6 15A8 8 0 0018.4 9M18.4 9L20 9M5.6 15L4 15'
};

/* ---- Rendu Markdown minimal et sûr : **gras** et [texte](/lien-interne) uniquement ---- */
function renderInline(text: string, keyBase: string, onNavigate?: () => void, dark = false): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const re = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\((\/[^)\s]*)\)/g;   // **gras**, *italique*, [texte](/lien)
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index));
        if (m[1]) nodes.push(<strong key={`${keyBase}-b${i}`}>{m[1]}</strong>);
        else if (m[2]) nodes.push(<em key={`${keyBase}-i${i}`}>{m[2]}</em>);
        else nodes.push(
            <Link key={`${keyBase}-l${i}`} href={m[4]} onClick={onNavigate} className={`underline font-semibold hover:opacity-80 ${dark ? 'text-amber-300' : 'text-amber-700'}`}>{m[3]}</Link>
        );
        last = m.index + m[0].length;
        i++;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

function RichText({ text, onNavigate, dark }: { text: string; onNavigate?: () => void; dark: boolean }) {
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, idx) => {
                const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
                if (bullet) {
                    return (
                        <div key={idx} className="flex gap-2 pl-1">
                            <span aria-hidden="true">•</span>
                            <span>{renderInline(bullet[1], `r${idx}`, onNavigate, dark)}</span>
                        </div>
                    );
                }
                if (!line.trim()) return <div key={idx} className="h-2" />;
                return <div key={idx}>{renderInline(line, `r${idx}`, onNavigate, dark)}</div>;
            })}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  WIDGET                                                                    */
/* -------------------------------------------------------------------------- */

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [dark, setDark] = useState(false);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const abortRef = useRef<AbortController | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    /* Suit le mode sombre posé par les pages (classe "dark" sur <html>) */
    useEffect(() => {
        const el = document.documentElement;
        const sync = () => setDark(el.classList.contains('dark'));
        sync();
        const obs = new MutationObserver(sync);
        obs.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    /* Conversation conservée le temps de la session du navigateur */
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('xassida_chat');
            if (raw) setMessages(JSON.parse(raw));
        } catch { /* ignoré */ }
    }, []);
    useEffect(() => {
        try { sessionStorage.setItem('xassida_chat', JSON.stringify(messages.slice(-30))); } catch { /* ignoré */ }
    }, [messages]);

    /* Défilement automatique vers le bas */
    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, open, busy]);

    /* Focus à l'ouverture, Échap pour fermer */
    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            if (!getApps().length) return null;
            return (await getAuth().currentUser?.getIdToken()) ?? null;
        } catch { return null; }
    }, []);

    const send = useCallback(async (raw: string) => {
        const text = raw.trim();
        if (!text || busy) return;

        setError('');
        setInput('');
        const history: Msg[] = [...messages, { role: 'user', content: text }];
        setMessages([...history, { role: 'assistant', content: '' }]);
        setBusy(true);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const token = await getToken();
            const res = await fetch('/api/chat', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ messages: history })
            });

            if (!res.ok || !res.body) {
                let msg = "L'assistant est momentanément indisponible. Réessayez dans un instant.";
                try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignoré */ }
                throw new Error(msg);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let answer = '';
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                answer += decoder.decode(value, { stream: true });
                setMessages([...history, { role: 'assistant', content: answer }]);
            }
            if (!answer.trim()) throw new Error("Je n'ai pas pu répondre. Pouvez-vous reformuler ?");
        } catch (e) {
            if ((e as Error).name === 'AbortError') {
                // Arrêt volontaire : on garde ce qui a déjà été reçu
                setMessages((prev) => (prev[prev.length - 1]?.content ? prev : prev.slice(0, -1)));
            } else {
                setMessages(history); // retire la bulle vide
                setError((e as Error).message || 'Une erreur est survenue.');
            }
        } finally {
            setBusy(false);
            abortRef.current = null;
        }
    }, [messages, busy, getToken]);

    // Sur téléphone, le panneau couvre la page : on le referme quand on ouvre une xassida
    const closeOnMobile = () => { if (window.innerWidth < 640) setOpen(false); };

    const stop = () => abortRef.current?.abort();
    const reset = () => {
        abortRef.current?.abort();
        setMessages([]);
        setError('');
        try { sessionStorage.removeItem('xassida_chat'); } catch { /* ignoré */ }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
    };

    /* ---- Styles (mêmes couleurs que le site) ---- */
    const panel = dark ? 'bg-[#0a2219] border-emerald-800/80 text-[#e2e8f0]' : 'bg-white border-emerald-900/15 text-[#0F3D2E]';
    const bubbleBot = dark ? 'bg-[#0d261e] border-emerald-800/50 text-gray-100' : 'bg-emerald-900/5 border-emerald-900/10 text-[#0F3D2E]';
    const field = dark ? 'bg-[#041c14] border-emerald-900/60 text-white placeholder-gray-500 focus:border-amber-400' : 'bg-emerald-50/30 border-gray-200 text-black placeholder-gray-500 focus:border-emerald-700';
    const chip = dark ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-gray-200' : 'bg-emerald-900/10 hover:bg-emerald-900/20 text-[#0F3D2E]';

    const lastIsEmptyBot = busy && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1].content;

    return (
        <>
            {/* BOUTON FLOTTANT */}
            {!open && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label="Ouvrir l'assistant Xassida Cloud"
                    className="fixed bottom-5 right-5 z-[45] w-14 h-14 rounded-full bg-[#0F3D2E] hover:bg-emerald-800 text-amber-300 border border-amber-400/40 shadow-2xl flex items-center justify-center transition-transform hover:scale-105"
                >
                    <Icon d={ICONS.chat} c="w-7 h-7" />
                </button>
            )}

            {/* FENÊTRE DE CHAT */}
            {open && (
                <div
                    role="dialog"
                    aria-label="Assistant Xassida Cloud"
                    className={`fixed z-[65] inset-x-3 bottom-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px] h-[min(620px,calc(100dvh-1.5rem))] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${panel}`}
                >
                    {/* En-tête */}
                    <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-br from-[#0F3D2E] to-[#062a1f] text-white">
                        <div className="min-w-0">
                            <p className="text-sm font-bold font-serif truncate">Assistant Xassida Cloud</p>
                            <p className="text-[11px] text-amber-300/90 truncate">Pour trouver et utiliser nos contenus</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {messages.length > 0 && (
                                <button type="button" onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation" className="p-2 rounded-full hover:bg-white/10 text-emerald-100">
                                    <Icon d={ICONS.reset} c="w-4 h-4" />
                                </button>
                            )}
                            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer l'assistant" className="p-2 rounded-full hover:bg-white/10 text-emerald-100">
                                <Icon d={ICONS.close} c="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
                        <div className={`max-w-[88%] rounded-2xl rounded-bl-md border px-4 py-3 text-[13px] leading-relaxed ${bubbleBot}`}>{WELCOME}</div>

                        {messages.length === 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {SUGGESTIONS.map((s) => (
                                    <button key={s} type="button" onClick={() => send(s)} className={`px-3 py-2 rounded-full text-[11px] font-medium text-left transition-colors ${chip}`}>{s}</button>
                                ))}
                            </div>
                        )}

                        {messages.map((m, i) => {
                            if (m.role === 'assistant' && !m.content) return null;
                            return m.role === 'user' ? (
                                <div key={i} className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0F3D2E] text-amber-100 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</div>
                                </div>
                            ) : (
                                <div key={i} className={`max-w-[88%] rounded-2xl rounded-bl-md border px-4 py-3 text-[13px] leading-relaxed break-words ${bubbleBot}`}>
                                    <RichText text={m.content} onNavigate={closeOnMobile} dark={dark} />
                                </div>
                            );
                        })}

                        {lastIsEmptyBot && (
                            <div className={`inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border px-4 py-3 ${bubbleBot}`} aria-label="L'assistant écrit">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '120ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '240ms' }}></span>
                            </div>
                        )}

                        {error && (
                            <div role="alert" className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium px-4 py-3">{error}</div>
                        )}
                    </div>

                    {/* Saisie */}
                    <div className={`px-3 pt-3 pb-3 border-t ${dark ? 'border-emerald-900/40' : 'border-emerald-900/10'}`}>
                        <div className="flex items-end gap-2">
                            <label htmlFor="chat-input" className="sr-only">Votre message</label>
                            <textarea
                                id="chat-input"
                                ref={inputRef}
                                rows={1}
                                maxLength={1500}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Posez votre question…"
                                className={`flex-1 resize-none max-h-28 px-4 py-3 rounded-2xl border text-xs sm:text-[13px] outline-none transition-colors ${field}`}
                            />
                            {busy ? (
                                <button type="button" onClick={stop} aria-label="Arrêter la réponse" className="shrink-0 w-11 h-11 rounded-2xl bg-red-500/15 text-red-500 hover:bg-red-500/25 flex items-center justify-center">
                                    <Icon d={ICONS.stop} c="w-4 h-4" fill />
                                </button>
                            ) : (
                                <button type="button" onClick={() => send(input)} disabled={!input.trim()} aria-label="Envoyer" className="shrink-0 w-11 h-11 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0F3D2E] flex items-center justify-center shadow-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    <Icon d={ICONS.send} c="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <p className={`mt-2 px-1 text-[10px] leading-snug ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Assistant automatisé : il peut se tromper et ne donne pas d’avis religieux. Consultez les textes et un guide qualifié.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
