import { createFileRoute } from "@tanstack/react-router";
import { InboxList } from "@/components/inbox/inbox-list";
import { useInboxTasks } from "@/lib/queries/tasks";

export const Route = createFileRoute("/_authenticated/inbox")({
  component: InboxPage,
});

function InboxPage() {
  const { data: tasks = [], isLoading } = useInboxTasks();

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">AI tasks that need your attention</p>
      </div>

      <InboxList tasks={tasks} isLoading={isLoading} />
    </div>
  );
}
