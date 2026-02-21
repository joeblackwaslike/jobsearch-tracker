# Thrive Iteration — Companies, Applications, Interviews

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish three feature areas: Companies table upgrade with edit/archive row actions, Applications edit icon and resume-picker with localStorage memory, Interviews form widget polish and empty-state bug fix.

**Architecture:** Sequential by feature area (A → B → C). Each task is one red-green-refactor TDD cycle ending in a commit. The new `DocumentTypePicker` is built during Area B and is the only genuinely new shared component. All other changes are modifications to existing files.

**Tech Stack:** React 19, TanStack Query, shadcn/ui Select + Popover + Calendar, Tailwind v4, Zod v4, Vitest + Testing Library + jsdom. Tests use `vi.mock` to mock Supabase client and query hooks.

---

## Area A: Companies

### Task 1: Add `useArchiveCompany` hook

**Files:**

- Modify: `frontend/src/lib/queries/companies.ts`
- Test: `frontend/src/components/companies/__tests__/company-directory.test.tsx` (add mock + test in Task 2)

**Step 1: Add the hook**

Open `frontend/src/lib/queries/companies.ts`. At the very end of the file, after `useUpdateCompany`, add:

```typescript
export function useArchiveCompany() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("companies")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
    },
  });
}
```

**Step 2: Run lint**

```bash
cd frontend && pnpm lint
```

Expected: no errors. Fix any Biome warnings before continuing.

**Step 3: Commit**

```bash
git add frontend/src/lib/queries/companies.ts
git commit -m "feat: add useArchiveCompany hook"
```

---

### Task 2: `CompanyTable` component with edit and archive actions

**Files:**

- Create: `frontend/src/components/companies/company-table.tsx`
- Create: `frontend/src/components/companies/__tests__/company-table.test.tsx`
- Modify: `frontend/src/components/companies/company-directory.tsx`

**Step 1: Write the failing test**

Create `frontend/src/components/companies/__tests__/company-table.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyTable } from "../company-table";

const mockArchiveMutate = vi.fn();

vi.mock("@/lib/queries/companies", () => ({
  useArchiveCompany: () => ({ mutate: mockArchiveMutate, isPending: false }),
}));

const companies = [
  {
    id: "c1",
    user_id: "u1",
    name: "Acme Corp",
    industry: "Tech",
    location: "Remote",
    size: "50-200",
    researched: true,
    tags: ["startup", "saas"],
    ratings: null,
    website: null,
    notes: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("CompanyTable", () => {
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders company rows", () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });

  it("calls onEdit when row is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByText("Acme Corp"));
    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("calls onEdit when pencil icon is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Edit company"));
    expect(onEdit).toHaveBeenCalledWith(companies[0]);
  });

  it("calls useArchiveCompany.mutate when archive icon is clicked", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Archive company"));
    expect(mockArchiveMutate).toHaveBeenCalledWith("c1");
  });

  it("archive button click does not trigger row click (stops propagation)", async () => {
    render(<CompanyTable data={companies} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle("Archive company"));
    expect(onEdit).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test company-table
```

Expected: FAIL — `CompanyTable` not found.

**Step 3: Create the component**

Create `frontend/src/components/companies/company-table.tsx`:

```typescript
import { Archive, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company } from "@/lib/queries/companies";
import { useArchiveCompany } from "@/lib/queries/companies";

interface CompanyTableProps {
  data: Company[];
  onEdit: (company: Company) => void;
}

export function CompanyTable({ data, onEdit }: CompanyTableProps) {
  const archiveCompany = useArchiveCompany();

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Researched</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((company) => {
            const tags = Array.isArray(company.tags) ? (company.tags as string[]) : [];
            return (
              <TableRow
                key={company.id}
                className="cursor-pointer"
                onClick={() => onEdit(company)}
              >
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.industry || "--"}</TableCell>
                <TableCell>{company.location || "--"}</TableCell>
                <TableCell>{company.size || "--"}</TableCell>
                <TableCell>
                  {company.researched ? (
                    <Badge variant="secondary" className="text-xs">
                      Yes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      title="Edit company"
                      onClick={() => onEdit(company)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Archive company"
                      onClick={() => archiveCompany.mutate(company.id)}
                    >
                      <Archive className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 4: Run tests**

```bash
cd frontend && pnpm test company-table
```

Expected: all 5 tests pass.

**Step 5: Run lint**

```bash
cd frontend && pnpm lint
```

**Step 6: Commit**

```bash
git add frontend/src/components/companies/company-table.tsx \
        frontend/src/components/companies/__tests__/company-table.test.tsx
