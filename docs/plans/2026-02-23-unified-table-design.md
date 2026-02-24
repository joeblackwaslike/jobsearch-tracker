# Unified Table Component with Side Panel Detail View

**Date:** 2026-02-23
**Status:** Approved
**Approach:** Type-Safe Schema Definitions with Page-Level State (Approach 3)

---

## Overview

Create a unified, type-safe table component that works for Applications, Companies, and Events entities. Tables should expand to fill available space with fixed minimum widths and grow-based distribution. Clicking a row opens a side panel detail view that displays entity-specific fields and related models when valuable.

---

## Architecture

### Core Components

1. **`UniversalTable<T>`** - Type-safe table component rendering any entity based on schema configuration. Handles column rendering, sorting, row selection, and column visibility. Pure presentation component.

2. **`TableSchema<T>`** - Configuration object defining columns, their types, widths, and behavior. Type-safe and exported by each entity.

3. **`PageLayout`** - Layout wrapper managing side panel slot. Handles responsive behavior (side panel on desktop, bottom sheet on mobile), animation, and close interactions.

4. **`SidePanel`** - Generic container for detail views. Manages width variants, scrolling, and dismissal.

5. **`useTableState`** - Hook encapsulating common table state (filters, sorting, selection, pagination). Reduces boilerplate across pages.

6. **Entity Detail Components** - `ApplicationDetail`, `CompanyDetail`, `EventDetail` - Pure presentation components showing entity details and related models.

### File Structure

```
frontend/src/
  hooks/
    use-table-state.ts
  components/
    shared/
      universal-table.tsx
      page-layout.tsx
      side-panel.tsx
    applications/
      application-detail.tsx
    companies/
      company-detail.tsx
    events/
      event-detail.tsx
  schemas/
    table-schema.ts
    table-schemas.ts
  lib/
    formatters.ts
```

### Data Flow

```
Page → useTableState → filters/sorting/pagination/selection
Page → data hooks (useApplications, etc.) → filtered/sorted data
Page → UniversalTable → renders table based on schema
User clicks row → Page updates selectedId
Page → detail hooks (useApplication, etc.) → selected entity
Page → PageLayout detailPanel slot → DetailComponent renders
```

---

## Schema Definitions

### TableSchema Type

```typescript
export type ColumnType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "enum"
  | "relation";

export interface ColumnSchema<T = unknown> {
  id: string;
  header: string;
  type: ColumnType;
  sortable: boolean;
  minWidth: number;
  grow?: number; // flex grow factor, defaults to 1
  align?: "left" | "center" | "right";
  cell?: (row: T) => React.ReactNode; // custom cell renderer
  options?: string[]; // for enum type columns
}

export interface TableSchema<T = unknown> {
  columns: ColumnSchema<T>[];
}

export type SchemaData<T> = T extends TableSchema<infer U> ? U : never;
```

### Application Schema

Columns: Position, Company, Status, Interest, Location, Salary, Applied Date, Updated Date.

- `position`: text, sortable, grow=2, minWidth=200px
- `company.name`: relation, grow=1.5, minWidth=150px
- `status`: enum, custom badge renderer, minWidth=120px
- `interest`: enum, custom badge renderer, minWidth=120px
- `location`: text, grow=1, minWidth=150px
- `applied_at`: date, sortable, minWidth=130px
- `updated_at`: datetime, sortable, minWidth=140px

### Company Schema

Columns: Name, Industry, Location, Size, Researched, Tags.

- `name`: text, grow=2, minWidth=200px
- `industry`: text, grow=1, minWidth=150px
- `location`: text, grow=1, minWidth=150px
- `size`: text, grow=0.5, minWidth=120px
- `researched`: enum, centered, minWidth=100px
- `tags`: text, custom truncated list renderer, grow=1, minWidth=150px

### Event Schema

Columns: Company, Position, Type, Status, Date.

- `application.company.name`: relation, grow=1.5, minWidth=180px
- `application.position`: relation, grow=2, minWidth=200px
- `type`: enum, minWidth=120px
- `status`: enum, custom badge renderer, minWidth=140px
- `scheduled_at`: datetime, sortable, minWidth=180px

---

## Components

### UniversalTable<T>

Features:
- Type-safe with generics
- Custom cell renderers via schema
- Fixed minimum widths with grow-based proportional distribution
- Sortable columns with visual indicators (up/down/sort icons)
- Row selection highlighting
- Handles nested properties (e.g., `company.name`)
- Default cell renderers for text, number, date, datetime, enum types
- Empty state with helpful message

### SidePanel

Features:
- Desktop: Right-side panel with backdrop
- Mobile: Bottom sheet with full-width
- Configurable width variants (sm: 360px, md: 480px, lg: 600px, xl: 800px)
- Smooth animations (300ms ease-in-out)
- Header with close button
- Scrollable content area
- Backdrop with blur effect

### PageLayout

Features:
- Composes main content + side panel
- Main content area shrinks/reserves space when panel is open
- Smooth transitions
- Configurable detail panel width
- Optional detail panel prop (null = no panel)

### useTableState Hook

