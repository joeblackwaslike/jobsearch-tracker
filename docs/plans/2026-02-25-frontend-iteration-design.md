# Frontend Iteration Design

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Shared fixes first, then features (Approach 1)

---

## Overview

This iteration covers shared component bug fixes, a full company detail redesign with a reusable detail layout pattern, an application bookmark feature, events form accessibility improvements, and a documents sidebar fix.

**Sequencing:**
1. Shared component bug fixes (benefit all entity pages immediately)
2. Company detail redesign + extract reusable `DetailLayout`
3. Application bookmark feature
4. Events form accessibility + new event types
5. Documents sidebar fix

---

## Section 1: Shared Component Bug Fixes

### SidePanel — Opens on Left Instead of Right

The `SidePanel` component has a `position` prop defaulting to `"right"` but the fixed positioning CSS likely applies incorrect directional classes. Fix: ensure fixed panel uses `right-0` not `left-0`. Verify `PageLayout` doesn't wrap it in a way that reverses the positioning.

### PageLayout — Horizontal Scroll When Panel Opens

Currently uses `pr-[480px]` on the main content area to reserve space for the panel, which overflows the viewport. Fix: restructure to a flexbox split where the main area shrinks (`flex-1 min-w-0`) and the panel sits alongside it in the same flex row. No horizontal overflow.

### SidePanel — Content Not Vertically Scrollable

The scrollable area must live inside the panel's content container. Fix: ensure the content area has `overflow-y-auto` and `h-full` inside a flex column that fills the panel height. Header stays pinned, body scrolls.

### SidePanel — `headerActions` Prop

Add an optional `headerActions?: React.ReactNode` prop to `SidePanel`, rendered to the left of the X close button. Each detail component passes its own action buttons (edit pencil, archive trash, etc.) through this prop.

### UniversalTable — `rowActions` Prop

Add an optional `rowActions?: (row: T) => React.ReactNode` render prop to `UniversalTable`. Each page passes its own row-level action buttons:
- **Applications:** `ArchiveDialog` (existing component, prompts for reason)
- **Companies:** Simple archive button (no reason prompt)
- **Events:** No button passed

### Detail Components — Cards Fill Parent Width

Detail component cards don't stretch to fill the panel. Fix: wrapper divs use `w-full`, cards inside use full-width layout — remove any fixed or auto widths.

---

## Section 2: Company Detail Redesign + Reusable `DetailLayout`

### Reusable `DetailLayout` Component

**File:** `components/shared/detail-layout.tsx`

The shell used by all entity detail panels going forward. Props:

```typescript
interface DetailLayoutProps {
  icon: React.ReactNode;           // entity icon (Building, Briefcase, etc.)
  name: string;                    // primary title
  meta: Array<{                    // rows below name (location, website, etc.)
    icon: React.ReactNode;
    text: string;
    href?: string;
  }>;
  badges: React.ReactNode;         // badge row below meta
  headerActions?: React.ReactNode; // passed to SidePanel headerActions
  tabs: Array<{
    id: string;
    label: string;
    content: React.ReactNode;
  }>;
  defaultTab: string;
}
```

Header section (icon, name, meta rows, badges) is always visible and sticky above the tab list. A separator sits between header and tabs. Tab content scrolls within the panel body.

### `CompanyDetail` Rebuilt with `DetailLayout`

Replaces the current card-based `CompanyDetail`. Wires up:
- Icon: `Building2`
- Name: `company.name`
- Meta: location (MapPin icon), website (Globe icon, clickable link)
- Badges: aggregate app status badges + researched status + completeness percentage
- Header actions: edit (Pencil icon), archive (Trash icon)
- Tabs: Overview, Research, Apps (N), Links

#### Overview Tab

1. **Data Quality card** — label + quality badge (Excellent/Good/Fair/Needs Work) + "Completeness" label + percentage + full-width progress bar
2. **2-column key-value grid** — Industry, Company Size, Founded, Salary Range
3. **Ratings section** — Overall rating with star display + numeric score; Work-Life Balance, Compensation, Career Growth as numeric rows
4. **Description** — rendered as markdown

**Completeness calculation:** filled fields ÷ 14 tracked fields.
Tracked fields: `name`, `industry`, `location`, `size`, `founded_year`, `salary_range`, `description`, `website`, `culture`, `tech_stack`, `benefits`, `pros`, `cons`, `researched`.
Badge thresholds: 90–100% = Excellent, 70–89% = Good, 50–69% = Fair, <50% = Needs Work.

#### Research Tab

1. **Culture** — rendered as markdown
2. **Tech Stack** — light grey filled pills
3. **Benefits** — grey outlined pills
4. **Pros / Cons** — two-column side-by-side layout; "Pros" heading in green with bullet list, "Cons" heading in red with bullet list
5. **Notes** — rendered as markdown

#### Apps Tab

- Header row: app count on left, "Link Application" button (chain-link icon) on right
- List of application cards (informational only — no click behavior yet):
  - Role name (bold) + status badge (top right of card)
  - Applied date
  - Salary range
- Cards in chronological order

#### Links Tab

Vertical list of link cards:
- Type-specific icon on far left
- Name (bold) + full URL below
- External open icon on far right
- Full card is clickable (opens URL in new tab), subtle hover effect

