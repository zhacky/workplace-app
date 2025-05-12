import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const bookingData = await request.json();
    console.log("Received booking data:", bookingData);

    // In a real application, you would save this data to your database
    // For now, we'll just return a success message

    return NextResponse.json({ message: 'Booking received successfully!' }, { status: 200 });
  } catch (error) {
    console.error("Error receiving booking data:", error);
    return NextResponse.json({ message: 'Error receiving booking data.' }, { status: 500 });
  }
}