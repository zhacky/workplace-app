
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice } from '@/lib/types';
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
      console.error("Failed to initialize Firebase Admin SDK for invoices:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance for invoices:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) " +
    "are not fully set. Firebase features in /api/invoices will be disabled."
  );
}

const serializeInvoice = (doc: admin.firestore.DocumentSnapshot): Invoice => {
    const data = doc.data()!;
    
    const formatDateField = (field: any): string => {
        if (field instanceof admin.firestore.Timestamp) {
            return field.toDate().toISOString();
        } else if (typeof field === 'string') {
            return field;
        }
        return new Date(0).toISOString(); // Fallback for missing or malformed dates
    };

    return {
      id: doc.id,
      bookingId: data.bookingId || '',
      customerId: data.customerId || '',
      customerName: data.customerName || 'N/A', // This might be denormalized or fetched separately
      invoiceNumber: data.invoiceNumber || '',
      issueDate: formatDateField(data.issueDate),
      dueDate: formatDateField(data.dueDate),
      amount: data.amount || 0,
      status: data.status || 'draft',
      items: data.items || [],
      createdAt: formatDateField(data.createdAt),
    };
};

export async function GET(request: NextRequest) {
  if (!db) {
    console.warn("Firestore is not initialized for invoices. Returning empty list or 404.");
    const invoiceId = request.nextUrl.searchParams.get('id');
    if (invoiceId) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured for invoices.' }, { status: 503 });
    }
    return NextResponse.json([], { status: 200 });
  }

  try {
    const invoiceId = request.nextUrl.searchParams.get('id');

    if (invoiceId) {
      const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
      if (!invoiceDoc.exists) {
        return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
      }
      return NextResponse.json(serializeInvoice(invoiceDoc), { status: 200 });
    } else {
      const invoicesRef = db.collection('invoices');
      // Consider adding ordering, e.g., .orderBy('issueDate', 'desc')
      const snapshot = await invoicesRef.orderBy('issueDate', 'desc').get(); 
      const invoices: Invoice[] = snapshot.docs.map(serializeInvoice);
      return NextResponse.json(invoices, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching invoice data from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching invoice data: ${errorMessage}` }, { status: 500 });
  }
}

// TODO: Add POST, PUT, DELETE handlers for invoices if needed in the future
// For now, invoices are expected to be generated from bookings or managed elsewhere.
// If status updates are needed, a PUT handler would be appropriate here.
// Example of a simple PUT for status (not fully implemented as per current request scope):
/*
export async function PUT(request: NextRequest) {
    if (!db) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
    }
    try {
        const { id, status } = await request.json();
        if (!id || !status) {
            return NextResponse.json({ message: 'Invoice ID and status are required.' }, { status: 400 });
        }
        await db.collection('invoices').doc(id).update({ status });
        return NextResponse.json({ message: 'Invoice status updated.' }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: `Error updating invoice: ${errorMessage}` }, { status: 500 });
    }
}
*/

