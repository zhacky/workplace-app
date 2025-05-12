import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    // Your Firebase project credentials
    // Use environment variables for security
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    const bookingData = await request.json();
    console.log("Received booking data:", bookingData);

    // Add booking data to Firestore
    const docRef = await db.collection('bookings').add({
      ...bookingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), // Add a server timestamp
    });

    return NextResponse.json({ message: 'Booking received successfully!', bookingId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error saving booking data to Firebase:", error);
    return NextResponse.json({ message: 'Error saving booking data.' }, { status: 500 });
  }
}