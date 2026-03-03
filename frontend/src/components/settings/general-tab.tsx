import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/lib/queries/settings";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function GeneralTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    updateSettings.mutate({ theme: newTheme });
  };

  const handleSelectChange = (field: string, value: string) => {
    updateSettings.mutate({ [field]: value });
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    updateSettings.mutate({ [field]: checked });
  };

  return (
    <div className="space-y-8">
      {/* Theme & Display Section */}
      <div>
        <h3 className="text-lg font-semibold">Theme & Display</h3>
        <p className="text-sm text-muted-foreground">
          Customize the appearance of your application
        </p>
        <Separator className="my-4" />

        <div className="space-y-1">
          <SettingRow label="Theme" description="Select your preferred color scheme">
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("light")}
              >
                <Sun className="mr-1 size-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange("dark")}
              >
                <Moon className="mr-1 size-4" />
                Dark
              </Button>
            </div>
          </SettingRow>

          <SettingRow label="Language" description="Choose your preferred language">
            <Select
              value={settings?.language ?? "en"}
              onValueChange={(value) => handleSelectChange("language", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Calendar Type" description="Select your calendar system">
            <Select
              value={settings?.calendar_type ?? "gregorian"}
              onValueChange={(value) => handleSelectChange("calendar_type", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gregorian">Gregorian</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Date Format" description="Choose how dates are displayed">
            <Select
              value={settings?.date_format ?? "MM/DD/YYYY"}
              onValueChange={(value) => handleSelectChange("date_format", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label="Time Format" description="Choose how times are displayed">
            <Select
              value={settings?.time_format ?? "12h"}
              onValueChange={(value) => handleSelectChange("time_format", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (3:00 PM)</SelectItem>
                <SelectItem value="24h">24-hour (15:00)</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            label="Compact Mode"
            description="Reduce spacing and padding throughout the interface"
          >
            <Switch
              checked={settings?.compact_mode ?? false}
              onCheckedChange={(checked) => handleSwitchChange("compact_mode", checked as boolean)}
            />
          </SettingRow>

          <SettingRow label="Show Avatars" description="Display user and company avatars in lists">
            <Switch
              checked={settings?.show_avatars ?? true}
              onCheckedChange={(checked) => handleSwitchChange("show_avatars", checked as boolean)}
            />
          </SettingRow>
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Manage when and how you receive notifications
        </p>
        <Separator className="my-4" />

        <div className="space-y-1">
          <SettingRow
            label="Backup Reminders"
            description="Get reminded to back up your data regularly"
          >
            <Switch
              checked={settings?.notify_backup ?? true}
              onCheckedChange={(checked) => handleSwitchChange("notify_backup", checked as boolean)}
            />
          </SettingRow>

          <SettingRow label="Status Changes" description="Notify when application statuses change">
            <Switch
              checked={settings?.notify_status ?? true}
              onCheckedChange={(checked) => handleSwitchChange("notify_status", checked as boolean)}
            />
          </SettingRow>

          <SettingRow
            label="Deadline Alerts"
            description="Alert before upcoming application deadlines"
          >
            <Switch
              checked={settings?.notify_deadline ?? true}
              onCheckedChange={(checked) =>
                handleSwitchChange("notify_deadline", checked as boolean)
              }
            />
          </SettingRow>

          <SettingRow
            label="Interview Reminders"
            description="Get reminded about upcoming interviews"
          >
            <Switch
              checked={settings?.notify_interview ?? true}
              onCheckedChange={(checked) =>
                handleSwitchChange("notify_interview", checked as boolean)
              }
            />
          </SettingRow>

          <SettingRow
            label="Email Notifications"
            description="Receive email reminders for upcoming interviews"
          >
            <Switch
              checked={settings?.email_reminders ?? true}
              onCheckedChange={(checked) =>
                handleSwitchChange("email_reminders", checked as boolean)
              }
            />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
