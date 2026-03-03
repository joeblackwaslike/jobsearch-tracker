# Contacts & Application Documents Implementation Plan

> **For Claude:** REQUIRED SUB-SKILLS: Use `superpowers:executing-plans` to implement this plan task-by-task. Every task MUST use `superpowers:test-driven-development` — write failing tests first, then implement.

**Goal:** Add interviewers (contacts) to interview events and document attachment to applications.

**Architecture:** New `event_contacts` junction table links events to contacts. Contacts are created inline on the interview form (streamlined) or on the company form (full CRUD). Application documents use the existing `application_documents` snapshot table and `useSnapshotDocument` mutation, adding UI on the application detail page and form dialog.

**Tech Stack:** TanStack Start, TanStack Query, React Hook Form + Zod v4 (`zod/v3` compat), shadcn/ui (Popover + Command combobox pattern), Supabase Postgres with RLS, Vitest + Testing Library.

**Key codebase patterns to follow:**
- Query hooks: one file per domain in `frontend/src/lib/queries/` — exports query keys, query options, query hooks, mutation hooks
- Combobox: see `frontend/src/components/applications/company-combobox.tsx` for the Popover + Command + debounced search + inline create pattern
- Dialog forms: see `frontend/src/components/applications/add-event-dialog.tsx` for the create/edit mode pattern with `useForm` + `zodResolver`
- Zod schemas: import from `zod` but cast `zodResolver(schema as any)` due to v4/resolvers compat issue
- Supabase client: `createClient()` from `@/lib/supabase/client` for browser, all mutations call `supabase.auth.getUser()` first
- Tests: use `render` from `@/test/test-utils` (wraps with QueryClientProvider), mock Supabase with `vi.mock`

---

### Task 1: Database migration for event_contacts

**Files:**
- Create: `supabase/migrations/20260217120000_event_contacts.sql`

**Step 1: Write the migration SQL**

```sql
-- Event-contacts junction table (interviewers per interview)
CREATE TABLE event_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, contact_id)
);

ALTER TABLE event_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_via_event" ON event_contacts
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_via_event" ON event_contacts
  FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );
CREATE POLICY "delete_via_event" ON event_contacts
  FOR DELETE USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

CREATE INDEX idx_event_contacts_event ON event_contacts(event_id);
CREATE INDEX idx_event_contacts_contact ON event_contacts(contact_id);
```

**Step 2: Apply migration and regenerate types**

Run: `supabase db reset --no-seed`
Expected: Migration applies cleanly.

Run: `make db-types`
Expected: `frontend/src/lib/supabase/types.ts` regenerated with `event_contacts` table.

**Step 3: Commit**

```bash
git add supabase/migrations/20260217120000_event_contacts.sql frontend/src/lib/supabase/types.ts
git commit -m "feat: add event_contacts junction table for interviewers"
```

---

### Task 2: Contacts query layer

**Files:**
- Create: `frontend/src/lib/queries/contacts.ts`
- Test: `frontend/src/lib/queries/__tests__/contacts.test.ts`

**Step 1: Write the failing test**

```typescript
// frontend/src/lib/queries/__tests__/contacts.test.ts
import { describe, it, expect, vi } from "vitest";

// We'll test that the query functions and hooks are exported correctly
// and that the search hook debounces properly
describe("contacts query layer", () => {
  it("exports useContacts hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useContacts).toBeDefined();
    expect(typeof mod.useContacts).toBe("function");
  });

  it("exports useSearchContacts hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useSearchContacts).toBeDefined();
    expect(typeof mod.useSearchContacts).toBe("function");
  });

  it("exports useCreateContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useCreateContact).toBeDefined();
    expect(typeof mod.useCreateContact).toBe("function");
  });

  it("exports useUpdateContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useUpdateContact).toBeDefined();
    expect(typeof mod.useUpdateContact).toBe("function");
  });

  it("exports useDeleteContact hook", async () => {
    const mod = await import("../contacts");
    expect(mod.useDeleteContact).toBeDefined();
    expect(typeof mod.useDeleteContact).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/contacts.test.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

```typescript
// frontend/src/lib/queries/contacts.ts
import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Contact = Tables<"contacts">;
type ContactInsert = TablesInsert<"contacts">;
type ContactUpdate = TablesUpdate<"contacts">;

