import { BotIcon, GlobeIcon, MailIcon, ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProviderCard {
  name: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
}

const PROVIDERS: ProviderCard[] = [
  {
    name: "Anthropic",
    description: "AI-powered company research and document generation",
    icon: <BotIcon className="size-5" />,
    active: true,
  },
  {
    name: "Apollo.io",
    description: "Contact enrichment and company data",
    icon: <GlobeIcon className="size-5" />,
    active: false,
  },
  {
    name: "Google",
    description: "Gmail integration for application tracking",
    icon: <MailIcon className="size-5" />,
    active: false,
  },
  {
    name: "Inngest",
    description: "Background job orchestration for AI tasks",
    icon: <ZapIcon className="size-5" />,
    active: false,
  },
];

export function IntegrationsTab() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect external services to enhance your job search
        </p>
        <Separator className="my-4" />

        <div className="grid gap-4 sm:grid-cols-2">
          {PROVIDERS.map((provider) => (
            <Card key={provider.name} className={provider.active ? "" : "opacity-60"}>
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="rounded-md border p-2 text-muted-foreground">{provider.icon}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    {!provider.active && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{provider.description}</CardDescription>
                  {provider.active && (
                    <a
                      href="/settings?tab=ai"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Configure
                    </a>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
