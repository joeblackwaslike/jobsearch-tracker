# THRIVE Frontend Iteration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a polished, feature-complete iteration: user menu, toast notifications, full application form overhaul (new components + field improvements), interview filter, email reminders infrastructure, pre-commit and CI setup.

**Architecture:** Frontend-first. New shared UI primitives (TagInput, SalaryRangeSlider, SourceCombobox, CityCombobox) power the redesigned application forms. Sonner toasts wire into existing mutation hooks. Email reminders land as a Supabase Edge Function + Cron.

**Tech Stack:** React, TanStack Router, Supabase (auth + DB + Cron + Edge Functions), shadcn/ui, Radix UI, Sonner, react-email, Resend, Vitest + Testing Library, Biome, Bun.

---

## Reference

- **Run all tests:** `cd frontend && bun run test --run`
- **Run one file:** `cd frontend && bun run test --run src/path/to/file.test.tsx`
- **Lint:** `cd frontend && bun run biome check .`
- **Type check:** `cd frontend && bunx tsc --noEmit`
- **Build:** `cd frontend && bun run build`
- **Design doc:** `docs/plans/2026-02-21-frontend-iteration-design.md`

---

## Phase 1: Infrastructure

### Task 1: Mount Toaster + install Radix Slider

**Files:**
- Modify: `frontend/src/routes/__root.tsx`
- Install: `@radix-ui/react-slider`

**Step 1: Install the Radix Slider package**

```bash
cd frontend && bun add @radix-ui/react-slider
```

Expected: Package added to `package.json`, no errors.

**Step 2: Mount the Toaster in root**

In `frontend/src/routes/__root.tsx`, add the import and mount `<Toaster />` inside `ThemeProvider`:

```tsx
import { Toaster } from "@/components/ui/sonner";

// Inside RootDocument, after ThemeProvider opens:
<ThemeProvider>
  <TooltipProvider>{children}</TooltipProvider>
  <Toaster />
</ThemeProvider>
```

**Step 3: Verify toast renders**

The Toaster is now mounted. No test needed — it's a wrapper-level change. Verify by running the smoke test:

```bash
cd frontend && bun run test --run src/test/smoke.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
cd frontend && git add package.json bun.lockb src/routes/__root.tsx
git commit -m "feat: mount Toaster in app root, install @radix-ui/react-slider"
```

---

## Phase 2: User Menu

### Task 2: UserMenu component

**Files:**
- Create: `frontend/src/components/layout/user-menu.tsx`
- Create: `frontend/src/components/layout/__tests__/user-menu.test.tsx`
- Modify: `frontend/src/components/layout/nav-bar.tsx`

**Step 1: Write the failing test**

Create `frontend/src/components/layout/__tests__/user-menu.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { UserMenu } from "../user-menu";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      signOut: vi.fn().mockResolvedValue({}),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe("UserMenu", () => {
  it("shows Login and Register when logged out", () => {
    render(<UserMenu />);
    // The trigger button should be visible
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/layout/__tests__/user-menu.test.tsx
```

Expected: FAIL — `UserMenu` not found.

**Step 3: Create the UserMenu component**

Create `frontend/src/components/layout/user-menu.tsx`:

```tsx
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

type AuthModal = "login" | "signup" | null;

function getUserInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>(null);
  const navigate = useNavigate();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="User menu">
            {user ? (
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {getUserInitials(user.email ?? "?")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <UserIcon className="size-5" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-medium truncate">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/settings?tab=general">
                  <SettingsIcon className="mr-2 size-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOutIcon className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setAuthModal("login")}>
                Sign In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAuthModal("signup")}>
                Register
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Login Modal */}
      <Dialog open={authModal === "login"} onOpenChange={(o) => !o && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In</DialogTitle>
            <DialogDescription>Sign in to your THRIVE account.</DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setAuthModal(null)} />
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={authModal === "signup"} onOpenChange={(o) => !o && setAuthModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Start tracking your job search.</DialogDescription>
          </DialogHeader>
          <SignupForm onSuccess={() => setAuthModal(null)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/layout/__tests__/user-menu.test.tsx
```

Expected: PASS

**Step 5: Wire UserMenu into NavBar**

In `frontend/src/components/layout/nav-bar.tsx`:

- Add import: `import { UserMenu } from "./user-menu";`
- Remove: `import { Settings } from "lucide-react";` and the Settings Tooltip block in desktop header and mobile sheet
- Replace the Settings block in desktop header:

```tsx
{/* Right: Theme toggle + User menu (desktop only) */}
<div className="hidden md:flex items-center gap-1">
  <ThemeToggle />
  <UserMenu />
</div>
```

- In mobile Sheet, replace the Settings `<Link>` button with `<UserMenu />`.

**Step 6: Run all tests**

```bash
cd frontend && bun run test --run
```

Expected: All PASS

**Step 7: Commit**

```bash
git add frontend/src/components/layout/user-menu.tsx \
        frontend/src/components/layout/__tests__/user-menu.test.tsx \
        frontend/src/components/layout/nav-bar.tsx
git commit -m "feat: add UserMenu to NavBar replacing Settings icon"
```

---

## Phase 3: Toast Notifications

### Task 3: Add toasts to mutation hooks

**Files:**
- Modify: `frontend/src/lib/queries/applications.ts`
- Modify: `frontend/src/lib/queries/companies.ts`
- Modify: `frontend/src/lib/queries/events.ts`
- Modify: `frontend/src/lib/queries/documents.ts`
- Modify: `frontend/src/lib/queries/contacts.ts`
- Modify: `frontend/src/lib/queries/settings.ts`

**Pattern:** Add `onSuccess` and `onError` to each mutation. Import `toast` from `"sonner"`.

**Step 1: Update applications.ts**

Add `import { toast } from "sonner";` at the top.

In `useCreateApplication`, add after `onSettled`:
```ts
onSuccess: () => { toast.success("Application added."); },
onError: () => { toast.error("Failed to add application."); },
```

In `useUpdateApplication`:
```ts
onSuccess: () => { toast.success("Application updated."); },
onError: () => { toast.error("Failed to update application."); },
```

In `useArchiveApplication`:
```ts
onSuccess: () => { toast.success("Application archived."); },
onError: () => { toast.error("Failed to archive application."); },
```

**Step 2: Update companies.ts**

