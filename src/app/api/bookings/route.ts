
import { NextResponse, type NextRequest } from 'next/server';
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { parseISO, differenceInMinutes, set, isValid } from 'date-fns';

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

async function getCustomerHourlyRate(customerId: string): Promise<number | null> {
  if (!db) return null;
  try {
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (customerDoc.exists) {
      return customerDoc.data()?.hourlyRate || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching customer hourly rate:", error);
    return null;
  }
}

export async function POST(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized. Cannot create booking.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
  }

  try {
    const bookingData = await request.json();
    console.log("Received booking data for POST:", bookingData);

     // Server-side validation for hours and cost if necessary, or trust client
    // For simplicity, we'll trust client-calculated hours/cost for now but this could be hardened.
    if (typeof bookingData.hours !== 'number' || typeof bookingData.cost !== 'number') {
        return NextResponse.json({ message: 'Invalid hours or cost provided.' }, { status: 400 });
    }
     if (bookingData.hours <=0) {
         return NextResponse.json({ message: 'Booking duration must be positive.' }, { status: 400 });
     }


    const docRef = await db.collection('bookings').add({
      ...bookingData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const newBookingDoc = await docRef.get();
    const newBooking = { id: newBookingDoc.id, ...newBookingDoc.data() };
     // Serialize timestamp for response
    if (newBooking.createdAt instanceof admin.firestore.Timestamp) {
        newBooking.createdAt = newBooking.createdAt.toDate().toISOString();
    }


    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Error saving booking data to Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error saving booking data: ${errorMessage}` }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!db) {
    console.warn("Firestore is not initialized. Returning empty bookings list or 503.");
    const customerId = request.nextUrl.searchParams.get('customerId');
     if (customerId) {
        return NextResponse.json({ message: 'Service unavailable: Database not configured for bookings.' }, { status: 503 });
    }
    return NextResponse.json([], { status: 200 });
  }

  try {
    const customerId = request.nextUrl.searchParams.get('customerId');
    let query: admin.firestore.Query = db.collection('bookings');

    if (customerId) {
      query = query.where('customerId', '==', customerId);
      // Client-side sorting will handle order for customer-specific bookings
    } else {
      query = query.orderBy('createdAt', 'desc');
    }
    
    const snapshot = await query.get();

    const bookings = snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt instanceof admin.firestore.Timestamp 
                        ? data.createdAt.toDate().toISOString() 
                        : (typeof data.createdAt === 'string' ? data.createdAt : undefined);
      return {
        id: doc.id,
        ...data,
        createdAt,
      };
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching booking data from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching booking data: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized. Cannot update booking.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
  }

  try {
    const bookingData = await request.json();
    const { id, ...dataToUpdate } = bookingData;

    if (!id) {
      return NextResponse.json({ message: 'Booking ID is required for an update.' }, { status: 400 });
    }

    // Recalculate hours and cost on the server based on potentially changed times/customer
    // This ensures data integrity if client-side calculation is bypassed or incorrect.
    const hourlyRate = await getCustomerHourlyRate(dataToUpdate.customerId);
    if (hourlyRate === null) {
      return NextResponse.json({ message: 'Could not find customer to determine hourly rate for update.' }, { status: 400 });
    }

    const bookingDateObj = parseISO(dataToUpdate.bookingDate); // bookingDate is "yyyy-MM-dd"
    const [startHour, startMinute] = dataToUpdate.startTime.split(':').map(Number);
    const [endHour, endMinute] = dataToUpdate.endTime.split(':').map(Number);

    const startDate = set(bookingDateObj, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
    const endDate = set(bookingDateObj, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

    if (!isValid(startDate) || !isValid(endDate) || endDate <= startDate) {
      return NextResponse.json({ message: 'Invalid date or time range for update.' }, { status: 400 });
    }

    const totalMinutes = differenceInMinutes(endDate, startDate);
    const hours = totalMinutes / 60;
    const cost = hours * hourlyRate;

    dataToUpdate.hours = hours;
    dataToUpdate.cost = cost;
    dataToUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();


    const docRef = db.collection('bookings').doc(id as string);
    await docRef.update(dataToUpdate);

    const updatedBookingDoc = await docRef.get();
     if (!updatedBookingDoc.exists) {
        return NextResponse.json({ message: 'Booking not found after update.' }, { status: 404 });
    }
    const updatedBooking = { id: updatedBookingDoc.id, ...updatedBookingDoc.data() };
    // Serialize timestamps for response
    if (updatedBooking.createdAt instanceof admin.firestore.Timestamp) {
        updatedBooking.createdAt = updatedBooking.createdAt.toDate().toISOString();
    }
    if (updatedBooking.updatedAt instanceof admin.firestore.Timestamp) {
        updatedBooking.updatedAt = updatedBooking.updatedAt.toDate().toISOString();
    }


    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error("Error updating booking in Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error updating booking: ${errorMessage}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!db) {
    console.warn("Firestore is not initialized. Cannot delete booking.");
    return NextResponse.json({ message: 'Service unavailable: Database not configured.' }, { status: 503 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Booking ID is required for deletion.' }, { status: 400 });
    }

    await db.collection('bookings').doc(id as string).delete();
    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Error deleting booking from Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error deleting booking: ${errorMessage}` }, { status: 500 });
  }
}
