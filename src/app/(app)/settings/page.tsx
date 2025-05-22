
// src/app/(app)/settings/page.tsx
"use client"; // Ensure this is a client component to use hooks

import { SettingsForm } from "./components/settings-form";
import { ChangePasswordForm } from "./components/change-password-form";
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

export default function SettingsPage() {
  const { isSuperadmin } = useAuth(); // Get superadmin status

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Application Settings
        </h1>
        <p className="text-muted-foreground">
          Manage company details, your account password, and other application-wide settings.
        </p>
      </div>
      {isSuperadmin && <SettingsForm />} {/* Conditionally render SettingsForm */}
      <ChangePasswordForm />
    </div>
  );
}
