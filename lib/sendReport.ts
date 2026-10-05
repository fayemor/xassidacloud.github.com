type ReportPayload = {
    docId: string;
    docTitle: string;
    message: string;
    userName?: string | null;
    userEmail?: string | null;
};

export async function sendReport(payload: ReportPayload): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40000);
    try {
        const res = await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        return res.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
} 
