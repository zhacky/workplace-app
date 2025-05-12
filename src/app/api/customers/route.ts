// src/app/api/customers/route.ts
import { NextResponse } from 'next/server';
import { mockCustomers } from '@/lib/mock-data'; // Assuming mock data is in this location

export async function GET() {
  return NextResponse.json(mockCustomers);
}