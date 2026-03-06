# DB Schema Fixes & Consistency Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix six schema inconsistencies: add a surrogate PK to `user_settings`, add `notes` to `companies` and `applications`, add `archived_at` and `source` to `contacts`, migrate `companies.location` to `locations text[]`, and fix `get_dashboard_stats` to exclude archived rows.

**Architecture:** Each schema change is its own migration file. All migrations are written first, applied in one `db:reset`, then types are regenerated. Frontend changes follow TDD: failing test → implementation → passing test → commit.

**Tech Stack:** Postgres migrations (raw SQL), `pnpm db:reset`, `pnpm db:types`, React 19, TanStack Query, React Hook Form, Zod v4, Vitest + Testing Library, `cd frontend && npx vitest run <file>`

---

## Migration Tasks

### Task 1: Migration — `user_settings` surrogate PK

**Files:**
- Create: `supabase/migrations/20260305000001_user_settings_id.sql`

**Step 1: Write the migration**

```sql
-- Add surrogate PK to user_settings.
-- user_id was the PK; it remains a FK to auth.users with a UNIQUE constraint.
ALTER TABLE user_settings ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE user_settings DROP CONSTRAINT user_settings_pkey;
ALTER TABLE user_settings ADD PRIMARY KEY (id);
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000001_user_settings_id.sql
git commit -m "feat(db): add surrogate UUID PK to user_settings"
```

---

### Task 2: Migration — `companies.notes`

**Files:**
- Create: `supabase/migrations/20260305000002_companies_notes.sql`

**Step 1: Write the migration**

```sql
ALTER TABLE companies ADD COLUMN notes TEXT DEFAULT '';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000002_companies_notes.sql
git commit -m "feat(db): add notes column to companies"
```

---

### Task 3: Migration — `applications.notes`

**Files:**
- Create: `supabase/migrations/20260305000003_applications_notes.sql`

**Step 1: Write the migration**

```sql
ALTER TABLE applications ADD COLUMN notes TEXT DEFAULT '';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000003_applications_notes.sql
git commit -m "feat(db): add notes column to applications"
```

---

### Task 4: Migration — `contacts.archived_at`

**Files:**
- Create: `supabase/migrations/20260305000004_contacts_archived_at.sql`

**Step 1: Write the migration**

```sql
ALTER TABLE contacts ADD COLUMN archived_at TIMESTAMPTZ;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000004_contacts_archived_at.sql
git commit -m "feat(db): add archived_at soft-delete column to contacts"
```

---

### Task 5: Migration — `contacts.source`

**Files:**
- Create: `supabase/migrations/20260305000005_contacts_source.sql`

**Step 1: Write the migration**

```sql
ALTER TABLE contacts ADD COLUMN source VARCHAR(100) DEFAULT '';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000005_contacts_source.sql
git commit -m "feat(db): add source column to contacts"
```

---

### Task 6: Migration — `companies.location` → `locations text[]`

**Files:**
- Create: `supabase/migrations/20260305000006_companies_locations.sql`

**Step 1: Write the migration**

```sql
-- Migrate companies.location (singular varchar) to locations (text array).
ALTER TABLE companies ADD COLUMN locations TEXT[] DEFAULT '{}';

-- Populate from existing location data (skip empty/null)
UPDATE companies
  SET locations = ARRAY[location]
  WHERE location IS NOT NULL AND location <> '';

ALTER TABLE companies DROP COLUMN location;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000006_companies_locations.sql
git commit -m "feat(db): migrate companies.location varchar to locations text[]"
```

---

### Task 7: Migration — fix `get_dashboard_stats`

`companies` stat currently has no `archived_at IS NULL` filter. `contacts` will need the same filter once `archived_at` is added.

**Files:**
- Create: `supabase/migrations/20260305000007_fix_dashboard_stats.sql`

