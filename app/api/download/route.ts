import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const name = searchParams.get('name') || 'document.pdf';

    if (!id) {
        return NextResponse.json(
            { error: 'ID du fichier manquant.' },
            { status: 400 }
        );
    }

    try {
        const driveUrl =
            `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;

        const response = await fetch(driveUrl, {
            redirect: 'follow',
            cache: 'no-store',
        });

        if (!response.ok || !response.body) {
            return NextResponse.json(
                { error: 'Impossible de récupérer le fichier Google Drive.' },
                { status: 502 }
            );
        }

        const contentType =
            response.headers.get('content-type') || 'application/pdf';

        const contentLength = response.headers.get('content-length');

        const headers = new Headers();

        headers.set('Content-Type', contentType);
        headers.set(
            'Content-Disposition',
            `attachment; filename="${name.replace(/"/g, '')}"`
        );
        headers.set('Cache-Control', 'private, no-store');

        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Google Drive download error:', error);

        return NextResponse.json(
            { error: 'Erreur lors du téléchargement.' },
            { status: 500 }
        );
    }
}