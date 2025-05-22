# Workplace Studio: Co-working Space Management

Welcome to Workplace Studio! This application is designed to help manage the day-to-day operations of "The Workplace," a co-working space. It provides tools for staff to handle customer information, bookings, invoicing, and gain insights into the business's performance.

## What is Workplace Studio?

Imagine a digital assistant for a co-working space. Workplace Studio helps keep track of:
*   **Who your customers are:** Their details, contact information, and history with the space.
*   **When they book time:** Managing hourly bookings for desks or rooms.
*   **How much they owe:** Creating and tracking invoices for services.
*   **How the business is doing:** Showing key numbers and trends at a glance.
*   **What customers think:** Analyzing feedback to improve services.

It's built to be user-friendly, allowing staff to efficiently manage essential tasks.

## Key Features

Workplace Studio comes packed with features to streamline co-working space management:

*   **Secure User Access:**
    *   **Login & Signup:** Staff can create accounts and log in securely.
    *   **Account Review:** New user accounts require approval from a superadmin before they can access the application, ensuring controlled access.
    *   **Superadmin Role:** A special administrative role with full access, including the ability to manage company-wide settings.
    *   **Change Password:** Users can securely update their own account passwords.

*   **Customer Management:**
    *   **Add, Edit, & Delete Customers:** Easily manage a database of all clients.
    *   **Customer Profiles:** View detailed information for each customer, including their contact details, company (if any), gender, hourly rate, and booking history.
    *   **Avatar Placeholders:** Displays gender-specific default avatars if a custom one isn't uploaded.

*   **Booking Management:**
    *   **Create Hourly Bookings:** Schedule new bookings for customers, specifying date, start time, and end time. The system automatically calculates the duration and estimated cost.
    *   **Edit & Delete Bookings:** Modify or remove existing bookings as needed.
    *   **Bookings Table:** A clear overview of all bookings, with visual cues for past, ongoing, and future appointments.

*   **Invoice Management:**
    *   **Create Invoices:** Generate invoices for customers, including details like issue date, due date, and total amount.
    *   **Edit & Delete Invoices:** Update or remove invoices.
    *   **Track Invoice Status:** Mark invoices as 'draft', 'sent', 'paid', 'overdue', or 'cancelled'.
    *   **View Invoice Details:** See a comprehensive view of each invoice, including company details and payment instructions.
    *   **Print & Download (Simulated):** Options to print invoices or view them in a new tab for PDF download.
    *   **Process Payments:** Mark invoices as 'paid'.

*   **Dashboard & Reporting:**
    *   **At-a-Glance KPIs:** The dashboard shows key metrics like active customers, today's bookings, pending invoices, and current monthly revenue.
    *   **Performance Reports:** The reports page provides deeper insights, including total revenue, total bookings, current month's occupancy rate, and charts for monthly revenue and bookings over the past six months.

*   **AI-Powered Customer Satisfaction Analysis:**
    *   Input customer feedback (e.g., from surveys or comments).
    *   The system uses Artificial Intelligence (Genkit with Google's Gemini model) to analyze the feedback for:
        *   Overall sentiment (positive, negative, neutral).
        *   Key trends mentioned by customers.
        *   Actionable suggestions for improvement.

*   **Application Settings:**
    *   **Company Details (Superadmin Only):** Superadmins can update company information (name, address, contact, payment instructions) that appears on invoices.
    *   **Change Password (All Users):** All logged-in users can change their own account password.

## Technology Used (For the Curious!)

For those interested in the technical side, Workplace Studio is built with:
*   **Next.js & React:** For a modern, fast, and interactive user interface.
*   **ShadCN UI & Tailwind CSS:** For a beautiful and consistent design.
*   **Firebase:** For secure user authentication and a reliable database (Firestore) to store all application data.
*   **Genkit (with Google's Gemini model):** To power the AI-driven customer satisfaction analysis.

## Getting Started (For Developers)

This project is a Next.js application.
1.  Ensure you have Node.js and npm/yarn installed.
2.  Set up a Firebase project and enable Authentication (Email/Password) and Firestore.
3.  Configure your environment variables in a `.env` file (see `.env.example` or provided instructions for required Firebase credentials for both client-side SDK and server-side Admin SDK).
4.  Install dependencies: `npm install` or `yarn install`.
5.  Run the development server: `npm run dev` or `yarn dev`.

The application will typically be available at `http://localhost:9002`.
```