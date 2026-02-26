import { SidePanel } from "./side-panel";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface PageLayoutProps {
  children: React.ReactNode;
  detailPanel?: React.ReactNode | null;
  onDetailClose?: () => void;
  detailWidth?: SidePanelWidth;
  showDetailPanel?: boolean;
  detailHeaderActions?: React.ReactNode;
}

export function PageLayout({
  children,
  detailPanel,
  onDetailClose = () => {},
  detailWidth = "md",
  showDetailPanel = !!detailPanel,
  detailHeaderActions,
}: PageLayoutProps) {
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      <SidePanel
        isOpen={showDetailPanel}
        onClose={onDetailClose}
        width={detailWidth}
        headerActions={detailHeaderActions}
      >
        {detailPanel}
      </SidePanel>
    </div>
  );
}
