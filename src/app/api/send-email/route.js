import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Marhabten <support@marhabten.net>';

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, html } = body;

    console.log('[Email] Sending to:', to, '| Subject:', subject);

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 });
    }

    if (!RESEND_API_KEY || RESEND_API_KEY === 're_your_resend_api_key_here') {
      console.warn('[Email] RESEND_API_KEY not configured — skipping send');
      return NextResponse.json({ success: true, skipped: true });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    const data = await res.json();
    console.log('[Email] Resend response:', res.status, data);

    if (!res.ok) {
      return NextResponse.json({ error: 'Email send failed', detail: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('[Email] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
