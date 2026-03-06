# UI Architecture

**Last updated:** 2026-03-04

---

## Overview

The frontend is a single-page application built with **TanStack Start** (SSR-capable framework) and **TanStack Router** (file-based routing). UI components are built on **Radix UI** primitives styled with **Tailwind CSS v4**. Data is fetched and cached via **TanStack Query**.

| Concern | Library |
| --- | --- |
| Framework | TanStack Start (Vite 7) |
| Routing | TanStack Router (file-based) |
| State management | TanStack Query + URL search params |
| Styling | Tailwind CSS v4 + CVA |
| Component primitives | Radix UI |
| Tables | TanStack React Table v8 |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Toasts | sonner |

All source lives in `frontend/src/`.

---

## Directory Structure

```
frontend/src/
├── components/
│   ├── applications/       # Application domain components
│   ├── auth/               # Login / signup forms
│   ├── companies/          # Company domain components
│   ├── dashboard/          # Dashboard widgets
│   ├── documents/          # Document management components
│   ├── events/             # Event / interview components
│   ├── layout/             # App shell (nav, theme, user menu)
│   ├── settings/           # Settings page tabs
│   ├── shared/             # Cross-domain shared components
│   └── ui/                 # Design system primitives (27 files)
├── hooks/                  # Custom React hooks
├── lib/
│   ├── queries/            # TanStack Query hooks per domain
│   └── supabase/           # Supabase client factories
├── routes/                 # TanStack Router file-based routes
│   ├── __root.tsx          # Provider stack + document head
│   ├── index.tsx           # Redirect to /dashboard
│   ├── login.tsx           # Public login page
│   └── _authenticated/     # Auth-gated route group
│       ├── _authenticated.tsx
│       ├── dashboard.tsx
│       ├── applications.tsx
│       ├── companies.tsx
│       ├── events.tsx
│       ├── documents.tsx
│       └── settings.tsx
├── schemas/
│   ├── table-schema.ts     # TableSchema<T> type definitions
│   └── table-schemas.tsx   # Concrete schema instances
└── styles/
    └── globals.css         # Tailwind v4 theme tokens
```

---

## Theme System

### Design Tokens

`frontend/src/styles/globals.css` defines all design tokens as CSS custom properties using **Tailwind v4 `@theme inline`** with **oklch** color space.

```css
@theme inline {
  --color-background: oklch(1 0 0);          /* white */
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0 0);
  --color-muted: oklch(0.97 0 0);
  --color-border: oklch(0.922 0 0);
  --color-destructive: oklch(0.577 0.245 27.325);
  --radius: 0.625rem;
  /* ... more tokens ... */
}

.dark {
  --color-background: oklch(0.145 0 0);      /* near-black */
  --color-primary: oklch(0.922 0 0);         /* near-white */
  --color-muted: oklch(0.269 0 0);
  --color-border: oklch(0.269 0 0);
  /* ... */
}
```

All Tailwind utility classes (e.g. `bg-background`, `text-foreground`, `border-border`) resolve to these CSS custom properties.

### ThemeProvider

`frontend/src/components/layout/theme-provider.tsx`

React Context that manages the active theme. Default is `'dark'`.

```tsx
const ThemeContext = createContext<ThemeContextValue>(...)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('tracker-theme')
    if (saved) setTheme(saved as Theme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('tracker-theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
```

**localStorage key:** `tracker-theme`

The `dark` class is toggled on `document.documentElement` to activate the `.dark` CSS block.

### Flash Prevention

`frontend/src/routes/__root.tsx` injects an inline script that reads `localStorage` and sets the `dark` class **before** React hydrates, preventing a flash of unstyled content:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      const theme = localStorage.getItem('tracker-theme') ?? 'dark';
      if (theme === 'dark') document.documentElement.classList.add('dark');
    `,
  }}
/>
```

---

## Provider Stack

`frontend/src/routes/__root.tsx` wraps the entire application in the following provider hierarchy:

