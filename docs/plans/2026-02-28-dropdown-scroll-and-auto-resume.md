# Dropdown Scroll Bugfix + Auto-Resume Pre-selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix combobox dropdowns that no longer scroll, and pre-select the last-used resume every time FullApplicationForm opens.

**Architecture:** Bug 1 is a browser-debug-first task — open the live UI, inspect computed styles on the CommandList element, identify the CSS root cause, then apply a targeted fix. Bug 2 is a one-line change: read `localStorage.getItem("tracker:default_resume_id")` on form open instead of hard-coding `null`.

**Tech Stack:** React 19, TanStack Start, shadcn/ui (cmdk + Radix UI Popover), Vitest + React Testing Library, pnpm (via `npx pnpm`), Vite 7 dev server.

**Design doc:** `docs/plans/2026-02-28-dropdown-scroll-and-auto-resume-design.md`

---

## Task 1: Auto-resume pre-selection (easy win first)

**Files:**
- Modify: `frontend/src/components/applications/full-application-form.tsx:207-211`

### Step 1: Find the exact line to change

Open `frontend/src/components/applications/full-application-form.tsx`.

Find the `useEffect` that depends on `[open, reset, prefill, importData, defaultStatus]`. Near the end of that effect you'll see:

```ts
setSelectedResumeId(null);
```

### Step 2: Apply the change

Replace that line with:

```ts
setSelectedResumeId(localStorage.getItem("tracker:default_resume_id"));
```

That's the entire implementation. The `DocumentTypePicker` already receives `value={selectedResumeId}` and will display whichever document ID is set. The submit path already persists the new selection back to localStorage — no other changes needed.

### Step 3: Verify manually in the browser

1. Start the dev server: `cd frontend && npx pnpm dev`
2. Open the app, submit any application with a resume attached (this writes to localStorage)
3. Close the form, re-open "New Application"
4. Confirm the resume picker pre-selects the previously used resume
5. Open "New Application" again without submitting — confirm the same resume is still pre-selected

### Step 4: Commit

```bash
git add frontend/src/components/applications/full-application-form.tsx
git commit -m "feat(full-application-form): pre-select last-used resume from localStorage on open"
```

---

## Task 2: Dropdown scroll bugfix — browser debug

**Files (expected — confirm after debugging):**
- Likely modify: `frontend/src/components/ui/command.tsx`
- Possibly modify: one or more of:
  - `frontend/src/components/companies/industry-combobox.tsx`
  - `frontend/src/components/applications/city-multi-combobox.tsx`
  - `frontend/src/components/applications/source-combobox.tsx`

### Context

All three affected comboboxes share the same structure:

```
Popover (Radix, renders via Portal — outside DOM tree)
  └── PopoverContent (className="w-full p-0")
        └── Command (has: flex h-full w-full flex-col overflow-hidden)
              ├── CommandInput
              └── CommandList (has: max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto)
                    └── CommandGroup (has: overflow-hidden)
                          └── CommandItem × N
```

The most likely suspects based on reading the code:
- `overflow-hidden` on `Command` root clipping `CommandList`'s scroll area
- `scroll-py-1` on `CommandList` interfering with scroll offset calculation
- `overscroll` bubbling to the parent `ScrollArea` in `FullApplicationForm`

### Step 1: Load the browser debugging tool

Use the `superpowers-chrome:browsing` skill for browser interaction — this gives access to the MCP browser tool (`mcp__plugin_superpowers-chrome_chrome__use_browser`).

### Step 2: Start the dev server if not already running

```bash
cd frontend && npx pnpm dev
```

Server runs at `http://localhost:3000` (or whichever port Vite picks).

### Step 3: Navigate to the company form

Open the app, navigate to Companies, click "Add Company" or edit an existing one to open the company form with the Industries and Locations fields.

### Step 4: Open the Industries dropdown and inspect

1. Click the Industries combobox to open the dropdown
2. In Chrome DevTools (Elements tab), find the element with `data-slot="command-list"`
3. Check **Computed styles**: confirm `overflow-y: auto` and that `max-height` is resolving to `300px`
4. Check whether the element has a nonzero `scrollHeight > clientHeight` (it should — there are ~65 industry options)
5. Try scrolling in the dropdown — note which element the scroll event lands on (DevTools → Event Listeners panel on the `command-list` element)

### Step 5: Identify root cause and apply fix

Based on what you find, apply the appropriate fix:

**If `overflow-hidden` on `Command` is clipping the list:**

In `frontend/src/components/ui/command.tsx`, change the `Command` component className from:
```ts
"bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md"
```
to:
```ts
"bg-popover text-popover-foreground flex h-full w-full flex-col rounded-md"
```
(Remove `overflow-hidden`.)

**If scroll events are bubbling to the parent `ScrollArea`:**

In each affected combobox file, add `onWheel={(e) => e.stopPropagation()}` to the `CommandList`:
```tsx
<CommandList
  className="max-h-[300px] overflow-y-auto"
  onWheel={(e) => e.stopPropagation()}
>
```

**If `CommandList` has no effective height (0px max-height due to parent):**

In `PopoverContent` within each combobox, ensure the content has an explicit min-width so the flex container doesn't collapse:
```tsx
<PopoverContent className="min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
```

### Step 6: Verify the fix works in the browser

1. Open Industries dropdown on company form — scroll should work through all ~65 options
2. Open Locations dropdown on company form — scroll should work
3. Open application add/edit form, open Source dropdown — scroll should work
4. Confirm the fix didn't break keyboard navigation (arrow keys still move selection)
5. Confirm the fix didn't break search/filter behavior

### Step 7: Commit

```bash
git add frontend/src/components/ui/command.tsx
# Add any other changed files
git commit -m "fix(combobox): restore scroll in command list dropdowns"
```

---

## Task 3: Final verification

### Step 1: Run the full test suite

```bash
cd frontend && npx pnpm test run
```

Expected: all existing tests pass. The combobox components don't have scroll-specific unit tests (scroll behavior is not testable in jsdom), so the browser verification from Task 2 is the primary signal.

### Step 2: Check for lint errors

```bash
cd frontend && npx pnpm lint
```

Fix any issues before the final commit.

### Step 3: Smoke test the full flow

1. Open "New Application" — confirm resume auto-selects
2. Submit with a different resume — confirm it saves
3. Open "New Application" again — confirm the new resume is now pre-selected
4. Open company form — confirm Industries dropdown scrolls
5. Open application form — confirm Source dropdown scrolls
