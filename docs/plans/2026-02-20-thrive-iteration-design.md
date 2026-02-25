# Thrive Iteration Design — 2026-02-20

## Overview

Three feature areas: Companies table upgrade, Applications edit + resume picker, Interviews form polish + bug fix. Sequenced by feature area (A → B → C), TDD throughout.

---

## Feature Area A: Companies

### Table view upgrade

Replace the plain `<Table>` in `CompanyDirectory`'s table view with TanStack Table (`@tanstack/react-table`, already a project dependency). Columns: Name, Industry, Location, Size, Researched, Tags, Actions.

Default view changes from `"cards"` to `"table"`:
- `CompanyDirectory` prop default: `viewParam = "table"`
- Route `validateSearch` default: `view: "table"`

### Actions column

Two icon buttons per row, right-aligned, with `e.stopPropagation()` so they don't trigger the row-click edit:

- **Pencil icon** — opens `CompanyForm` in edit mode (reuses existing `handleOpenEdit`)
- **Archive icon** — calls `useArchiveCompany`, a new hook in `src/lib/queries/companies.ts` that wraps `useUpdateCompany` with `{ id, archived_at: new Date().toISOString() }`. One click, no confirmation dialog. Cache invalidation is inherited from `useUpdateCompany`.

Row click continues to open the edit form (same as cards view).

---

## Feature Area B: Applications

### Edit icon in the table

The `actions` column in `ApplicationTable` currently renders only `<ArchiveDialog>`. A pencil icon button is prepended. It calls a new `onEdit` callback prop, which the applications route wires to open `ApplicationForm` in edit mode. Row click still navigates to the detail page. Action buttons stop propagation.

### `DocumentTypePicker` component

New component: `src/components/documents/document-type-picker.tsx`

**Props:**
```ts
interface DocumentTypePickerProps {
  type?: string;           // filter by document type; undefined = show all
  value: string | null;    // selected document ID
  onChange: (doc: Document | null) => void;
}
```

Renders as a shadcn `Select`. Options are all unarchived documents matching `type` (if provided), fetched via `documentsQueryOptions(type)`. A fixed bottom option **"Attach new…"** opens the existing `UploadDialog`; on upload success the new document auto-selects and calls `onChange`.

When `type` is omitted, no filter is applied — all unarchived documents are shown.

### Resume picker in the application form

Both create and edit flows replace the existing `DocumentPicker` section with `DocumentTypePicker` (`type="resume"`).

**Create mode:**
- On mount, reads `localStorage.getItem("thrive:default_resume_id")` and pre-selects that document if it still appears in the fetched list (silently falls back to no selection if the document was deleted/archived).
- On successful submit, writes the chosen document ID to `localStorage.setItem("thrive:default_resume_id", id)` (or removes the key if none selected).
- After application is created, uses `useAttachDocument` to link the selected document.

**Edit mode:**
- Pre-populated with the document currently linked to the application (from `useApplicationDocuments`).
- No localStorage read or write.
- Uses `useAttachDocument` / `useDetachDocument` to sync changes after submit.

---

## Feature Area C: Interviews

### Empty state layout bug

The header `flex` container (`flex items-center justify-between`) gets `gap-4` to ensure consistent spacing between the h1 and the Schedule Interview button. The search bar is conditionally hidden when `!hasAnyInterviews` (no point searching an empty list).

### ScheduleDialog — date field

Replace `<Input type="date">` with a shadcn `DatePicker` (Calendar inside a Popover). Displays the selected date as a formatted string in the trigger button. Integrates with React Hook Form via `Controller`.

### ScheduleDialog — time field

Keep `<Input type="time">` — the native time picker is already correct. No change.

### ScheduleDialog — duration field

Replace the free-text number input with a shadcn `Select`. Options are 15-minute increments from 15 to 180 minutes, displayed as human-readable labels:

| Value | Label |
|-------|-------|
| 15 | 15 min |
| 30 | 30 min |
| 45 | 45 min |
| 60 | 1 hr |
| 75 | 1 hr 15 min |
| ... | ... |
| 180 | 3 hr |

A "None" option at the top maps to `undefined`.

### ScheduleDialog — title placeholder

The title `Input` placeholder is derived from the currently selected `type` using the existing `EVENT_TYPE_OPTIONS` label map (e.g. `type="technical-interview"` → placeholder `"Technical Interview"`). On submit, if `title` is blank, the value is set to the placeholder label before sending.

### ScheduleDialog — default status + auto-switch

Default status changes from `"scheduled"` to `"availability-requested"`. A `useEffect` watches `date` and `time` field values:
- Both non-empty → set status to `"scheduled"`
- Either cleared → revert to `"availability-requested"`

The user can manually override status after an auto-switch.

---

## Testing

All changes follow TDD (red-green-refactor). Tests live in `__tests__/` directories colocated with components.

- `company-directory.test.tsx` — table default, edit/archive icon presence and behavior
- `companies.test.ts` — `useArchiveCompany` hook
- `application-table.test.tsx` — edit icon presence, `onEdit` callback
- `document-type-picker.test.tsx` — type filtering, "Attach new" option, onChange
- `application-form.test.tsx` — resume picker in create (localStorage) and edit (pre-population) modes
- `schedule-dialog.test.tsx` — date picker, duration dropdown, title placeholder, status auto-switch
- `interviews.test.tsx` (route) — empty state layout, search bar visibility

## Implementation Order

1. Companies (query hook → table upgrade → default view → tests)
2. Applications (DocumentTypePicker → table edit icon → form resume picker → tests)
3. Interviews (bug fix → duration dropdown → date picker → title placeholder → status auto-switch → tests)
