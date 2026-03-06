# Untitled UI Restyle — Design Document

**Status:** Ready for implementation
**Date:** 2026-03-05
**Scope:** Visual restyling of existing shadcn/ui components to match the Untitled UI aesthetic. No component APIs change. No consuming files need to be touched. Zero regression risk on functionality.

---

## Overview

The tracker's current theme is achromatic — every color token is pure grayscale. The goal is to adopt Untitled UI's visual language: a violet primary, warm-tinted gray neutrals, Inter typography, a layered shadow system, and tighter component geometry. This is a pure styling pass.

**What changes:** `globals.css` and the Tailwind class strings inside `src/components/ui/*.tsx`
**What doesn't change:** Component APIs, props, behavior, accessibility, routing, queries, or any consuming component

---

## Phase 1 — Design Tokens (`globals.css`)

This single file change produces ~70% of the visual transformation. Every component in the app references these tokens.

### Full replacement for `src/styles/globals.css`

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Typography */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Colors — mapped to CSS custom properties */
  --color-background:            var(--background);
  --color-foreground:            var(--foreground);
  --color-card:                  var(--card);
  --color-card-foreground:       var(--card-foreground);
  --color-popover:               var(--popover);
  --color-popover-foreground:    var(--popover-foreground);
  --color-primary:               var(--primary);
  --color-primary-foreground:    var(--primary-foreground);
  --color-secondary:             var(--secondary);
  --color-secondary-foreground:  var(--secondary-foreground);
  --color-muted:                 var(--muted);
  --color-muted-foreground:      var(--muted-foreground);
  --color-accent:                var(--accent);
  --color-accent-foreground:     var(--accent-foreground);
  --color-destructive:           var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border:                var(--border);
  --color-input:                 var(--input);
  --color-ring:                  var(--ring);

  /* Status semantic colors */
  --color-success:               var(--success);
  --color-success-foreground:    var(--success-foreground);
  --color-warning:               var(--warning);
  --color-warning-foreground:    var(--warning-foreground);

  /* Chart */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Sidebar */
  --color-sidebar:                     var(--sidebar);
  --color-sidebar-foreground:          var(--sidebar-foreground);
  --color-sidebar-primary:             var(--sidebar-primary);
  --color-sidebar-primary-foreground:  var(--sidebar-primary-foreground);
  --color-sidebar-accent:              var(--sidebar-accent);
  --color-sidebar-accent-foreground:   var(--sidebar-accent-foreground);
  --color-sidebar-border:              var(--sidebar-border);
  --color-sidebar-ring:                var(--sidebar-ring);

  /* Border radius — Untitled UI scale */
  --radius-none: 0px;
  --radius-xxs:  0.125rem;   /*  2px */
  --radius-xs:   0.25rem;    /*  4px — tiny badges */
  --radius-sm:   0.375rem;   /*  6px — small elements */
  --radius-md:   0.5rem;     /*  8px — inputs, buttons */
  --radius-lg:   0.625rem;   /* 10px */
  --radius-xl:   0.75rem;    /* 12px — cards, dropdowns */
  --radius-2xl:  1rem;       /* 16px — modals, large cards */
  --radius-3xl:  1.25rem;    /* 20px */
  --radius-full: 9999px;     /* pills */

  /* Shadows — Untitled UI layered shadow system */
  --shadow-xs:   0px 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-sm:   0px 1px 3px rgba(16, 24, 40, 0.10), 0px 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-md:   0px 4px 8px -2px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.06);
  --shadow-lg:   0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
  --shadow-xl:   0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03);
  --shadow-2xl:  0px 24px 48px -12px rgba(16, 24, 40, 0.18);
  --shadow-3xl:  0px 32px 64px -12px rgba(16, 24, 40, 0.14);
}

