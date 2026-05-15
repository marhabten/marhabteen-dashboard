import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userId, phone, name, password } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Update Firestore fields
    const firestoreUpdates = {};
    if (name !== undefined)     firestoreUpdates['1_name']        = name;
    if (phone !== undefined)    firestoreUpdates['3_phoneNumber'] = phone;
    if (password !== undefined && password !== '') firestoreUpdates['4_password'] = password;

    if (Object.keys(firestoreUpdates).length > 0) {
      await admin.firestore.collection('users').doc(userId).update(firestoreUpdates);
    }

    // Update Firebase Auth password
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      try {
        await admin.auth.updateUser(userId, { password });
      } catch (authErr) {
        // User may not exist in Firebase Auth (e.g. phone-only accounts) — ignore
        console.warn('[Users] Auth password update skipped:', authErr.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Users] Update error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}
