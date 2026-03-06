import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidePanelWidth = "sm" | "md" | "lg" | "xl";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: SidePanelWidth;
  position?: "right" | "left";
  headerActions?: React.ReactNode;
}

const WIDTH_CLASSES: Record<SidePanelWidth, string> = {
  sm: "w-[360px]",
  md: "w-[480px]",
  lg: "w-[600px]",
  xl: "w-[800px]",
};

export function SidePanel({
  isOpen,
  onClose,
  children,
  width = "md",
  position = "right",
  headerActions,
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
      return;
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-end">
        <button
          type="button"
          data-testid="side-panel-backdrop"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Dismiss panel"
          onClick={onClose}
        />
        <div className="relative flex w-full flex-col border-t border-border bg-card shadow-xl max-h-[80vh]">
          <div className="flex shrink-0 items-center justify-end gap-1 border-b p-2">
            {headerActions}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="size-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    );
  }

  const positionClass = position === "right" ? "right-0" : "left-0";

  return (
    <>
      <button
        type="button"
        data-testid="side-panel-backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-label="Dismiss panel"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col border-l border-border bg-card shadow-xl",
          WIDTH_CLASSES[width],
          positionClass,
        )}
      >
        <div className="flex shrink-0 items-center justify-end gap-1 border-b p-2">
          {headerActions}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
}
