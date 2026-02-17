import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/companies")({
  component: CompaniesPage,
});

function CompaniesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Companies</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
