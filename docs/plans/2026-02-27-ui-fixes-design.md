# UI Fixes Design — 2026-02-27

## Scope

Three independent areas: Companies detail polish, Application detail restructure, and Events form fixes.

---

## Area 1: Companies Detail

### 1a. Markdown Heading Styles

**Problem:** `MarkdownContent` wraps content in `prose prose-sm` classes, but `@tailwindcss/typography` is not installed. Tailwind v4 (via `@tailwindcss/vite`) ignores unknown utility classes, so headings render with no visual distinction from body text.

**Fix:** Remove the `prose prose-sm` classes from `markdown-content.tsx` and replace with explicit Tailwind element-selectors:
- Headings: `[&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium`
- Inline: `[&_strong]:font-semibold [&_a]:text-primary [&_a]:underline`
- Lists: `[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4`

**File:** `frontend/src/components/ui/markdown-content.tsx`

### 1b. Tab Cursor Pointer

**Problem:** `TabsTrigger` in `ui/tabs.tsx` is missing `cursor-pointer`, so hovering tabs shows a default arrow cursor instead of a pointer.

**Fix:** Add `cursor-pointer` to the `TabsTrigger` className string.

**File:** `frontend/src/components/ui/tabs.tsx`

---

## Area 2: Application Detail

### 2a. Bookmark Toast Message

**Problem:** `useCreateApplication` always fires `toast.success("Application added.")` in `onSuccess`, even when the application is created with `status: "bookmarked"`.

**Fix:** In the `onSuccess` callback, check `data.status`. If `"bookmarked"`, show `"Bookmarked."`, otherwise show `"Application added."`.

**File:** `frontend/src/lib/queries/applications.ts`

### 2b. Timeline Milestone Dates

**Problem:** The timeline section only shows events. It should also show when the application was bookmarked and when it was applied.

**Fix:** Above the `EventTimeline` component, render two read-only milestone rows:
- "Bookmarked" — always present, using `application.created_at`
- "Applied" — only if `application.applied_at` is non-null

Style them as static timeline nodes (icon + label + date, no edit/delete controls) consistent with `EventNode` appearance.

**File:** `frontend/src/components/applications/application-detail.tsx`

### 2c. View Company Instead of Edit Company

**Problem:** The "Edit Company" button opens a `CompanyForm` dialog inline. This should instead navigate to the company detail page.

**Fix:** Replace the `Button onClick={() => setEditCompanyOpen(true)}` with a `<Link to="/companies/$companyId" params={{ companyId: application.company_id }}>` rendered as a button. Remove `editCompanyOpen` state, the `CompanyForm` import, and the `CompanyForm` dialog at the bottom.

**File:** `frontend/src/components/applications/application-detail.tsx`

### 2d. Remove Redundant Edit Application Button

**Problem:** `ApplicationDetail` renders an "Edit Application" button in its action row. The parent `PageLayout` in `applications.tsx` already provides a pencil icon in the panel header via `detailHeaderActions`. This is redundant.

**Fix:** Remove the "Edit Application" `Button` and associated `editAppOpen` state from `ApplicationDetail`. The `ApplicationForm` dialog driven by the parent's pencil button remains. The `editAppOpen` state and `setEditAppOpen` can be fully removed from the component.

**Note:** The standalone `/$applicationId` route also renders `ApplicationDetail` directly without a header pencil. That route should add its own edit button or the `ApplicationDetail` keeps one for standalone use. Given the todo says "there is already one at the top of detail", the panel view is the primary context — remove it from `ApplicationDetail` and ensure the standalone route has an edit mechanism if needed (out of scope for this iteration).

**File:** `frontend/src/components/applications/application-detail.tsx`

### 2e. Archive Button to Header

**Problem:** The archive button lives inside `ApplicationDetail`'s action row. It should appear in the panel header alongside the edit pencil and close X.

**Fix:** In `applications.tsx`, lift the `ArchiveDialog` into `detailHeaderActions` next to the pencil button. This requires tracking a local `archiveOpen` state in the route component, and rendering `<ArchiveDialog applicationId={selectedApp.id} open={archiveOpen} onOpenChange={setArchiveOpen} />` there. The `ArchiveDialog` component needs to accept optional `open`/`onOpenChange` props (or already does — check and adapt accordingly).

Remove the `<ArchiveDialog>` from `ApplicationDetail`'s action buttons row.

