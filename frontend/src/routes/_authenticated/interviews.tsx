import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { InterviewList } from "@/components/interviews/interview-list";
import { ScheduleDialog } from "@/components/interviews/schedule-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePastInterviews, useUpcomingInterviews } from "@/lib/queries/events";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/interviews")({
  component: InterviewsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "upcoming",
  }),
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function InterviewsPage() {
  const { tab } = useSearch({ from: "/_authenticated/interviews" });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: upcoming = [] } = useUpcomingInterviews();
  const { data: past = [] } = usePastInterviews();

  const setTab = (value: string) => {
    navigate({
      to: "/interviews",
      search: { tab: value },
      replace: true,
    });
  };

  const hasAnyInterviews = upcoming.length > 0 || past.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <Button onClick={() => setScheduleOpen(true)}>
          <PlusIcon className="mr-2 size-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Search */}
      {hasAnyInterviews && (
        <div className="relative max-w-sm">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by company, position, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Tabs */}
      {hasAnyInterviews ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <InterviewList interviews={upcoming} search={search} />
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            <InterviewList interviews={past} search={search} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <CalendarIcon className="text-muted-foreground mb-4 size-12" />
          <h3 className="mb-1 text-lg font-semibold">No interviews scheduled yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Schedule your first interview to get started.
          </p>
          <Button onClick={() => setScheduleOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            Schedule Your First Interview
          </Button>
        </div>
      )}

      {/* Schedule dialog */}
      <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
    </div>
  );
}
