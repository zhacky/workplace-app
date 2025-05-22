// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// IMPORTANT: User needs to add these to their .env or .env.local file
// These values come from your Firebase project settings (Project settings > General > Your apps > Firebase SDK snippet > Config)
// Ensure they are prefixed with NEXT_PUBLIC_ to be accessible on the client side.

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.warn(
      "Firebase client configuration is missing or incomplete. " +
      "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
      "and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set in your environment variables."
    );
    // You might want to throw an error here or handle this case differently
    // For now, we'll let it proceed, but auth features won't work without config.
    app = initializeApp({}); // Initialize with empty config to avoid further errors if accessed
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApp();
}

const auth = getAuth(app);

export { app, auth };
