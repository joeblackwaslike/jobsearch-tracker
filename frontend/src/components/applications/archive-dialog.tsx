import { useState } from "react";
import { ArchiveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { useArchiveApplication } from "@/lib/queries/applications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArchiveDialogProps {
  applicationId: string;
  onArchived?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARCHIVE_REASONS = [
  "Received rejection",
  "No response",
  "No longer interested",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArchiveDialog({ applicationId, onArchived }: ArchiveDialogProps) {
  const [open, setOpen] = useState(false);
  const archiveApplication = useArchiveApplication();

  const handleSelect = async (reason: string) => {
    try {
      await archiveApplication.mutateAsync({
        id: applicationId,
        archived_reason: reason,
      });
      setOpen(false);
      onArchived?.();
    } catch {
      // Error is handled by the mutation's onError if configured
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => e.stopPropagation()}
          title="Archive application"
        >
          <ArchiveIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <PopoverHeader className="px-2 pb-2">
          <PopoverTitle className="text-sm">
            Why are you archiving this?
          </PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {ARCHIVE_REASONS.map((reason) => (
            <Button
              key={reason}
              variant="ghost"
              size="sm"
              className="justify-start font-normal"
              disabled={archiveApplication.isPending}
              onClick={() => handleSelect(reason)}
            >
              {reason}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