git commit -m "feat: add CompanyTable component with edit and archive actions"
```

---

### Task 3: Wire `CompanyTable` into `CompanyDirectory` and set table as default view

**Files:**

- Modify: `frontend/src/components/companies/company-directory.tsx`
- Modify: `frontend/src/routes/_authenticated/companies.tsx`
- Test: `frontend/src/components/companies/__tests__/company-directory.test.tsx`

**Step 1: Write a failing test**

Open the existing `company-directory.test.tsx`. Add a test that confirms the table view renders `CompanyTable`. Look at the existing tests to understand the render pattern and existing mocks. Add:

```typescript
it("defaults to table view", () => {
  // Render CompanyDirectory without passing viewParam
  // Expect the table element to be present, not the cards grid
  render(<CompanyDirectory onSearchChange={vi.fn()} onViewChange={vi.fn()} />);
  // The table view renders a <table> element; the cards view renders a grid of cards
  expect(screen.getByRole("table")).toBeInTheDocument();
});
```

Note: look at what the existing mock setup provides before adding; do not duplicate existing mocks.

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test company-directory
```

Expected: FAIL — defaults to "cards" currently, no table rendered by default.

**Step 3: Swap the inline table for `CompanyTable` and change the default**

In `frontend/src/components/companies/company-directory.tsx`:

1. Add import at the top:

```typescript
import { CompanyTable } from "./company-table";
```

2. Change the prop default from `"cards"` to `"table"`:

```typescript
// Before:
viewParam = "cards",
// After:
viewParam = "table",
```

3. In the content section, replace the existing table block (the `<div className="overflow-x-auto rounded-md border">...</div>` block in the `view === "table"` branch) with:

```typescript
) : (
  <CompanyTable data={companies} onEdit={handleOpenEdit} />
)}
```

Also remove the now-unused individual Table/TableBody/etc. imports if they're no longer used elsewhere in the file (check first — they may still be used in some edge case).

**Step 4: Update the route default**

Open `frontend/src/routes/_authenticated/companies.tsx`. Find the `validateSearch` function. Change the default view from `"cards"` to `"table"`:

```typescript
// Before:
view: (search.view as string) || "cards",
// After:
view: (search.view as string) || "table",
```

If `viewParam` is passed from the route into `CompanyDirectory` via props, confirm the prop name matches. Check the existing route file to see how `viewParam` / `view` is passed — adjust accordingly.

**Step 5: Run all company tests**

```bash
cd frontend && pnpm test company
```

Expected: all pass.

**Step 6: Run lint + type check**

```bash
cd frontend && pnpm lint && pnpm type
```

**Step 7: Commit**

```bash
git add frontend/src/components/companies/company-directory.tsx \
        frontend/src/routes/_authenticated/companies.tsx \
        frontend/src/components/companies/__tests__/company-directory.test.tsx
git commit -m "feat: wire CompanyTable into CompanyDirectory, default to table view"
```

---

## Area B: Applications

### Task 4: Add edit icon to `ApplicationTable`

**Files:**

- Modify: `frontend/src/components/applications/application-table.tsx`
- Modify: `frontend/src/routes/_authenticated/applications.tsx`
- Test: `frontend/src/components/applications/__tests__/application-table.test.tsx`

**Step 1: Write a failing test**

Open the existing `application-table.test.tsx`. Look at the existing mock + render setup. Add:

