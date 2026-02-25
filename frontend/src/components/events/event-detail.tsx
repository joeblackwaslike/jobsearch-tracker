import { Building2, Calendar, Clock, ExternalLink, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDuration } from "@/lib/formatters";
import { useEventContacts } from "@/lib/queries/event-contacts";
import type { EventWithApplication } from "@/lib/queries/events";

const EVENT_TYPE_LABELS: Record<string, string> = {
  "screening-interview": "Screening Interview",
  "technical-interview": "Technical Interview",
  "behavioral-interview": "Behavioral Interview",
  "online-test": "Online Test",
  "take-home": "Take Home Assignment",
  onsite: "Onsite Interview",
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  rescheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "availability-requested": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "availability-submitted": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "no-show": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface EventDetailProps {
  event: EventWithApplication;
}

export function EventDetail({ event }: EventDetailProps) {
  const { data: eventContacts = [] } = useEventContacts(event.id);
  const typeLabel = EVENT_TYPE_LABELS[event.type] ?? event.type;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{event.title ?? typeLabel}</h3>
        <Badge variant="secondary" className={EVENT_STATUS_COLORS[event.status] ?? ""}>
          {event.status}
        </Badge>
      </div>

      {event.application && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Related Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">{event.application.company?.name}</p>
              <p className="text-xs text-muted-foreground">{event.application.position}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`/applications/${event.application.id}`}>View Application</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Event Type</p>
            <Badge variant="outline">{typeLabel}</Badge>
          </div>

          {event.scheduled_at && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{formatDate(event.scheduled_at)}</span>
                </div>
              </div>
            </>
          )}

          {event.duration_minutes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{formatDuration(event.duration_minutes)}</span>
                </div>
              </div>
            </>
          )}

          {eventContacts.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Contacts</p>
                {eventContacts.map(({ contact }) => (
                  <div key={contact.id} className="flex items-center gap-2 text-sm">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p>{contact.name}</p>
                      {contact.email && (
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {event.url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meeting Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground truncate">{event.url}</p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="size-3" />
                  Open
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {event.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
