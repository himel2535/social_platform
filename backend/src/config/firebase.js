const admin = require('firebase-admin');

let initialized = false;

const initFirebase = () => {
  if (initialized) return admin;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('Firebase credentials not configured — push notifications disabled');
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
    console.log('Firebase Admin SDK initialized');
    return admin;
  } catch (error) {
    console.warn('Firebase initialization failed:', error.message);
    return null;
  }
};

const getMessaging = () => {
  const firebase = initFirebase();
  if (!firebase) return null;
  return firebase.messaging();
};

module.exports = { initFirebase, getMessaging };