```typescript
it("renders an edit button per row", () => {
  const onEdit = vi.fn();
  render(<ApplicationTable data={mockApplications} onEdit={onEdit} ... />);
  // Confirm a pencil/edit button exists for each row
  const editButtons = screen.getAllByTitle("Edit application");
  expect(editButtons).toHaveLength(mockApplications.length);
});

it("calls onEdit when edit button clicked", async () => {
  const onEdit = vi.fn();
  render(<ApplicationTable data={mockApplications} onEdit={onEdit} ... />);
  await userEvent.click(screen.getAllByTitle("Edit application")[0]);
  expect(onEdit).toHaveBeenCalledWith(mockApplications[0]);
});
```

Adapt `mockApplications` to match whatever fixture already exists in the file.

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test application-table
```

Expected: FAIL — `onEdit` prop doesn't exist yet.

**Step 3: Add `onEdit` prop and edit button to `ApplicationTable`**

In `frontend/src/components/applications/application-table.tsx`:

1. Add `Pencil` to the lucide-react import.

2. Add `onEdit` to the `ApplicationTableProps` interface:

```typescript
interface ApplicationTableProps {
  data: ApplicationListItem[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  onEdit: (app: ApplicationListItem) => void;
}
```

3. The `columns` array is currently a module-level `const`. Because `onEdit` needs to be accessible inside the column cell renderer, convert it to a factory function inside the component. Replace the module-level `const columns` with a `createColumns` factory:

```typescript
function createColumns(onEdit: (app: ApplicationListItem) => void): ColumnDef<ApplicationListItem>[] {
  return [
    // ...copy all existing column definitions unchanged...
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Edit application"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="size-4" />
          </Button>
          <ArchiveDialog applicationId={row.original.id} />
        </div>
      ),
    },
  ];
}
```

4. Inside `ApplicationTable`, replace the `columns` reference in `columnsWithHeaders` with `createColumns(onEdit)`:

```typescript
export function ApplicationTable({ ..., onEdit }: ApplicationTableProps) {
  // ...
  const columnsWithHeaders = useMemo(
    (): ColumnDef<ApplicationListItem>[] =>
      createColumns(onEdit).map(...), // same mapping as before
    [sorting, handleSort, onEdit],
  );
```

**Step 4: Wire `onEdit` in the applications route**

Open `frontend/src/routes/_authenticated/applications.tsx`. Find where `ApplicationTable` is rendered. Pass an `onEdit` handler that opens `ApplicationForm` in edit mode. The route likely already has `formOpen`/`formMode`/`editingApp` state (since the "New Application" button works). If not, add state:

```typescript
const [editingApp, setEditingApp] = useState<ApplicationListItem | null>(null);

// In the JSX:
<ApplicationTable
  ...
  onEdit={(app) => {
    setEditingApp(app);
    // Open ApplicationForm in edit mode
  }}
/>
<ApplicationForm
  open={!!editingApp}
  onOpenChange={(open) => { if (!open) setEditingApp(null); }}
  mode="edit"
  application={editingApp}
/>
```

Read the existing route file carefully before modifying — it may already have edit state wired for another flow.

**Step 5: Run tests**

```bash
cd frontend && pnpm test application-table
```

Expected: all pass.

**Step 6: Run lint + type check**

```bash
cd frontend && pnpm lint && pnpm type
```

**Step 7: Commit**

```bash
git add frontend/src/components/applications/application-table.tsx \
        frontend/src/routes/_authenticated/applications.tsx \
        frontend/src/components/applications/__tests__/application-table.test.tsx
git commit -m "feat: add edit icon to ApplicationTable with onEdit callback"
```

---

### Task 5: `DocumentTypePicker` component

**Files:**

- Create: `frontend/src/components/documents/document-type-picker.tsx`
- Create: `frontend/src/components/documents/__tests__/document-type-picker.test.tsx`

**Step 1: Write the failing test**

Create `frontend/src/components/documents/__tests__/document-type-picker.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentTypePicker } from "../document-type-picker";

const mockDocuments = [
  { id: "d1", name: "Resume 2025.pdf", type: "resume", archived_at: null },
  { id: "d2", name: "Cover Letter.pdf", type: "cover_letter", archived_at: null },
];

