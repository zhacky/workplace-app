
import { NextResponse, type NextRequest } from 'next/server';
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

export async function GET(request: NextRequest) {
  if (!db) {
    console.warn("Firestore is not initialized. Returning empty bookings list or 503.");
    const customerId = request.nextUrl.searchParams.get('customerId');
     if (customerId) {
        // If specific customer bookings are requested and DB is not available, it's a server issue.
        return NextResponse.json({ message: 'Service unavailable: Database not configured for bookings.' }, { status: 503 });
    }
    return NextResponse.json([], { status: 200 }); // For general list, return empty if DB not ready.
  }

  try {
    const customerId = request.nextUrl.searchParams.get('customerId');
    let query: admin.firestore.Query = db.collection('bookings');

    if (customerId) {
      query = query.where('customerId', '==', customerId);
      // When filtering by customerId, we remove orderBy('createdAt') here to avoid needing a composite index by default.
      // The client fetching specific customer bookings will handle sorting.
    } else {
      query = query.orderBy('createdAt', 'desc'); // For the general bookings list, keep server-side sorting.
    }
    
    const snapshot = await query.get();

    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure createdAt is serialized to ISO string if it's a Timestamp
      const createdAt = data.createdAt instanceof admin.firestore.Timestamp 
                        ? data.createdAt.toDate().toISOString() 
                        : (typeof data.createdAt === 'string' ? data.createdAt : undefined);
      return {
        id: doc.id,
        ...data,
        createdAt, // Override with serialized version
      };
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking data from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching booking data: ${errorMessage}` }, { status: 500 });
  }
}
