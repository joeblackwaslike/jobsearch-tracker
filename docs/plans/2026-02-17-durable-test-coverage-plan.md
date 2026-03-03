# Durable Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add durable, backend-agnostic test coverage for all core user-facing components and forms, prioritizing the user stories that matter most.

**Architecture:** All tests mock at the React Query hook boundary (`vi.mock("@/lib/queries/...")`) — never at the Supabase client level. This means when the backend migrates from PostgREST to FastAPI, only the query files change; every test file stays identical. Tests assert on rendered output (`screen.getByText`, `screen.getByRole`) and user interactions (`userEvent.click`, `userEvent.type`), never on internal state or implementation details.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/user-event, existing `@/test/test-utils` wrapper (provides QueryClientProvider)

**Existing test conventions** (follow these exactly):
- Import from `@/test/test-utils` instead of `@testing-library/react`
- Mock modules with `vi.mock("@/lib/queries/...")` at file top
- Use `const mutateAsyncMock = vi.fn()` pattern for mutations
- Use `userEvent.setup()` for user interactions
- Use `waitFor()` for async assertions
- Use `beforeEach` with `mockReset()` for mutation mocks

---

## Tier 1: Highest Value (Core Forms & User Stories)

### Task 1: ApplicationTable component tests

**Files:**
- Create: `frontend/src/components/applications/__tests__/application-table.test.tsx`
- Reference: `frontend/src/components/applications/application-table.tsx`

**Context:** ApplicationTable is the main data display for applications. It uses TanStack Table with manual sorting/pagination. It renders columns for position, company, status (colored badges), interest, location, salary, applied date, updated date. Clicking a row navigates to `/applications/{id}`. Empty state shows "No applications found".

**Mocks needed:**
```tsx
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/lib/queries/applications", () => ({
  useArchiveApplication: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));
```

**Test cases (5 tests):**

1. **Renders rows with position, company, and status badge** — Pass mock data array with 2 items, assert both positions visible, company names visible, status badges visible with correct text (capitalize first letter)
2. **Renders empty state when data is empty** — Pass empty array, assert "No applications found" and the help text visible
3. **Renders salary column with formatted values** — Pass data with `salary: { min: 100000, max: 150000, period: "yearly" }`, assert `$100k - $150k/yr` visible
4. **Calls navigate on row click** — Click a row, assert `navigateMock` called with `{ to: "/applications/{id}" }`
5. **Renders interest badge when present, dash when absent** — One item with `interest: "high"` shows "High", another with `interest: null` shows "-"

**Mock data shape:**
```tsx
const mockData: ApplicationListItem[] = [
  {
    id: "app-1",
    user_id: "u1",
    company_id: "c1",
    position: "Senior Engineer",
    url: null,
    status: "applied",
    work_type: "remote",
    employment_type: "full-time",
    location: "San Francisco",
    salary: { min: 100000, max: 150000, currency: "USD", period: "yearly" },
    job_description: null,
    interest: "high",
    source: null,
    tags: null,
    applied_at: "2026-01-15",
    archived_at: null,
    archived_reason: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
    company: { name: "Acme Corp" },
  },
];
```

**Step 1:** Write all test cases
**Step 2:** Run `cd frontend && npx vitest run src/components/applications/__tests__/application-table.test.tsx`
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add ApplicationTable component tests`

---

### Task 2: ApplicationFilters component tests

**Files:**
- Create: `frontend/src/components/applications/__tests__/application-filters.test.tsx`
- Reference: `frontend/src/components/applications/application-filters.tsx`

**Context:** ApplicationFilters renders a search input (debounced 300ms), 4 multi-select filter popovers (Status, Interest, Work Type, Employment), a Columns visibility toggle, and a "Clear filters" button that only appears when filters are active. The `onFiltersChange` callback receives the updated filter state.

**No query mocks needed** — this is a pure presentational component that receives props.

**Test cases (5 tests):**

1. **Renders search input and all filter buttons** — Assert placeholder "Search applications..." visible, buttons "Status", "Interest", "Work Type", "Employment", "Columns" all visible
2. **Calls onFiltersChange with search text after debounce** — Type "engineer" into search, use `vi.advanceTimersByTime(300)`, assert `onFiltersChange` called with `{ search: "engineer" }`
3. **Shows Clear filters button only when filters are active** — Render with empty filters, assert "Clear filters" not visible. Render with `{ status: ["applied"] }`, assert "Clear filters" visible
4. **Calls onFiltersChange with empty object when Clear filters clicked** — Render with active filters, click "Clear filters", assert `onFiltersChange({})` called
5. **Shows filter count badge when items selected** — Render with `{ status: ["applied", "interviewing"] }`, assert the Status button shows count badge "2"

**Important:** Use `vi.useFakeTimers()` and `vi.useRealTimers()` for debounce testing.

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add ApplicationFilters component tests`

