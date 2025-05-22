
// src/app/api/invoices/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Invoice, InvoiceItem } from '@/lib/types';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { format } from 'date-fns';

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
            return field; // Assuming it's already an ISO string
        }
        // Attempt to parse if it's a different date representation or fallback
        try {
            if (field && typeof field.toDate === 'function') { // handle cases where it might be a non-admin Timestamp
                 return field.toDate().toISOString();
            }
            if (field) return new Date(field).toISOString();
        } catch (e) {
             console.warn("Error parsing date field during serialization:", field, e);
        }
        return new Date(0).toISOString(); // Fallback for missing or malformed dates
    };

    return {
      id: doc.id,
      bookingId: data.bookingId || undefined,
      customerId: data.customerId || '',
      customerName: data.customerName || 'N/A', 
      invoiceNumber: data.invoiceNumber || '',
      issueDate: formatDateField(data.issueDate),
      dueDate: formatDateField(data.dueDate),
      amount: data.amount || 0,
      status: data.status || 'draft',
      items: data.items || [],
      createdAt: formatDateField(data.createdAt),
      updatedAt: data.updatedAt ? formatDateField(data.updatedAt) : undefined,
    };
};

async function getCustomerName(customerId: string): Promise<string> {
  if (!db) return 'N/A';
  try {
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (customerDoc.exists) {
      return customerDoc.data()?.name || 'N/A';
    }
    return 'Customer Not Found';
  } catch (error) {
    console.error("Error fetching customer name:", error);
    return 'Error Fetching Name';
  }
}

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

export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { customerId, issueDate, dueDate, amount, status, items } = body;

    if (!customerId || !issueDate || !dueDate || amount === undefined || !status) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    const customerName = await getCustomerName(customerId);

    // Generate invoice number (e.g., INV-YYYYMMDD-timestamp)
    const now = new Date();
    const invoiceNumber = `INV-${format(now, 'yyyyMMdd')}-${now.getTime().toString().slice(-4)}`;
    
    const defaultItems: InvoiceItem[] = items && items.length > 0 ? items : [
      { description: "Services Rendered / Product Sale", quantity: 1, unitPrice: Number(amount), total: Number(amount) }
    ];

    const newInvoiceData = {
      customerId,
      customerName, // Denormalized
      invoiceNumber,
      issueDate: new Date(issueDate), // Store as Firestore Timestamp
      dueDate: new Date(dueDate),     // Store as Firestore Timestamp
      amount: Number(amount),
      status,
      items: defaultItems,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('invoices').add(newInvoiceData);
    const newInvoiceDoc = await docRef.get();
    return NextResponse.json(serializeInvoice(newInvoiceDoc), { status: 201 });

  } catch (error) {
    console.error("Error creating invoice:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error creating invoice: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    if (!db) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
    }
    try {
        const body = await request.json();
        const { id, customerId, issueDate, dueDate, amount, status, items } = body;

        if (!id) {
            return NextResponse.json({ message: 'Invoice ID is required for update.' }, { status: 400 });
        }

        const dataToUpdate: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        if (customerId) {
            dataToUpdate.customerId = customerId;
            dataToUpdate.customerName = await getCustomerName(customerId);
        }
        if (issueDate) dataToUpdate.issueDate = new Date(issueDate);
        if (dueDate) dataToUpdate.dueDate = new Date(dueDate);
        if (status) dataToUpdate.status = status;
        
        if (amount !== undefined) {
            dataToUpdate.amount = Number(amount);
            // If amount changes, update default items or use provided items
            dataToUpdate.items = items && items.length > 0 ? items : [
              { description: "Services Rendered / Product Sale", quantity: 1, unitPrice: Number(amount), total: Number(amount) }
            ];
        } else if (items && items.length > 0) {
            dataToUpdate.items = items;
             // Recalculate amount if items are provided but amount is not
            dataToUpdate.amount = items.reduce((sum: number, item: InvoiceItem) => sum + item.total, 0);
        }


        const docRef = db.collection('invoices').doc(id as string);
        await docRef.update(dataToUpdate);
        
        const updatedInvoiceDoc = await docRef.get();
        if (!updatedInvoiceDoc.exists) {
            return NextResponse.json({ message: 'Invoice not found after update.' }, { status: 404 });
        }
        return NextResponse.json(serializeInvoice(updatedInvoiceDoc), { status: 200 });

    } catch (error) {
        console.error("Error updating invoice:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: `Error updating invoice: ${errorMessage}` }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!db) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
    }
    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ message: 'Invoice ID is required for deletion.' }, { status: 400 });
        }
        await db.collection('invoices').doc(id as string).delete();
        return NextResponse.json({ message: 'Invoice deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return NextResponse.json({ message: `Error deleting invoice: ${errorMessage}` }, { status: 500 });
    }
}