export type { Contact };

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function contactsQueryOptions(companyId?: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["contacts", { companyId }],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .order("name", { ascending: true });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function searchContactsQueryOptions(term: string, companyId?: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["contacts", "search", { term, companyId }],
    queryFn: async () => {
      let query = supabase
        .from("contacts")
        .select("*")
        .ilike("name", `%${term}%`)
        .order("name", { ascending: true })
        .limit(20);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: term.length >= 1,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useContacts(companyId?: string) {
  return useQuery(contactsQueryOptions(companyId));
}

export function useSearchContacts(term: string, companyId?: string) {
  return useQuery(searchContactsQueryOptions(term, companyId));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useCreateContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<ContactInsert, "user_id">) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: ContactUpdate & { id: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
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
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/contacts.test.ts`
Expected: 5 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/queries/contacts.ts frontend/src/lib/queries/__tests__/contacts.test.ts
git commit -m "feat: add contacts query layer with CRUD and search hooks"
```

---

### Task 3: Event contacts query layer

**Files:**
- Create: `frontend/src/lib/queries/event-contacts.ts`
- Test: `frontend/src/lib/queries/__tests__/event-contacts.test.ts`

**Step 1: Write the failing test**

```typescript
// frontend/src/lib/queries/__tests__/event-contacts.test.ts
import { describe, it, expect } from "vitest";

describe("event-contacts query layer", () => {
  it("exports useEventContacts hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useEventContacts).toBeDefined();
  });

  it("exports useAddInterviewer hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useAddInterviewer).toBeDefined();
  });

  it("exports useRemoveInterviewer hook", async () => {
    const mod = await import("../event-contacts");
    expect(mod.useRemoveInterviewer).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/event-contacts.test.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

```typescript
// frontend/src/lib/queries/event-contacts.ts
import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/types";
import type { Contact } from "./contacts";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventContact = Tables<"event_contacts">;

export type EventContactWithDetails = EventContact & {
  contact: Contact;
};

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function eventContactsQueryOptions(eventId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["event_contacts", { eventId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_contacts")
        .select("*, contact:contacts(*)")
        .eq("event_id", eventId);
      if (error) throw error;
      return data as unknown as EventContactWithDetails[];
    },
    enabled: !!eventId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useEventContacts(eventId: string) {
  return useQuery(eventContactsQueryOptions(eventId));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useAddInterviewer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      contactId,
    }: {
      eventId: string;
      contactId: string;
    }) => {
      const { data, error } = await supabase
        .from("event_contacts")
        .insert({ event_id: eventId, contact_id: contactId })
        .select("*, contact:contacts(*)")
        .single();
      if (error) throw error;
      return data as unknown as EventContactWithDetails;
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.eventId) {
        queryClient.invalidateQueries({
          queryKey: ["event_contacts", { eventId: variables.eventId }],
        });
      }
    },
  });
}

export function useRemoveInterviewer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      contactId,
    }: {
      eventId: string;
      contactId: string;
    }) => {
      const { error } = await supabase
        .from("event_contacts")
        .delete()
        .eq("event_id", eventId)
        .eq("contact_id", contactId);
      if (error) throw error;
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.eventId) {
        queryClient.invalidateQueries({
          queryKey: ["event_contacts", { eventId: variables.eventId }],
        });
      }
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/event-contacts.test.ts`
Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/queries/event-contacts.ts frontend/src/lib/queries/__tests__/event-contacts.test.ts
git commit -m "feat: add event-contacts query layer for interviewer management"
```

---

### Task 4: Interviewer combobox component

**Files:**
- Create: `frontend/src/components/interviews/interviewer-combobox.tsx`
- Test: `frontend/src/components/interviews/__tests__/interviewer-combobox.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/interviews/__tests__/interviewer-combobox.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { InterviewerCombobox } from "../interviewer-combobox";

// Mock the contacts query
vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("InterviewerCombobox", () => {
  it("renders the trigger button", () => {
    render(
      <InterviewerCombobox
        companyId="company-1"
        selectedContactIds={[]}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Search interviewers...")).toBeInTheDocument();
  });

  it("shows selected contacts as chips", () => {
    const selectedContacts = [
      { id: "c1", name: "Alice Smith" },
      { id: "c2", name: "Bob Jones" },
    ];
    render(
      <InterviewerCombobox
        companyId="company-1"
        selectedContactIds={["c1", "c2"]}
        selectedContacts={selectedContacts}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("calls onRemove when chip X is clicked", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const selectedContacts = [{ id: "c1", name: "Alice Smith" }];

    render(
      <InterviewerCombobox
        companyId="company-1"
        selectedContactIds={["c1"]}
        selectedContacts={selectedContacts}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />
    );

    const removeButton = screen.getByLabelText("Remove Alice Smith");
    await user.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith("c1");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/interviews/__tests__/interviewer-combobox.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

The `InterviewerCombobox` follows the same Popover + Command pattern as `CompanyCombobox` but:
- Searches contacts filtered by `companyId`
- Shows selected contacts as removable chips
- Has a "+ Create [name]" inline option that expands a streamlined form (name, title, contact method selector + value)
- Auto-sets `company_id` on created contacts

```typescript
// frontend/src/components/interviews/interviewer-combobox.tsx
import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSearchContacts,
  useCreateContact,
  type Contact,
} from "@/lib/queries/contacts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InterviewerComboboxProps {
  companyId: string;
  selectedContactIds: string[];
  selectedContacts?: Pick<Contact, "id" | "name">[];
  onAdd: (contact: Pick<Contact, "id" | "name">) => void;
  onRemove?: (contactId: string) => void;
}

