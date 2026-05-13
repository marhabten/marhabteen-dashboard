import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const RESALA_TOKEN = process.env.RESALA_TOKEN;
const RESALA_SERVICE_NAME = 'Marhabten';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Missing required field: phone' }, { status: 400 });
    }

    if (!RESALA_TOKEN) {
      console.error('[OTP/Send] Missing RESALA_TOKEN env var');
      return NextResponse.json({ error: 'OTP service not configured' }, { status: 500 });
    }

    // Resala expects phone without '+' sign (e.g. 218910024433)
    const resalaPhone = phone.replace(/^\+/, '');

    console.log(`[OTP/Send] Sending OTP to ${resalaPhone} via Resala`);

    const resalaRes = await fetch(
      `https://dev.resala.ly/api/v1/pins?service_name=${encodeURIComponent(RESALA_SERVICE_NAME)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESALA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: resalaPhone }),
      }
    );

    const resalaBody = await resalaRes.json().catch(() => ({}));
    console.log(`[OTP/Send] Resala response (${resalaRes.status}):`, resalaBody);

    if (!resalaRes.ok) {
      const msg = resalaBody?.message || resalaBody?.error || 'Failed to send OTP';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Resala returns the PIN code directly in the response — store it for verification
    const pin = resalaBody?.pin;
    if (!pin) {
      console.error('[OTP/Send] No pin in Resala response:', resalaBody);
      return NextResponse.json({ error: 'OTP sent but no pin received from provider' }, { status: 500 });
    }

    const sessionKey = phone.replace(/\+/g, '').replace(/\s/g, '');
    await admin.firestore.collection('otp_sessions').doc(sessionKey).set({
      pin: String(pin),
      phone,
      createdAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    console.log(`[OTP/Send] Session stored for ${sessionKey}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[OTP/Send] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}
