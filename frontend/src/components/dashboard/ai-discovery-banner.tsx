import { Link } from "@tanstack/react-router";
import { SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings, useUpdateSettings } from "@/lib/queries/settings";

export function AiDiscoveryBanner() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading || !settings) return null;
  if (settings.ai_features_enabled) return null;
  if (settings.ai_setup_banner_dismissed) return null;

  return (
    <Card className="relative border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="rounded-md border border-primary/20 bg-primary/10 p-2">
          <SparklesIcon className="size-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base">AI-Powered Company Research</CardTitle>
          <CardDescription>
            Get AI-generated insights about companies you're applying to.{" "}
            <Link
              to="/settings"
              search={{ tab: "ai" }}
              className="font-medium text-primary hover:underline"
            >
              Set up AI features
            </Link>
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Dismiss"
          onClick={() => updateSettings.mutate({ ai_setup_banner_dismissed: true })}
        >
          <XIcon className="size-4" />
        </Button>
      </CardHeader>
    </Card>
  );
}
