import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import * as React from "react";
import { DocumentEditor } from "@/components/documents/document-editor";
import { DocumentSidebar } from "@/components/documents/document-sidebar";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

type DocumentsSearch = {
  doc?: string;
};

export const Route = createFileRoute("/_authenticated/documents")({
  validateSearch: (search: Record<string, unknown>): DocumentsSearch => ({
    doc: typeof search.doc === "string" ? search.doc : undefined,
  }),
  component: DocumentsPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DocumentsPage() {
  const { doc: selectedId } = Route.useSearch();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleSelect = (id: string) => {
    navigate({
      to: "/documents",
      search: { doc: id },
      replace: true,
    });
    setMobileOpen(false);
  };

  const handleDeleted = () => {
    navigate({
      to: "/documents",
      search: {},
      replace: true,
    });
  };

  const handleUploadSuccess = (id: string) => {
    handleSelect(id);
  };

  const sidebarContent = (
    <DocumentSidebar
      selectedId={selectedId}
      onSelect={handleSelect}
      onUploadClick={() => setUploadOpen(true)}
    />
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full w-[320px] shrink-0">{sidebarContent}</div>

      {/* Mobile sidebar trigger */}
      <div className="md:hidden absolute top-3 left-3 z-10">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)}>
          <MenuIcon className="size-4 mr-1" />
          Documents
        </Button>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[320px] p-0" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Documents</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Editor panel */}
      <div className="flex-1 min-w-0">
        <DocumentEditor documentId={selectedId} onDeleted={handleDeleted} />
      </div>

      {/* Upload dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