Link types and icons:
- website → Globe
- careers → Briefcase
- news/blog → Newspaper
- linkedin → Linkedin
- glassdoor → Star (or custom)
- crunchbase → TrendingUp

---

## Section 3: Application Bookmark Feature

### Bookmark Button on Forms

Both `EasyAddForm` and `FullApplicationForm` get a `<Bookmark>` icon button to the right of the submit button. Clicking it:
- Calls `createApplication` with `status: "bookmarked"` and `applied_at: null`
- Does not trigger applied date auto-population
- Closes the form on success

### Bookmarked App Edit UX

When a bookmarked application is opened for editing, the form detects `status === "bookmarked"` and replaces the footer with:
- **"Set to Applied"** button — patches `status: "applied"` and `applied_at: new Date()`, closes form
- **"Cancel"** button — closes without saving

All other form fields remain editable normally.

### Finding Bookmarked Apps

No new UI needed. Users filter the applications table by `status = bookmarked` using the existing filter system.

### Remove Bookmark Button from Page Header

The existing bookmark button in the applications page header is removed entirely.

---

## Section 4: Events Form Accessibility + New Event Types

### Tab Stop on Date/Time Picker Icons

The calendar and clock trigger buttons (icon-only, open pickers) get `tabIndex={-1}`. Input fields remain tabbable; icon buttons do not consume a tab stop.

### Form Scrollability

`ScheduleDialog` content area gets `overflow-y-auto` with `max-h-[85vh]`. Header and footer stay fixed, body scrolls. Matches how applications and companies forms already handle this.

### Duration Field Keyboard Navigation

`DurationCombobox` gets an `onKeyDown` handler on the trigger: `ArrowDown`/`ArrowUp` moves through options, `Enter` selects. Consistent with native `<select>` behavior.

### Contacts Section Keyboard Search

`ContactCombobox`: when the combobox receives focus via Tab, the search input inside auto-focuses so the user can immediately type to filter contacts without using the mouse.

### Tab into New Contact Form

When user types a new name in the contacts search and hits Enter to create, the resulting inline creation form programmatically receives focus on its first field so keyboard-only users can complete it.

### New Event Types

Seven new values added to `EVENT_TYPE_OPTIONS` and `EVENT_TYPE_CONFIG`:

| Value | Label |
|---|---|
| `received-offer` | Received Offer |
| `accepted-offer` | Accepted Offer |
| `rejected-offer` | Rejected Offer |
| `offer-withdrawn` | Offer Withdrawn |
| `follow-up` | Follow Up |
| `hiring-manager` | Hiring Manager |
| `peer-interview` | Peer Interview |

Each type needs an entry in `EVENT_TYPE_CONFIG` with an appropriate icon and color so timeline and badge rendering work correctly.

---

## Section 5: Documents Sidebar Fix

The sidebar on the documents page is not snapping to the left edge of the screen. Fix: ensure the sidebar uses `left-0` positioning (or is the first child in a flex row layout) so it anchors correctly to the left side. No other layout changes.

---

## File Inventory (expected touches)

### Shared components
- `components/shared/side-panel.tsx` — add `headerActions` prop, fix position CSS
- `components/shared/page-layout.tsx` — fix flexbox layout, remove padding hack
- `components/shared/universal-table.tsx` — add `rowActions` prop
- `components/shared/detail-layout.tsx` — **new file**

### Company
- `components/companies/company-detail.tsx` — full rewrite using `DetailLayout`

### Applications
- `components/applications/easy-add-form.tsx` — add bookmark button
- `components/applications/full-application-form.tsx` — add bookmark button + bookmarked edit UX
- `routes/_authenticated/applications.tsx` — remove header bookmark button, wire `rowActions`

### Companies
- `routes/_authenticated/companies.tsx` — wire `rowActions` for archive

### Events
- `components/events/schedule-dialog.tsx` — scrollability, tab stops, new event types
- `components/events/duration-combobox.tsx` — keyboard navigation
- `components/events/contact-combobox.tsx` — keyboard search + tab into new contact form
- `lib/constants/events.ts` (or wherever `EVENT_TYPE_CONFIG` lives) — new types

### Documents
- `routes/_authenticated/documents.tsx` (or documents layout component) — sidebar positioning fix

---

## Success Criteria

- [ ] Detail panel opens on the right side on all three entity pages
- [ ] Opening a detail panel does not cause horizontal scroll
- [ ] Detail panel content is vertically scrollable
- [ ] Edit icon appears in panel header (left of X) for applications, companies, events
- [ ] Archive buttons appear in application and company table rows; events rows have none
- [ ] Cards in detail views fill the full panel width
- [ ] Company detail shows new tabbed layout matching the reference screenshots
- [ ] `DetailLayout` is extracted and reusable for future entity detail views
- [ ] Data quality completeness calculates correctly across 14 fields
- [ ] Bookmark button appears on both application forms
- [ ] Bookmarked apps show "Set to Applied" / "Cancel" footer when editing
- [ ] Bookmark button removed from applications page header
- [ ] Events form is scrollable on small screens
- [ ] Date/time picker icons are not tab stops
- [ ] Duration field navigable with arrow keys
- [ ] Contacts search reachable by keyboard
- [ ] New contact form reachable by Tab after creation
- [ ] 7 new event types appear in the type dropdown and render correctly in timeline/badges
- [ ] Documents sidebar snaps to left edge
