import { BotIcon, EyeIcon, EyeOffIcon, KeyIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function AiTab() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const handleAiToggle = (checked: boolean) => {
    if (checked && !settings?.ai_features_enabled) {
      setShowConsentDialog(true);
      return;
    }
    updateSettings.mutate({ ai_features_enabled: checked });
  };

  const handleConsentAccept = () => {
    updateSettings.mutate({ ai_features_enabled: true });
    setShowConsentDialog(false);
  };

  const handleApiKeySave = () => {
    if (!apiKeyInput.trim()) return;
    updateSettings.mutate({ anthropic_api_key: apiKeyInput.trim() });
    setApiKeyInput("");
    setTestResult(null);
  };

  const handleApiKeyClear = () => {
    updateSettings.mutate({ anthropic_api_key: null });
    setApiKeyInput("");
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    const key = apiKeyInput.trim() || settings?.anthropic_api_key;
    if (!key) return;

    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful" });
      } else {
        const data = await response.json();
        setTestResult({
          success: false,
          message: data.error?.message ?? "Connection failed",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Failed to connect to Anthropic API",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const aiEnabled = settings?.ai_features_enabled ?? false;
  const hasApiKey = !!settings?.anthropic_api_key;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">AI Features</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI-powered features for your job search
        </p>
        <Separator className="my-4" />

        <div className="space-y-1">
          <SettingRow
            label="Enable AI Features"
            description="Allow AI to generate research documents and drafts for your applications"
          >
            <Switch checked={aiEnabled} onCheckedChange={handleAiToggle} />
          </SettingRow>

          {aiEnabled && (
            <SettingRow
              label="Company Research"
              description="Generate AI-powered company research for job applications"
            >
              <Switch
                checked={settings?.ai_company_research ?? false}
                onCheckedChange={(checked) =>
                  updateSettings.mutate({
                    ai_company_research: checked as boolean,
                  })
                }
              />
            </SettingRow>
          )}
        </div>
      </div>

      {aiEnabled && (
        <div>
          <h3 className="text-lg font-semibold">API Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Connect your Anthropic API key to enable AI features
          </p>
          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Anthropic API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder={hasApiKey ? "sk-ant-...configured" : "sk-ant-api03-..."}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApiKeySave}
                  disabled={!apiKeyInput.trim()}
                >
                  Save
                </Button>
                {hasApiKey && (
                  <Button variant="outline" size="sm" onClick={handleApiKeyClear}>
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored securely and used only for AI features within this
                application.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testingConnection || (!apiKeyInput.trim() && !hasApiKey)}
              >
                {testingConnection ? (
                  <>
                    <LoaderIcon className="size-4 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <BotIcon className="size-4 mr-1" />
                    Test Connection
                  </>
                )}
              </Button>
              {testResult && (
                <span
                  className={`text-sm ${testResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {testResult.message}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable AI Features</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">By enabling AI features, you acknowledge that:</span>
              <span className="block">
                - Application and company data will be sent to Anthropic&apos;s API for processing
              </span>
              <span className="block">
                - Generated content is AI-created and should be reviewed before use
              </span>
              <span className="block">
                - You are responsible for providing your own API key or using the configured server
                key
              </span>
              <span className="block">- AI-generated documents will be clearly marked as such</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentAccept}>
              I Understand, Enable AI
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