---

### Task 3: EventTimeline component tests

**Files:**
- Create: `frontend/src/components/applications/__tests__/event-timeline.test.tsx`
- Reference: `frontend/src/components/applications/event-timeline.tsx`

**Context:** EventTimeline renders a vertical timeline of events. Each event shows an icon (per type), the event type label, a status badge, optional title, and formatted date. Events have expandable details (description, URL, duration). Empty state shows "No events yet" message. Uses `useDeleteEvent` for deletion.

**Mocks needed:**
```tsx
vi.mock("@/lib/queries/events", () => ({
  useDeleteEvent: () => ({
    mutateAsync: deleteMock,
    isPending: false,
  }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
  useRemoveInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({}));

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

Also mock `useCreateEvent` and `useUpdateEvent` since `AddEventDialog` (imported by EventTimeline) uses them:
```tsx
// Add to events mock:
useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
useUpdateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
```

**Test cases (4 tests):**

1. **Renders empty state when no events** — Pass empty array, assert "No events yet. Add an event to start tracking your timeline." visible
2. **Renders event type labels and status badges** — Pass 2 events (screening-interview/scheduled, offer/completed), assert "Screening Interview" and "Offer" visible, "Scheduled" and "Completed" badges visible
3. **Renders event title and formatted date** — Pass event with `title: "Phone screen with HR"` and `scheduled_at`, assert title and formatted date visible
4. **Renders multiple events in order** — Pass 3 events, assert all type labels rendered in DOM order

**Mock event shape:**
```tsx
const mockEvent = {
  id: "evt-1",
  user_id: "u1",
  application_id: "app-1",
  type: "screening-interview",
  status: "scheduled",
  title: "Phone screen with HR",
  description: "Discuss role",
  url: "https://zoom.us/123",
  scheduled_at: "2026-02-20T14:00:00Z",
  duration_minutes: 30,
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};
```

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add EventTimeline component tests`

---

### Task 4: AddEventDialog component tests

**Files:**
- Create: `frontend/src/components/applications/__tests__/add-event-dialog.test.tsx`
- Reference: `frontend/src/components/applications/add-event-dialog.tsx`

**Context:** AddEventDialog is a form dialog for creating/editing events on an application timeline. It has fields for type (Select), status (Select), title, date, time, duration, URL, description, and an optional Interviewers section (shown when companyId prop is provided). Create mode starts empty, edit mode pre-populates from event data.

**Mocks needed:**
```tsx
const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
  useRemoveInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

**Test cases (5 tests):**

1. **Renders create mode with "Add Event" title** — Pass `mode="create"`, assert "Add Event" title and "Add a new event to this application timeline." description visible
2. **Renders edit mode with "Edit Event" title** — Pass `mode="edit"` with event prop, assert "Edit Event" title and "Update event details." visible
3. **Renders all form fields** — Assert labels visible: "Type *", "Status", "Title", "Date", "Time", "Duration (minutes)", "Meeting URL", "Description"
4. **Pre-fills form in edit mode** — Pass event with title "Phone screen", assert input value matches
5. **Shows Interviewers section when companyId provided** — Pass `companyId="c1"`, assert "Interviewers" label visible. Without companyId, assert it's NOT visible

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add AddEventDialog component tests`

---

### Task 5: CompanyForm component tests

**Files:**
- Create: `frontend/src/components/companies/__tests__/company-form.test.tsx`
- Reference: `frontend/src/components/companies/company-form.tsx`

**Context:** CompanyForm is the primary company create/edit dialog. Create mode shows only name field. Edit mode shows all sections: Basic Information (name, description, industry, size, location, founded), Links (website, careers, linkedin, glassdoor, news), Research Notes (culture, benefits, pros, cons, tech_stack), Ratings (6 rating selects), Tags & Status (tags input, researched checkbox), and Contacts (CompanyContacts sub-component). Submit calls useCreateCompany or useUpdateCompany.