**Step 1: Write the migration**

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL),
    'interviews_upcoming', (SELECT count(*) FROM events WHERE user_id = auth.uid() AND type LIKE '%interview%' AND scheduled_at > now()),
    'active_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status IN ('applied', 'interviewing') AND archived_at IS NULL),
    'offers', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'offer'),
    'rejections', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'rejected'),
    'contacts', (SELECT count(*) FROM contacts WHERE user_id = auth.uid() AND archived_at IS NULL),
    'companies', (SELECT count(*) FROM companies WHERE user_id = auth.uid() AND archived_at IS NULL),
    'response_rate', (
      SELECT CASE WHEN total = 0 THEN 0 ELSE round((with_interviews::numeric / total * 100), 1) END
      FROM (
        SELECT count(*) as total,
               count(*) FILTER (WHERE status IN ('interviewing', 'offer', 'accepted')) as with_interviews
        FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL
      ) s
    )
  );
$$;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260305000007_fix_dashboard_stats.sql
git commit -m "fix(db): exclude archived companies and contacts from dashboard stats"
```

---

### Task 8: Apply migrations and regenerate types

**Step 1: Apply all migrations**

From the repo root:
```bash
pnpm db:reset
```

Expected: Supabase resets, applies all migrations, reports success. No errors.

**Step 2: Regenerate TypeScript types**

```bash
pnpm db:types
```

Expected: `frontend/src/lib/supabase/types.ts` is updated. The `companies` type gains `locations: string[]` and loses `location`. The `contacts` type gains `archived_at`, `source`. The `applications` type gains `notes`. The `user_settings` type gains `id`.

**Step 3: Check TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```

Expected: A handful of errors pointing to places that reference the now-deleted `companies.location` field — these will be fixed in subsequent tasks. No unexpected errors.

**Step 4: Commit the regenerated types**

```bash
git add frontend/src/lib/supabase/types.ts
git commit -m "chore(types): regenerate supabase types after schema fixes"
```

---

## Frontend Tasks

### Task 9: `companies.notes` — form + detail

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`
- Modify: `frontend/src/components/companies/company-detail.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-form.test.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Write failing tests**

In `frontend/src/components/companies/__tests__/company-form.test.tsx`, add inside the `"CompanyForm"` describe:

```tsx
it("renders Notes textarea in both create and edit modes", () => {
  render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
  expect(screen.getByLabelText("Notes")).toBeInTheDocument();
});

it("pre-fills notes in edit mode", () => {
  const company = { ...mockCompany, notes: "Some important notes" };
  render(
    <CompanyForm open={true} onOpenChange={noop} mode="edit" company={company as never} />,
  );
  expect(screen.getByLabelText("Notes")).toHaveValue("Some important notes");
});
```

In `frontend/src/components/companies/__tests__/company-detail.test.tsx` (check existing fixture and mock pattern, then add):

```tsx
it("renders Notes tab when company has notes", () => {
  const company = { ...mockCompany, notes: "Very important note" };
  render(<CompanyDetail company={company as never} />);
  expect(screen.getByRole("tab", { name: /notes/i })).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/components/companies/__tests__/company-form.test.tsx
cd frontend && npx vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL — "Notes" label not found / "Notes" tab not found.

**Step 3: Update `company-form.tsx`**

In `companyFormSchema`, add:
```ts
notes: z.string().default(""),
```

In `companyToFormValues`, add:
```ts
notes: company.notes ?? "",
```

In `formValuesToPayload`, add:
```ts
notes: values.notes || null,
```

In the form JSX, add a full-width `notes` textarea to the Research Notes fieldset, after the `tech_stack` input and before the `tags` field:

```tsx
<div className="space-y-2">
  <Label htmlFor="notes">Notes</Label>
  <textarea
    id="notes"
    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    placeholder="Free-form notes about this company..."
    {...register("notes")}
  />