**Files:** `frontend/src/routes/_authenticated/applications.tsx`, `frontend/src/components/applications/application-detail.tsx`, possibly `frontend/src/components/applications/archive-dialog.tsx`

### 2f. URL Display + Markdown Job Description

**Problem:** (1) The job posting URL is buried in the Details card at the bottom with other fields. (2) The job description is rendered as collapsible plain text.

**Fix:**
- Before the job description card, add a dedicated URL row (if `application.url` is set): display the URL text truncated with an `ExternalLinkIcon` button that opens in a new tab.
- Replace the collapsible job description card with a direct `MarkdownContent` render. Remove `descriptionExpanded` state, the toggle button, `ChevronDownIcon`, and `ChevronRightIcon` imports.
- The job description card becomes always-visible when content exists.

**File:** `frontend/src/components/applications/application-detail.tsx`

---

## Area 3: Events Forms

Fixes apply to both `add-event-dialog.tsx` and `schedule-dialog.tsx` unless noted.

### 3a. Date Picker (Calendar Popover)

**Problem:** Both forms use `<Input type="date">` which renders the native browser date picker — visually inconsistent with the project.

**Fix:** Create a shared `DatePickerField` component at `frontend/src/components/ui/date-picker-field.tsx`:
- Props: `value: string` (YYYY-MM-DD), `onChange: (value: string) => void`, `placeholder?: string`
- Renders a `Button` (outline variant) showing the formatted date or placeholder, with a `CalendarIcon` on the left
- Clicking opens a `Popover` containing the `Calendar` component
- On day select: format as YYYY-MM-DD, call `onChange`, close the popover

Replace `<Input type="date">` in both dialogs with `<DatePickerField>`.

**Files:** `frontend/src/components/ui/date-picker-field.tsx` (new), `frontend/src/components/applications/add-event-dialog.tsx`, `frontend/src/components/events/schedule-dialog.tsx`

### 3b. Time Picker (Styled Input)

**Problem:** `<input type="time">` shows native browser chrome that is visually inconsistent.

**Fix:** Use the existing `Input` component with additional className to hide the browser picker indicator:
```
className="[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0"
```
This preserves the text-based time entry while hiding the browser UI chrome. `schedule-dialog.tsx` already partially does this — ensure both dialogs apply consistent classes.

**Files:** `frontend/src/components/applications/add-event-dialog.tsx`, `frontend/src/components/events/schedule-dialog.tsx`

### 3c. Contacts Visibility in AddEventDialog

**Problem:** `AddEventDialog` only shows the contacts section when `companyId` is provided. When opened from `EventTimeline` (edit mode), `companyId` is not passed, so contacts are hidden.

**Fix:** Add `companyId?: string` prop to `EventTimeline` and `EventNode`. Thread `application.company_id` from `ApplicationDetail` into `EventTimeline`. Pass it from `EventNode` to `AddEventDialog`.

**Files:** `frontend/src/components/applications/event-timeline.tsx`, `frontend/src/components/applications/application-detail.tsx`

### 3d. Move Title Field

**Problem:** In both forms, the Title field appears between Status and Date. It should appear just above Description.

**Fix:** Move the Title field JSX block to immediately before the Description field in both `AddEventDialog` and `ScheduleDialog`.

**Files:** `frontend/src/components/applications/add-event-dialog.tsx`, `frontend/src/components/events/schedule-dialog.tsx`

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/components/ui/markdown-content.tsx` | Replace prose classes with element-selectors |
| `src/components/ui/tabs.tsx` | Add `cursor-pointer` to TabsTrigger |
| `src/components/ui/date-picker-field.tsx` | New — Calendar/Popover date picker |
| `src/lib/queries/applications.ts` | Conditional toast in useCreateApplication |
| `src/components/applications/application-detail.tsx` | Timeline milestones, View Company link, remove Edit App btn, remove Archive btn, URL row, markdown job desc |
| `src/components/applications/archive-dialog.tsx` | Accept optional open/onOpenChange props |
| `src/routes/_authenticated/applications.tsx` | Lift archive dialog into detailHeaderActions |
| `src/components/applications/event-timeline.tsx` | Thread companyId prop |
| `src/components/applications/add-event-dialog.tsx` | DatePickerField, styled time, move title, contacts fix |
| `src/components/events/schedule-dialog.tsx` | DatePickerField, styled time, move title |