/* ─── Light mode ──────────────────────────────────────────────────────────── */
:root {
  /* Violet palette (Untitled UI violet) */
  --violet-25:  oklch(0.990 0.010 290);  /* #FCFAFF */
  --violet-50:  oklch(0.978 0.018 290);  /* #F9F5FF */
  --violet-100: oklch(0.960 0.035 290);  /* #F4EBFF */
  --violet-200: oklch(0.920 0.065 290);  /* #E9D7FE */
  --violet-300: oklch(0.862 0.105 290);  /* #D6BBFB */
  --violet-400: oklch(0.780 0.155 290);  /* #B692F6 */
  --violet-500: oklch(0.702 0.185 290);  /* #9E77ED */
  --violet-600: oklch(0.617 0.210 292);  /* #7F56D9 ← primary */
  --violet-700: oklch(0.540 0.205 292);  /* #6941C6 */
  --violet-800: oklch(0.445 0.175 292);  /* #53389E */
  --violet-900: oklch(0.370 0.148 292);  /* #42307D */

  /* Gray palette (Untitled UI — slightly cool, not pure achromatic) */
  --gray-25:  oklch(0.990 0.002 270);  /* #FCFCFD */
  --gray-50:  oklch(0.984 0.002 247);  /* #F9FAFB */
  --gray-100: oklch(0.965 0.004 247);  /* #F2F4F7 */
  --gray-200: oklch(0.940 0.005 247);  /* #EAECF0 */
  --gray-300: oklch(0.867 0.008 252);  /* #D0D5DD */
  --gray-400: oklch(0.680 0.015 252);  /* #98A2B3 */
  --gray-500: oklch(0.540 0.020 252);  /* #667085 */
  --gray-600: oklch(0.430 0.022 252);  /* #475467 */
  --gray-700: oklch(0.345 0.022 252);  /* #344054 */
  --gray-800: oklch(0.235 0.020 252);  /* #1D2939 */
  --gray-900: oklch(0.160 0.018 252);  /* #101828 */

  /* Semantic tokens — light */
  --background:           oklch(1 0 0);                /* white */
  --foreground:           var(--gray-900);              /* #101828 */
  --card:                 oklch(1 0 0);
  --card-foreground:      var(--gray-900);
  --popover:              oklch(1 0 0);
  --popover-foreground:   var(--gray-900);
  --primary:              var(--violet-600);            /* #7F56D9 */
  --primary-foreground:   oklch(1 0 0);                /* white */
  --secondary:            var(--gray-100);              /* #F2F4F7 */
  --secondary-foreground: var(--gray-700);              /* #344054 */
  --muted:                var(--gray-50);               /* #F9FAFB */
  --muted-foreground:     var(--gray-500);              /* #667085 */
  --accent:               var(--gray-100);              /* #F2F4F7 */
  --accent-foreground:    var(--gray-700);              /* #344054 */
  --destructive:          oklch(0.563 0.215 27);        /* error-600 #D92D20 */
  --destructive-foreground: oklch(1 0 0);
  --border:               var(--gray-200);              /* #EAECF0 — surfaces */
  --input:                var(--gray-300);              /* #D0D5DD — input borders (darker) */
  --ring:                 var(--violet-300);            /* #D6BBFB — focus ring */
  --success:              oklch(0.608 0.170 162);       /* #039855 */
  --success-foreground:   oklch(1 0 0);
  --warning:              oklch(0.655 0.180 64);        /* #DC6803 */
  --warning-foreground:   oklch(1 0 0);

  /* Charts */
  --chart-1: var(--violet-600);
  --chart-2: oklch(0.608 0.170 162);   /* emerald */
  --chart-3: oklch(0.655 0.180 64);    /* amber */
  --chart-4: oklch(0.600 0.118 185);   /* teal */
  --chart-5: oklch(0.563 0.215 27);    /* red */

  /* Sidebar */
  --sidebar:                    var(--gray-50);
  --sidebar-foreground:         var(--gray-900);
  --sidebar-primary:            var(--violet-600);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent:             var(--gray-100);
  --sidebar-accent-foreground:  var(--gray-700);
  --sidebar-border:             var(--gray-200);
  --sidebar-ring:               var(--violet-300);
}