</div>
```

**Step 4: Update `company-detail.tsx`**

Add a `NotesTab` component alongside the existing tab components:

```tsx
function NotesTab({ company }: { company: Company }) {
  if (!company.notes) {
    return <p className="text-sm text-muted-foreground">No notes yet.</p>;
  }
  return <MarkdownContent content={company.notes} />;
}
```

Add the tab to the `tabs` array in `CompanyDetail`:

```tsx
{
  id: "notes",
  label: "Notes",
  content: <NotesTab company={company} />,
},
```

Place it after `"research"` and before `"apps"`.

**Step 5: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/components/companies/__tests__/company-form.test.tsx
cd frontend && npx vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: All tests pass, including new ones.

**Step 6: Commit**

```bash
git add frontend/src/components/companies/company-form.tsx \
        frontend/src/components/companies/company-detail.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx \
        frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "feat: add notes field to company form and detail view"
```

---

### Task 10: `applications.notes` — form + detail

**Files:**
- Modify: `frontend/src/components/applications/application-form.tsx`
- Modify: `frontend/src/components/applications/application-detail.tsx`
- Modify: `frontend/src/components/applications/__tests__/application-form.test.tsx`
- Modify: `frontend/src/components/applications/__tests__/application-detail.test.tsx`

**Step 1: Write failing tests**

In `frontend/src/components/applications/__tests__/application-form.test.tsx`, look for the describe block and add:

```tsx
it("renders Notes textarea", () => {
  render(
    <ApplicationForm open={true} onOpenChange={vi.fn()} application={mockApplication} />,
  );
  expect(screen.getByLabelText("Notes")).toBeInTheDocument();
});

it("pre-fills notes when application has notes", () => {
  const app = { ...mockApplication, notes: "My private notes" };
  render(<ApplicationForm open={true} onOpenChange={vi.fn()} application={app as never} />);
  expect(screen.getByLabelText("Notes")).toHaveValue("My private notes");
});
```

In `frontend/src/components/applications/__tests__/application-detail.test.tsx`, add:

```tsx
it("renders Notes card when application has notes", () => {
  const app = { ...mockApplication, notes: "Take-home notes here" };
  render(<ApplicationDetail application={app as any} />);
  expect(screen.getByRole("heading", { name: /notes/i })).toBeInTheDocument();
  expect(screen.getByText("Take-home notes here")).toBeInTheDocument();
});

it("does not render Notes card when notes is null", () => {
  render(<ApplicationDetail application={mockApplication} />);
  // mockApplication has no notes field; heading should not appear
  const notesHeadings = screen
    .queryAllByRole("heading")
    .filter((el) => el.textContent === "Notes");
  expect(notesHeadings).toHaveLength(0);
});
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/components/applications/__tests__/application-form.test.tsx
cd frontend && npx vitest run src/components/applications/__tests__/application-detail.test.tsx
```

Expected: FAIL.

**Step 3: Update `application-form.tsx`**

In `applicationFormSchema`, add:
```ts
notes: z.string().default(""),
```

In `applicationToFormValues`, add:
```ts
notes: app.notes ?? "",
```

In `formValuesToPayload`, add:
```ts
notes: values.notes || null,
```

In the form default values, add `notes: ""`.

In the form JSX, add to the "Additional Information" fieldset after tags:

```tsx
<div className="space-y-2">
  <Label htmlFor="edit-notes">Notes</Label>
  <textarea
    id="edit-notes"
    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    placeholder="Private notes about this application..."
    {...register("notes")}
  />
</div>
```

**Step 4: Update `application-detail.tsx`**

After the job description card and before `<ApplicationDocuments>`, add:

```tsx
{application.notes && (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Notes</CardTitle>
    </CardHeader>
    <CardContent>
      <MarkdownContent content={application.notes} />
    </CardContent>
  </Card>
)}
```

**Step 5: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/components/applications/__tests__/application-form.test.tsx
cd frontend && npx vitest run src/components/applications/__tests__/application-detail.test.tsx
```

Expected: All pass.

**Step 6: Commit**

