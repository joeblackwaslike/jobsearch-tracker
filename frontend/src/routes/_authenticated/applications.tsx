import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Applications</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
