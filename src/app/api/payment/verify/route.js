import { NextResponse } from 'next/server';

const PAYMENT_GATEWAY_ID = process.env.PAYMENT_GATEWAY_ID;
const PAYMENT_GATEWAY_TOKEN = process.env.PAYMENT_GATEWAY_TOKEN;
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || 'https://c7drkx2ege.execute-api.eu-west-2.amazonaws.com';

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
      console.error('Payment gateway credentials not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    const verifyUrl = `${PAYMENT_GATEWAY_URL}/receipt/transaction?store_id=${PAYMENT_GATEWAY_ID}&custom_ref=${customRef}`;

    console.log('Verifying payment for booking:', customRef);

    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYMENT_GATEWAY_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error('Payment verification failed:', response.status);
      return NextResponse.json(
        { success: false, verified: false },
        { status: 200 }
      );
    }

    const data = await response.json();
    const isSuccess = data.result === 'success';

    console.log('Payment verification result:', isSuccess ? 'SUCCESS' : 'FAILED');

    return NextResponse.json({
      success: true,
      verified: isSuccess,
      customRef: customRef,
      details: data,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message, success: false, verified: false },
      { status: 500 }
    );
  }
}