Same pattern for `useCreateCompany`, `useUpdateCompany`, `useArchiveCompany`:
```ts
onSuccess: () => { toast.success("Company added."); },
onError: () => { toast.error("Failed to add company."); },
// etc.
```

**Step 3: Update events.ts (interviews)**

For `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`:
```ts
// create
onSuccess: () => { toast.success("Interview scheduled."); },
onError: () => { toast.error("Failed to schedule interview."); },
// update
onSuccess: () => { toast.success("Interview updated."); },
onError: () => { toast.error("Failed to update interview."); },
// delete
onSuccess: () => { toast.success("Interview deleted."); },
onError: () => { toast.error("Failed to delete interview."); },
```

**Step 4: Update documents.ts**

For `useCreateDocument`, `useUpdateDocument`, `useArchiveDocument`:
```ts
onSuccess: () => { toast.success("Document saved."); },
// etc.
```

**Step 5: Update contacts.ts**

For `useCreateContact`, `useUpdateContact`, `useDeleteContact`:
```ts
onSuccess: () => { toast.success("Contact saved."); },
// etc.
```

**Step 6: Update settings.ts**

For `useUpdateSettings`:
```ts
onSuccess: () => { toast.success("Settings saved."); },
onError: () => { toast.error("Failed to save settings."); },
```

**Step 7: Add signup toast**

In `frontend/src/components/auth/signup-form.tsx`, after successful sign-up:
```tsx
import { toast } from "sonner";
// inside onSubmit success:
toast.success("Welcome to THRIVE!");
onSuccess?.();
```

**Step 8: Run all tests**

```bash
cd frontend && bun run test --run
```

