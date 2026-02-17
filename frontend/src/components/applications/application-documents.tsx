import { useState } from "react";
import { XIcon, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useApplicationDocuments,
  useDetachDocument,
} from "@/lib/queries/application-documents";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { DocumentPicker } from "@/components/documents/document-picker";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  other: "Other",
};

function typeLabel(type: string | null | undefined): string {
  if (!type) return "Other";
  return TYPE_LABELS[type] ?? "Other";
}

const TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  resume: "default",
  cover_letter: "secondary",
  other: "outline",
};

function typeVariant(type: string | null | undefined): "default" | "secondary" | "outline" {
  if (!type) return "outline";
  return TYPE_VARIANT[type] ?? "outline";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ApplicationDocumentsProps {
  applicationId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationDocuments({ applicationId }: ApplicationDocumentsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: documents = [], isLoading } = useApplicationDocuments(applicationId);
  const detach = useDetachDocument();
  const snapshot = useSnapshotDocument();

  const excludeDocIds = documents
    .map((d) => d.document_id)
    .filter((id): id is string => id != null);

  async function handleAttach(documentId: string) {
    await snapshot.mutateAsync({ applicationId, documentId });
  }

  async function handleDetach(id: string) {
    await detach.mutateAsync({ id, applicationId });
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Documents</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            <PaperclipIcon className="size-4" />
            Attach Document
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          )}

          {!isLoading && documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents attached</p>
          )}

          {!isLoading && documents.length > 0 && (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {doc.name}
                    </span>
                    <Badge variant={typeVariant(doc.type)}>
                      {typeLabel(doc.type)}
                    </Badge>
                    {doc.linked_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(doc.linked_at)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => handleDetach(doc.id)}
                    disabled={detach.isPending}
                    aria-label={`Remove ${doc.name}`}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DocumentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAttach}
        excludeIds={excludeDocIds}
      />
    </>
  );
}
