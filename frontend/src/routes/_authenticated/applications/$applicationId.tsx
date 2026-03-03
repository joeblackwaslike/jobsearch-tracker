import { createFileRoute } from "@tanstack/react-router";
import { ApplicationDetail } from "@/components/applications/application-detail";
import { useApplication } from "@/lib/queries/applications";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/applications/$applicationId")({
  component: ApplicationDetailPage,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ApplicationDetailPage() {
  const { applicationId } = Route.useParams();
  const { data: application, isLoading, error } = useApplication(applicationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-muted-foreground">Application not found.</p>
        <a href="/applications" className="text-sm text-primary hover:underline">
          Back to applications
        </a>
      </div>
    );
  }

  return <ApplicationDetail application={application} />;
}