vi.mock("@/lib/queries/documents", () => ({
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(),
  })),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: mockDocuments, isLoading: false })),
  };
});

vi.mock("../upload-dialog", () => ({
  UploadDialog: ({ open, onSuccess }: { open: boolean; onSuccess?: (id: string) => void }) =>
    open ? (
      <div data-testid="upload-dialog">
        <button onClick={() => onSuccess?.("new-doc-id")}>Upload</button>
      </div>
    ) : null,
}));

describe("DocumentTypePicker", () => {
  const onChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders a select trigger", () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows document names as options", async () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Resume 2025.pdf")).toBeInTheDocument();
    expect(screen.getByText("Cover Letter.pdf")).toBeInTheDocument();
  });

  it("shows 'Attach new...' as the last option", async () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveTextContent("Attach new…");
  });

  it("calls onChange with the selected document", async () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Resume 2025.pdf"));
    expect(onChange).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it("opens UploadDialog when 'Attach new...' selected", async () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Attach new…"));
    expect(screen.getByTestId("upload-dialog")).toBeInTheDocument();
  });

  it("calls onChange with new document id after upload success", async () => {
    render(<DocumentTypePicker value={null} onChange={onChange} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByText("Attach new…"));
    await userEvent.click(screen.getByText("Upload"));
    // onChange is called with a partial Document matching the new id
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: "new-doc-id" }));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test document-type-picker
```

Expected: FAIL — component not found.

**Step 3: Create the component**

Create `frontend/src/components/documents/document-type-picker.tsx`:

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Document } from "@/lib/queries/documents";
import { documentsQueryOptions } from "@/lib/queries/documents";
import { UploadDialog } from "./upload-dialog";

interface DocumentTypePickerProps {
  /** Filter by document type. Omit to show all document types. */
  type?: string;
  value: string | null;
  onChange: (doc: Document | null) => void;
}

export function DocumentTypePicker({ type, value, onChange }: DocumentTypePickerProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: documents = [] } = useQuery(documentsQueryOptions(type));

  const handleValueChange = (val: string) => {
    if (val === "__attach_new__") {
      setUploadOpen(true);
      return;
    }
    if (val === "__none__") {
      onChange(null);
      return;
    }
    const doc = documents.find((d) => d.id === val);
    onChange(doc ?? null);
  };

  const handleUploadSuccess = (id: string) => {
    setUploadOpen(false);
    // Find the newly uploaded document in the refetched list, or construct a minimal object.
    // The query will refetch automatically due to cache invalidation in useUploadDocument.
    // We pass a minimal document object; the parent only needs the id immediately.
    onChange({ id } as Document);
  };

  return (
    <>
      <Select value={value ?? "__none__"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a document..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {documents.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              {doc.name}
            </SelectItem>
          ))}
          <SelectItem value="__attach_new__">Attach new…</SelectItem>
        </SelectContent>
      </Select>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
```

**Step 4: Run tests**

```bash
cd frontend && pnpm test document-type-picker
```

Expected: all pass.

**Step 5: Run lint**

```bash
cd frontend && pnpm lint
```

**Step 6: Commit**

```bash
git add frontend/src/components/documents/document-type-picker.tsx \
        frontend/src/components/documents/__tests__/document-type-picker.test.tsx
git commit -m "feat: add DocumentTypePicker component"
```

---

### Task 6: Wire `DocumentTypePicker` into `ApplicationForm`

**Files:**

- Modify: `frontend/src/components/applications/application-form.tsx`
- Test: `frontend/src/components/applications/__tests__/application-form.test.tsx`

**Background — current document attachment flow:**

The current form stages documents in `pendingDocIds` (create mode) or immediately snapshots (edit mode) via `snapshotDocument.mutateAsync({ applicationId, documentId })`. The new resume picker replaces this section entirely. Non-resume attachments from prior saves remain on the application but are no longer managed through this form.

**Step 1: Write failing tests**

