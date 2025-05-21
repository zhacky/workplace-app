// src/app/api/customers/route.ts
import { NextResponse } from 'next/server';
import type { Customer } from '@/lib/types';

// In-memory store for customers for testing purposes
let customersData: Customer[] = [];

export async function GET() {
  return NextResponse.json(customersData);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, hourlyRate } = body;

    if (!name || !email || hourlyRate === undefined) {
      return NextResponse.json({ message: 'Missing required fields: name, email, hourlyRate' }, { status: 400 });
    }

    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone: phone || undefined,
      company: company || undefined,
      hourlyRate: parseFloat(hourlyRate as string), // Ensure hourlyRate is a number
      profilePictureUrl: `https://placehold.co/100x100.png`, // Generic placeholder
      createdAt: new Date().toISOString(),
    };

    customersData.push(newCustomer);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error("Error adding customer:", error);
    return NextResponse.json({ message: 'Error adding customer' }, { status: 500 });
  }
}
