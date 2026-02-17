import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/interviews")({
  component: InterviewsPage,
});

function InterviewsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Interviews</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