```
QueryClientProvider (staleTime: 5 min, retry: 1)
  └── ThemeProvider
        └── TooltipProvider
              └── Outlet (route content)
              └── Toaster (sonner)
```

QueryClient config:
- `staleTime: 5 * 60 * 1000` (5 minutes)
- `retry: 1`

---

## Layout Architecture

### NavBar

`frontend/src/components/layout/nav-bar.tsx`

Sticky top navigation bar (`sticky top-0 z-50`). Height: `h-16`.

**Desktop layout:** Logo · nav links (ghost Button + Link) · ThemeToggle · UserMenu

**Mobile layout:** Logo · hamburger icon → Sheet drawer with vertical nav links

Nav links:
- Dashboard → `/dashboard`
- Applications → `/applications`
- Events → `/events`
- Companies → `/companies`
- Documents → `/documents`

Active link styles are applied via TanStack Router's `activeProps` on the `<Link>` component.

### PageShell

`frontend/src/components/layout/page-shell.tsx`

Simple max-width container used on pages that don't use `PageLayout`:

```tsx
<main className="mx-auto max-w-7xl p-6">{children}</main>
```

### PageLayout

`frontend/src/components/shared/page-layout.tsx`

The primary layout for all list pages. Renders the main content area alongside an optional slide-in detail panel.

```tsx
interface PageLayoutProps {
  children: ReactNode            // main content (table, filters, pagination)
  detailPanel?: ReactNode        // detail component to show in SidePanel
  onDetailClose?: () => void     // called when panel is closed
  detailWidth?: 'sm' | 'md' | 'lg' | 'xl'  // default: 'lg'
  showDetailPanel?: boolean      // explicit override
  detailHeaderActions?: ReactNode // edit/archive buttons in panel header
}
```

When `detailPanel` is non-null and `showDetailPanel` is not explicitly false, a `SidePanel` opens on the right.

### SidePanel

`frontend/src/components/shared/side-panel.tsx`

Responsive sliding panel that hosts detail views.

| Breakpoint | Behaviour |
| --- | --- |
| Desktop | Fixed `<aside>` positioned to the right of the main content; backdrop overlay |
| Mobile | Bottom Sheet (`max-h-[80vh]`) using the `Sheet` UI component |

Width variants:

| Prop | Desktop width |
| --- | --- |
| `sm` | 360px |
| `md` | 480px |
| `lg` | 600px (default) |
| `xl` | 800px |

### DetailLayout

`frontend/src/components/shared/detail-layout.tsx`

Standardized header for detail panel content. Accepts structured metadata and renders a consistent icon → name → meta → badges → tabs layout.

```tsx
interface DetailLayoutProps {
  icon?: ReactNode
  name: string
  meta?: Array<{ icon: ReactNode; text: string; href?: string }>
  badges?: ReactNode
  tabs: Array<{ id: string; label: string; content: ReactNode }>
  defaultTab?: string
}
```

---

## Page Composition Pattern

All list pages follow a consistent composition:

```
PageLayout
  ├── children
  │   ├── page header (h1, subtitle, action buttons)
  │   ├── [stats bar]
  │   ├── filter bar
  │   ├── UniversalTable (or bespoke table)
  │   └── pagination controls
  └── detailPanel → SidePanel
        └── [Domain]Detail component
```

Example — Applications page (`/applications`):

```tsx
<PageLayout
  detailPanel={selectedApp ? <ApplicationDetail application={selectedApp} /> : null}
  onDetailClose={...}
  detailWidth="lg"
  detailHeaderActions={<Button onClick={...}><PencilIcon /></Button>}
>
  <ApplicationStats />
  <ApplicationFilters ... />
  <UniversalTable data={applications} schema={applicationTableSchema} ... />
  {/* pagination */}
  <FullApplicationForm ... />
  <EasyAddForm ... />
</PageLayout>
```

---

## URL Search State