**Mocks needed:**
```tsx
const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();

vi.mock("@/lib/queries/companies", () => ({
  useCreateCompany: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

**Test cases (6 tests):**

1. **Renders create mode with "Add Company" title and only name field** — Assert "Add Company" title, name input visible, "Basic Information" section NOT visible
2. **Renders edit mode with "Edit Company" title and all sections** — Assert "Edit Company", sections visible: "Basic Information", "Links", "Research Notes", "Ratings (1-5)", "Tags & Status", "Contacts"
3. **Pre-fills edit mode with company data** — Pass company with `name: "Acme"`, `industry: "Tech"`, assert fields populated
4. **Validates name is required on create** — Submit empty form, assert "Name is required" error visible
5. **Shows correct submit button text per mode** — Create: "Add Company", Edit: "Save Changes"
6. **Shows Contacts section with CompanyContacts in edit mode** — Assert "Contacts" fieldset legend visible in edit mode

**Mock company shape:**
```tsx
const mockCompany = {
  id: "c-1",
  user_id: "u1",
  name: "Acme Corp",
  description: "A tech company",
  links: { website: "https://acme.com", linkedin: "https://linkedin.com/acme" },
  industry: "Technology",
  size: "51-200",
  location: "San Francisco",
  founded: "2015-01-01",
  culture: "Fast-paced",
  benefits: "401k, health",
  pros: "Good pay",
  cons: "Long hours",
  tech_stack: "React, Node",
  ratings: { overall: "4", culture: "5" },
  tags: ["startup", "remote"],
  researched: true,
  archived_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};
```

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add CompanyForm component tests`

---

### Task 6: CompanyDirectory component tests

**Files:**
- Create: `frontend/src/components/companies/__tests__/company-directory.test.tsx`
- Reference: `frontend/src/components/companies/company-directory.tsx`

**Context:** CompanyDirectory is the main companies page. It has a header with "Companies" title and "New Company" button, 4 stat cards (Total, Researched %, Open Apps, Avg Rating), a search input, view toggle (cards/table), and renders companies in either card or table view. Empty state shows "No companies yet" with "Add Your First Company" button.

**Mocks needed:**
```tsx
vi.mock("@/lib/queries/companies", () => ({
  useCompanies: vi.fn(() => ({
    data: { data: mockCompanies, count: mockCompanies.length },
    isLoading: false,
  })),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

**Test cases (4 tests):**

1. **Renders header, stats, and search** — Assert "Companies" heading, "New Company" button, stat card labels (Total, Researched, Open Apps, Avg Rating), search input with "Search companies..." placeholder
2. **Renders company names in cards view** — Pass 2 companies, default cards view, assert both company names visible
3. **Renders empty state when no companies** — Mock `useCompanies` to return empty, assert "No companies yet" and "Add Your First Company" button visible
4. **Shows table view with correct columns** — Render with `viewParam="table"`, assert column headers: Name, Industry, Location, Size, Researched, Tags

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add CompanyDirectory component tests`

---

### Task 7: DocumentEditor component tests

**Files:**
- Create: `frontend/src/components/documents/__tests__/document-editor.test.tsx`
- Reference: `frontend/src/components/documents/document-editor.tsx`

**Context:** DocumentEditor is the main document editing view. Without a documentId it shows empty state ("Select a document or create a new one"). With a documentId, it loads the document and shows: editable name input, type selector (Resume/Cover Letter/Other), revision badge, tags input, and either a textarea for content (text documents) or a file info card with download button (uploaded documents). Save/Delete buttons in header.

**Mocks needed:**
```tsx
const updateMutateMock = vi.fn();
const deleteMutateMock = vi.fn();

vi.mock("@/lib/queries/documents", () => ({
  useDocument: vi.fn(() => ({
    data: mockDocument,
    isLoading: false,
  })),
  useUpdateDocument: () => ({
    mutate: updateMutateMock,
    isPending: false,
  }),
  useDeleteDocument: () => ({
    mutate: deleteMutateMock,
    isPending: false,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: { from: () => ({ createSignedUrl: vi.fn() }) },
  }),
}));
```

**Test cases (5 tests):**

1. **Renders empty state when no documentId** — Pass `documentId={undefined}`, assert "Select a document or create a new one" visible
2. **Renders document name, type selector, and content textarea** — Pass text document (no uri), assert name input has value, type selector shows "Resume", textarea has content value, "Save" and "Delete" buttons visible
3. **Renders file info card for uploaded documents** — Pass document with `uri: "user/doc/resume.pdf"`, assert "resume.pdf" filename visible, "Download file" button visible, textarea NOT visible
4. **Shows delete confirmation dialog** — Click "Delete" button, assert "Are you sure you want to delete" dialog appears with Cancel/Delete buttons
5. **Shows revision badge when present** — Pass document with `revision: "v2.1"`, assert badge "v2.1" visible

