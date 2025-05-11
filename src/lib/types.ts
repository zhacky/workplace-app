
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  hourlyRate: number; // Agreed hourly rate
  profilePictureUrl?: string;
  createdAt: string; // ISO date string
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  hours: number;
  totalAmount: number;
  notes?: string;
  createdAt: string; // ISO date string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string; // Denormalized
  invoiceNumber: string;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: InvoiceStatus;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string; // ISO date string
}