All list pages persist UI state (filters, pagination, sorting, selected detail ID) in URL search params via TanStack Router `validateSearch`.

Pattern:

```tsx
const searchSchema = z.object({
  search: z.string().optional().catch(undefined),
  status: z.union([z.string(), z.array(z.string())]).optional().catch(undefined),
  page: z.coerce.number().optional().catch(1),
  pageSize: z.coerce.number().optional().catch(25),
  sort: z.string().optional().catch(undefined),
  detail: z.string().optional().catch(undefined),  // selected row ID
})

export const Route = createFileRoute('/_authenticated/applications')({
  validateSearch: (raw) => searchSchema.parse(raw),
  component: ApplicationsPage,
})
```

Updates use `navigate({ to: '.', search: prev => ({ ...prev, ...updates }), replace: true })`.

Sort format: `"column_id.asc"` or `"column_id.desc"`.

---

## Table System

### UniversalTable

`frontend/src/components/shared/universal-table.tsx`

A generic wrapper around TanStack React Table that accepts a `TableSchema<T>` config.

```tsx
interface UniversalTableProps<T extends object> {
  data: T[]
  schema: TableSchema<T>
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  onRowClick?: (row: T) => void
  selectedId?: string | null       // highlights selected row
  rowActions?: (row: T) => ReactNode  // injected as last column
  isLoading?: boolean
  emptyMessage?: string
}
```

Row clicks navigate to the detail panel by setting `detail` in the URL. The `rowActions` slot injects per-row action buttons (e.g. `ArchiveDialog`) without encoding them in the schema.

Manual sorting and pagination — the table is always in server-driven mode (`manualSorting: true`, `manualPagination: true`).

### TableSchema

`frontend/src/schemas/table-schema.ts`

```typescript
type ColumnType = 'text' | 'number' | 'date' | 'datetime' | 'enum' | 'relation'

interface ColumnSchema<T> {
  id: string           // dot-notation path for nested access (e.g. 'company.name')
  header: string
  type: ColumnType
  sortable: boolean
  minWidth: number
  grow?: number        // flex-grow factor
  align?: 'left' | 'center' | 'right'
  cell?: (row: T) => ReactNode  // custom renderer
  options?: string[]   // enum values for filtering
}

interface TableSchema<T> {
  readonly columns: ReadonlyArray<ColumnSchema<T>>
}
```

### Concrete Schemas

`frontend/src/schemas/table-schemas.tsx`

Three concrete schema instances with inline `cell` renderers:

| Export | Used by |
| --- | --- |
| `applicationTableSchema` | `ApplicationsPage` |
| `companyTableSchema` | `CompaniesPage` |
| `eventTableSchema` | `EventsPage` |

**Note:** `ApplicationTable` in `components/applications/application-table.tsx` is a bespoke table (built directly with TanStack Table) that is **not** driven by `TableSchema`. It was implemented before `UniversalTable` was introduced. The route page currently uses `UniversalTable` with `applicationTableSchema` instead.

### useTableState Hook

`frontend/src/hooks/use-table-state.ts`

Encapsulates local table state for pages that don't use URL params:

```tsx
const {
  filters, setFilters, updateFilter,
  sorting, setSorting,
  page, pageSize, setPage, setPageSize,
  selectedId, setSelectedId,
  resetFilters, resetSorting, resetAll,
} = useTableState()
```

---

## UI Primitives

All 27 components in `frontend/src/components/ui/` are thin wrappers around **Radix UI** primitives styled with Tailwind. Component variants use **CVA** (class-variance-authority).

### Button

`button.tsx` — The most-used primitive.

**Variants:** `default` | `destructive` | `outline` | `secondary` | `ghost` | `link`

**Sizes:** `xs` | `sm` | `default` | `lg` | `icon` | `icon-xs` | `icon-sm` | `icon-lg`

`asChild` prop supported via Radix `Slot.Root` — renders children as the root element instead of `<button>`.

```tsx
<Button variant="outline" size="sm" asChild>
  <Link to="/companies">View Company</Link>
</Button>
```

