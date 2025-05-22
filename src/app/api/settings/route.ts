
// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { CompanySettings } from '@/lib/types';

let app: App | undefined = undefined;
let db: admin.firestore.Firestore | undefined = undefined;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  if (!admin.apps.length) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      console.error("Failed to initialize Firebase Admin SDK for settings:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance for settings:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables for settings are not fully set. API will use defaults."
  );
}

const SETTINGS_COLLECTION = 'appSettings';
const COMPANY_DETAILS_DOC_ID = 'companyDetails';

const defaultSettings: CompanySettings = {
  companyName: "The Workplace",
  companyAddress: "123 Main Street, Anytown, USA",
  companyContact: "contact@theworkplace.com | (555) 123-4567",
  paymentInstructions: "Please make payments to Workplace Bank, Account #123456789 or GCash: 09XX-XXX-XXXX (John Doe).",
};

export async function GET() {
  if (!db) {
    console.warn("Firestore is not initialized for settings. Returning default settings.");
    return NextResponse.json(defaultSettings, { status: 200 });
  }

  try {
    const settingsDoc = await db.collection(SETTINGS_COLLECTION).doc(COMPANY_DETAILS_DOC_ID).get();
    if (!settingsDoc.exists) {
      return NextResponse.json(defaultSettings, { status: 200 });
    }
    return NextResponse.json(settingsDoc.data() as CompanySettings, { status: 200 });
  } catch (error) {
    console.error("Error fetching settings from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching settings: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized for settings. Cannot save settings.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured for settings.' }, { status: 503 });
  }

  try {
    const settingsData: CompanySettings = await request.json();
    
    // Basic validation
    if (!settingsData.companyName || !settingsData.companyAddress || !settingsData.companyContact || !settingsData.paymentInstructions) {
      return NextResponse.json({ message: 'Missing required settings fields.' }, { status: 400 });
    }

    await db.collection(SETTINGS_COLLECTION).doc(COMPANY_DETAILS_DOC_ID).set(settingsData, { merge: true });
    return NextResponse.json(settingsData, { status: 200 });
  } catch (error) {
    console.error("Error saving settings to Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error saving settings: ${errorMessage}` }, { status: 500 });
  }
}
