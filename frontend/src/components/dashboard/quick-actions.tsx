import { useNavigate } from "@tanstack/react-router";
import { CalendarIcon, ListIcon, PlusIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import { EasyAddForm } from "@/components/applications/easy-add-form";
import { FullApplicationForm } from "@/components/applications/full-application-form";
import { ScheduleDialog } from "@/components/interviews/schedule-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActions() {
  const navigate = useNavigate();
  const [easyAddOpen, setEasyAddOpen] = useState(false);
  const [fullFormOpen, setFullFormOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="outline" className="justify-start" onClick={() => setEasyAddOpen(true)}>
            <ZapIcon className="mr-2 size-4" />
            Easy Add Application
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => setFullFormOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            New Application
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

      <EasyAddForm open={easyAddOpen} onOpenChange={setEasyAddOpen} />
      <FullApplicationForm open={fullFormOpen} onOpenChange={setFullFormOpen} />
      <ScheduleDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen} />
    </>
  );
}