/* ─── Dark mode ───────────────────────────────────────────────────────────── */
.dark {
  /* Dark backgrounds — Untitled UI uses deep navy-gray, not pure black */
  --background:           oklch(0.115 0.020 252);   /* #0C111D — page bg */
  --foreground:           var(--gray-25);            /* #FCFCFD */
  --card:                 oklch(0.155 0.018 252);   /* #161B26 — slightly lighter */
  --card-foreground:      var(--gray-25);
  --popover:              oklch(0.195 0.020 252);   /* #1D2939 — popovers/dropdowns */
  --popover-foreground:   var(--gray-25);
  --primary:              var(--violet-500);         /* #9E77ED — brighter in dark */
  --primary-foreground:   oklch(1 0 0);
  --secondary:            oklch(0.235 0.020 252);   /* #1D2939 */
  --secondary-foreground: var(--gray-300);           /* #D0D5DD */
  --muted:                oklch(0.195 0.020 252);
  --muted-foreground:     var(--gray-400);           /* #98A2B3 */
  --accent:               oklch(0.235 0.020 252);
  --accent-foreground:    var(--gray-300);
  --destructive:          oklch(0.500 0.195 27);
  --destructive-foreground: oklch(0.963 0.060 27);
  --border:               oklch(0.250 0.020 252);   /* #1F242F — subtle borders */
  --input:                oklch(0.280 0.022 252);   /* #344054 range — input borders */
  --ring:                 var(--violet-500);         /* #9E77ED — focus ring */
  --success:              oklch(0.680 0.175 162);
  --success-foreground:   oklch(1 0 0);
  --warning:              oklch(0.720 0.185 64);
  --warning-foreground:   oklch(0.160 0.018 252);

  /* Charts */
  --chart-1: var(--violet-400);
  --chart-2: oklch(0.696 0.170 162);
  --chart-3: oklch(0.769 0.188 70);
  --chart-4: oklch(0.600 0.118 185);
  --chart-5: oklch(0.645 0.246 27);

  /* Sidebar */
  --sidebar:                    oklch(0.155 0.018 252);
  --sidebar-foreground:         var(--gray-25);
  --sidebar-primary:            var(--violet-500);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent:             oklch(0.235 0.020 252);
  --sidebar-accent-foreground:  var(--gray-300);
  --sidebar-border:             oklch(0.250 0.020 252);
  --sidebar-ring:               var(--violet-500);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "cv11", "ss01";  /* Inter: better figures and alternates */
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold tracking-tight;
  }
}
```

> **Note on Google Fonts:** If you prefer self-hosting (better performance, no third-party request), download Inter from [rsms.me/inter](https://rsms.me/inter) and use `@font-face` declarations instead of the `@import` above.

---

## Phase 2 — Core Components

Each file below requires only class string changes. No props, no logic, no imports change.

### `button.tsx`

**Changes:** `rounded-md` → `rounded-lg`, `font-medium` → `font-semibold`, add `shadow-xs` to default/outline, update focus ring width, adjust heights.

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-4 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/80",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-transparent dark:border-input dark:hover:bg-input/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5 has-[>svg]:px-3",
        xs:      "h-7 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm:      "h-9 rounded-lg gap-1.5 px-3.5 has-[>svg]:px-2.5",
        lg:      "h-11 rounded-lg px-5 has-[>svg]:px-4",
        icon:    "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

---

### `input.tsx`

**Changes:** Taller (`h-10`), rounder (`rounded-lg`), darker border (`border-input` which now maps to gray-300), wider focus ring.

```tsx
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "border-input h-10 w-full min-w-0 rounded-lg border bg-background px-3.5 py-2 text-sm shadow-xs",
        "transition-[color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-ring/30 focus-visible:ring-4",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:bg-input/10 dark:border-input",
        className,
      )}
      {...props}
    />
  )
}
```

---

### `badge.tsx`

**Changes:** Untitled UI badges use a "soft" style by default — colored background tint with matching text. The base pill shape stays. Add new color-semantic variants to support the tracker's status/interest system more naturally.

```tsx
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors overflow-hidden border border-transparent",
  {
    variants: {
      variant: {
        // Solid
        default:     "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-white",
        // Soft (tinted background — the Untitled UI default)
        primary:     "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        secondary:   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        success:     "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
        warning:     "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        error:       "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        // Outline
        outline:     "border-border text-foreground bg-transparent",
        ghost:       "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)
```

---

### `label.tsx`

**Changes:** `font-medium` weight, correct color.

```tsx
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
```

---

## Phase 3 — Surface & Overlay Components

### `card.tsx`

**Changes:** Upgrade shadow to `shadow-sm` (the richer Untitled UI shadow-sm), ensure border is `border-border`, padding tightened slightly.

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border py-6 shadow-sm",
        className,
      )}
      {...props}
    />
  )
}
```

> The `shadow-sm` here resolves to the CSS variable `--shadow-sm` defined in `@theme inline`, which is the richer two-layer Untitled UI shadow — not Tailwind's default 1px shadow.

---

### `dialog.tsx`

**Changes:** Rounder corners, bigger shadow, backdrop gets a subtle blur.

**`DialogOverlay`:**
```tsx
className={cn(
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-sm",
  className,
)}
```

**`DialogContent`:**
```tsx
className={cn(
  "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%]",
  "gap-4 rounded-2xl border border-border p-6 shadow-2xl duration-200 outline-none sm:max-w-lg",
  className,
)}
```

**`DialogTitle`:**
```tsx
className={cn("text-lg leading-tight font-semibold text-foreground", className)}
```

**`DialogDescription`:**
```tsx
className={cn("text-sm text-muted-foreground mt-1", className)}
```

---

### `select.tsx`

**`SelectTrigger`:**
```tsx
className={cn(
  "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground",
  "focus-visible:border-primary focus-visible:ring-ring/30 focus-visible:ring-4",
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  "flex w-fit items-center justify-between gap-2 rounded-lg border bg-background px-3.5 py-2 text-sm whitespace-nowrap shadow-xs",
  "transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50",
  "data-[size=default]:h-10 data-[size=sm]:h-9",
  "dark:bg-input/10 dark:border-input dark:hover:bg-input/20",
  "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  className,
)}
```

**`SelectContent`:**
```tsx
className={cn(
  "bg-popover text-popover-foreground border border-border shadow-lg rounded-xl",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto",
  className,
)}
```

**`SelectItem`:**
```tsx
className={cn(
  "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground",
  "relative flex w-full cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-sm outline-hidden select-none",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  className,
)}
```

---

### `popover.tsx`

**`PopoverContent`:**
```tsx
className={cn(
  "bg-popover text-popover-foreground rounded-xl border border-border shadow-lg outline-none",
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  "z-50 w-72 p-3",
  className,
)}
```

---

### `command.tsx`

**`CommandContent` / wrapper:**
The command palette popup gets the same `rounded-xl border shadow-lg` treatment as popover.

**`CommandInput`:**
Remove the default bottom border on the search input container; let the overall command wrapper handle the border treatment.

**`CommandItem`:**
```tsx
className={cn(
  "relative flex cursor-default gap-2 select-none items-center rounded-lg px-3 py-2 text-sm outline-none",
  "text-foreground data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
  className,
)}
```

---

### `sheet.tsx`

**`SheetContent`:** Match the dialog shadow and rounding on the exposed edge.

```tsx
// Right-side sheet (most common):
"inset-y-0 right-0 h-full w-3/4 border-l border-border shadow-2xl sm:max-w-sm"
// The border-l replaces the full border; shadow-2xl gives depth
```

---

### `dropdown-menu.tsx`

**`DropdownMenuContent`:**
```tsx
className={cn(
  "bg-popover text-popover-foreground rounded-xl border border-border shadow-lg",
  "z-50 min-w-[8rem] overflow-hidden p-1.5",
  "data-[state=open]:animate-in data-[state=closed]:animate-out ...",
  className,
)}
```

**`DropdownMenuItem`:**
```tsx
className={cn(
  "relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
  "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground",
  className,
)}
```

---

## Phase 4 — Remaining Primitives

These are smaller changes that follow the same pattern as above.

### `tabs.tsx`

**`TabsList`:** More rounded, subtle background.
```tsx
// Replace rounded-lg → rounded-xl, ensure bg-muted is gray-50/gray-800 in dark
"inline-flex h-10 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground"
```

**`TabsTrigger`:** Tighter selected state.
```tsx
"inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
```

---

### `checkbox.tsx`

```tsx
// Border → input color (gray-300), checked → primary violet
"peer h-4 w-4 shrink-0 rounded-sm border border-input shadow-xs focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
```

---

### `switch.tsx`

```tsx
// Checked state should use violet primary
"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
```

---

### `separator.tsx`

No change needed — `bg-border` already maps to the new gray-200.

---

### `scroll-area.tsx`

**Scrollbar thumb:** Make slightly more visible.
```tsx
// ScrollBar thumb: bg-border → slightly more opaque
"relative flex-1 rounded-full bg-border/80 hover:bg-border transition-colors"
```

---

### `tooltip.tsx`

**`TooltipContent`:**
```tsx
"z-50 overflow-hidden rounded-lg border border-border bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 ..."
```

---

### `avatar.tsx`

**`AvatarFallback`:** Use primary-tinted background.
```tsx
"flex h-full w-full items-center justify-center rounded-full bg-violet-100 text-violet-700 text-sm font-semibold dark:bg-violet-900/40 dark:text-violet-300"
```

---

### `table.tsx`

**`TableHead`:** Smaller, uppercase-style label treatment matching Untitled UI table headers.
```tsx
"h-11 px-4 text-left align-middle text-xs font-medium text-muted-foreground uppercase tracking-wide [&:has([role=checkbox])]:pr-0"
```

**`TableRow`:** Hover state.
```tsx
"border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-accent"
```

**`TableCell`:**
```tsx
"px-4 py-3 align-middle text-sm [&:has([role=checkbox])]:pr-0"
```

---

## Phase 5 — Domain Component Touch-ups

These are not in `src/components/ui/` — they're domain components that may need minor style adjustments after the token update. Review each after Phase 1–4 and patch where needed.

| Component | What to check |
|---|---|
| `NavBar` | Background should be `bg-background` with `border-b border-border shadow-sm`. Active link style should use `text-primary`. |
| `PageLayout` / `SidePanel` | Side panel background: `bg-card shadow-xl border-l border-border` |
| `DetailLayout` | Tab bar should pick up the new `Tabs` rounding cleanly |
| `UniversalTable` | Table wrapper: add `rounded-xl border border-border overflow-hidden shadow-xs`. Header row should get `bg-muted/60`. |
| `ApplicationStats` / `StatsCards` | Stat cards: verify `Card` shadow reads correctly against page background |
| Status/interest badge color maps | Update badge color classes throughout `table-schemas.tsx` and `application-table.tsx` to use the new semantic badge variants (`success`, `warning`, `error`, `primary`, `secondary`) |

---

## Implementation Order (Recommended)

| Phase | Task | Impact | Effort |
|---|---|---|---|
| 1 | Replace `globals.css` entirely | Transforms every component instantly | 1 session |
| 2a | Restyle `button.tsx` | 45 usage sites — biggest visible impact | 30 min |
| 2b | Restyle `input.tsx`, `label.tsx` | All forms update | 20 min |
| 2c | Restyle `badge.tsx` | Status chips throughout the app | 30 min |
| 3a | Restyle `card.tsx` | Dashboard, detail panels | 15 min |
| 3b | Restyle `dialog.tsx` | All modals | 20 min |
| 3c | Restyle `select.tsx`, `popover.tsx`, `command.tsx` | All dropdowns and comboboxes | 30 min |
| 3d | Restyle `sheet.tsx`, `dropdown-menu.tsx` | Nav mobile drawer, user menu | 20 min |
| 4 | Restyle remaining primitives | tabs, checkbox, switch, table, tooltip, avatar | 30 min |
| 5 | Domain touch-ups | NavBar, SidePanel, UniversalTable, badge color maps | 1 session |

**Total estimated effort:** 2–3 focused sessions.

---

## New Untitled UI Patterns (À la carte, for upcoming features)

When building the AI inbox, approval flows, and email draft review UI, pull these patterns directly from Untitled UI as new component files. They slot in alongside the restyled primitives and inherit the token system automatically:

| Feature | Untitled UI pattern to copy |
|---|---|
| AI inbox / pending actions | `Notification` / `Inbox` section pattern |
| Email draft review card | `Featured icon` + `Content card` pattern |
| Approval/reject actions | `Modal with icon` pattern |
| Empty states | `Empty state` with illustration and CTA |
| Status timeline | `Timeline` pattern |
| Integrations settings tab | `Settings row` with toggle and description |

---

## Reference

- Untitled UI component library: [untitledui.com](https://untitledui.com)
- Violet palette reference: Untitled UI Design System → Color → Violet
- Inter font: [rsms.me/inter](https://rsms.me/inter) or Google Fonts
- Current token file: `frontend/src/styles/globals.css`
- Current component directory: `frontend/src/components/ui/`
