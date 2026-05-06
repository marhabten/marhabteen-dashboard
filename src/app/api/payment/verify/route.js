import { NextResponse } from 'next/server';

const PAYMENT_GATEWAY_ID = process.env.PAYMENT_GATEWAY_ID;
const PAYMENT_GATEWAY_TOKEN = process.env.PAYMENT_GATEWAY_TOKEN;
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'https://uat-api.tlync.ly/api/v3';

export async function POST(req) {
  try {
    const body = await req.json();
    const { customRef } = body;

    if (!customRef) {
      return NextResponse.json(
        { error: 'Missing customRef (bookingId)' },
        { status: 400 }
      );
    }

    if (!PAYMENT_GATEWAY_ID || !PAYMENT_GATEWAY_TOKEN) {
      console.error('[Payment] Missing env vars — PAYMENT_GATEWAY_ID:', !!PAYMENT_GATEWAY_ID, 'PAYMENT_GATEWAY_TOKEN:', !!PAYMENT_GATEWAY_TOKEN);
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Params must be in body as x-www-form-urlencoded (not query string)
    const verifyParams = new URLSearchParams({
      store_id: PAYMENT_GATEWAY_ID,
      custom_ref: customRef,
    });

    const verifyUrl = `${PAYMENT_GATEWAY_URL}/receipt/transaction`;

    console.log('[Payment] Verifying payment:', {
      customRef,
      url: verifyUrl,
      tokenPresent: !!PAYMENT_GATEWAY_TOKEN,
      tokenPrefix: PAYMENT_GATEWAY_TOKEN?.slice(0, 6) + '...',
      body: verifyParams.toString(),
    });

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${PAYMENT_GATEWAY_TOKEN}`,
      },
      body: verifyParams,
    });

    const rawText = await response.text();
    console.log('[Payment] Verify gateway response:', response.status, rawText);

    if (!response.ok) {
      console.error('[Payment] Verification failed:', response.status, rawText);
      return NextResponse.json(
        { success: false, verified: false },
        { status: 200 }
      );
    }

    const data = JSON.parse(rawText);
    const isSuccess = data.result === 'success';

    console.log('[Payment] Verification result:', isSuccess ? 'SUCCESS' : 'NOT COMPLETE', data);

    return NextResponse.json({
      success: true,
      verified: isSuccess,
      customRef: customRef,
      details: data,
    });

  } catch (error) {
    console.error('[Payment] Verification error:', error);
    return NextResponse.json(
      { error: error.message, success: false, verified: false },
      { status: 500 }
    );
  }
}