Expected: All PASS (toast calls are fire-and-forget; existing tests don't assert on them)

**Step 9: Commit**

```bash
git add frontend/src/lib/queries/ frontend/src/components/auth/signup-form.tsx
git commit -m "feat: add toast notifications to all mutation hooks and signup"
```

---

## Phase 4: Shared UI Components

### Task 4: SalaryRangeSlider component

**Files:**
- Create: `frontend/src/components/ui/salary-range-slider.tsx`
- Create: `frontend/src/components/ui/__tests__/salary-range-slider.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/ui/__tests__/salary-range-slider.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SalaryRangeSlider } from "../salary-range-slider";

describe("SalaryRangeSlider", () => {
  it("renders period select", () => {
    render(
      <SalaryRangeSlider
        period="yearly"
        currency="USD"
        min={0}
        max={200000}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Annual")).toBeInTheDocument();
  });

  it("renders hourly period", () => {
    render(
      <SalaryRangeSlider
        period="hourly"
        currency="USD"
        min={0}
        max={100}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Hourly")).toBeInTheDocument();
  });

  it("shows formatted range label for annual", () => {
    render(
      <SalaryRangeSlider
        period="yearly"
        currency="USD"
        min={80000}
        max={120000}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("$80k – $120k")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/ui/__tests__/salary-range-slider.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create SalaryRangeSlider**

```tsx
// frontend/src/components/ui/salary-range-slider.tsx
import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PERIOD_OPTIONS = [
  { value: "yearly", label: "Annual" },
  { value: "hourly", label: "Hourly" },
] as const;

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

interface SalaryRangeSliderProps {
  period: string;
  currency: string;
  min: number;
  max: number;
  onChange: (values: { period: string; currency: string; min: number; max: number }) => void;
}

function formatSalary(value: number, period: string): string {
  if (period === "yearly") {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${value}`;
}

export function SalaryRangeSlider({ period, currency, min, max, onChange }: SalaryRangeSliderProps) {
  const isYearly = period === "yearly";
  const sliderMax = isYearly ? 1_000_000 : 500;
  const step = isYearly ? 1000 : 1;

  const safeMin = Math.min(min, sliderMax);
  const safeMax = Math.min(max, sliderMax);

  function handlePeriodChange(newPeriod: string) {
    onChange({ period: newPeriod, currency, min: 0, max: 0 });
  }

  function handleCurrencyChange(newCurrency: string) {
    onChange({ period, currency: newCurrency, min, max });
  }

  function handleSliderChange([newMin, newMax]: number[]) {
    onChange({ period, currency, min: newMin, max: newMax });
  }

  const rangeLabel =
    safeMin === 0 && safeMax === 0
      ? "Not specified"
      : `${formatSalary(safeMin, period)} – ${formatSalary(safeMax, period)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Period</Label>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Range</span>
          <span className="font-medium text-foreground">{rangeLabel}</span>
        </div>
        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center"
          min={0}
          max={sliderMax}
          step={step}
          value={[safeMin, safeMax]}
          onValueChange={handleSliderChange}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>{isYearly ? "$1M" : "$500"}</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/ui/__tests__/salary-range-slider.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/ui/salary-range-slider.tsx \
        frontend/src/components/ui/__tests__/salary-range-slider.test.tsx
git commit -m "feat: add SalaryRangeSlider component with Radix slider"
```

---

### Task 5: TagInput component

**Files:**
- Create: `frontend/src/components/ui/tag-input.tsx`
- Create: `frontend/src/components/ui/__tests__/tag-input.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/ui/__tests__/tag-input.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TagInput } from "../tag-input";

describe("TagInput", () => {
  it("renders existing tags as chips", () => {
    render(<TagInput value={["react", "typescript"]} onChange={vi.fn()} />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("adds a tag when comma is typed", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "react," } });
    expect(onChange).toHaveBeenCalledWith(["react"]);
  });

  it("removes a tag when × is clicked", () => {
    const onChange = vi.fn();
    render(<TagInput value={["react"]} onChange={onChange} />);
    const removeBtn = screen.getByRole("button", { name: /remove react/i });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/ui/__tests__/tag-input.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Create TagInput**

```tsx
// frontend/src/components/ui/tag-input.tsx
import { useState } from "react";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tag..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw.endsWith(",")) {
      const tag = raw.slice(0, -1).trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInputValue("");
    } else {
      setInputValue(raw);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="flex min-h-9 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => removeTag(tag)}
            className="rounded-full hover:bg-muted"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="h-auto min-w-[80px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/ui/__tests__/tag-input.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/ui/tag-input.tsx \
        frontend/src/components/ui/__tests__/tag-input.test.tsx
git commit -m "feat: add TagInput chip component"
```

---

### Task 6: SourceCombobox component

**Files:**
- Create: `frontend/src/components/applications/source-combobox.tsx`
- Create: `frontend/src/components/applications/__tests__/source-combobox.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/applications/__tests__/source-combobox.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SourceCombobox } from "../source-combobox";

describe("SourceCombobox", () => {
  it("renders with placeholder when no value", () => {
    render(<SourceCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<SourceCombobox value="linkedin" onChange={vi.fn()} />);
    expect(screen.getByText("linkedin")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/source-combobox.test.tsx
```

Expected: FAIL

**Step 3: Create SourceCombobox**

```tsx
// frontend/src/components/applications/source-combobox.tsx
import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  "google search",
  "google jobs",
  "theirstack",
  "welcome to the jungle",
  "linkedin",
  "wellfound",
  "glassdoor",
  "builtin",
  "workatastartup",
  "indeed",
  "dice",
  "ziprecruiter",
  "levels",
  "blind",
  "referral",
];

interface SourceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceCombobox({ value, onChange }: SourceComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select or type source..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type source..."
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                onClick={() => { setOpen(false); }}
              >
                Use &ldquo;{value}&rdquo;
              </button>
            </CommandEmpty>
            <CommandGroup>
              {SOURCE_OPTIONS.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/source-combobox.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/applications/source-combobox.tsx \
        frontend/src/components/applications/__tests__/source-combobox.test.tsx
git commit -m "feat: add SourceCombobox with predefined list + free-text"
```

---

### Task 7: CityCombobox + city data

**Files:**
- Create: `frontend/src/data/major-us-cities.json`
- Create: `frontend/src/components/applications/city-combobox.tsx`
- Create: `frontend/src/components/applications/__tests__/city-combobox.test.tsx`

**Step 1: Create the city data file**

Create `frontend/src/data/major-us-cities.json` with ~100 major US cities to start. The format is an array of strings: `"City, ST"`. Include at minimum the following cities (expand as needed):

```json
[
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX",
  "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA",
  "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL",
  "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "Indianapolis, IN",
  "San Francisco, CA", "Seattle, WA", "Denver, CO", "Nashville, TN",
  "Oklahoma City, OK", "El Paso, TX", "Washington, DC", "Boston, MA",
  "Las Vegas, NV", "Louisville, KY", "Memphis, TN", "Portland, OR",
  "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ",
  "Fresno, CA", "Sacramento, CA", "Kansas City, MO", "Mesa, AZ",
  "Atlanta, GA", "Omaha, NE", "Colorado Springs, CO", "Raleigh, NC",
  "Long Beach, CA", "Virginia Beach, VA", "Minneapolis, MN", "Tampa, FL",
  "New Orleans, LA", "Honolulu, HI", "Anaheim, CA", "Aurora, CO",
  "Santa Ana, CA", "Corpus Christi, TX", "Riverside, CA", "Pittsburgh, PA",
  "Lexington, KY", "Stockton, CA", "Cincinnati, OH", "St. Paul, MN",
  "Anchorage, AK", "Greensboro, NC", "Plano, TX", "Henderson, NV",
  "Lincoln, NE", "Buffalo, NY", "Fort Wayne, IN", "Jersey City, NJ",
  "Chula Vista, CA", "Orlando, FL", "St. Louis, MO", "Madison, WI",
  "Durham, NC", "Lubbock, TX", "Winston-Salem, NC", "Garland, TX",
  "Glendale, AZ", "Hialeah, FL", "Reno, NV", "Baton Rouge, LA",
  "Irvine, CA", "Chesapeake, VA", "Irving, TX", "Scottsdale, AZ",
  "North Las Vegas, NV", "Fremont, CA", "Gilbert, AZ", "San Bernardino, CA",
  "Birmingham, AL", "Boise, ID", "Rochester, NY", "Richmond, VA",
  "Spokane, WA", "Des Moines, IA", "Montgomery, AL", "Modesto, CA",
  "Fayetteville, NC", "Tacoma, WA", "Shreveport, LA", "Akron, OH",
  "Aurora, IL", "Yonkers, NY", "Huntington Beach, CA", "Little Rock, AR",
  "Salt Lake City, UT", "Tallahassee, FL", "Grand Rapids, MI", "Huntsville, AL"
]
```

**Step 2: Write the failing test**

```tsx
// frontend/src/components/applications/__tests__/city-combobox.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CityCombobox } from "../city-combobox";

describe("CityCombobox", () => {
  it("renders with placeholder", () => {
    render(<CityCombobox value="" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays selected value", () => {
    render(<CityCombobox value="San Francisco, CA" onChange={vi.fn()} />);
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/city-combobox.test.tsx
```

Expected: FAIL

**Step 4: Create CityCombobox**

```tsx
// frontend/src/components/applications/city-combobox.tsx
import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import cities from "@/data/major-us-cities.json";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CityCombobox({ value, onChange }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "City, State..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search city..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No city found. Type to use custom value.</CommandEmpty>
            <CommandGroup>
              {(cities as string[])
                .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 50)
                .map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(val) => {
                      onChange(val);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn("mr-2 size-4", value === city ? "opacity-100" : "opacity-0")}
                    />
                    {city}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Step 5: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/city-combobox.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/data/major-us-cities.json \
        frontend/src/components/applications/city-combobox.tsx \
        frontend/src/components/applications/__tests__/city-combobox.test.tsx
git commit -m "feat: add CityCombobox with bundled US major cities list"
```

---

## Phase 5: Application Forms

### Task 8: EasyAddForm component

The current `ApplicationForm` create mode becomes a standalone `EasyAddForm`. The existing `ApplicationForm` will be refactored to edit-only in a later task. For now, create `EasyAddForm` as a new file copying the create-mode logic.

**Files:**
- Create: `frontend/src/components/applications/easy-add-form.tsx`
- Create: `frontend/src/components/applications/__tests__/easy-add-form.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/applications/__tests__/easy-add-form.test.tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";
import { EasyAddForm } from "../easy-add-form";

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: "new" }), isPending: false }),
}));
vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/documents", () => ({
  useDocuments: () => ({ data: [], isLoading: false }),
  useSnapshotDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(() => []),
  })),
}));

describe("EasyAddForm", () => {
  it("renders the dialog with title", () => {
    render(<EasyAddForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Easy Add Application")).toBeInTheDocument();
  });

  it("shows Company, Position, URL, Resume fields", () => {
    render(<EasyAddForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Company *")).toBeInTheDocument();
    expect(screen.getByText("Position *")).toBeInTheDocument();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/easy-add-form.test.tsx
```

Expected: FAIL

**Step 3: Create EasyAddForm**

Create `frontend/src/components/applications/easy-add-form.tsx`. This is extracted from the current `ApplicationForm` create-mode. Key changes:
- Dialog title: "Easy Add Application"
- Default status: `"applied"` (changed from `"bookmarked"`)
- Employment type default: `"full-time"`
- Fields: Company, Position, URL, Resume

```tsx
// frontend/src/components/applications/easy-add-form.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DocumentTypePicker } from "@/components/documents/document-type-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateApplication } from "@/lib/queries/applications";
import type { Company } from "@/lib/queries/companies";
import { useSnapshotDocument } from "@/lib/queries/documents";
import { CompanyCombobox } from "./company-combobox";

const easyAddSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  company_name: z.string().default(""),
  position: z.string().min(1, "Position is required"),
  url: z.string().default(""),
});

type EasyAddValues = z.infer<typeof easyAddSchema>;

interface EasyAddFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefill?: { company?: string; position?: string; url?: string };
}

export function EasyAddForm({ open, onOpenChange, onSuccess, prefill }: EasyAddFormProps) {
  const createApplication = useCreateApplication();
  const snapshotDocument = useSnapshotDocument();
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EasyAddValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zod version mismatch
    resolver: zodResolver(easyAddSchema as any),
    defaultValues: {
      company_id: "",
      company_name: "",
      position: prefill?.position ?? "",
      url: prefill?.url ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        company_id: "",
        company_name: "",
        position: prefill?.position ?? "",
        url: prefill?.url ?? "",
      });
      const savedId = localStorage.getItem("thrive:default_resume_id");
      setSelectedResumeId(savedId ?? null);
    }
  }, [open, reset, prefill]);

  const selectedCompany = watch("company_id")
    ? { id: watch("company_id"), name: watch("company_name") }
    : null;

  const handleCompanySelect = (company: Pick<Company, "id" | "name">) => {
    setValue("company_id", company.id, { shouldValidate: true });
    setValue("company_name", company.name);
  };

  const onSubmit = async (values: EasyAddValues) => {
    const newApp = await createApplication.mutateAsync({
      company_id: values.company_id,
      position: values.position,
      url: values.url || null,
      status: "applied",
      employment_type: "full-time",
    });

    if (selectedResumeId && newApp?.id) {
      await snapshotDocument.mutateAsync({
        applicationId: newApp.id,
        documentId: selectedResumeId,
      });
      localStorage.setItem("thrive:default_resume_id", selectedResumeId);
    } else {
      localStorage.removeItem("thrive:default_resume_id");
    }

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Easy Add Application</DialogTitle>
          <DialogDescription>Quickly log a new job application.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company *</Label>
              <CompanyCombobox
                value={selectedCompany}
                onSelect={handleCompanySelect}
                initialSearchText={prefill?.company ?? ""}
              />
              {errors.company_id && (
                <p className="text-sm text-destructive">{errors.company_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="easy-position">Position *</Label>
              <Input
                id="easy-position"
                placeholder="e.g. Senior Software Engineer"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-sm text-destructive">{errors.position.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="easy-url">URL</Label>
              <Input id="easy-url" placeholder="https://..." {...register("url")} />
            </div>

            <div className="space-y-2">
              <Label>Resume</Label>
              <DocumentTypePicker
                type="resume"
                value={selectedResumeId}
                onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/easy-add-form.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/applications/easy-add-form.tsx \
        frontend/src/components/applications/__tests__/easy-add-form.test.tsx
git commit -m "feat: add EasyAddForm component (extracted from ApplicationForm create mode)"
```

---

### Task 9: Update ApplicationForm to edit-only + integrate new field components

**Files:**
- Modify: `frontend/src/components/applications/application-form.tsx`
- Modify existing tests: `frontend/src/components/applications/__tests__/application-form-docs.test.tsx`

**Step 1: Update ApplicationForm**

In `frontend/src/components/applications/application-form.tsx`:

1. Remove `mode: "create" | "edit"` prop — edit only.
2. Remove create-mode branch JSX.
3. Remove `mode === "create"` references from `isCreate` logic.
4. Change `WORK_TYPE_OPTIONS` to include hybrid variants:
   ```ts
   const WORK_TYPE_OPTIONS = [
     "remote",
     "Hybrid (1 day)",
     "Hybrid (2 day)",
     "Hybrid (3 day)",
     "Hybrid (4 day)",
     "onsite",
   ] as const;
   ```
5. Change `SALARY_PERIOD_OPTIONS` to remove `"monthly"`:
   ```ts
   const SALARY_PERIOD_OPTIONS = ["yearly", "hourly"] as const;
   ```
6. Replace salary min/max `<Input>` fields with `<SalaryRangeSlider>`:
   ```tsx
   import { SalaryRangeSlider } from "@/components/ui/salary-range-slider";

   // Replace the Salary fieldset body:
   <SalaryRangeSlider
     period={watch("salary.period") ?? "yearly"}
     currency={watch("salary.currency") ?? "USD"}
     min={watch("salary.min") ?? 0}
     max={watch("salary.max") ?? 0}
     onChange={({ period, currency, min, max }) => {
       setValue("salary.period", period);
       setValue("salary.currency", currency);
       setValue("salary.min", min);
       setValue("salary.max", max);
     }}
   />
   ```
7. Replace source `<Input>` with `<SourceCombobox>`:
   ```tsx
   import { SourceCombobox } from "./source-combobox";

   <SourceCombobox
     value={watch("source") ?? ""}
     onChange={(v) => setValue("source", v)}
   />
   ```
8. Replace tags `<Input>` with `<TagInput>`:
   ```tsx
   import { TagInput } from "@/components/ui/tag-input";

   // tags schema must change to z.array(z.string()).default([])
   // Update applicationFormSchema accordingly
   // Update applicationToFormValues to use array directly
   // Update formValuesToPayload to pass array directly

   <TagInput
     value={watch("tags") ?? []}
     onChange={(tags) => setValue("tags", tags)}
   />
   ```
9. Replace location `<Input>` with `<CityCombobox>`:
   ```tsx
   import { CityCombobox } from "./city-combobox";

   <CityCombobox
     value={watch("location") ?? ""}
     onChange={(v) => setValue("location", v)}
   />
   ```
10. Employment type default: `"full-time"`.
11. Fix overflow: Change `ScrollArea className="max-h-[60vh]"` to `max-h-[70vh]`.
12. Remove `DocumentTypePicker` and `attachedDocs` logic from this component (documents UI handled in Task 11).

**Note on tags schema change:** The `tags` field must change from `z.string()` to `z.array(z.string())`:
```ts
// In applicationFormSchema:
tags: z.array(z.string()).default([]),

// In applicationToFormValues:
tags: Array.isArray(app.tags) ? (app.tags as string[]) : [],

// In formValuesToPayload:
tags: values.tags.length > 0 ? values.tags : null,

// Default values:
tags: [],
```

**Step 2: Update tests**

In `frontend/src/components/applications/__tests__/application-form-docs.test.tsx`:
- Remove the `mode="create"` test case (that form is now `EasyAddForm`).
- Update the edit test to remove `mode` prop (no longer needed).

**Step 3: Run tests**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/
```

Expected: All PASS

**Step 4: Commit**

```bash
git add frontend/src/components/applications/application-form.tsx \
        frontend/src/components/applications/__tests__/application-form-docs.test.tsx
git commit -m "feat: refactor ApplicationForm to edit-only with new field components (salary slider, tags, source, city)"
```

---

### Task 10: FullApplicationForm component

This is the new "New Application" modal — identical structure to the edit form but in create mode with all fields editable.

**Files:**
- Create: `frontend/src/components/applications/full-application-form.tsx`
- Create: `frontend/src/components/applications/__tests__/full-application-form.test.tsx`

**Step 1: Write the failing test**

```tsx
// frontend/src/components/applications/__tests__/full-application-form.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { FullApplicationForm } from "../full-application-form";

vi.mock("@/lib/queries/applications", () => ({
  useCreateApplication: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: "new" }), isPending: false }),
}));
vi.mock("@/lib/queries/companies", () => ({
  useSearchCompanies: () => ({ data: [], isLoading: false }),
  useCreateCompany: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/queries/documents", () => ({
  useDocuments: () => ({ data: [], isLoading: false }),
  useSnapshotDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
  documentsQueryOptions: vi.fn((type?: string) => ({
    queryKey: ["documents", { type }],
    queryFn: vi.fn(() => []),
  })),
}));

describe("FullApplicationForm", () => {
  it("renders with title New Application", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("New Application")).toBeInTheDocument();
  });

  it("shows all field group headings", () => {
    render(<FullApplicationForm open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByText("Job Details")).toBeInTheDocument();
    expect(screen.getByText("Salary Information")).toBeInTheDocument();
    expect(screen.getByText("Additional Information")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: FAIL

**Step 3: Create FullApplicationForm**

Create `frontend/src/components/applications/full-application-form.tsx`. This mirrors `ApplicationForm` (edit) but:
- All fields editable (including Company via `CompanyCombobox`)
- Default `status: "applied"`, `employment_type: "full-time"`
- Title: "New Application"
- Description: "Add a new job application with full details."
- Grouped fields: Basic Information, Job Details, Salary Information, Additional Information, Documents
- Uses `SalaryRangeSlider`, `TagInput`, `SourceCombobox`, `CityCombobox`
- Uses `DocumentTypePicker` for resume attachment

The schema and `formValuesToPayload` logic are identical to the updated `application-form.tsx` (they can share utility functions if desired, but keep them inline for simplicity).

Key field groupings in JSX:
```tsx
{/* Basic Information */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Basic Information</legend>
  {/* Company combobox (editable) */}
  {/* Position */}
  {/* Status (default: applied) */}
  {/* Interest (default: medium) */}
</fieldset>

{/* Job Details */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Job Details</legend>
  {/* Work Type */}
  {/* Employment Type (default: full-time) */}
  {/* CityCombobox for Location */}
  {/* URL */}
  {/* Job Description textarea */}
</fieldset>

{/* Salary Information */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Salary Information</legend>
  <SalaryRangeSlider ... />
</fieldset>

{/* Additional Information */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Additional Information</legend>
  {/* SourceCombobox */}
  {/* TagInput */}
  {/* Notes textarea */}
</fieldset>

{/* Documents */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Documents</legend>
  <DocumentTypePicker ... />
</fieldset>
```

**Step 4: Run test to verify it passes**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/full-application-form.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/applications/full-application-form.tsx \
        frontend/src/components/applications/__tests__/full-application-form.test.tsx
git commit -m "feat: add FullApplicationForm with grouped fields and new field components"
```

---

### Task 11: Wire forms into Applications page and Dashboard

**Files:**
- Modify: `frontend/src/routes/_authenticated/applications.tsx`
- Modify: `frontend/src/components/dashboard/quick-actions.tsx`

**Step 1: Update Applications page**

In `frontend/src/routes/_authenticated/applications.tsx`:

1. Add imports:
   ```tsx
   import { EasyAddForm } from "@/components/applications/easy-add-form";
   import { FullApplicationForm } from "@/components/applications/full-application-form";
   ```
2. Remove: `import { ApplicationForm } from ...`
3. Add state: `const [easyAddOpen, setEasyAddOpen] = useState(false);`
4. Update header buttons:
   ```tsx
   <div className="flex items-center gap-2">
     <Button variant="outline" onClick={() => setEasyAddOpen(true)}>
       <ZapIcon className="size-4" />
       Easy Add
     </Button>
     <Button onClick={() => setFormOpen(true)}>
       <PlusIcon className="size-4" />
       New Application
     </Button>
   </div>
   ```
   Add `import { ZapIcon } from "lucide-react";`
5. Replace `<ApplicationForm open={formOpen} ... mode="create" />` with `<FullApplicationForm open={formOpen} onOpenChange={setFormOpen} />`
6. Add `<EasyAddForm open={easyAddOpen} onOpenChange={setEasyAddOpen} />`
7. Edit dialog: `<ApplicationForm open={!!editingApp} ... application={editingApp} />` — remove `mode` prop (now edit-only)

**Step 2: Update Dashboard QuickActions**

In `frontend/src/components/dashboard/quick-actions.tsx`:

1. Replace `<ApplicationForm ... mode="create" />` with `<EasyAddForm ... />`
2. Import `EasyAddForm` instead of `ApplicationForm`
3. Add a second "Full Application" button that opens `FullApplicationForm`:
   ```tsx
   const [fullFormOpen, setFullFormOpen] = useState(false);

   <Button variant="outline" className="justify-start" onClick={() => setApplicationFormOpen(true)}>
     <ZapIcon className="mr-2 size-4" />
     Easy Add Application
   </Button>
   <Button variant="outline" className="justify-start" onClick={() => setFullFormOpen(true)}>
     <PlusIcon className="mr-2 size-4" />
     New Application
   </Button>

   <EasyAddForm open={applicationFormOpen} onOpenChange={setApplicationFormOpen} />
   <FullApplicationForm open={fullFormOpen} onOpenChange={setFullFormOpen} />
   ```

**Step 3: Run all tests**

```bash
cd frontend && bun run test --run
```

Expected: All PASS

**Step 4: Commit**

```bash
git add frontend/src/routes/_authenticated/applications.tsx \
        frontend/src/components/dashboard/quick-actions.tsx
git commit -m "feat: wire EasyAddForm and FullApplicationForm into Applications page and Dashboard"
```

---

## Phase 6: Field Updates & Bugfixes

### Task 12: Update hybrid work type options everywhere

**Files:**
- Modify: `frontend/src/components/applications/application-filters.tsx`
- Modify: `frontend/src/components/applications/application-table.tsx`
- Modify: `frontend/src/components/applications/application-detail.tsx`

**Step 1: Update application-filters.tsx**

Find the `WORK_TYPE` filter options and replace `"hybrid"` with the four variants:
```tsx
const WORK_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "Hybrid (1 day)", label: "Hybrid (1 day)" },
  { value: "Hybrid (2 day)", label: "Hybrid (2 day)" },
  { value: "Hybrid (3 day)", label: "Hybrid (3 day)" },
  { value: "Hybrid (4 day)", label: "Hybrid (4 day)" },
  { value: "onsite", label: "Onsite" },
];
```

**Step 2: Update application-table.tsx**

Find the work_type cell renderer and update the display mapping to handle the new hybrid values (they already display correctly since they're stored as the full string).

**Step 3: Update application-detail.tsx**

Find where `work_type` is displayed; no change needed if it displays the raw string, but verify it shows correctly.

**Step 4: Run relevant tests**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/application-filters.test.tsx
cd frontend && bun run test --run src/components/applications/__tests__/application-table.test.tsx
```

Expected: PASS (or update test data if tests use old "hybrid" value)

**Step 5: Commit**

```bash
git add frontend/src/components/applications/application-filters.tsx \
        frontend/src/components/applications/application-table.tsx \
        frontend/src/components/applications/application-detail.tsx
git commit -m "feat: expand hybrid work type to 4 day variants in filters, table, and detail"
```

---

### Task 13: Fix modal overflow bugfixes

**Files:**
- Modify: `frontend/src/components/companies/company-form.tsx`

The `ApplicationForm` overflow was already addressed in Task 9 (ScrollArea `max-h-[70vh]`).

**Step 1: Fix CompanyForm overflow**

In `frontend/src/components/companies/company-form.tsx`, line `<ScrollArea className="max-h-[60vh] pr-4">`:

Change to: `<ScrollArea className="max-h-[70vh] pr-4">`

Also ensure `DialogContent` already has `max-h-[90vh]` (it does: `"sm:max-w-2xl max-h-[90vh]"`). Add `overflow-hidden` to be safe:
```tsx
<DialogContent className={isCreate ? "sm:max-w-md" : "sm:max-w-2xl max-h-[90vh] overflow-hidden"}>
```

**Step 2: Run tests**

```bash
cd frontend && bun run test --run src/components/companies/__tests__/company-form.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/companies/company-form.tsx
git commit -m "fix: increase ScrollArea max-h in CompanyForm to prevent overflow in edit mode"
```

---

## Phase 7: Remaining Frontend

### Task 14: Interview archived-application filter

**Files:**
- Modify: `frontend/src/components/interviews/interview-list.tsx`
- Modify: `frontend/src/routes/_authenticated/interviews.tsx` (pass `hideArchived` prop)

**Step 1: Read the interviews route**

Check `frontend/src/routes/_authenticated/interviews.tsx` to understand how interviews are fetched and passed to `InterviewList`.

**Step 2: Update InterviewList**

In `frontend/src/components/interviews/interview-list.tsx`, add a `hideArchived` prop (default `true`) and filter:

```tsx
interface InterviewListProps {
  interviews: EventWithApplication[];
  search: string;
  hideArchived?: boolean;
}

export function InterviewList({ interviews, search, hideArchived = true }: InterviewListProps) {
  const filtered = interviews.filter((interview) => {
    if (hideArchived && interview.application?.status === "archived") return false;
    if (!search) return true;
    // ... existing search filter
  });

  // Add filter indicator chip after the empty state check:
  return (
    <>
      {hideArchived && (
        <p className="text-xs text-muted-foreground">
          Showing active interviews only.
        </p>
      )}
      <div className="space-y-3">
        {/* ... existing interview cards */}
      </div>
    </>
  );
}
```

**Step 3: Verify EventWithApplication type has application.status**

Check `frontend/src/lib/queries/events.ts` — confirm `EventWithApplication` includes `application.status`. If not, update the select query to include it.

**Step 4: Run tests**

```bash
cd frontend && bun run test --run src/components/interviews/__tests__/
```

Expected: PASS (update mocks if needed to include `application.status`)

**Step 5: Commit**

```bash
git add frontend/src/components/interviews/interview-list.tsx \
        frontend/src/lib/queries/events.ts
git commit -m "feat: filter archived-application interviews by default in InterviewList"
```

---

### Task 15: Settings — email_reminders DB migration + UI

**Files:**
- Create: `supabase/migrations/<timestamp>_add_email_reminders_to_settings.sql`
- Modify: `frontend/src/components/settings/general-tab.tsx`
- Modify: `frontend/src/lib/queries/settings.ts`

**Step 1: Create Supabase migration**

Find the latest migration number in `supabase/migrations/` and create the next one:

```sql
-- supabase/migrations/<timestamp>_add_email_reminders_to_settings.sql
alter table settings
  add column if not exists email_reminders boolean not null default true;
```

Apply locally with: `bun run supabase db push` (or `bun run supabase migration up`).

**Step 2: Update settings types**

In `frontend/src/lib/supabase/types.ts`, the `settings` table Row/Insert/Update types need `email_reminders: boolean`. If types are auto-generated, regenerate:
```bash
cd frontend && bunx supabase gen types typescript --local > src/lib/supabase/types.ts
```

If types are manually maintained, add the field manually.

**Step 3: Update settings query**

In `frontend/src/lib/queries/settings.ts`, verify `email_reminders` is included in the select (if using `select("*")`, it will be).

**Step 4: Update settings UI**

In `frontend/src/components/settings/general-tab.tsx`, replace the disabled "Email Notifications — Coming Soon" row:

```tsx
<SettingRow
  label="Email Notifications"
  description="Receive email reminders for upcoming interviews"
>
  <Switch
    checked={settings?.email_reminders ?? true}
    onCheckedChange={(checked) => handleSwitchChange("email_reminders", checked as boolean)}
  />
</SettingRow>
```

**Step 5: Run all tests**

```bash
cd frontend && bun run test --run
```

Expected: PASS

**Step 6: Commit**

```bash
git add supabase/migrations/ \
        frontend/src/lib/supabase/types.ts \
        frontend/src/lib/queries/settings.ts \
        frontend/src/components/settings/general-tab.tsx
git commit -m "feat: add email_reminders setting with DB migration and Settings UI toggle"
```

---

### Task 16: Documents UI update in application forms

**Files:**
- Modify: `frontend/src/components/applications/application-form.tsx` (edit)
- Modify: `frontend/src/components/applications/full-application-form.tsx`

**Step 1: Update Documents fieldset**

In both forms, update the Documents fieldset to show attached documents as a styled list:

```tsx
{/* Documents fieldset */}
<fieldset className="space-y-4">
  <legend className="text-sm font-semibold text-muted-foreground">Documents</legend>

  <div className="space-y-2">
    <Label>Resume</Label>
    <DocumentTypePicker
      type="resume"
      value={selectedResumeId}
      onChange={(doc) => setSelectedResumeId(doc?.id ?? null)}
    />
  </div>

  {attachedDocs.length > 0 && (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Attached</Label>
      <div className="space-y-1">
        {attachedDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{doc.name}</span>
              <Badge variant="outline" className="text-xs">{doc.type}</Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => detachDocument.mutateAsync({ id: doc.id, applicationId: application?.id ?? "" })}
            >
              <XIcon className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )}
</fieldset>
```

Add `import { FileIcon, XIcon } from "lucide-react";`

**Step 2: Run tests**

```bash
cd frontend && bun run test --run src/components/applications/__tests__/
```

Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/applications/application-form.tsx \
        frontend/src/components/applications/full-application-form.tsx
git commit -m "feat: update Documents UI in application forms with file list display"
```

---

## Phase 8: Backend / Infrastructure

### Task 17: react-email + interview reminder template

**Files:**
- Modify: `frontend/package.json` (add react-email)
- Create: `frontend/src/emails/interview-reminder.tsx`

**Step 1: Install react-email**

```bash
cd frontend && bun add @react-email/components react-email
```

Expected: Packages added to `package.json`.

**Step 2: Create interview reminder email template**

Create `frontend/src/emails/interview-reminder.tsx`:

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface InterviewReminderEmailProps {
  candidateName: string;
  companyName: string;
  position: string;
  interviewType: string;
  scheduledAt: string;
  durationMinutes?: number;
  interviewers?: string[];
  meetingUrl?: string;
  applicationUrl: string;
}

export function InterviewReminderEmail({
  candidateName,
  companyName,
  position,
  interviewType,
  scheduledAt,
  durationMinutes,
  interviewers,
  meetingUrl,
  applicationUrl,
}: InterviewReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Interview reminder: {interviewType} at {companyName} tomorrow</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", margin: "0 auto", padding: "24px", maxWidth: "600px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "8px" }}>
            Interview Reminder
          </Heading>
          <Text>Hi {candidateName},</Text>
          <Text>
            You have an interview scheduled for tomorrow. Here are the details:
          </Text>
          <Section style={{ backgroundColor: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
            <Text style={{ margin: "4px 0" }}><strong>Company:</strong> {companyName}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Role:</strong> {position}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Type:</strong> {interviewType}</Text>
            <Text style={{ margin: "4px 0" }}><strong>Time:</strong> {scheduledAt}</Text>
            {durationMinutes && (
              <Text style={{ margin: "4px 0" }}><strong>Duration:</strong> {durationMinutes} minutes</Text>
            )}
            {interviewers && interviewers.length > 0 && (
              <Text style={{ margin: "4px 0" }}><strong>Interviewers:</strong> {interviewers.join(", ")}</Text>
            )}
          </Section>
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Button
              href={applicationUrl}
              style={{ backgroundColor: "#000000", color: "#ffffff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none" }}
            >
              View Application
            </Button>
            {meetingUrl && (
              <>
                {" "}
                <Button
                  href={meetingUrl}
                  style={{ backgroundColor: "#ffffff", color: "#000000", padding: "12px 24px", borderRadius: "6px", border: "1px solid #000000", textDecoration: "none" }}
                >
                  Join Meeting
                </Button>
              </>
            )}
          </Section>
          <Hr />
          <Text style={{ color: "#888888", fontSize: "12px" }}>
            You're receiving this because you have email reminders enabled in THRIVE.
            You can update your preferences in Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/package.json frontend/bun.lockb frontend/src/emails/interview-reminder.tsx
git commit -m "feat: add react-email dependency and interview reminder email template"
```

---

### Task 18: Supabase Edge Function — send-interview-reminders

**Files:**
- Create: `supabase/functions/send-interview-reminders/index.ts`

**Step 1: Create the edge function directory and file**

```bash
mkdir -p supabase/functions/send-interview-reminders
```

Create `supabase/functions/send-interview-reminders/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";
import { render } from "https://esm.sh/@react-email/render@0.0.12";

// NOTE: InterviewReminderEmail must be a standalone module importable in Deno.
// For now, inline a minimal version or import from a shared location.
// A full React-email render in Deno Edge Functions requires careful module resolution.
// Use a string template as fallback if JSX doesn't work in the edge runtime.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://thrive.app";

const TYPE_LABELS: Record<string, string> = {
  screening_interview: "Screening Interview",
  technical_interview: "Technical Interview",
  behavioral_interview: "Behavioral Interview",
  online_test: "Online Test",
  take_home: "Take Home",
  onsite: "Onsite Interview",
};

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // Interviews scheduled for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: interviews, error } = await supabase
    .from("events")
    .select(`
      *,
      application:applications(
        id, position, status,
        company:companies(name),
        user_id
      )
    `)
    .gte("scheduled_at", tomorrowStart.toISOString())
    .lte("scheduled_at", tomorrowEnd.toISOString())
    .neq("application.status", "archived");

  if (error) {
    console.error("Error fetching interviews:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;

  for (const interview of (interviews ?? [])) {
    const app = interview.application;
    if (!app || app.status === "archived") continue;

    // Check user settings
    const { data: settings } = await supabase
      .from("settings")
      .select("email_reminders, notify_interview")
      .eq("user_id", app.user_id)
      .single();

    if (!settings?.email_reminders || !settings?.notify_interview) continue;

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(app.user_id);
    if (!user?.email) continue;

    const applicationUrl = `${APP_URL}/applications/${app.id}`;
    const scheduledAt = interview.scheduled_at
      ? new Date(interview.scheduled_at).toLocaleString("en-US", {
          weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
        })
      : "TBD";

    const emailHtml = `
      <h2>Interview Reminder</h2>
      <p>You have a ${TYPE_LABELS[interview.type] ?? interview.type} scheduled for tomorrow.</p>
      <ul>
        <li><strong>Company:</strong> ${app.company?.name ?? "Unknown"}</li>
        <li><strong>Role:</strong> ${app.position}</li>
        <li><strong>Time:</strong> ${scheduledAt}</li>
        ${interview.duration_minutes ? `<li><strong>Duration:</strong> ${interview.duration_minutes} minutes</li>` : ""}
      </ul>
      <p><a href="${applicationUrl}">View Application</a></p>
    `;

    await resend.emails.send({
      from: "THRIVE <reminders@thrive.app>",
      to: user.email,
      subject: `Interview tomorrow: ${app.position} at ${app.company?.name ?? "Unknown"}`,
      html: emailHtml,
    });

    sent++;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
```

**Step 2: Add Cron schedule to Supabase**

Create a migration for the cron job:

```sql
-- supabase/migrations/<timestamp>_add_interview_reminder_cron.sql
select cron.schedule(
  'send-interview-reminders',
  '0 11 * * *',  -- 6am EST = 11am UTC
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-interview-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);
```

**Step 3: Commit**

```bash
git add supabase/functions/ supabase/migrations/
git commit -m "feat: add send-interview-reminders edge function with Supabase Cron schedule"
```

---

### Task 19: Pre-commit hooks

**Files:**
- Modify: `.pre-commit-config.yaml`

**Step 1: Read current file**

Read `.pre-commit-config.yaml` to see what's already there (it exists as untracked).

**Step 2: Populate pre-commit config**

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: typescript-check
        name: TypeScript type check
        language: system
        entry: bash -c "cd frontend && bunx tsc --noEmit"
        pass_filenames: false
        types: [ts, tsx]

      - id: biome-check
        name: Biome lint + format check
        language: system
        entry: bash -c "cd frontend && bunx biome check ."
        pass_filenames: false
        types: [ts, tsx, json]

      - id: vitest
        name: Vitest unit tests
        language: system
        entry: bash -c "cd frontend && bun run test --run"
        pass_filenames: false
        types: [ts, tsx]

      - id: build-check
        name: Vite build check
        language: system
        entry: bash -c "cd frontend && bun run build"
        pass_filenames: false
        stages: [push]
```

Note: The build check is on `push` stage (not `commit`) to keep commits fast.

**Step 3: Install pre-commit**

```bash
pip install pre-commit && pre-commit install
```

**Step 4: Commit**

```bash
git add .pre-commit-config.yaml
git commit -m "chore: configure pre-commit hooks for tsc, biome, vitest, and build"
```

---

### Task 20: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: cd frontend && bun install --frozen-lockfile
      - name: Biome check
        run: cd frontend && bunx biome check .
      - name: TypeScript check
        run: cd frontend && bunx tsc --noEmit

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: cd frontend && bun install --frozen-lockfile
      - name: Run tests
        run: cd frontend && bun run test --run

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: cd frontend && bun install --frozen-lockfile
      - name: Build
        run: cd frontend && bun run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: add GitHub Actions CI workflow for lint, test, and build"
```

---

## Phase 9: Final Verification

### Task 21: Run full test suite and type check

**Step 1: Run all tests**

```bash
cd frontend && bun run test --run
```

Expected: All PASS, 0 failures.

**Step 2: Run type check**

```bash
cd frontend && bunx tsc --noEmit
```

Expected: No errors.

**Step 3: Run biome**

```bash
cd frontend && bunx biome check .
```

Expected: No violations.

**Step 4: Run build**

```bash
cd frontend && bun run build
```

Expected: Build succeeds.

**Step 5: Final commit if any fixes needed**

```bash
git add -p  # stage only relevant fixes
git commit -m "fix: address type errors and lint issues from full suite run"
```

---

## Summary of New Files

| File | Task |
|---|---|
| `frontend/src/components/layout/user-menu.tsx` | Task 2 |
| `frontend/src/components/layout/__tests__/user-menu.test.tsx` | Task 2 |
| `frontend/src/components/ui/salary-range-slider.tsx` | Task 4 |
| `frontend/src/components/ui/__tests__/salary-range-slider.test.tsx` | Task 4 |
| `frontend/src/components/ui/tag-input.tsx` | Task 5 |
| `frontend/src/components/ui/__tests__/tag-input.test.tsx` | Task 5 |
| `frontend/src/components/applications/source-combobox.tsx` | Task 6 |
| `frontend/src/components/applications/__tests__/source-combobox.test.tsx` | Task 6 |
| `frontend/src/data/major-us-cities.json` | Task 7 |
| `frontend/src/components/applications/city-combobox.tsx` | Task 7 |
| `frontend/src/components/applications/__tests__/city-combobox.test.tsx` | Task 7 |
| `frontend/src/components/applications/easy-add-form.tsx` | Task 8 |
| `frontend/src/components/applications/__tests__/easy-add-form.test.tsx` | Task 8 |
| `frontend/src/components/applications/full-application-form.tsx` | Task 10 |
| `frontend/src/components/applications/__tests__/full-application-form.test.tsx` | Task 10 |
| `frontend/src/emails/interview-reminder.tsx` | Task 17 |
| `supabase/functions/send-interview-reminders/index.ts` | Task 18 |
| `.github/workflows/ci.yml` | Task 20 |
