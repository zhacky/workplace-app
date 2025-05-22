
// src/app/api/customers/route.ts
import { NextResponse, type NextRequest } from 'next/server';
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

const serializeCustomer = (doc: admin.firestore.DocumentSnapshot): Customer => {
    const data = doc.data()!;
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
      profilePictureUrl: data.profilePictureUrl || `https://placehold.co/100x100.png`,
      gender: data.gender || 'unknown',
      createdAt: createdAtString,
    };
};

export async function GET(request: NextRequest) {
  if (!db) {
    console.warn("Firestore is not initialized for customers. Returning empty list or 404.");
    const customerId = request.nextUrl.searchParams.get('id');
    if (customerId) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured for customers.' }, { status: 503 });
    }
    return NextResponse.json([], { status: 200 });
  }

  try {
    const customerId = request.nextUrl.searchParams.get('id');

    if (customerId) {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      if (!customerDoc.exists) {
        return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
      }
      return NextResponse.json(serializeCustomer(customerDoc), { status: 200 });
    } else {
      const customersRef = db.collection('customers');
      const snapshot = await customersRef.orderBy('name', 'asc').get(); 
      const customers: Customer[] = snapshot.docs.map(serializeCustomer);
      return NextResponse.json(customers, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching customer data from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching customer data: ${errorMessage}` }, { status: 500 });
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
    
    if (!newCustomerDoc.exists) {
      console.error("Failed to retrieve document data for newly created customer:", docRef.id);
      return NextResponse.json({ message: 'Failed to confirm customer creation.' }, { status: 500 });
    }
    
    return NextResponse.json(serializeCustomer(newCustomerDoc), { status: 201 });
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

    if (!updatedCustomerDoc.exists) {
      return NextResponse.json({ message: 'Failed to retrieve updated customer data (customer might have been deleted).' }, { status: 404 });
    }

    return NextResponse.json(serializeCustomer(updatedCustomerDoc), { status: 200 });
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

