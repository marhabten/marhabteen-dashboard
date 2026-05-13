import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { phone, code, purpose } = await req.json();
    // purpose: 'signup' (default) | 'reset'

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, code' },
        { status: 400 }
      );
    }

    // Look up the pin stored by /send
    const sessionKey = phone.replace(/\+/g, '').replace(/\s/g, '');
    const sessionSnap = await admin.firestore.collection('otp_sessions').doc(sessionKey).get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: 'No OTP session found. Please request a new code.' }, { status: 400 });
    }

    const session = sessionSnap.data();
    if (Date.now() > session.expiresAt) {
      await admin.firestore.collection('otp_sessions').doc(sessionKey).delete();
      return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
    }

    const { pin } = session;
    console.log(`[OTP/Verify] Comparing code for ${phone}`);

    if (!pin || String(code).trim() !== String(pin).trim()) {
      console.log(`[OTP/Verify] Code mismatch for ${phone}`);
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    console.log(`[OTP/Verify] Code matched for ${phone}`);

    // Clean up session
    await admin.firestore.collection('otp_sessions').doc(sessionKey).delete();

    // For reset password — just confirm verification, no Firebase user creation
    if (purpose === 'reset') {
      console.log(`[OTP/Verify] Reset flow verified for ${phone}`);
      return NextResponse.json({ success: true, verified: true });
    }

    // For signup — get or create Firebase Auth user, issue custom token
    let uid;
    try {
      const existing = await admin.auth.getUserByPhoneNumber(phone);
      uid = existing.uid;
      console.log(`[OTP/Verify] Found existing Firebase user: ${uid}`);
    } catch {
      const created = await admin.auth.createUser({ phoneNumber: phone });
      uid = created.uid;
      console.log(`[OTP/Verify] Created new Firebase user: ${uid}`);
    }

    const customToken = await admin.auth.createCustomToken(uid);
    console.log(`[OTP/Verify] Issued custom token for uid: ${uid}`);

    return NextResponse.json({ success: true, customToken, uid });
  } catch (error) {
    console.error('[OTP/Verify] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
