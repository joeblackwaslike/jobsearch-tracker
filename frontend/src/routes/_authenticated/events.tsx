import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { CalendarIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { EventDetail } from "@/components/events/event-detail";
import { ScheduleDialog } from "@/components/events/schedule-dialog";
import { PageLayout } from "@/components/shared/page-layout";
import { UniversalTable } from "@/components/shared/universal-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type EventWithApplication, usePastEvents, useUpcomingEvents } from "@/lib/queries/events";
import type { TableSchema } from "@/schemas/table-schema";
import { eventTableSchema } from "@/schemas/table-schemas";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/events")({
  component: EventsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || "upcoming",
  }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function filterEvents(events: EventWithApplication[], search: string): EventWithApplication[] {
  if (!search) return events;
  const term = search.toLowerCase();
  return events.filter((event) => {
    const companyName = event.application?.company?.name?.toLowerCase() ?? "";
    const position = event.application?.position?.toLowerCase() ?? "";
    const title = event.title?.toLowerCase() ?? "";
    return companyName.includes(term) || position.includes(term) || title.includes(term);
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function EventsPage() {
  const { tab } = useSearch({ from: "/_authenticated/events" });
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: upcoming = [] } = useUpcomingEvents();
  const { data: past = [] } = usePastEvents();

  const filteredUpcoming = useMemo(() => filterEvents(upcoming, search), [upcoming, search]);
  const filteredPast = useMemo(() => filterEvents(past, search), [past, search]);

  const setTab = (value: string) => {
    navigate({ to: "/events", search: { tab: value }, replace: true });
    setSelectedId(null);
  };

  // Look up selected event from either list
  const selectedEvent = useMemo(
    () => (selectedId ? ([...upcoming, ...past].find((e) => e.id === selectedId) ?? null) : null),
    [selectedId, upcoming, past],
  );

  const hasAnyEvents = upcoming.length > 0 || past.length > 0;

  return (
    <PageLayout
      detailPanel={selectedEvent ? <EventDetail event={selectedEvent} /> : null}
      onDetailClose={() => setSelectedId(null)}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Events</h1>
          <Button onClick={() => setScheduleOpen(true)}>
            <PlusIcon className="size-4" />
            Add Event
          </Button>
        </div>

        {/* Search */}
        {hasAnyEvents && (
          <div className="relative max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by company, position, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Content */}
        {hasAnyEvents ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <UniversalTable
                data={filteredUpcoming}
                schema={eventTableSchema as unknown as TableSchema<EventWithApplication>}
                onRowClick={(event) => setSelectedId((event as EventWithApplication).id)}
                selectedId={selectedId}
              />
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              <UniversalTable
                data={filteredPast}
                schema={eventTableSchema as unknown as TableSchema<EventWithApplication>}
                onRowClick={(event) => setSelectedId((event as EventWithApplication).id)}
                selectedId={selectedId}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <CalendarIcon className="mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold">No events scheduled yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Schedule your first event to get started.
            </p>
            <Button onClick={() => setScheduleOpen(true)}>
              <PlusIcon className="size-4" />
              Add Your First Event
            </Button>
          </div>
        )}

        {/* Schedule dialog */}
        <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      </div>
    </PageLayout>
  );
}
