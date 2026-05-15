import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const PAGE_SIZE = 50;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const startAfter = searchParams.get('startAfter');

    // Search mode: scan all users server-side and filter in memory.
    // Admin SDK has no security rule overhead so this is fast enough for
    // typical user bases. Returns up to 100 matching results.
    if (search) {
      const snap = await admin.firestore.collection('users').get();
      const matched = [];
      for (const d of snap.docs) {
        const data = d.data();
        const name    = (data['1_name']        || '').toLowerCase();
        const email   = (data['2_email']       || '').toLowerCase();
        const phone   = (data['3_phoneNumber'] || '').toLowerCase();
        if (name.includes(search) || email.includes(search) || phone.includes(search)) {
          matched.push({ id: d.id, ...data });
          if (matched.length >= 100) break;
        }
      }
      return NextResponse.json({ users: matched, lastDocId: null, hasMore: false });
    }

    // Normal paginated listing
    let query = admin.firestore
      .collection('users')
      .orderBy('__name__')
      .limit(PAGE_SIZE);

    if (startAfter) {
      const cursorDoc = await admin.firestore.collection('users').doc(startAfter).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const lastDocId = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1].id : null;
    const hasMore = snap.docs.length === PAGE_SIZE;

    return NextResponse.json({ users, lastDocId, hasMore });
  } catch (error) {
    console.error('[Users] List error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
