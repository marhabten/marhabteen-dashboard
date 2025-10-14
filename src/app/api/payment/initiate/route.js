import { NextResponse } from 'next/server';

// IMPORTANT: Store these in environment variables, NOT in code
const PAYMENT_GATEWAY_ID = process.env.PAYMENT_GATEWAY_ID;
const PAYMENT_GATEWAY_TOKEN = process.env.PAYMENT_GATEWAY_TOKEN;
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'https://c7drkx2ege.execute-api.eu-west-2.amazonaws.com';

export async function POST(req) {
  try {
    const body = await req.json();
    const { bookingId, amount, email, phone } = body;

    // Validate required fields
    if (!bookingId || !amount || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, amount, email' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!PAYMENT_GATEWAY_ID || !PAYMENT_GATEWAY_TOKEN) {
      console.error('Payment gateway credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Build callback URLs
    const backendCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/payment/callback`;
    const frontendReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/payment/success`;

    // Prepare payment request
    const paymentParams = new URLSearchParams({
      id: PAYMENT_GATEWAY_ID,
      amount: amount.toString(),
      phone: phone || '',
      email: email,
      backend_url: backendCallbackUrl,
      frontend_url: frontendReturnUrl,
      custom_ref: bookingId,
    });

    const initiateUrl = `${PAYMENT_GATEWAY_URL}/payment/initiate?${paymentParams}`;

    console.log('Initiating payment for booking:', bookingId, 'Amount:', amount);

    // Call payment gateway
    const response = await fetch(initiateUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYMENT_GATEWAY_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('Payment gateway error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Payment gateway request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Payment initiated successfully:', data);

    return NextResponse.json({
      success: true,
      paymentUrl: data.url,
      customRef: bookingId,
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
