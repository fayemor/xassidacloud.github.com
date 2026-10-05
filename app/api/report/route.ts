import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const message = String(body?.message ?? '').trim();
    const docTitle = String(body?.docTitle ?? 'Document inconnu').slice(0, 200);
    const docId = String(body?.docId ?? '').slice(0, 100);
    const userEmail = body?.userEmail ? String(body.userEmail).slice(0, 200) : null;
    const userName = body?.userName ? String(body.userName).slice(0, 200) : null;

    if (!message || message.length > 2000) {
        return NextResponse.json({ error: 'Message invalide' }, { status: 400 });
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return NextResponse.json({ error: 'Service email non configuré' }, { status: 500 });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Xassida Cloud" <${process.env.GMAIL_USER}>`,
            to: 'xassidacloud@gmail.com',
            replyTo: userEmail || undefined,
            subject: `Signalement : ${docTitle}`,
            text: [
                `Document : ${docTitle} (id : ${docId})`,
                `Utilisateur : ${userName ?? 'Anonyme'}${userEmail ? ` <${userEmail}>` : ''}`,
                '',
                'Message :',
                message,
            ].join('\n'),
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        const err = error as { code?: string; responseCode?: number; message?: string };
        console.error('Report email error:', err.code, err.responseCode, err.message);
        return NextResponse.json({ error: 'Envoi impossible' }, { status: 500 });
    }
}