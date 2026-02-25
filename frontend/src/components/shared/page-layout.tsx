import { cn } from "@/lib/utils";
import { SidePanel } from "./side-panel";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface PageLayoutProps {
  children: React.ReactNode;
  detailPanel?: React.ReactNode | null;
  onDetailClose?: () => void;
  detailWidth?: SidePanelWidth;
  showDetailPanel?: boolean;
}

export function PageLayout({
  children,
  detailPanel,
  onDetailClose = () => {},
  detailWidth = "md",
  showDetailPanel = !!detailPanel,
}: PageLayoutProps) {
  return (
    <div className="flex h-full w-full">
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          showDetailPanel && "pr-[480px]",
        )}
      >
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
      <SidePanel isOpen={showDetailPanel} onClose={onDetailClose} width={detailWidth}>
        {detailPanel}
      </SidePanel>
    </div>
  );
}
