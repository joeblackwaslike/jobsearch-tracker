import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Documents</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