### Badge

`badge.tsx`

**Variants:** `default` | `secondary` | `destructive` | `outline` | `ghost` | `link`

`asChild` supported. Used for status/interest chips throughout.

### Status and Interest Color Maps

Defined in `table-schemas.tsx` and locally in `application-table.tsx`:

**Application status:**

| Status | Color |
| --- | --- |
| bookmarked | gray |
| applied | blue |
| interviewing | yellow |
| offer | green |
| accepted | emerald |
| rejected | red |
| archived | slate |

**Application interest:**

| Interest | Color |
| --- | --- |
| low | slate |
| medium | blue |
| high | orange |
| dream | purple |

**Event status:**

| Status | Color |
| --- | --- |
| scheduled | blue |
| completed | green |
| cancelled | red |
| rescheduled | amber |
| availability-requested | purple |
| availability-submitted | indigo |
| no-show | gray |

### Card

`card.tsx` — `Card` + `CardHeader` + `CardTitle` + `CardDescription` + `CardContent` + `CardFooter`

### Dialog

`dialog.tsx` — Radix Dialog. Used for confirmation dialogs and simple forms. `DialogContent` renders into a Portal with backdrop overlay.

### Sheet

`sheet.tsx` — Radix Dialog variant that slides in from an edge (`left`, `right`, `top`, `bottom`). Used for the mobile `SidePanel` and for `FullApplicationForm`.

### Select

`select.tsx` — Radix Select. Composed as `SelectTrigger` / `SelectContent` / `SelectItem`.

### Tabs

`tabs.tsx` — Radix Tabs. Composed as `TabsList` / `TabsTrigger` / `TabsContent`. Used in `DetailLayout`.

### Command

`command.tsx` — cmdk-based command palette. Powers all combobox components.

### DatePickerField

`date-picker-field.tsx` — Calendar popover with formatted date display. Built on Radix Popover + react-day-picker Calendar.

### MarkdownContent

`markdown-content.tsx` — Renders markdown string as HTML via react-markdown. Used for job descriptions.

### SalaryRangeSlider

`salary-range-slider.tsx` — Dual-thumb slider for salary min/max input.

### StarRating

`star-rating.tsx` — Read-only star rating display (used for company ratings).

### TagInput

`tag-input.tsx` — Chip-style text input. Press Enter or comma to add a tag, click × or Backspace to remove.

### UrlInput

`url-input.tsx` — Text input with URL format validation.

### Additional Primitives

