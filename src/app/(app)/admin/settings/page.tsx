import { getSettings } from "@/lib/services/data-service";
import { SettingsForm } from "@/features/settings/settings-form";

export default async function AdminSettingsPage() {
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Configurable scheduling rules used across student, supervisor, and admin views
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