```bash
git add frontend/src/components/applications/application-form.tsx \
        frontend/src/components/applications/application-detail.tsx \
        frontend/src/components/applications/__tests__/application-form.test.tsx \
        frontend/src/components/applications/__tests__/application-detail.test.tsx
git commit -m "feat: add notes field to application form and detail view"
```

---

### Task 11: `contacts` — `archived_at` soft-delete + `source` field

**Files:**
- Modify: `frontend/src/lib/queries/contacts.ts`
- Modify: `frontend/src/components/companies/company-contacts.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-contacts.test.tsx`

**Step 1: Write failing tests**

Open `frontend/src/components/companies/__tests__/company-contacts.test.tsx` and add:

```tsx
it("renders Source field in the contact form", async () => {
  const user = userEvent.setup();
  render(<CompanyContacts companyId="c-1" />);
  await user.click(screen.getByRole("button", { name: /add contact/i }));
  expect(screen.getByLabelText("Source")).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/components/companies/__tests__/company-contacts.test.tsx
```

Expected: FAIL — "Source" label not found.

**Step 3: Update `contacts.ts` queries**

Add `archived_at` filter to both query functions:

In `contactsQueryOptions`:
```ts
let query = supabase
  .from("contacts")
  .select("*")
  .is("archived_at", null)        // ← add this
  .order("name", { ascending: true });
```

In `searchContactsQueryOptions`:
```ts
let query = supabase
  .from("contacts")
  .select("*")
  .is("archived_at", null)        // ← add this
  .ilike("name", `%${term}%`)
  .order("name", { ascending: true })
  .limit(20);
```

Add `useArchiveContact` hook after `useUpdateContact`:

```ts
export function useArchiveContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("contacts")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact removed.");
    },
    onError: () => {
      toast.error("Failed to remove contact.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
```

**Step 4: Update `company-contacts.tsx`**

In `ContactFormData` interface, add:
```ts
source: string;
```

In `emptyForm`, add:
```ts
source: "",
```

In the `ContactForm` component, add a Source field after the LinkedIn URL field:

```tsx
<div className="space-y-1">
  <Label htmlFor="contact-source" className="text-xs">
    Source
  </Label>
  <Input
    id="contact-source"
    value={form.source}
    onChange={(e) => handleChange("source", e.target.value)}
    placeholder="LinkedIn, Apollo, Referral..."
    className="h-8 text-sm"
  />
</div>
```

Update imports to add `useArchiveContact`:
```ts
import {
  type Contact,
  useArchiveContact,
  useContacts,
  useCreateContact,
  useUpdateContact,
} from "@/lib/queries/contacts";
```

Replace `useDeleteContact` with `useArchiveContact` in `CompanyContacts`:
```ts
const archiveContact = useArchiveContact();
```

In `handleDelete`:
```ts
const handleDelete = async (id: string) => {
  await archiveContact.mutateAsync(id);
};
```

In `ContactRow`, update the `isDeleting` prop to use `archiveContact.isPending`:
```ts
isDeleting={archiveContact.isPending}
```

Pass `source` through `handleCreate` and `handleUpdate`:
```ts
const handleCreate = async (data: ContactFormData) => {
  await createContact.mutateAsync({
    company_id: companyId,
    name: data.name,
    title: data.title || null,
    email: data.email || null,
    phone: data.phone || null,
    linkedin_url: data.linkedin_url || null,
    notes: data.notes || null,
    source: data.source || null,
  });
  setShowAddForm(false);
};

const handleUpdate = async (id: string, data: ContactFormData) => {
  await updateContact.mutateAsync({
    id,
    name: data.name,
    title: data.title || null,
    email: data.email || null,
    phone: data.phone || null,
    linkedin_url: data.linkedin_url || null,
    notes: data.notes || null,
    source: data.source || null,
  });
  setEditingId(null);
};
```