**Mock document shape:**
```tsx
const mockDocument = {
  id: "doc-1",
  user_id: "u1",
  name: "My Resume",
  type: "resume",
  content: "# Professional Summary\nExperienced engineer...",
  uri: null,
  mime_type: null,
  revision: "v2.1",
  tags: ["engineering", "senior"],
  archived_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
```

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add DocumentEditor component tests`

---

## Tier 2: Medium Value (Supporting Components & Remaining Forms)

### Task 8: ScheduleDialog component tests

**Files:**
- Create: `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`
- Reference: `frontend/src/components/interviews/schedule-dialog.tsx`

**Context:** ScheduleDialog is used from the Interviews page to schedule a new interview. It has an application selector (Popover+Command combobox), type selector, status selector, title, date/time, duration, URL, description, and interviewers section (shown when a company is derived from selected application).

**Mocks needed:**
```tsx
const createEventMock = vi.fn();

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: () => ({ mutateAsync: createEventMock, isPending: false }),
}));

vi.mock("@/lib/queries/applications", () => ({
  useApplications: () => ({
    data: {
      data: [
        { id: "app-1", position: "Engineer", company_id: "c1", company: { name: "Acme" } },
      ],
      count: 1,
    },
    isLoading: false,
  }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

**Test cases (4 tests):**

1. **Renders "Schedule Interview" title and all form fields** — Assert title, description "Schedule a new interview for an existing application.", labels: "Application *", "Type *", "Status", "Title", "Date", "Time", "Duration (minutes)", "Meeting URL", "Description"
2. **Shows application combobox with "Select application..." placeholder** — Assert combobox trigger button with text "Select application..."
3. **Shows Cancel and Schedule Interview buttons** — Assert both buttons visible
4. **Validates application is required** — Submit without selecting application, assert "Application is required" error visible

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add ScheduleDialog component tests`

---

### Task 9: ApplicationDetail component tests

**Files:**
- Create: `frontend/src/components/applications/__tests__/application-detail.test.tsx`
- Reference: `frontend/src/components/applications/application-detail.tsx`

**Context:** ApplicationDetail is the main application detail page. It shows breadcrumb (Applications > Company > Position), header with company name, position, status/interest badges, action buttons (Edit Application, Edit Company, Archive), Details card (work type, employment type, location, salary, interest, source, applied date, URL, tags), collapsible Job Description card, Documents section (ApplicationDocuments), and Timeline section with events.

**Mocks needed:**
```tsx
vi.mock("@/lib/queries/events", () => ({
  useEvents: () => ({ data: [], isLoading: false }),
  useCreateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteEvent: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveApplication: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: () => ({ data: [], isLoading: false }),
  useDetachDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: () => ({ data: [], isLoading: false }),
  useSnapshotDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: () => ({ data: [] }),
  useAddInterviewer: () => ({ mutateAsync: vi.fn() }),
  useRemoveInterviewer: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
```

**Test cases (5 tests):**

1. **Renders breadcrumb with company name and position** — Assert "Applications" link, company name, position all visible
2. **Renders header with company name, position, status badge** — Assert h1 with company name, position text, status badge "Applied"
3. **Renders action buttons** — Assert "Edit Application", "Edit Company" buttons visible
4. **Renders Details card with application info** — Assert "Details" heading, work type, location, salary formatted, interest visible
5. **Renders Timeline section** — Assert "Timeline" heading and "Add Event" button visible

**Step 1:** Write all test cases
**Step 2:** Run tests
**Step 3:** Fix any issues
**Step 4:** Commit: `test: add ApplicationDetail component tests`

---

### Task 10: Final verification and build check

**Step 1:** Run ALL tests: `cd frontend && npx vitest run`
**Step 2:** Verify total test count (expecting ~80+ tests)
**Step 3:** Run production build: `cd frontend && npx vinxi build`
**Step 4:** Commit any final fixes if needed

---

## Summary

| Task | Component | Tests | Priority |
|------|-----------|-------|----------|
| 1 | ApplicationTable | 5 | Tier 1 |
| 2 | ApplicationFilters | 5 | Tier 1 |
| 3 | EventTimeline | 4 | Tier 1 |
| 4 | AddEventDialog | 5 | Tier 1 |
| 5 | CompanyForm | 6 | Tier 1 |
| 6 | CompanyDirectory | 4 | Tier 1 |
| 7 | DocumentEditor | 5 | Tier 1 |
| 8 | ScheduleDialog | 4 | Tier 2 |
| 9 | ApplicationDetail | 5 | Tier 2 |
| 10 | Final verification | - | - |
| **Total** | | **~43 new** | |

Combined with existing 48 tests → **~91 total tests** covering all core user stories with durable, backend-agnostic assertions.