Features:
- Type-safe filters with generics
- Common state patterns: filters, sorting, pagination, selection
- Helper methods: `updateFilter`, `resetFilters`, `resetSorting`, `resetAll`
- Clean API for pages

### Entity Detail Components

#### ApplicationDetail

Sections:
- Company info card (name, industry)
- Position details card (position, status, interest badges, location, salary, applied/updated dates)
- Events card (related events list with type, date, status badges)
- Description card (if present)

#### CompanyDetail

Sections:
- Header with name and website link
- Company information card (industry, location, size, research status)
- Contact card (email, phone)
- Tags card (list of badges)
- Ratings card (star ratings display)
- Notes card (if present)

#### EventDetail

Sections:
- Header with title and status badge
- Related Application card (company, position, link to view application)
- Event Details card (type badge, date/time, duration, contact person)
- Meeting Link card (with open button)
- Notes card (if present)

---

## Date Formatting

Using `date-fns` package for all date/time formatting:

```typescript
import { format, formatDistanceToNow, isValid } from "date-fns";

// Date: "Feb 23, 2026"
formatDate(dateString: string | null): string

// DateTime: "Feb 23, 2026 8:30 AM"
formatDateTime(isoString: string | null): string

// Relative: "2 days ago", "5 hours ago"
formatRelativeTime(dateString: string): string

// Duration: "45m", "2h 30m"
formatDuration(minutes: number | null): string
```

---

## Key Design Decisions

### Why Approach 3 (Page-Level State)?

- **Flexibility**: Easy to change layout (side panel, modal, split view) by modifying PageLayout once
- **Decoupling**: Side panel logic is separate from table, allowing different detail views per entity
- **Future-proof**: Adding new pages (Documents, etc.) reuses PageLayout immediately
- **Entity-specific behavior**: Each page can customize filters, actions, and detail view as needed

### Why Type-Safe Schema Definitions?

- **Full TypeScript type safety**: Compile-time errors, autocomplete
- **Explicit and predictable**: Clear what each column does
- **Customization easy**: Custom cell renderers for badges, truncated lists, etc.
- **No runtime overhead**: No schema queries or code generation
- **Testable**: Schemas are just objects, easy to mock

### Why Fixed Minimum + Grow Widths?

- **Professional appearance**: Table fills available space regardless of content
- **No awkward resizing**: Adding/removing rows doesn't shift table width
- **Proportional distribution**: Important columns get more space via `grow` factor
- **Responsive minimums**: Columns don't become unusably narrow on small screens

---

## Implementation Notes

### Dependencies

- `date-fns` - installed via pnpm
- Existing: `@tanstack/react-table`, `lucide-react`, shadcn/ui components

### Column Width Calculation

```
totalGrow = sum(column.grow for all columns)
column.width = minmax(column.minWidth, (column.grow / totalGrow) * 100%)
```

### Mobile Responsiveness

- Side panel transforms to bottom sheet on screens < 768px
- Bottom sheet max-height: 80vh
- Tables maintain horizontal scroll on mobile

### Testing Strategy

1. **Unit tests**: Schema definitions, useTableState hook
2. **Component tests**: UniversalTable with mock data, SidePanel open/close
3. **Integration tests**: Full page with table + side panel selection
4. **E2E tests**: Real user workflows with browser automation (as requested for verification)

---

## Migration Plan

### Phase 1: Foundation
1. Create `lib/formatters.ts` with date-fns functions
2. Create `schemas/table-schema.ts` with types
3. Create `schemas/table-schemas.ts` with entity schemas
4. Create `hooks/use-table-state.ts`

### Phase 2: Layout Components
5. Create `components/shared/side-panel.tsx`
6. Create `components/shared/page-layout.tsx`
7. Create `components/shared/universal-table.tsx`

### Phase 3: Detail Components
8. Create `components/applications/application-detail.tsx`
9. Create `components/companies/company-detail.tsx`
10. Create `components/events/event-detail.tsx`

### Phase 4: Page Refactors
11. Refactor `routes/_authenticated/applications.tsx` to use new components
12. Refactor `routes/_authenticated/companies.tsx` to use new components
13. Refactor `routes/_authenticated/events.tsx` to use new components (add table view)

### Phase 5: Verification
14. Run browser automation to verify tables fill available space correctly
15. Run browser automation to verify side panel works on desktop and mobile
16. Test all three pages end-to-end

### Phase 6: Cleanup
17. Remove old components: `application-table.tsx`, `company-table.tsx`, `event-list.tsx` (cards)
18. Update tests for new components
19. Remove unused imports/exports

---

## Success Criteria

- [ ] Applications page uses `UniversalTable` with `applicationTableSchema`
- [ ] Companies page uses `UniversalTable` with `companyTableSchema`
- [ ] Events page uses `UniversalTable` with `eventTableSchema`
- [ ] Table columns expand to fill available space (not sized by content)
- [ ] Clicking row opens side panel with entity details
- [ ] Side panel shows related entities when valuable (Events → Application)
- [ ] Mobile shows bottom sheet, desktop shows side panel
- [ ] All dates formatted with date-fns
- [ ] Browser automation confirms tables work correctly
- [ ] All existing tests pass