Also update the edit form `initial` to include `source`:
```ts
initial={{
  name: contact.name,
  title: contact.title ?? "",
  email: contact.email ?? "",
  phone: contact.phone ?? "",
  linkedin_url: contact.linkedin_url ?? "",
  notes: contact.notes ?? "",
  source: contact.source ?? "",
}}
```

Also update any test mocks in `company-form.test.tsx` that mock `useDeleteContact` — change to mock `useArchiveContact` instead:
```ts
vi.mock("@/lib/queries/contacts", () => ({
  useContacts: () => ({ data: [], isLoading: false }),
  useSearchContacts: () => ({ data: [], isLoading: false }),
  useCreateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
```

Similarly update mocks in `application-detail.test.tsx` and any other test file that mocks `useDeleteContact`.

**Step 5: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/components/companies/__tests__/company-contacts.test.tsx
cd frontend && npx vitest run src/components/companies/__tests__/company-form.test.tsx
cd frontend && npx vitest run src/components/applications/__tests__/application-detail.test.tsx
```

Expected: All pass.

**Step 6: Commit**

```bash
git add frontend/src/lib/queries/contacts.ts \
        frontend/src/components/companies/company-contacts.tsx \
        frontend/src/components/companies/__tests__/company-contacts.test.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx \
        frontend/src/components/applications/__tests__/application-detail.test.tsx
git commit -m "feat: add source field and archived_at soft-delete to contacts"
```

---

### Task 12: `companies.locations` — form + detail

This is the most involved frontend change. `company-form.tsx` currently uses `CityCombobox` (single value). We replace it with `CityMultiCombobox` (array). The detail view and any helper that references `company.location` must be updated.

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`
- Modify: `frontend/src/components/companies/company-detail.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-form.test.tsx`
- Modify: `frontend/src/components/companies/__tests__/company-detail.test.tsx`

**Step 1: Write failing tests**

In `company-form.test.tsx`, add:

```tsx
it("renders Locations as a multi-combobox (shows 'Add location...' button)", () => {
  render(<CompanyForm open={true} onOpenChange={noop} mode="create" />);
  // CityMultiCombobox trigger shows "Add location..." when empty
  expect(screen.getByRole("combobox", { name: /location/i })).toBeInTheDocument();
});

it("pre-fills locations array in edit mode", () => {
  const company = { ...mockCompany, locations: ["San Francisco, CA", "New York, NY"] };
  render(
    <CompanyForm open={true} onOpenChange={noop} mode="edit" company={company as never} />,
  );
  expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
  expect(screen.getByText("New York, NY")).toBeInTheDocument();
});
```

Also update the `mockCompany` fixture — replace `location: "San Francisco"` with `locations: ["San Francisco"]`.

In `company-detail.test.tsx`, add:

```tsx
it("shows locations in meta when company has locations", () => {
  const company = { ...mockCompany, locations: ["Austin, TX"] };
  render(<CompanyDetail company={company as never} />);
  expect(screen.getByText("Austin, TX")).toBeInTheDocument();
});
```

Also update the `mockCompany` fixture in this file — replace `location:` with `locations: []`.

**Step 2: Run tests to verify they fail**

```bash
cd frontend && npx vitest run src/components/companies/__tests__/company-form.test.tsx
cd frontend && npx vitest run src/components/companies/__tests__/company-detail.test.tsx
```

Expected: FAIL — type errors and/or the new assertions about locations.

**Step 3: Update `company-form.tsx`**

Change imports — remove `CityCombobox`, add `CityMultiCombobox`:
```ts
import { CityMultiCombobox } from "@/components/applications/city-multi-combobox";
```
(Remove the `CityCombobox` import)

In `companyFormSchema`, change:
```ts
// before:
location: z.string().default(""),
// after:
locations: z.array(z.string()).default([]),
```

In `companyToFormValues`, change:
```ts
// before:
location: company.location ?? "",
// after:
locations: Array.isArray(company.locations) ? (company.locations as string[]) : [],
```

