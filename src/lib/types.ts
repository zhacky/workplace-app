
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  hourlyRate: number; // Agreed hourly rate
  profilePictureUrl?: string;
  gender: 'male' | 'female' | 'unknown';
  createdAt: string; // ISO date string
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  startTime: string; // ISO date string
  endTime: string; // ISO date string
  hours: number;
  totalAmount: number; // Note: API and other parts use 'cost'. This might need alignment.
  notes?: string;
  createdAt: string; // ISO date string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
export interface Invoice {
  id: string;
  bookingId?: string; // Invoice might not always be tied to a booking
  customerId: string;
  customerName: string; // Denormalized
  invoiceNumber: string; // Should be present after creation
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  amount: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
}

