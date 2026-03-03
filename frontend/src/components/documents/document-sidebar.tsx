import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Document, useCreateDocument, useDocuments } from "@/lib/queries/documents";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentSidebarProps {
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onUploadClick: () => void;
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDownIcon className="size-3.5" />
        ) : (
          <ChevronRightIcon className="size-3.5" />
        )}
        {title}
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
          {count}
        </Badge>
      </button>
      {open && <div className="space-y-0.5 px-1">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document item
// ---------------------------------------------------------------------------

function typeIcon(type: string) {
  switch (type) {
    case "resume":
      return <FileTextIcon className="size-4 shrink-0" />;
    case "cover-letter":
      return <FileIcon className="size-4 shrink-0" />;
    default:
      return <FileIcon className="size-4 shrink-0" />;
  }
}

function DocumentItem({
  doc,
  selected,
  onSelect,
}: {
  doc: Document;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground",
      )}
    >
      {typeIcon(doc.type)}
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{doc.name}</div>
        <div className="text-xs text-muted-foreground">
          {new Date(doc.updated_at).toLocaleDateString()}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptySection({ label }: { label: string }) {
  return <p className="px-4 py-2 text-xs text-muted-foreground italic">No {label} yet</p>;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function DocumentSidebar({ selectedId, onSelect, onUploadClick }: DocumentSidebarProps) {
  const [search, setSearch] = React.useState("");
  const { data: documents = [], isLoading } = useDocuments();
  const createDocument = useCreateDocument();

  const filtered = React.useMemo(() => {
    if (!search) return documents;
    const lower = search.toLowerCase();
    return documents.filter((d) => d.name.toLowerCase().includes(lower));
  }, [documents, search]);

  const resumes = filtered.filter((d) => d.type === "resume");
  const coverLetters = filtered.filter((d) => d.type === "cover-letter");
  const others = filtered.filter((d) => d.type !== "resume" && d.type !== "cover-letter");

  const handleNewDocument = () => {
    createDocument.mutate(
      { name: "Untitled Document", type: "other", content: "" },
      {
        onSuccess: (doc) => {
          onSelect(doc.id);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col border-r">
      {/* Search */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onUploadClick}>
            <UploadIcon className="size-4 mr-1" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleNewDocument}
            disabled={createDocument.isPending}
          >
            <PlusIcon className="size-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Document list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">Loading...</p>
        ) : (
          <div className="space-y-2 pb-4">
            <CollapsibleSection title="Resumes" count={resumes.length}>
              {resumes.length === 0 ? (
                <EmptySection label="resumes" />
              ) : (
                resumes.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    selected={doc.id === selectedId}
                    onSelect={() => onSelect(doc.id)}
                  />
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Cover Letters" count={coverLetters.length}>
              {coverLetters.length === 0 ? (
                <EmptySection label="cover letters" />
              ) : (
                coverLetters.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    selected={doc.id === selectedId}
                    onSelect={() => onSelect(doc.id)}
                  />
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Other" count={others.length}>
              {others.length === 0 ? (
                <EmptySection label="documents" />
              ) : (
                others.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    selected={doc.id === selectedId}
                    onSelect={() => onSelect(doc.id)}
                  />
                ))
              )}
            </CollapsibleSection>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
