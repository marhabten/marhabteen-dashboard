import { NextResponse } from 'next/server';

// IMPORTANT: Store these in environment variables, NOT in code
const PAYMENT_GATEWAY_ID = process.env.PAYMENT_GATEWAY_ID;
const PAYMENT_GATEWAY_TOKEN = process.env.PAYMENT_GATEWAY_TOKEN;
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'https://uat-api.tlync.ly/api/v3';

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, amount, email, phone } = body;

    console.log('[Payment] ── Incoming Request ──────────────────────');
    console.log('[Payment] Raw body:', JSON.stringify(body));
    console.log('[Payment] Parsed  — bookingId:', bookingId, '| amount:', amount, '(type:', typeof amount, ') | email:', email, '| phone:', phone);
    console.log('[Payment] ─────────────────────────────────────────');

    // Validate required fields
    if (!bookingId || !amount || !phone) {
      console.error('[Payment] Validation failed — missing fields. bookingId:', !!bookingId, '| amount:', !!amount, '| phone:', !!phone);
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, amount, phone' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!PAYMENT_GATEWAY_ID || !PAYMENT_GATEWAY_TOKEN) {
      console.error('[Payment] Missing env vars — PAYMENT_GATEWAY_ID:', !!PAYMENT_GATEWAY_ID, 'PAYMENT_GATEWAY_TOKEN:', !!PAYMENT_GATEWAY_TOKEN);
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      console.error('[Payment] Invalid amount — value:', amount, 'type:', typeof amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Build callback URLs
    const backendCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/payment/callback`;
    const frontendReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/payment/success`;

    // Prepare payment request as form-encoded body (required by TLYNC)
    const paymentParams = new URLSearchParams({
      id: PAYMENT_GATEWAY_ID,
      amount: amount.toString(),
      phone: phone || '',
      backend_url: backendCallbackUrl,
      frontend_url: frontendReturnUrl,
      custom_ref: bookingId,
    });
    if (email) paymentParams.set('email', email);

    const initiateUrl = `${PAYMENT_GATEWAY_URL}/payment/initiate`;

    const requestHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${PAYMENT_GATEWAY_TOKEN}`,
    };

    console.log('[Payment] ── Outgoing Request ──────────────────────');
    console.log('[Payment] Method : POST');
    console.log('[Payment] URL    :', initiateUrl);
    console.log('[Payment] Headers:', {
      ...requestHeaders,
      Authorization: `Bearer ${PAYMENT_GATEWAY_TOKEN?.slice(0, 6)}...`,
    });
    console.log('[Payment] Body   :', paymentParams.toString());
    console.log('[Payment] Params :', { bookingId, amount, phone, email, backendCallbackUrl, frontendReturnUrl });
    console.log('[Payment] ────────────────────────────────────────────');

    const response = await fetch(initiateUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: paymentParams,
    });

    const rawText = await response.text();

    console.log('[Payment] ── Gateway Response ───────────────────────');
    console.log('[Payment] Status :', response.status, response.statusText);
    console.log('[Payment] Headers:', Object.fromEntries(response.headers.entries()));
    console.log('[Payment] Body   :', rawText);
    console.log('[Payment] ────────────────────────────────────────────');

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Payment gateway request failed', gatewayStatus: response.status, gatewayMessage: rawText },
        { status: response.status }
      );
    }

    const data = JSON.parse(rawText);
    console.log('[Payment] Initiated successfully:', data);

    return NextResponse.json({
      success: true,
      paymentUrl: data.url,
      customRef: bookingId,
    });

  } catch (error) {
    console.error('[Payment] Initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
