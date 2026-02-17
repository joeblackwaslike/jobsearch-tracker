import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon, CalendarIcon, ListIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "@/components/applications/application-form";
import { ScheduleDialog } from "@/components/interviews/schedule-dialog";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActions() {
  const navigate = useNavigate();
  const [applicationFormOpen, setApplicationFormOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setApplicationFormOpen(true)}
          >
            <PlusIcon className="mr-2 size-4" />
            Add Application
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => setScheduleDialogOpen(true)}
          >
            <CalendarIcon className="mr-2 size-4" />
            Schedule Interview
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate({ to: "/applications" })}
          >
            <ListIcon className="mr-2 size-4" />
            View Applications
          </Button>
        </CardContent>
      </Card>

      <ApplicationForm
        open={applicationFormOpen}
        onOpenChange={setApplicationFormOpen}
        mode="create"
      />

      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </>
  );
}