| Component | Radix primitive |
| --- | --- |
| `Avatar` | `@radix-ui/react-avatar` |
| `Calendar` | react-day-picker |
| `Checkbox` | `@radix-ui/react-checkbox` |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` |
| `Input` | — (plain `<input>`) |
| `Label` | `@radix-ui/react-label` |
| `Popover` | `@radix-ui/react-popover` |
| `ScrollArea` | `@radix-ui/react-scroll-area` |
| `Separator` | `@radix-ui/react-separator` |
| `Sonner` | sonner (toast) |
| `Switch` | `@radix-ui/react-switch` |
| `Table` | — (plain `<table>`) |
| `Tooltip` | `@radix-ui/react-tooltip` |

---

## Domain Components

### Applications

`frontend/src/components/applications/`

| Component | Description |
| --- | --- |
| `ApplicationTable` | Bespoke TanStack Table. Columns: position, company, status, interest, locations, salary, applied, updated, row actions. Formats salary as `$Xk–$Yk/yr`. |
| `ApplicationDetail` | Full detail view rendered inside `SidePanel`. Sections: breadcrumb, header (company/position/status badges), info card (details `<dl>`), job description (MarkdownContent), documents (ApplicationDocuments), timeline (EventTimeline + milestones). |
| `ApplicationFilters` | Filter bar with debounced search input (300ms) and multi-select Popover filters for status, interest, work type, employment type, plus a column visibility toggle. |
| `ApplicationStats` | Compact stat row: active, applied, interviewing, offers counts. |
| `ApplicationDocuments` | Attached document snapshots with snapshot/detach actions. |
| `ApplicationForm` | Edit dialog for an existing application (react-hook-form). |
| `EasyAddForm` | Minimal Dialog: company combobox, position, URL, optional resume picker. Bookmark button → `status: bookmarked`; Submit → `status: applied`. Persists last-used resume ID to `localStorage` (`tracker:default_resume_id`). |
| `FullApplicationForm` | Comprehensive Sheet form covering all application fields, presented as a multi-section form. |
| `UrlImportDialog` | Prompts for a job URL, extracts structured data, pre-populates FullApplicationForm via `importData` prop. |
| `AddEventDialog` | Create event linked to an application and company. |
| `EventTimeline` | Vertical timeline of interview events for an application with type/status badges. |
| `ArchiveDialog` | Confirmation dialog to archive an application. |
| `CompanyCombobox` | Searchable combobox that queries existing companies; creates inline if no match. |
| `CityCombobox` / `CityMultiCombobox` | City name search (single or multi-select). |
| `SourceCombobox` | Job source selection (LinkedIn, Indeed, Referral, etc.). |

### Companies

`frontend/src/components/companies/`

| Component | Description |
| --- | --- |
| `CompanyTable` | `UniversalTable` + `companyTableSchema`. Columns: name, industry, location, size, researched. |
| `CompanyDetail` | Detail panel with rating, culture notes, pros/cons, tech stack, external links (website/careers/LinkedIn/Glassdoor/Crunchbase/news). |
| `CompanyCard` | Card-format summary used in `CompanyDirectory`. |
| `CompanyDirectory` | Searchable card grid of companies. |
| `CompanyContacts` | Contacts linked to a company with add/remove capability. |
| `CompanyForm` | Create/edit dialog. |
| `IndustryCombobox` | Predefined industry list with free-text fallback. |

### Dashboard

`frontend/src/components/dashboard/`

The dashboard does **not** use `PageLayout` — it renders a bare `<div className="space-y-6 p-4 md:p-8">`.

| Component | Description |
| --- | --- |
| `StatsCards` | 2×4 responsive grid of stat cards. Stats: total applications, upcoming interviews, active applications, response rate (%), offers, rejections, contacts, companies. Skeleton loading state. |
| `RecentActivity` | Feed of recent application/event changes. |
| `QuickActions` | Shortcut buttons: Add Application, Schedule Interview, Add Company, etc. |
| `ApplicationFunnelChart` | Chart placeholder (funnel by status). |
| `ApplicationTrendsChart` | Chart placeholder (applications over time). |
| `DistributionChart` | Chart placeholder (source/type distribution). |
| `SuccessMetricsChart` | Chart placeholder (response/conversion rates). |

Chart components are current placeholders awaiting real chart library integration.

### Documents

`frontend/src/components/documents/`

| Component | Description |
| --- | --- |
| `DocumentEditor` | Text/markdown content editor with save/cancel. |
| `DocumentPicker` | Browse all documents with type/name filtering. |
| `DocumentSidebar` | Revision history sidebar showing parent chain. |
| `DocumentTypePicker` | Filtered picker by document type (resume, cover letter, etc.). |
| `UploadDialog` | File upload dialog for PDFs and other files. |

### Events

`frontend/src/components/events/`

| Component | Description |
| --- | --- |
| `EventList` | `UniversalTable` + `eventTableSchema`. Columns: company, position, type, status, scheduled date. |
| `EventDetail` | Detail panel with scheduling info, contacts, notes, and links. |
| `ScheduleDialog` | Create/edit event with all scheduling fields: type, status, title, date/time, duration, URL, notes. |
| `ContactCombobox` | Contact search with create-inline capability. |
| `DurationCombobox` | Predefined duration options (30 min, 1 hr, etc.). |

### Settings

`frontend/src/components/settings/`

| Component | Description |
| --- | --- |
| `GeneralTab` | General settings: display name, theme override, locale, notification preferences. |

### Auth

`frontend/src/components/auth/`

| Component | Description |
| --- | --- |
| `LoginForm` | Email + password sign in. Calls `supabase.auth.signInWithPassword`. |
| `SignupForm` | Email + password registration. Calls `supabase.auth.signUp`. |

Both forms are rendered inside a `Dialog` opened from `UserMenu`.

### Layout

`frontend/src/components/layout/`

| Component | Description |
| --- | --- |
| `NavBar` | Sticky top nav with responsive mobile drawer (Sheet). |
| `PageShell` | `<main className="mx-auto max-w-7xl p-6">` wrapper. |
| `ThemeProvider` | Dark/light mode context. Default: `dark`. localStorage key: `tracker-theme`. |
| `ThemeToggle` | Icon button that cycles between light and dark. |
| `UserMenu` | Avatar dropdown: email display, Settings link, Sign Out. Opens Login/Signup dialogs for unauthenticated state. |

---

## Form Pattern

All forms use **react-hook-form** with **Zod** schemas via `@hookform/resolvers/zod`.

```tsx
const schema = z.object({
  company_id: z.string().min(1, 'Required'),
  position: z.string().min(1, 'Required'),
})

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { company_id: '', position: '' },
})
```

Error display convention:

```tsx
{errors.field && (
  <p className="text-sm text-destructive">{errors.field.message}</p>
)}
```

Submit button pattern:

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>
```