Open the existing `application-form.test.tsx`. Look at the existing mocks and render pattern. Add mock for `DocumentTypePicker`:

```typescript
vi.mock("@/components/documents/document-type-picker", () => ({
  DocumentTypePicker: ({
    value,
    onChange,
  }: {
    value: string | null;
    onChange: (doc: { id: string } | null) => void;
  }) => (
    <div>
      <button onClick={() => onChange({ id: "doc-resume-1" })}>Select Resume</button>
      {value && <span data-testid="selected-resume">{value}</span>}
    </div>
  ),
}));
```

Add tests:

```typescript
describe("create mode resume picker", () => {
  it("renders DocumentTypePicker in create mode", () => {
    render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);
    expect(screen.getByText("Resume")).toBeInTheDocument(); // section label
  });

  it("pre-selects resume from localStorage if present", () => {
    localStorage.setItem("thrive:default_resume_id", "doc-resume-1");
    render(<ApplicationForm open mode="create" onOpenChange={vi.fn()} />);
    expect(screen.getByTestId("selected-resume")).toHaveTextContent("doc-resume-1");
    localStorage.removeItem("thrive:default_resume_id");
  });

  it("snapshots and attaches selected resume after successful create", async () => {
    // mock createApplication and snapshotDocument
    // simulate form submission with a selected resume
    // assert snapshotDocument.mutateAsync was called with the application id and resume doc id
  });

  it("saves selected resume id to localStorage on successful submit", async () => {
    // simulate form submission with a selected resume
    // assert localStorage.getItem("thrive:default_resume_id") === selected doc id
  });
});

describe("edit mode resume picker", () => {
  it("renders DocumentTypePicker in edit mode", () => {
    render(<ApplicationForm open mode="edit" application={mockApp} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("does not read from localStorage in edit mode", () => {
    localStorage.setItem("thrive:default_resume_id", "doc-resume-1");
    render(<ApplicationForm open mode="edit" application={mockApp} onOpenChange={vi.fn()} />);
    // picker should have null value (not pre-seeded from localStorage)
    expect(screen.queryByTestId("selected-resume")).not.toBeInTheDocument();
    localStorage.removeItem("thrive:default_resume_id");
  });
});
```

Adapt `mockApp` to the shape expected by `ApplicationWithCompany`.

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test application-form
```

Expected: FAIL — `DocumentTypePicker` not wired yet.

**Step 3: Modify `ApplicationForm`**

In `frontend/src/components/applications/application-form.tsx`:

1. Add import:

```typescript
import { DocumentTypePicker } from "@/components/documents/document-type-picker";
```

2. Remove imports no longer needed: `DocumentPicker`, `useDetachDocument` (check if `useDetachDocument` is used anywhere else in the file before removing).

3. Replace the document-attachment state:

```typescript
// Remove:
const [pendingDocIds, setPendingDocIds] = useState<string[]>([]);
const [pendingDocs, setPendingDocs] = useState<{ id: string; name: string }[]>([]);
const [pickerOpen, setPickerOpen] = useState(false);

// Add:
const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
```

4. In the `useEffect` that resets the form on open, add resume picker initialization:

```typescript
useEffect(() => {
  if (open) {
    if (mode === "edit" && application) {
      reset(applicationToFormValues(application));
      setSelectedResumeId(null); // edit mode: no localStorage prefill
    } else {
      reset({ /* existing defaults */ });
      // Create mode: prefill from localStorage
      const savedId = localStorage.getItem("thrive:default_resume_id");
      setSelectedResumeId(savedId ?? null);
    }
  }
}, [open, mode, application, reset, prefill]);
```

5. Update `onSubmit` — replace the `pendingDocIds` attachment block with resume attachment:

```typescript
const onSubmit = async (values: ApplicationFormValues) => {
  const payload = formValuesToPayload(values);

  if (mode === "edit" && application) {
    await updateApplication.mutateAsync({ id: application.id, ...payload });
    if (selectedResumeId) {
      await snapshotDocument.mutateAsync({
        applicationId: application.id,
        documentId: selectedResumeId,
      });
    }
  } else {
    const newApp = await createApplication.mutateAsync(payload);
    if (selectedResumeId && newApp?.id) {
      await snapshotDocument.mutateAsync({
        applicationId: newApp.id,
        documentId: selectedResumeId,
      });
      localStorage.setItem("thrive:default_resume_id", selectedResumeId);
    } else {
      localStorage.removeItem("thrive:default_resume_id");
    }
  }

  onSuccess?.();
  onOpenChange(false);
};
```

6. Replace the documents section in the JSX with `DocumentTypePicker`:

```tsx
{/* Resume */}
<div className="space-y-2">
  <Label>Resume</Label>
  <DocumentTypePicker
    type="resume"
    value={selectedResumeId}
    onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
  />
