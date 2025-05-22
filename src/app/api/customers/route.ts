
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
    const snapshot = await customersRef.orderBy('name', 'asc').get(); 

    const customers: Customer[] = snapshot.docs.map(doc => {
      const data = doc.data();
      let createdAtString: string;
      if (data.createdAt instanceof admin.firestore.Timestamp) {
        createdAtString = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtString = data.createdAt;
      } else {
        createdAtString = new Date(0).toISOString(); 
      }

      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || undefined,
        company: data.company || undefined,
        hourlyRate: data.hourlyRate || 0,
        profilePictureUrl: data.profilePictureUrl || `data:image/png;base64,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`,
        gender: data.gender || 'unknown',
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
    const { name, email, phone, company, hourlyRate, gender } = body;

    if (!name || !email || hourlyRate === undefined || isNaN(parseFloat(hourlyRate as string)) || !gender) {
      return NextResponse.json({ message: 'Missing or invalid required fields: name, email, hourlyRate (must be a number), gender' }, { status: 400 });
    }
    
    if (!['male', 'female', 'unknown'].includes(gender)) {
        return NextResponse.json({ message: 'Invalid gender value. Must be one of: male, female, unknown.' }, { status: 400 });
    }

    const customerDataToSave = {
      name,
      email,
      phone: phone || null,
      company: company || null,
      hourlyRate: parseFloat(hourlyRate as string),
      gender,
      profilePictureUrl: `https://placehold.co/100x100.png`, // Default placeholder
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('customers').add(customerDataToSave);
    const newCustomerDoc = await docRef.get();
    const newCustomerData = newCustomerDoc.data();

    if (!newCustomerData) {
      console.error("Failed to retrieve document data for newly created customer:", docRef.id);
      return NextResponse.json({ message: 'Failed to confirm customer creation.' }, { status: 500 });
    }
    
    let createdAtString: string;
    if (newCustomerData.createdAt instanceof admin.firestore.Timestamp) {
        createdAtString = newCustomerData.createdAt.toDate().toISOString();
    } else {
        createdAtString = new Date().toISOString(); 
    }

    const newCustomer: Customer = {
      id: docRef.id,
      name: newCustomerData.name,
      email: newCustomerData.email,
      phone: newCustomerData.phone || undefined,
      company: newCustomerData.company || undefined,
      hourlyRate: newCustomerData.hourlyRate,
      gender: newCustomerData.gender,
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
