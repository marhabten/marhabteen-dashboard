import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await admin.firestore.collection('users').doc(userId).delete();

    // Also remove from Firebase Auth if the user exists there
    try {
      await admin.auth.deleteUser(userId);
    } catch {
      // Phone-only users won't exist in Firebase Auth — that's expected
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Users] Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