type ContactMethod = "email" | "phone" | "linkedin_url";

const CONTACT_METHOD_OPTIONS: { value: ContactMethod; label: string; placeholder: string }[] = [
  { value: "email", label: "Email", placeholder: "email@example.com" },
  { value: "phone", label: "Phone", placeholder: "+1 555-0100" },
  { value: "linkedin_url", label: "LinkedIn", placeholder: "linkedin.com/in/..." },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InterviewerCombobox({
  companyId,
  selectedContactIds,
  selectedContacts = [],
  onAdd,
  onRemove,
}: InterviewerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [contactMethod, setContactMethod] = useState<ContactMethod | "">("");
  const [contactValue, setContactValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { data: contacts, isLoading } = useSearchContacts(debouncedTerm, companyId);
  const createContact = useCreateContact();

  // Filter out already-selected contacts
  const availableContacts = contacts?.filter(
    (c) => !selectedContactIds.includes(c.id)
  ) ?? [];

  const hasExactMatch = contacts?.some(
    (c) => c.name.toLowerCase() === searchText.toLowerCase()
  ) ?? false;

  const handleSelect = useCallback(
    (contact: Pick<Contact, "id" | "name">) => {
      onAdd(contact);
      setSearchText("");
      setOpen(false);
    },
    [onAdd]
  );

  const handleStartCreate = useCallback(() => {
    setNewName(searchText);
    setNewTitle("");
    setContactMethod("");
    setContactValue("");
    setCreating(true);
  }, [searchText]);

  const handleCreate = useCallback(async () => {
    const input: Record<string, string | null> = {
      name: newName,
      title: newTitle || null,
      company_id: companyId,
      email: null,
      phone: null,
      linkedin_url: null,
    };

    if (contactMethod && contactValue) {
      input[contactMethod] = contactValue;
    }

    const result = await createContact.mutateAsync(input as any);
    handleSelect({ id: result.id, name: result.name });
    setCreating(false);
  }, [newName, newTitle, companyId, contactMethod, contactValue, createContact, handleSelect]);

  const handleCancelCreate = useCallback(() => {
    setCreating(false);
  }, []);

  return (
    <div className="space-y-2">
      {/* Selected interviewers as chips */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedContacts.map((contact) => (
            <Badge key={contact.id} variant="secondary" className="gap-1">
              {contact.name}
              {onRemove && (
                <button
                  type="button"
                  aria-label={`Remove ${contact.name}`}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                  onClick={() => onRemove(contact.id)}
                >
                  <X className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            Search interviewers...
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name..."
              value={searchText}
              onValueChange={setSearchText}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              )}

              {!isLoading && availableContacts.length === 0 && debouncedTerm.length >= 1 && (
                <CommandEmpty>No contacts found.</CommandEmpty>
              )}

              {availableContacts.length > 0 && (
                <CommandGroup>
                  {availableContacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={contact.id}
                      onSelect={() => handleSelect(contact)}
                    >
                      <Check className="mr-2 size-4 opacity-0" />
                      <div>
                        <span>{contact.name}</span>
                        {contact.title && (
                          <span className="ml-1 text-muted-foreground text-xs">
                            — {contact.title}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchText.length >= 1 && !hasExactMatch && !creating && (
                <CommandGroup>
                  <CommandItem onSelect={handleStartCreate}>
                    <Plus className="mr-2 size-4" />
                    Create &quot;{searchText}&quot;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Inline create form */}
      {creating && (
        <div className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">New Contact</p>
          <div className="space-y-2">
            <Label htmlFor="new-contact-name">Name *</Label>
            <Input
              id="new-contact-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-contact-title">Title</Label>
            <Input
              id="new-contact-title"
              placeholder="e.g. Engineering Manager"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Method</Label>
            <Select
              value={contactMethod}
              onValueChange={(v) => {
                setContactMethod(v as ContactMethod);
                setContactValue("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contactMethod && (
            <div className="space-y-2">
              <Label htmlFor="new-contact-value">
                {CONTACT_METHOD_OPTIONS.find((o) => o.value === contactMethod)?.label}
              </Label>
              <Input
                id="new-contact-value"
                placeholder={
                  CONTACT_METHOD_OPTIONS.find((o) => o.value === contactMethod)?.placeholder
                }
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={!newName || createContact.isPending}
            >
              {createContact.isPending ? "Creating..." : "Add Contact"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelCreate}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/interviews/__tests__/interviewer-combobox.test.tsx`
Expected: 3 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/interviews/interviewer-combobox.tsx frontend/src/components/interviews/__tests__/interviewer-combobox.test.tsx
git commit -m "feat: add interviewer combobox with inline contact creation"
```

---

### Task 5: Add interviewers section to add-event-dialog and schedule-dialog

**Files:**
- Modify: `frontend/src/components/applications/add-event-dialog.tsx`
- Modify: `frontend/src/components/interviews/schedule-dialog.tsx`
- Test: `frontend/src/components/interviews/__tests__/interviewer-section.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/interviews/__tests__/interviewer-section.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AddEventDialog } from "@/components/applications/add-event-dialog";

vi.mock("@/lib/queries/events", () => ({
  useCreateEvent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateEvent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/contacts", () => ({
  useSearchContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/event-contacts", () => ({
  useEventContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useAddInterviewer: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRemoveInterviewer: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("AddEventDialog with interviewers", () => {
  it("renders Interviewers section when type is an interview", () => {
    render(
      <AddEventDialog
        open={true}
        onOpenChange={vi.fn()}
        applicationId="app-1"
        companyId="company-1"
        mode="create"
      />
    );
    // The interviewers section should be present
    expect(screen.getByText("Interviewers")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/interviews/__tests__/interviewer-section.test.tsx`
Expected: FAIL — `companyId` prop doesn't exist on AddEventDialog yet.

**Step 3: Modify add-event-dialog.tsx**

Add `companyId` to the props interface. After the description textarea field, add an "Interviewers" section that renders the `InterviewerCombobox` when the event type is an interview type. For create mode, track selected contacts in local state. For edit mode, use `useEventContacts` to load existing interviewers and `useAddInterviewer`/`useRemoveInterviewer` to manage them.

Key changes:
- Add `companyId: string` to `AddEventDialogProps`
- Import `InterviewerCombobox` and event-contacts hooks
- Add state: `selectedInterviewers` array of `{id, name}` for create mode
- After form submit in create mode, loop through `selectedInterviewers` and call `addInterviewer.mutateAsync` for each
- In edit mode, load existing interviewers and allow add/remove directly

Also modify `schedule-dialog.tsx` similarly — it already has the application selector, so derive `companyId` from the selected application.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/interviews/__tests__/interviewer-section.test.tsx`
Expected: PASS.

**Step 5: Also update application-detail.tsx to pass companyId to AddEventDialog**

The `ApplicationDetail` component renders `AddEventDialog` — update it to pass `companyId={application.company_id}`.

**Step 6: Commit**

```bash
git add frontend/src/components/applications/add-event-dialog.tsx frontend/src/components/interviews/schedule-dialog.tsx frontend/src/components/applications/application-detail.tsx frontend/src/components/interviews/__tests__/interviewer-section.test.tsx
git commit -m "feat: add interviewers section to interview dialogs"
```

---

### Task 6: Contacts section on company form dialog

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`
- Create: `frontend/src/components/companies/company-contacts.tsx`
- Test: `frontend/src/components/companies/__tests__/company-contacts.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/companies/__tests__/company-contacts.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CompanyContacts } from "../company-contacts";

vi.mock("@/lib/queries/contacts", () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteContact: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("CompanyContacts", () => {
  it("renders empty state when no contacts", () => {
    render(<CompanyContacts companyId="company-1" />);
    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
  });

  it("renders Add Contact button", () => {
    render(<CompanyContacts companyId="company-1" />);
    expect(screen.getByText("Add Contact")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/companies/__tests__/company-contacts.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write implementation**

`CompanyContacts` renders a list of contacts for a company with:
- Each contact row: name, title, contact info (email/phone/linkedin), edit and delete buttons
- "Add Contact" button that toggles an inline form
- Full form: name, title, email, phone, linkedin_url, notes
- Edit mode: same form pre-filled

Then modify `company-form.tsx` to render `<CompanyContacts companyId={company.id} />` as a new fieldset section in edit mode, after the "Tags & Status" fieldset.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/companies/__tests__/company-contacts.test.tsx`
Expected: 2 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/companies/company-contacts.tsx frontend/src/components/companies/__tests__/company-contacts.test.tsx frontend/src/components/companies/company-form.tsx
git commit -m "feat: add contacts section to company form dialog"
```

---

### Task 7: Application documents query layer

**Files:**
- Create: `frontend/src/lib/queries/application-documents.ts`
- Test: `frontend/src/lib/queries/__tests__/application-documents.test.ts`

**Step 1: Write the failing test**

```typescript
// frontend/src/lib/queries/__tests__/application-documents.test.ts
import { describe, it, expect } from "vitest";

describe("application-documents query layer", () => {
  it("exports useApplicationDocuments hook", async () => {
    const mod = await import("../application-documents");
    expect(mod.useApplicationDocuments).toBeDefined();
  });

  it("exports useDetachDocument hook", async () => {
    const mod = await import("../application-documents");
    expect(mod.useDetachDocument).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/application-documents.test.ts`
Expected: FAIL — module not found.

**Step 3: Write minimal implementation**

```typescript
// frontend/src/lib/queries/application-documents.ts
import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Tables } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApplicationDocument = Tables<"application_documents">;
export type { ApplicationDocument };

// ---------------------------------------------------------------------------
// Query-option factories
// ---------------------------------------------------------------------------

export function applicationDocumentsQueryOptions(applicationId: string) {
  const supabase = createClient();

  return queryOptions({
    queryKey: ["application_documents", { applicationId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", applicationId)
        .order("linked_at", { ascending: false });
      if (error) throw error;
      return data as ApplicationDocument[];
    },
    enabled: !!applicationId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — queries
// ---------------------------------------------------------------------------

export function useApplicationDocuments(applicationId: string) {
  return useQuery(applicationDocumentsQueryOptions(applicationId));
}

// ---------------------------------------------------------------------------
// Hooks — mutations
// ---------------------------------------------------------------------------

export function useDetachDocument() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      applicationId,
    }: {
      id: string;
      applicationId: string;
    }) => {
      const { error } = await supabase
        .from("application_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { id, applicationId };
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.applicationId) {
        queryClient.invalidateQueries({
          queryKey: ["application_documents", { applicationId: variables.applicationId }],
        });
      }
    },
  });
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/queries/__tests__/application-documents.test.ts`
Expected: 2 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/queries/application-documents.ts frontend/src/lib/queries/__tests__/application-documents.test.ts
git commit -m "feat: add application-documents query layer"
```

---

### Task 8: Document picker dialog

**Files:**
- Create: `frontend/src/components/documents/document-picker.tsx`
- Test: `frontend/src/components/documents/__tests__/document-picker.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/documents/__tests__/document-picker.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DocumentPicker } from "../document-picker";

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({
    data: [
      { id: "d1", name: "My Resume", type: "resume", updated_at: "2026-01-01" },
      { id: "d2", name: "Cover Letter", type: "cover-letter", updated_at: "2026-01-02" },
    ],
    isLoading: false,
  })),
}));

describe("DocumentPicker", () => {
  it("renders document list grouped by type", () => {
    render(
      <DocumentPicker
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        excludeIds={[]}
      />
    );
    expect(screen.getByText("Resumes")).toBeInTheDocument();
    expect(screen.getByText("My Resume")).toBeInTheDocument();
    expect(screen.getByText("Cover Letters")).toBeInTheDocument();
    expect(screen.getByText("Cover Letter")).toBeInTheDocument();
  });

  it("renders empty state when no documents", () => {
    const { useDocuments } = vi.mocked(await import("@/lib/queries/documents"));
    (useDocuments as any).mockReturnValue({ data: [], isLoading: false });

    render(
      <DocumentPicker
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        excludeIds={[]}
      />
    );
    expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/documents/__tests__/document-picker.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write implementation**

A Dialog that lists the user's documents grouped by type (Resumes, Cover Letters, Other). Each document is a clickable row. Clicking calls `onSelect(documentId)` and closes the dialog. Exclude already-attached document IDs via `excludeIds` prop.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/documents/__tests__/document-picker.test.tsx`
Expected: 2 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/documents/document-picker.tsx frontend/src/components/documents/__tests__/document-picker.test.tsx
git commit -m "feat: add document picker dialog for attaching docs to applications"
```

---

### Task 9: Documents section on application detail page

**Files:**
- Create: `frontend/src/components/applications/application-documents.tsx`
- Modify: `frontend/src/components/applications/application-detail.tsx`
- Test: `frontend/src/components/applications/__tests__/application-documents.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/applications/__tests__/application-documents.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationDocuments } from "../application-documents";

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useDetachDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useSnapshotDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("ApplicationDocuments", () => {
  it("renders empty state when no documents attached", () => {
    render(<ApplicationDocuments applicationId="app-1" />);
    expect(screen.getByText("No documents attached")).toBeInTheDocument();
  });

  it("renders Attach Document button", () => {
    render(<ApplicationDocuments applicationId="app-1" />);
    expect(screen.getByText("Attach Document")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/applications/__tests__/application-documents.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write implementation**

`ApplicationDocuments` component:
- Uses `useApplicationDocuments(applicationId)` to load attached docs
- Renders a Card with title "Documents"
- Lists each doc: name, type badge, linked_at formatted date, remove (X) button
- "Attach Document" button opens `DocumentPicker`
- On picker select, calls `useSnapshotDocument` to create the snapshot

Then add `<ApplicationDocuments applicationId={application.id} />` to `application-detail.tsx` between the info grid and the Timeline section.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/applications/__tests__/application-documents.test.tsx`
Expected: 2 tests PASS.

**Step 5: Commit**

```bash
git add frontend/src/components/applications/application-documents.tsx frontend/src/components/applications/__tests__/application-documents.test.tsx frontend/src/components/applications/application-detail.tsx
git commit -m "feat: add documents section to application detail page"
```

---

### Task 10: Documents section on application form dialog

**Files:**
- Modify: `frontend/src/components/applications/application-form.tsx`
- Test: `frontend/src/components/applications/__tests__/application-form-docs.test.tsx`

**Step 1: Write the failing test**

```typescript
// frontend/src/components/applications/__tests__/application-form-docs.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ApplicationForm } from "../application-form";

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: vi.fn(() => ({ mutateAsync: vi.fn().mockResolvedValue({ id: "new-app" }), isPending: false })),
  useUpdateApplication: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: vi.fn(() => ({ data: [], isLoading: false })),
  useCreateCompany: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/application-documents", () => ({
  useApplicationDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useDetachDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

vi.mock("@/lib/queries/documents", () => ({
  useDocuments: vi.fn(() => ({ data: [], isLoading: false })),
  useSnapshotDocument: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

describe("ApplicationForm with documents", () => {
  it("shows Attach button in create mode", () => {
    render(
      <ApplicationForm
        open={true}
        onOpenChange={vi.fn()}
        mode="create"
      />
    );
    expect(screen.getByText("Attach")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/components/applications/__tests__/application-form-docs.test.tsx`
Expected: FAIL — no "Attach" button in the form yet.

**Step 3: Modify application-form.tsx**

Add a "Documents" section after the existing form fields:
- In **create mode**: "Attach" button opens `DocumentPicker`. Selected docs are stored in local state as `pendingDocumentIds`. Show them as chips with remove. After the application is created (`createApplication.mutateAsync` returns), loop through `pendingDocumentIds` and call `snapshotDocument.mutateAsync` for each.
- In **edit mode**: Use `useApplicationDocuments` to show currently attached docs as chips with remove (calls `detachDocument`), plus "Attach" button for adding more.

**Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/components/applications/__tests__/application-form-docs.test.tsx`
Expected: PASS.

**Step 5: Run all tests**

Run: `cd frontend && npx vitest run`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add frontend/src/components/applications/application-form.tsx frontend/src/components/applications/__tests__/application-form-docs.test.tsx
git commit -m "feat: add documents section to application form dialog"
```

---

### Task 11: Run full test suite and verify build

**Step 1: Run all tests**

Run: `cd frontend && npx vitest run`
Expected: All tests PASS (previous 20 + new tests from this plan).

**Step 2: Verify production build**

Run: `cd frontend && pnpm build`
Expected: Build succeeds.

**Step 3: Commit any fixes**

If any tests or build issues were found, fix and commit.

```bash
git commit -m "fix: resolve any issues found during final verification"
```