**Form entry points for applications:**

| Dialog | When to use |
| --- | --- |
| `EasyAddForm` | Quick-capture: company + position only. Two outcomes: Bookmark or Apply. |
| `UrlImportDialog` → `FullApplicationForm` | Paste a job URL, auto-extract company/position/description, then complete in full form. |
| `FullApplicationForm` | Directly open the full form (from "New Application" button). |
| `ApplicationForm` | Edit an existing application. |

---

## Filter Pattern

Filter bars use a consistent pattern: debounced search input + `MultiSelectFilter` Popover components.

`MultiSelectFilter` renders a `Popover` trigger button with a count badge when filters are active, and a checkbox list inside the popover:

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      Status {count > 0 && <span>{count}</span>}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    {options.map(option => (
      <label>
        <Checkbox checked={selected.includes(option.value)} ... />
        {option.label}
      </label>
    ))}
  </PopoverContent>
</Popover>
```

Search input uses a 300ms debounce before propagating to query params.

---

## Authentication UI

### Route Guard

`frontend/src/routes/_authenticated/_authenticated.tsx` contains a `beforeLoad` hook that calls a `createServerFn` to verify the session cookie. If no valid session exists, it throws a redirect to `/login`.

All routes under `_authenticated/` inherit this guard.

### Login Page

`frontend/src/routes/login.tsx` — public route. Renders `LoginForm` + `SignupForm` tab switcher.

### UserMenu Auth State

`UserMenu` subscribes to `supabase.auth.onAuthStateChange` to reactively update the avatar/menu content. Sign-out calls `supabase.auth.signOut()` then navigates to `/`.

---

## localStorage Keys

| Key | Value | Set by |
| --- | --- | --- |
| `tracker-theme` | `'dark'` \| `'light'` | `ThemeProvider` |
| `tracker:default_resume_id` | document UUID | `EasyAddForm` (remembers last-used resume) |

---

## Testing

Component tests use **Vitest** + **@testing-library/react**.

Test files co-locate with their components in `__tests__/` subdirectories:

```
components/applications/__tests__/
  application-table.test.tsx
  application-filters.test.tsx
  easy-add-form.test.tsx
  ...
```

All test files use the `.test.tsx` extension. There are no `.spec.tsx` files.

Mock pattern: TanStack Query hooks are mocked at the module level; Supabase client is mocked via `vi.mock('@/lib/supabase/client')`.
