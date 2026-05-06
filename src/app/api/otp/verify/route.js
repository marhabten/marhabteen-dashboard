import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(req) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, code' },
        { status: 400 }
      );
    }

    if (!accountSid || !authToken || !serviceSid) {
      console.error('[OTP/Verify] Missing Twilio env vars');
      return NextResponse.json({ error: 'OTP service not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    console.log(`[OTP/Verify] Checking code for ${phone}`);

    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code });

    console.log(`[OTP/Verify] Check status: ${check.status} for ${phone}`);

    if (check.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    // OTP approved — get or create Firebase Auth user for this phone number
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
