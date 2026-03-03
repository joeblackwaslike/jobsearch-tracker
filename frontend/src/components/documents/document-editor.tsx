import { DownloadIcon, FileTextIcon, SaveIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeleteDocument, useDocument, useUpdateDocument } from "@/lib/queries/documents";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentEditorProps {
  documentId: string | undefined;
  onDeleted: () => void;
}

// ---------------------------------------------------------------------------
// Type label helper
// ---------------------------------------------------------------------------

function _typeLabel(type: string) {
  switch (type) {
    case "resume":
      return "Resume";
    case "cover-letter":
      return "Cover Letter";
    default:
      return "Other";
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2">
        <FileTextIcon className="size-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Select a document or create a new one</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File info card (for uploaded documents)
// ---------------------------------------------------------------------------

function FileInfoCard({ uri, mimeType }: { uri: string; mimeType: string | null }) {
  const handleDownload = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(uri, 60);
    if (error) {
      console.error("Failed to create download URL:", error);
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const fileName = uri.split("/").pop() ?? uri;

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FileTextIcon className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">{fileName}</p>
          <p className="text-sm text-muted-foreground">{mimeType ?? "Unknown type"}</p>
        </div>
      </div>
      <Button variant="outline" onClick={handleDownload}>
        <DownloadIcon className="size-4 mr-2" />
        Download file
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export function DocumentEditor({ documentId, onDeleted }: DocumentEditorProps) {
  const { data: doc, isLoading } = useDocument(documentId ?? "");
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("other");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Sync local state when doc loads
  React.useEffect(() => {
    if (doc) {
      setName(doc.name);
      setType(doc.type);
      setContent(doc.content ?? "");
      const tagArray = Array.isArray(doc.tags) ? doc.tags : [];
      setTags(tagArray.join(", "));
    }
  }, [doc]);

  if (!documentId) return <EmptyState />;
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  const isUploaded = !!doc.uri;

  const handleSave = () => {
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    updateDocument.mutate({
      id: doc.id,
      name,
      type,
      tags: tagArray,
      ...(!isUploaded ? { content } : {}),
    });
  };

  const handleContentBlur = () => {
    if (!isUploaded && content !== (doc.content ?? "")) {
      handleSave();
    }
  };

  const handleDelete = () => {
    deleteDocument.mutate(doc.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onDeleted();
      },
    });
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    updateDocument.mutate({ id: doc.id, type: newType });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name !== doc.name) {
              updateDocument.mutate({ id: doc.id, name });
            }
          }}
          className="max-w-xs font-semibold"
        />

        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-35">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resume">Resume</SelectItem>
            <SelectItem value="cover-letter">Cover Letter</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {doc.revision && <Badge variant="secondary">{doc.revision}</Badge>}

        <div className="ml-auto flex gap-2">
          {!isUploaded && (
            <Button size="sm" onClick={handleSave} disabled={updateDocument.isPending}>
              <SaveIcon className="size-4 mr-1" />
              {updateDocument.isPending ? "Saving..." : "Save"}
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon className="size-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Label className="text-xs text-muted-foreground shrink-0">Tags:</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          onBlur={() => {
            const tagArray = tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            const current = Array.isArray(doc.tags) ? doc.tags : [];
            if (JSON.stringify(tagArray) !== JSON.stringify(current)) {
              updateDocument.mutate({ id: doc.id, tags: tagArray });
            }
          }}
          placeholder="Add tags separated by commas"
          className="h-8 text-sm"
        />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {isUploaded ? (
          <FileInfoCard uri={doc.uri as string} mimeType={doc.mime_type} />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            className="h-full w-full resize-none rounded-lg border bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Start writing..."
          />
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{doc.name}&rdquo;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
