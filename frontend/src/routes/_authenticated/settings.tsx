import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GeneralTab } from "@/components/settings/general-tab";
import { useUpdateSettings } from "@/lib/queries/settings";
import { useTheme } from "@/components/layout/theme-provider";

const searchSchema = z.object({
  tab: z.enum(["general", "data", "integrations", "about"]).catch("general"),
});

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: searchSchema,
  component: SettingsPage,
});

function SettingsPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const updateSettings = useUpdateSettings();
  const { setTheme } = useTheme();

  const handleTabChange = (value: string) => {
    navigate({
      to: "/settings",
      search: { tab: value as z.infer<typeof searchSchema>["tab"] },
      replace: true,
    });
  };

  const handleResetToDefaults = () => {
    setTheme("dark");
    updateSettings.mutate({
      theme: "dark",
      language: "en",
      calendar_type: "gregorian",
      date_format: "MM/DD/YYYY",
      time_format: "12h",
      compact_mode: false,
      show_avatars: true,
      notify_backup: true,
      notify_status: true,
      notify_deadline: true,
      notify_interview: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and configurations
          </p>
        </div>
        <Button variant="outline" onClick={handleResetToDefaults}>
          Reset to Defaults
        </Button>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>

        <TabsContent value="data">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="about">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