In `formValuesToPayload`, change:
```ts
// before:
location: values.location || null,
// after:
locations: values.locations.length > 0 ? values.locations : null,
```

In the form JSX, replace the Location `<CityCombobox>` with `<CityMultiCombobox>`:
```tsx
// before:
<div className="space-y-2">
  <Label>Location</Label>
  <CityCombobox
    value={watch("location") ?? ""}
    onChange={(v) => setValue("location", v)}
  />
</div>

// after:
<div className="space-y-2">
  <Label>Locations</Label>
  <CityMultiCombobox
    value={watch("locations") ?? []}
    onChange={(v) => setValue("locations", v)}
  />
</div>
```

**Step 4: Update `company-detail.tsx`**

In `calcCompleteness`, change:
```ts
// before:
c.location,
// after:
c.locations?.length ? c.locations : null,
```

In the `meta` array in `CompanyDetail`:
```ts
// before:
company.location && { icon: <MapPin className="size-3.5" />, text: company.location },
// after:
company.locations?.length && {
  icon: <MapPin className="size-3.5" />,
  text: (company.locations as string[]).join(", "),
},
```

In `OverviewTab`, in the key-value grid, change:
```tsx
// before:
{company.location && (
  <div>
    <p className="text-xs text-muted-foreground">Location</p>
    <p className="text-sm font-medium">{company.location}</p>
  </div>
)}
// after: (locations is an array — show as comma-separated or as badges)
{(company.locations as string[] | null)?.length ? (
  <div>
    <p className="text-xs text-muted-foreground">Locations</p>
    <p className="text-sm font-medium">
      {(company.locations as string[]).join(", ")}
    </p>
  </div>
) : null}
```

Note: if `OverviewTab` doesn't currently render `location` explicitly (check the JSX — the `OverviewTab` renders industry, size, founded but NOT location; location appears in the `meta` array at the top of `CompanyDetail`). Update only the meta array if location isn't in the overview key-value grid.

**Step 5: Run all company tests**

```bash
cd frontend && npx vitest run src/components/companies/
```

Expected: All pass.

**Step 6: Commit**

```bash
git add frontend/src/components/companies/company-form.tsx \
        frontend/src/components/companies/company-detail.tsx \
        frontend/src/components/companies/__tests__/company-form.test.tsx \
        frontend/src/components/companies/__tests__/company-detail.test.tsx
git commit -m "feat: migrate companies.location to locations[] with multi-city support"
```

---

### Task 13: Final verification

**Step 1: Run the full test suite**

```bash
cd frontend && npx vitest run
```

Expected: All tests pass. Note the total test count (was 91 before this work).

**Step 2: TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: No errors.

**Step 3: Update `data_model.md` migration history**

In `docs/architecture/data_model.md`, append to the Migration History table:

```
| `20260305000001_user_settings_id.sql` | Adds surrogate UUID PK to `user_settings`; `user_id` becomes FK + UNIQUE |
| `20260305000002_companies_notes.sql` | `companies.notes TEXT` column |
| `20260305000003_applications_notes.sql` | `applications.notes TEXT` column |
| `20260305000004_contacts_archived_at.sql` | `contacts.archived_at TIMESTAMPTZ` for soft-delete |
| `20260305000005_contacts_source.sql` | `contacts.source VARCHAR(100)` |
| `20260305000006_companies_locations.sql` | Migrates `companies.location VARCHAR` → `locations TEXT[]` |
| `20260305000007_fix_dashboard_stats.sql` | `get_dashboard_stats` excludes archived companies and contacts |
```

Also update the `user_settings` table definition to show `id` as PK and `user_id` as FK+UNIQUE. Update `companies` to show `locations TEXT[]` instead of `location VARCHAR(255)`. Update `contacts` to show `archived_at` and `source`. Update `applications` to show `notes`.

**Step 4: Commit**

```bash
git add docs/architecture/data_model.md
git commit -m "docs: update data_model.md to reflect schema fixes"
```
