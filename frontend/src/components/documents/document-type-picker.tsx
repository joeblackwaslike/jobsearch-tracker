import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document } from "@/lib/queries/documents";
import { documentsQueryOptions } from "@/lib/queries/documents";
import { UploadDialog } from "./upload-dialog";

interface DocumentTypePickerProps {
  /** Filter by document type. Omit to show all document types. */
  type?: string;
  value: string | null;
  onChange: (doc: Document | null) => void;
}

export function DocumentTypePicker({ type, value, onChange }: DocumentTypePickerProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: documents = [] } = useQuery(documentsQueryOptions(type));

  const handleValueChange = (val: string) => {
    if (val === "__attach_new__") {
      setUploadOpen(true);
      return;
    }
    if (val === "__none__") {
      onChange(null);
      return;
    }
    const doc = documents.find((d) => d.id === val);
    onChange(doc ?? null);
  };

  const handleUploadSuccess = (id: string) => {
    setUploadOpen(false);
    onChange({ id } as Document);
  };

  return (
    <>
      <Select value={value ?? "__none__"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a document..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              {doc.name}
            </SelectItem>
          ))}
          <SelectItem value="__attach_new__">Attach new…</SelectItem>
        </SelectContent>
      </Select>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
