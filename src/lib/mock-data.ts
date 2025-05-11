import type { Customer, Booking, Invoice, InvoiceStatus } from './types';

export const mockCustomers: Customer[] = [
  {
    id: 'cust_1',
    name: 'Alice Wonderland',
    email: 'alice@example.com',
    phone: '555-0101',
    company: 'Wonderland Inc.',
    hourlyRate: 30,
    profilePictureUrl: 'https://picsum.photos/seed/alice/100/100',
    createdAt: new Date(2023, 0, 15).toISOString(),
  },
  {
    id: 'cust_2',
    name: 'Bob The Builder',
    email: 'bob@example.com',
    phone: '555-0102',
    company: 'Builders Co.',
    hourlyRate: 25,
    profilePictureUrl: 'https://picsum.photos/seed/bob/100/100',
    createdAt: new Date(2023, 1, 20).toISOString(),
  },
  {
    id: 'cust_3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    hourlyRate: 28,
    profilePictureUrl: 'https://picsum.photos/seed/charlie/100/100',
    createdAt: new Date(2023, 2, 10).toISOString(),
  },
  {
    id: 'cust_4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    phone: '555-0104',
    company: 'Themyscira Corp.',
    hourlyRate: 35,
    createdAt: new Date(2023, 3, 5).toISOString(),
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'book_1',
    customerId: 'cust_1',
    customerName: 'Alice Wonderland',
    startTime: new Date(2024, 5, 1, 9, 0, 0).toISOString(),
    endTime: new Date(2024, 5, 1, 12, 0, 0).toISOString(),
    hours: 3,
    totalAmount: 90, // 3 * 30
    notes: 'Morning session, quiet room preferred.',
    createdAt: new Date(2024, 4, 28).toISOString(),
  },
  {
    id: 'book_2',
    customerId: 'cust_2',
    customerName: 'Bob The Builder',
    startTime: new Date(2024, 5, 2, 14, 0, 0).toISOString(),
    endTime: new Date(2024, 5, 2, 18, 0, 0).toISOString(),
    hours: 4,
    totalAmount: 100, // 4 * 25
    createdAt: new Date(2024, 4, 29).toISOString(),
  },
  {
    id: 'book_3',
    customerId: 'cust_1',
    customerName: 'Alice Wonderland',
    startTime: new Date(2024, 5, 3, 10, 0, 0).toISOString(),
    endTime: new Date(2024, 5, 3, 17, 0, 0).toISOString(),
    hours: 7,
    totalAmount: 210, // 7 * 30
    createdAt: new Date(2024, 5, 1).toISOString(),
  },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    bookingId: 'book_1',
    customerId: 'cust_1',
    customerName: 'Alice Wonderland',
    invoiceNumber: 'INV-2024-001',
    issueDate: new Date(2024, 5, 1).toISOString(),
    dueDate: new Date(2024, 5, 15).toISOString(),
    amount: 90,
    status: 'paid' as InvoiceStatus,
    items: [{ description: 'Co-working Space Rental (3 hours)', quantity: 3, unitPrice: 30, total: 90 }],
    createdAt: new Date(2024, 5, 1).toISOString(),
  },
  {
    id: 'inv_2',
    bookingId: 'book_2',
    customerId: 'cust_2',
    customerName: 'Bob The Builder',
    invoiceNumber: 'INV-2024-002',
    issueDate: new Date(2024, 5, 2).toISOString(),
    dueDate: new Date(2024, 5, 16).toISOString(),
    amount: 100,
    status: 'sent' as InvoiceStatus,
    items: [{ description: 'Co-working Space Rental (4 hours)', quantity: 4, unitPrice: 25, total: 100 }],
    createdAt: new Date(2024, 5, 2).toISOString(),
  },
  {
    id: 'inv_3',
    bookingId: 'book_3',
    customerId: 'cust_1',
    customerName: 'Alice Wonderland',
    invoiceNumber: 'INV-2024-003',
    issueDate: new Date(2024, 5, 3).toISOString(),
    dueDate: new Date(2024, 5, 17).toISOString(),
    amount: 210,
    status: 'draft' as InvoiceStatus,
    items: [{ description: 'Co-working Space Rental (7 hours)', quantity: 7, unitPrice: 30, total: 210 }],
    createdAt: new Date(2024, 5, 3).toISOString(),
  },
];
