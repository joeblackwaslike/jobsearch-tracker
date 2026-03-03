# Contacts (Interviewers) & Application Documents Design

## Goal

Add two features that have existing database schemas but no UI: contacts as interviewers on interview events, and document attachment on applications.

## Contacts

### Overview

Contacts represent people the user interacts with during their job search — primarily interviewers. They are not a top-level nav item. Instead, contacts are created and managed in two places:

1. **Interview form** — streamlined inline creation when scheduling/editing interviews
2. **Company form dialog** — full CRUD for contacts linked to a company

### Data Model

New junction table linking events to contacts (interviewers):

```sql
CREATE TABLE event_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, contact_id)
);
```

RLS: access granted if the event belongs to the user (via `events.user_id = auth.uid()`).

No changes to existing `contacts` or `events` tables.

### Interview Form — Interviewers Section

The schedule/edit interview dialog gets an "Interviewers" section:

- **Multi-select combobox** that searches existing contacts filtered by the application's company
- **Selected interviewers** displayed as removable chips below the combobox
- **"+ Create [name]"** option when the typed name doesn't match existing contacts

Inline create form (expanded below combobox when creating):

| Field | Type | Notes |
|-------|------|-------|
| Name | text input | Pre-filled from typed text, required |
| Title | text input | e.g. "Engineering Manager" |
| Contact method | select | Email, Phone, or LinkedIn — pick one |
| Contact value | text input | Appears after method selection, placeholder adapts |

On save:
- Contact created with `company_id` auto-set to the application's company
- Only the selected contact method field is populated; the other two stay empty
- `event_contacts` row created linking the contact to the event

Removing an interviewer: click X on the chip. Removes the `event_contacts` row, not the contact record.

Editing contacts is not supported from the interview form — that happens on the company page.

### Company Form Dialog — Contacts Section

The company form dialog (edit mode) gets a new section at the bottom:

- List of contacts linked to this company (name, title, contact info)
- "Add Contact" button opens inline form
- Edit/delete actions on each contact row

Full contact form fields:

| Field | Type | Notes |
|-------|------|-------|
| Name | text input | Required |
| Title | text input | Optional |
| Email | text input | Optional |
| Phone | text input | Optional |
| LinkedIn URL | text input | Optional |
| Notes | textarea | Optional |

All three contact methods available here (unlike the streamlined interview form).

## Application Documents

### Overview

Users can attach documents (resumes, cover letters) to specific applications. Attaching creates a snapshot — a point-in-time copy of the document's content stored in the `application_documents` table. The existing schema and `useSnapshotDocument` mutation already support this; only the UI is missing.

### Application Detail Page — Documents Card

A "Documents" card between the info grid and Timeline section:

- List of attached documents: name, type badge (Resume/Cover Letter/Other), linked_at date
- "Attach Document" button opens a picker dialog
- Remove button (X) on each doc to delete the `application_documents` row

### Picker Dialog

- Lists the user's document library grouped by type (Resumes, Cover Letters, Other) — same grouping as the Documents sidebar
- Click a document to attach it (creates snapshot via `useSnapshotDocument`)
- Dialog closes after selection
- Empty state with link to Documents page if no documents exist

### Application Form Dialog — Documents Section

Below existing form fields:

- **Edit mode**: shows currently attached documents as chips with remove (X), plus "Attach" button opening the picker
- **Create mode**: "Attach" button opens picker; selections queued in local state and created after the application is saved

### Query Layer

New hooks (in `application-documents.ts` or added to `documents.ts`):

- `useApplicationDocuments(applicationId)` — fetch attached docs for an application
- `useDetachDocument()` — delete an `application_documents` row

Existing `useSnapshotDocument()` handles the attach/snapshot flow.

## Not Building

- No standalone Contacts page (contacts are context-only: interviews and companies)
- No staleness indicator on document snapshots (show `linked_at` only)
- No new nav items
- No contact editing from the interview form
