
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Attempt to initialize Firebase Admin SDK only if all required environment variables are present.
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
      console.error("Failed to initialize Firebase Admin SDK:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) " +
    "are not fully set. Firebase features in /api/bookings will be disabled."
  );
}

export async function POST(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized. Cannot create booking.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
  }

  try {
    const bookingData = await request.json();
    console.log("Received booking data:", bookingData);

    // Add booking data to Firestore
    const docRef = await db.collection('bookings').add({
      ...bookingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add a server timestamp
    });

    return NextResponse.json({ message: 'Booking received successfully!', bookingId: docRef.id }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error saving booking data to Firebase:", error);
    // Check if the error is a Firestore-specific error or a general one
    if (error instanceof Error && 'code' in error) { // Heuristic for Firebase errors
        return NextResponse.json({ message: `Error saving booking data: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error processing booking request.' }, { status: 500 });
  }
}

export async function GET() {
  if (!db) {
    console.warn("Firestore is not initialized. Returning empty bookings list.");
    // Return an empty array, client will handle "No bookings found"
    return NextResponse.json([], { status: 200 });
  }

  try {
    const bookingsRef = db.collection('bookings');
    const snapshot = await bookingsRef.orderBy('createdAt', 'desc').get();

    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking data from Firebase:", error);
    // Return an error response that the client can potentially handle or display
    return NextResponse.json({ message: 'Error fetching booking data from the database.' }, { status: 500 });
  }
}
