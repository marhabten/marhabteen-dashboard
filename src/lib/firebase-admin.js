import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccount && typeof serviceAccount === 'string') {
  try {
    serviceAccount = JSON.parse(serviceAccount);

    // Fix the escaped newlines in the private key
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

  } catch (e) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e);
    serviceAccount = null;
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const admin = {
  firestore: getFirestore(),
  messaging: getMessaging(),
};