</div>
```

Remove the old `<DocumentPicker ... />` and associated badge display for pending docs.

**Step 4: Run tests**

```bash
cd frontend && pnpm test application-form
```

Expected: all pass.

**Step 5: Run lint + type check**

```bash
cd frontend && pnpm lint && pnpm type
```

**Step 6: Commit**

```bash
git add frontend/src/components/applications/application-form.tsx \
        frontend/src/components/applications/__tests__/application-form.test.tsx
git commit -m "feat: replace document picker with DocumentTypePicker resume selector in ApplicationForm"
```

---

## Area C: Interviews

### Task 7: Fix interviews page empty state spacing bug

**Files:**

- Modify: `frontend/src/routes/_authenticated/interviews.tsx`

**Background:** When no interviews exist, the header "Interviews" h1 and "Schedule Interview" button appear without proper spacing. The outer `space-y-6` div should handle vertical gaps between siblings, but the search bar renders unconditionally and may also be unnecessary when the list is empty.

**Step 1: Locate and fix**

Open `frontend/src/routes/_authenticated/interviews.tsx`.

1. Add `gap-4` to the header flex container:

```tsx
// Before:
<div className="flex items-center justify-between">
// After:
<div className="flex items-center justify-between gap-4">
```

2. Hide the search bar when there are no interviews (it's pointless to search an empty list):

```tsx
// Wrap the search Input section:
{hasAnyInterviews && (
  <div className="relative max-w-sm">
    ...
  </div>
)}
```

**Step 2: Run lint**

```bash
cd frontend && pnpm lint
```

**Step 3: Commit**

```bash
git add frontend/src/routes/_authenticated/interviews.tsx
git commit -m "fix: add gap to interviews header, hide search when no interviews"
```

---

### Task 8: ScheduleDialog — duration dropdown

**Files:**

- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Test: `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`

**Step 1: Write a failing test**

Open the existing `schedule-dialog.test.tsx`. Add:

```typescript
it("renders duration as a select dropdown, not a number input", () => {
  render(<ScheduleDialog open onOpenChange={vi.fn()} />);
  // The number input for duration should not exist
  expect(screen.queryByPlaceholderText("e.g. 30")).not.toBeInTheDocument();
  // A duration select should exist
  expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
});

