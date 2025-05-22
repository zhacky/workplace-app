
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
        // Fallback for older data or if createdAt is missing
        createdAtString = new Date(0).toISOString(); 
      }

      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || undefined,
        company: data.company || undefined,
        hourlyRate: data.hourlyRate || 0,
        profilePictureUrl: data.profilePictureUrl || `https://placehold.co/100x100.png`,
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

    const customerDataToSave: Omit<Customer, 'id' | 'createdAt' | 'profilePictureUrl'> & { createdAt: admin.firestore.FieldValue, profilePictureUrl?: string } = {
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      hourlyRate: parseFloat(hourlyRate as string),
      gender,
      profilePictureUrl: `https://placehold.co/100x100.png`, // Default placeholder for new customers
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
        // Should not happen for new docs with serverTimestamp, but as a fallback
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
  } catch (error) {
    console.error("Error adding customer to Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error adding customer: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized for customers. Cannot update customer.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured for customers.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, name, email, phone, company, hourlyRate, gender } = body;

    if (!id) {
      return NextResponse.json({ message: 'Customer ID is required for an update.' }, { status: 400 });
    }
    if (!name || !email || hourlyRate === undefined || isNaN(parseFloat(hourlyRate as string)) || !gender) {
      return NextResponse.json({ message: 'Missing or invalid required fields: name, email, hourlyRate, gender' }, { status: 400 });
    }
    if (!['male', 'female', 'unknown'].includes(gender)) {
        return NextResponse.json({ message: 'Invalid gender value.' }, { status: 400 });
    }

    // Construct object with only the fields to be updated
    // We don't update createdAt or profilePictureUrl via this form
    const customerDataToUpdate: Partial<Omit<Customer, 'id' | 'createdAt' | 'profilePictureUrl'>> = {
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      hourlyRate: parseFloat(hourlyRate as string),
      gender,
    };

    const docRef = db.collection('customers').doc(id as string);
    await docRef.update(customerDataToUpdate);

    const updatedCustomerDoc = await docRef.get();
    const updatedCustomerData = updatedCustomerDoc.data();

    if (!updatedCustomerData) {
      return NextResponse.json({ message: 'Failed to retrieve updated customer data.' }, { status: 500 });
    }

    let createdAtString: string;
    if (updatedCustomerData.createdAt instanceof admin.firestore.Timestamp) {
        createdAtString = updatedCustomerData.createdAt.toDate().toISOString();
    } else if (typeof updatedCustomerData.createdAt === 'string') {
        createdAtString = updatedCustomerData.createdAt;
    } else {
        createdAtString = new Date(0).toISOString();
    }

    const updatedCustomer: Customer = {
      id: docRef.id,
      name: updatedCustomerData.name,
      email: updatedCustomerData.email,
      phone: updatedCustomerData.phone || undefined,
      company: updatedCustomerData.company || undefined,
      hourlyRate: updatedCustomerData.hourlyRate,
      gender: updatedCustomerData.gender,
      profilePictureUrl: updatedCustomerData.profilePictureUrl, // Keep existing
      createdAt: createdAtString,
    };

    return NextResponse.json(updatedCustomer, { status: 200 });
  } catch (error) {
    console.error("Error updating customer in Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error updating customer: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized for customers. Cannot delete customer.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured for customers.' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: 'Customer ID is required for deletion.' }, { status: 400 });
    }

    await db.collection('customers').doc(id as string).delete();
    return NextResponse.json({ message: 'Customer deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error deleting customer: ${errorMessage}` }, { status: 500 });
  }
}
