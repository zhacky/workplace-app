
// src/lib/customer-api.ts

import { Invoice } from "./types"; // Assuming Invoice type is relevant

export async function fetchCustomers() {
  try {
    const response = await fetch('/api/customers');
    if (!response.ok) {
      throw new Error(`Error fetching customers: ${response.statusText}`);
    }
    const customers: Invoice['customer'][] = await response.json(); // Assuming the structure
    return customers;
  } catch (error) {
    console.error("Could not fetch customers:", error);
    return []; // Return an empty array or handle the error as appropriate
  }
}