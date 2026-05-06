import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Missing required field: phone' }, { status: 400 });
    }

    if (!accountSid || !authToken || !serviceSid) {
      console.error('[OTP/Send] Missing Twilio env vars');
      return NextResponse.json({ error: 'OTP service not configured' }, { status: 500 });
    }

    const client = twilio(accountSid, authToken);

    console.log(`[OTP/Send] Sending OTP to ${phone}`);

    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: 'sms' });

    console.log(`[OTP/Send] Status: ${verification.status} for ${phone}`);

    return NextResponse.json({ success: true, status: verification.status });
  } catch (error) {
    console.error('[OTP/Send] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
