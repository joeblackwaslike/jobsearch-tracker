import { useMemo } from "react";
import { useDocuments } from "@/lib/queries/documents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (documentId: string) => void;
  excludeIds: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<string, string> = {
  resume: "Resumes",
  cover_letter: "Cover Letters",
  other: "Other",
};

const GROUP_ORDER = ["resume", "cover_letter", "other"];

function groupKey(type: string | null | undefined): string {
  if (type === "resume" || type === "cover_letter") return type;
  return "other";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentPicker({
  open,
  onOpenChange,
  onSelect,
  excludeIds,
}: DocumentPickerProps) {
  const { data: documents, isLoading } = useDocuments();

  const filtered = useMemo(() => {
    if (!documents) return [];
    const excludeSet = new Set(excludeIds);
    return documents.filter((d) => !excludeSet.has(d.id));
  }, [documents, excludeIds]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const doc of filtered) {
      const key = groupKey(doc.type);
      const list = map.get(key) ?? [];
      list.push(doc);
      map.set(key, list);
    }
    return GROUP_ORDER.filter((k) => map.has(k)).map((k) => ({
      label: GROUP_LABELS[k],
      docs: map.get(k)!,
    }));
  }, [filtered]);

  function handleSelect(documentId: string) {
    onSelect(documentId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach Document</DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No documents yet. Create documents on the Documents page.
          </p>
        )}

        {!isLoading &&
          groups.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.docs.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => handleSelect(doc.id)}
                    >
                      {doc.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}
