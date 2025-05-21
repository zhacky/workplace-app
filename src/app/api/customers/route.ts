// src/app/api/customers/route.ts
import { NextResponse } from 'next/server';
import type { Customer } from '@/lib/types';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Firebase Admin SDK Initialization
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
      console.error("Failed to initialize Firebase Admin SDK for customers:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance for customers:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) " +
    "are not fully set. Firebase features in /api/customers will be disabled."
  );
}

export async function GET() {
  if (!db) {
    console.warn("Firestore is not initialized for customers. Returning empty list.");
    return NextResponse.json([], { status: 200 });
  }

  try {
    const customersRef = db.collection('customers');
    // Order by name for consistent listing, can be changed to createdAt if preferred
    const snapshot = await customersRef.orderBy('name', 'asc').get(); 

    const customers: Customer[] = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure createdAt is a string. Firestore Timestamps are serialized to ISO strings by NextResponse.json,
      // but explicit conversion here handles cases where it might already be a string or needs default.
      let createdAtString: string;
      if (data.createdAt instanceof admin.firestore.Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtString = data.createdAt;
      } else {
        // Fallback if createdAt is missing or not a Timestamp/string
        createdAtString = new Date(0).toISOString(); // Or handle as an error
      }

      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || undefined,
        company: data.company || undefined,
        hourlyRate: data.hourlyRate || 0,
        profilePictureUrl: data.profilePictureUrl || `https://placehold.co/100x100.png`,
        createdAt: createdAtString,
      };
    });

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error("Error fetching customer data from Firebase:", error);
    return NextResponse.json({ message: 'Error fetching customer data from the database.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized for customers. Cannot create customer.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured for customers.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, company, hourlyRate } = body;

    if (!name || !email || hourlyRate === undefined || isNaN(parseFloat(hourlyRate as string))) {
      return NextResponse.json({ message: 'Missing or invalid required fields: name, email, hourlyRate (must be a number)' }, { status: 400 });
    }

    const customerDataToSave = {
      name,
      email,
      phone: phone || null, // Store null if undefined/empty for better querying in Firestore
      company: company || null, // Store null if undefined/empty
      hourlyRate: parseFloat(hourlyRate as string),
      profilePictureUrl: `https://placehold.co/100x100.png`, // Default placeholder
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('customers').add(customerDataToSave);

    // Fetch the newly created customer to return it with the Firestore-generated ID and resolved timestamp
    const newCustomerDoc = await docRef.get();
    const newCustomerData = newCustomerDoc.data();

    if (!newCustomerData) {
      console.error("Failed to retrieve document data for newly created customer:", docRef.id);
      return NextResponse.json({ message: 'Failed to confirm customer creation.' }, { status: 500 });
    }
    
    // Ensure createdAt is correctly typed and converted for the response
    let createdAtString: string;
    if (newCustomerData.createdAt instanceof admin.firestore.Timestamp) {
        createdAtString = newCustomerData.createdAt.toDate().toISOString();
    } else {
        // This case is unlikely for a serverTimestamp but added for safety
        createdAtString = new Date().toISOString(); 
    }

    const newCustomer: Customer = {
      id: docRef.id,
      name: newCustomerData.name,
      email: newCustomerData.email,
      phone: newCustomerData.phone || undefined, // Convert null back to undefined for client if preferred
      company: newCustomerData.company || undefined, // Convert null back to undefined for client
      hourlyRate: newCustomerData.hourlyRate,
      profilePictureUrl: newCustomerData.profilePictureUrl,
      createdAt: createdAtString,
    };

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error)
  {
    console.error("Error adding customer to Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error adding customer: ${errorMessage}` }, { status: 500 });
  }
}
