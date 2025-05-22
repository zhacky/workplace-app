
// src/app/(app)/settings/page.tsx
import { SettingsForm } from "./components/settings-form";
import { ChangePasswordForm } from "./components/change-password-form"; // Import the new component

export default function SettingsPage() {
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
      <SettingsForm />
      <ChangePasswordForm /> {/* Add the ChangePasswordForm here */}
    </div>
  );
}