it("duration select contains 15-min increment options up to 3 hours", async () => {
  render(<ScheduleDialog open onOpenChange={vi.fn()} />);
  await userEvent.click(screen.getByLabelText(/duration/i));
  expect(screen.getByText("15 min")).toBeInTheDocument();
  expect(screen.getByText("1 hr")).toBeInTheDocument();
  expect(screen.getByText("3 hr")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test schedule-dialog
```

Expected: FAIL — duration is currently a number input.

**Step 3: Replace duration input with a Select**

In `frontend/src/components/interviews/schedule-dialog.tsx`:

1. Add the duration options constant near the top of the file (after existing constants):

```typescript
const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 75, label: "1 hr 15 min" },
  { value: 90, label: "1 hr 30 min" },
  { value: 105, label: "1 hr 45 min" },
  { value: 120, label: "2 hr" },
  { value: 135, label: "2 hr 15 min" },
  { value: 150, label: "2 hr 30 min" },
  { value: 165, label: "2 hr 45 min" },
  { value: 180, label: "3 hr" },
] as const;
```

2. Replace the duration `<Input>` block with a `<Select>`:

```tsx
{/* Duration */}
<div className="space-y-2">
  <Label htmlFor="schedule-duration">Duration</Label>
  <Select
    value={watch("duration_minutes")?.toString() ?? "__none__"}
    onValueChange={(v) =>
      setValue(
        "duration_minutes",
        v === "__none__" ? undefined : Number(v),
      )
    }
  >
    <SelectTrigger id="schedule-duration" aria-label="Duration">
      <SelectValue placeholder="Select duration..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">None</SelectItem>
      {DURATION_OPTIONS.map((opt) => (
        <SelectItem key={opt.value} value={opt.value.toString()}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Step 4: Run tests**

```bash
cd frontend && pnpm test schedule-dialog
```

Expected: all pass.

**Step 5: Run lint**

```bash
cd frontend && pnpm lint
```

**Step 6: Commit**

```bash
git add frontend/src/components/interviews/schedule-dialog.tsx \
        frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx
git commit -m "feat: replace duration number input with select dropdown in ScheduleDialog"
```

---

### Task 9: ScheduleDialog — shadcn Calendar date picker

**Files:**

- `frontend/` (add Calendar component)
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Test: `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`

**Step 1: Add the Calendar shadcn component**

```bash
cd frontend && npx shadcn@latest add calendar
```

This installs `react-day-picker` and creates `frontend/src/components/ui/calendar.tsx`. If prompted, confirm yes.

**Step 2: Write a failing test**

In `schedule-dialog.test.tsx`, add:

```typescript
it("renders a date picker button instead of a raw date input", () => {
  render(<ScheduleDialog open onOpenChange={vi.fn()} />);
  // Native date input should be gone
  expect(screen.queryByDisplayValue("")).not.toHaveAttribute("type", "date");
  // Date picker trigger button should exist
  expect(screen.getByRole("button", { name: /pick a date/i })).toBeInTheDocument();
});
```

**Step 3: Replace the date `<Input>` with a Calendar popover**

In `schedule-dialog.tsx`:

1. Add imports:

```typescript
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
```

2. Add `selectedDate` state (a `Date | undefined`):

```typescript
const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
```

3. Replace the date grid cell (`<Input id="schedule-date" type="date" ... />`) with:

```tsx
<div className="space-y-2">
  <Label>Date</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground",
        )}
        aria-label="Pick a date"
      >
        <CalendarIcon className="mr-2 size-4" />
        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          setSelectedDate(date);
          setValue("date", date ? format(date, "yyyy-MM-dd") : "");
        }}
        initialFocus
      />
    </PopoverContent>
  </Popover>
</div>
```

4. In `handleOpenChange`, reset `selectedDate` when the dialog closes:

```typescript
const handleOpenChange = (newOpen: boolean) => {
  if (!newOpen) {
    reset();
    setSelectedInterviewers([]);
    setSelectedDate(undefined); // add this line
  }
  onOpenChange(newOpen);
};
```

The hidden form field (`values.date`) is still a `"yyyy-MM-dd"` string, so `onSubmit` needs no changes.

**Step 4: Run tests**

```bash
cd frontend && pnpm test schedule-dialog
```

Expected: all pass (if the calendar mock is needed in tests, mock `@/components/ui/calendar` to render a simple button).

**Step 5: Run lint + type check**

```bash
cd frontend && pnpm lint && pnpm type
```

**Step 6: Commit**

```bash
git add frontend/src/components/ui/calendar.tsx \
        frontend/src/components/interviews/schedule-dialog.tsx \
        frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx \
        frontend/package.json frontend/pnpm-lock.yaml
git commit -m "feat: replace date input with Calendar popover in ScheduleDialog"
```

---

### Task 10: ScheduleDialog — title placeholder from type + status auto-switch

**Files:**

- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Test: `frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx`

**Step 1: Write failing tests**

In `schedule-dialog.test.tsx`, add:

```typescript
describe("title placeholder", () => {
  it("updates placeholder when interview type changes", async () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    // Change type to Technical Interview
    await userEvent.click(screen.getByRole("combobox", { name: /type/i }));
    await userEvent.click(screen.getByText("Technical Interview"));
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toHaveAttribute("placeholder", "Technical Interview");
  });

  it("uses placeholder text as title when title is blank on submit", async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: "evt-1" });
    // mock useCreateEvent to use mockCreate
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    // Fill required application field, leave title blank
    // Submit form
    // Assert mockCreate was called with title matching the type label
  });
});

describe("default status and auto-switch", () => {
  it("defaults status to availability_requested", () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByDisplayValue("availability_requested") ||
           screen.getByText("Availability Requested")).toBeInTheDocument();
  });

  it("auto-switches status to scheduled when date and time are both filled", async () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    // Fill in date (simulate via setValue or interact with Calendar mock)
    // Fill in time input
    // Assert status select now shows "Scheduled"
  });

  it("reverts to availability_requested when date is cleared", async () => {
    render(<ScheduleDialog open onOpenChange={vi.fn()} />);
    // Fill date + time (triggers auto-switch to "scheduled")
    // Clear date
    // Assert status reverts to "availability_requested"
  });
});
```

Adapt to the existing mock setup in the file — look at what `useCreateEvent` mock is already in place.

**Step 2: Run test to verify it fails**

```bash
cd frontend && pnpm test schedule-dialog
```

Expected: FAIL.

**Step 3: Implement title placeholder**

In `schedule-dialog.tsx`:

1. Add a derived `titlePlaceholder` variable inside the component:

```typescript
const selectedType = watch("type");
const titlePlaceholder =
  EVENT_TYPE_OPTIONS.find((o) => o.value === selectedType)?.label ?? "Interview";
```

2. Update the title Input to use it:

```tsx
<Input
  id="schedule-title"
  placeholder={titlePlaceholder}
  {...register("title")}
/>
```

3. In `onSubmit`, apply the fallback before building the payload:

```typescript
const onSubmit = async (values: ScheduleFormValues) => {
  const effectiveTitle = values.title.trim() || titlePlaceholder;
  // ... rest of onSubmit, replace `values.title` with `effectiveTitle`
  const newEvent = await createEvent.mutateAsync({
    ...
    title: effectiveTitle,
    ...
  });
```

**Step 4: Implement default status + auto-switch**

1. Change the schema default and form default value:

```typescript
// In schema:
status: z.string().default("availability_requested"),

// In defaultValues:
status: "availability_requested",
```

2. Add a `useEffect` that watches date and time, auto-switching status only between the two managed states:

```typescript
const watchedDate = watch("date");
const watchedTime = watch("time");

useEffect(() => {
  const currentStatus = watch("status");
  if (watchedDate && watchedTime) {
    if (currentStatus === "availability_requested") {
      setValue("status", "scheduled");
    }
  } else {
    if (currentStatus === "scheduled") {
      setValue("status", "availability_requested");
    }
  }
}, [watchedDate, watchedTime]); // eslint-disable-line react-hooks/exhaustive-deps
```

This only auto-switches between `"availability_requested"` and `"scheduled"`. If the user manually sets a different status (e.g. `"completed"`), the effect leaves it alone.

**Step 5: Run tests**

```bash
cd frontend && pnpm test schedule-dialog
```

Expected: all pass.

**Step 6: Run all tests to confirm nothing broken**

```bash
cd frontend && pnpm test
```

Expected: all pass.

**Step 7: Run lint + type check**

```bash
cd frontend && pnpm lint && pnpm type
```

**Step 8: Commit**

```bash
git add frontend/src/components/interviews/schedule-dialog.tsx \
        frontend/src/components/interviews/__tests__/schedule-dialog.test.tsx
git commit -m "feat: dynamic title placeholder, status auto-switch to scheduled in ScheduleDialog"
```

---

## Final Verification

After all 10 tasks are complete:

```bash
cd frontend && pnpm test && pnpm lint && pnpm type
```

All should pass with zero errors. Review `docs/next-iteration.md` and check off each item.
