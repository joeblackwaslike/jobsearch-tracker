import { ExternalLink } from "lucide-react";
import type React from "react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DetailMeta {
  icon: React.ReactNode;
  text: string;
  href?: string;
}

interface DetailTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface DetailLayoutProps {
  icon: React.ReactNode;
  name: string;
  meta?: DetailMeta[];
  badges?: React.ReactNode;
  tabs: DetailTab[];
  defaultTab: string;
}

export function DetailLayout({ icon, name, meta = [], badges, tabs, defaultTab }: DetailLayoutProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h2 className="text-xl font-semibold">{name}</h2>
        </div>

        {meta.length > 0 && (
          <div className="space-y-1">
            {meta.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0">{item.icon}</span>
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    {item.text}
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span>{item.text}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {badges && <div className="flex flex-wrap gap-1.5 pt-1">{badges}</div>}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
