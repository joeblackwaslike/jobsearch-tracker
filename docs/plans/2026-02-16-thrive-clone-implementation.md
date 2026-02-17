# THRIVE Clone Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a job search tracker (THRIVE clone) with TanStack Start, Supabase, and shadcn/ui.

**Architecture:** TanStack Start SPA deployed to Vercel. Supabase provides Postgres (with RLS), Auth, and Storage. No separate backend for v1. Server functions in TanStack Start handle session management and call Supabase via `@supabase/ssr`.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query, TanStack Table, React Hook Form, shadcn/ui, Tailwind CSS, Supabase (Postgres + Auth + Storage), Vitest, Testing Library, pnpm

**Design Doc:** `docs/plans/2026-02-16-thrive-clone-design.md`

---

## Phase 1: Foundation

### Task 1: Scaffold TanStack Start project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/app.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/app/routes/__root.tsx`
- Create: `frontend/app/routes/index.tsx`
- Create: `frontend/app/styles/globals.css`

**Step 1: Create frontend directory and init TanStack Start**

```bash
cd frontend
pnpm create @tanstack/start@latest . --template basic
```

If the CLI doesn't support `--template`, use manual setup:

```bash
mkdir -p frontend && cd frontend
pnpm init
pnpm add @tanstack/react-start @tanstack/react-router vinxi react react-dom
pnpm add -D @types/react @types/react-dom typescript vite
```

**Step 2: Verify dev server starts**

```bash
cd frontend && pnpm dev
```

Expected: Dev server starts on localhost, renders a page.

**Step 3: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold TanStack Start project"
```

---

### Task 2: Add Tailwind CSS + shadcn/ui

**Files:**
- Modify: `frontend/package.json` (new deps)
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/app/styles/globals.css` (Tailwind directives + shadcn theme)
- Create: `frontend/components.json` (shadcn config)

**Step 1: Install Tailwind**

```bash
cd frontend
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

Create `frontend/postcss.config.js`:
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Create `frontend/tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

Update `frontend/app/styles/globals.css` with Tailwind directives:
```css
@import "tailwindcss";
```

**Step 2: Init shadcn/ui**

```bash
cd frontend
pnpm dlx shadcn@latest init
```

Follow prompts: TypeScript, default style, dark mode via class, CSS variables, `app/components/ui` path.

**Step 3: Add core shadcn components we'll need**

```bash
cd frontend
pnpm dlx shadcn@latest add button dialog dropdown-menu input label select separator sheet table tabs toast popover command badge card checkbox switch avatar scroll-area tooltip
```

**Step 4: Verify Tailwind renders**

Update `__root.tsx` to import globals.css and add a styled element. Verify in browser.

**Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: add Tailwind CSS and shadcn/ui with core components"
```

---

### Task 3: Set up Supabase local development

**Files:**
- Create: `supabase/config.toml`
- Modify: `docker-compose.yaml`
- Create: `frontend/.env.local`

**Step 1: Install Supabase CLI**

```bash
brew install supabase/tap/supabase
```

**Step 2: Init Supabase in project root**

```bash
cd /path/to/jobsearch-tracker
supabase init
```

This creates `supabase/config.toml`.

**Step 3: Start local Supabase**

```bash
supabase start
```

Expected: Outputs local URLs and keys:
- API URL: `http://127.0.0.1:54321`
- anon key: `eyJ...`
- service_role key: `eyJ...`

**Step 4: Create frontend env file**

Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from step 3>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 3>
```

Add `frontend/.env.local` to `.gitignore`.

**Step 5: Commit**

```bash
git add supabase/ .gitignore
git commit -m "feat: set up Supabase local development"
```

---

### Task 4: Create database schema migration

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`

**Step 1: Create the migration file**

```bash
supabase migration new initial_schema
```

**Step 2: Write the schema SQL**

File: `supabase/migrations/<timestamp>_initial_schema.sql`

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- COMPANIES
-----------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  links JSONB DEFAULT '{}',
  industry VARCHAR(100) DEFAULT '',
  size VARCHAR(50) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  founded DATE,
  culture TEXT DEFAULT '',
  benefits TEXT DEFAULT '',
  pros TEXT DEFAULT '',
  cons TEXT DEFAULT '',
  tech_stack TEXT DEFAULT '',
  ratings JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  researched BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON companies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON companies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON companies FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON companies FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- APPLICATIONS
-----------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position VARCHAR(255) NOT NULL,
  status TEXT NOT NULL DEFAULT 'bookmarked',
  work_type TEXT DEFAULT '',
  employment_type TEXT DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  salary JSONB DEFAULT '{}',
  url TEXT DEFAULT '',
  job_description TEXT DEFAULT '',
  interest TEXT DEFAULT 'medium',
  source VARCHAR(100) DEFAULT '',
  tags JSONB DEFAULT '[]',
  applied_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON applications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON applications FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- EVENTS (interviews + timeline)
-----------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  title VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  url TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON events FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON events FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- DOCUMENTS
-----------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  content TEXT DEFAULT '',
  uri TEXT,
  mime_type VARCHAR(100),
  revision VARCHAR(50) DEFAULT '',
  parent_id UUID REFERENCES documents(id),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON documents FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- APPLICATION_DOCUMENTS (snapshot / line-item)
-----------------------------------------------------------
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type TEXT NOT NULL,
  content TEXT DEFAULT '',
  uri TEXT,
  mime_type VARCHAR(100),
  revision VARCHAR(50) DEFAULT '',
  linked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- No RLS needed: accessed through application (which has RLS)
-- But add it for defense in depth
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_via_application" ON application_documents
  FOR SELECT USING (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_via_application" ON application_documents
  FOR INSERT WITH CHECK (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );
CREATE POLICY "delete_via_application" ON application_documents
  FOR DELETE USING (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );

-----------------------------------------------------------
-- CONTACTS
-----------------------------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) DEFAULT '',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON contacts FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- USER_SETTINGS
-----------------------------------------------------------
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' NOT NULL,
  language TEXT DEFAULT 'en' NOT NULL,
  calendar_type TEXT DEFAULT 'gregorian' NOT NULL,
  date_format TEXT DEFAULT 'MM/DD/YYYY' NOT NULL,
  time_format TEXT DEFAULT '12h' NOT NULL,
  compact_mode BOOLEAN DEFAULT false NOT NULL,
  show_avatars BOOLEAN DEFAULT true NOT NULL,
  notify_backup BOOLEAN DEFAULT true NOT NULL,
  notify_status BOOLEAN DEFAULT true NOT NULL,
  notify_deadline BOOLEAN DEFAULT true NOT NULL,
  notify_interview BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON user_settings FOR UPDATE USING (user_id = auth.uid());

-- Auto-create settings row when a new user signs up
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-----------------------------------------------------------
-- DASHBOARD RPC
-----------------------------------------------------------
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
    'contacts', (SELECT count(*) FROM contacts WHERE user_id = auth.uid()),
    'companies', (SELECT count(*) FROM companies WHERE user_id = auth.uid()),
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

-----------------------------------------------------------
-- INDEXES
-----------------------------------------------------------
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(user_id, status);
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(user_id, name);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_application_id ON events(application_id);
CREATE INDEX idx_events_scheduled ON events(user_id, scheduled_at);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_application_documents_app ON application_documents(application_id);

-----------------------------------------------------------
-- STORAGE
-----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can manage own files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Step 3: Apply migration**

```bash
supabase db reset
```

Expected: All tables created, RLS policies applied, storage bucket created.

**Step 4: Verify schema**

```bash
supabase db lint
```

Expected: No errors.

**Step 5: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add initial database schema with RLS and indexes"
```

---

### Task 5: Set up Supabase client libraries

**Files:**
- Create: `frontend/app/lib/supabase/client.ts`
- Create: `frontend/app/lib/supabase/server.ts`
- Create: `frontend/app/lib/supabase/middleware.ts`
- Create: `frontend/app/lib/supabase/types.ts`

**Step 1: Install Supabase deps**

```bash
cd frontend
pnpm add @supabase/supabase-js @supabase/ssr
```

**Step 2: Generate TypeScript types from schema**

```bash
supabase gen types typescript --local > frontend/app/lib/supabase/types.ts
```

This generates type-safe database types from your local schema.

**Step 3: Create browser client**

File: `frontend/app/lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}
```

**Step 4: Create server client**

File: `frontend/app/lib/supabase/server.ts`

```ts
import { createServerClient } from "@supabase/ssr";
import { getCookie, setCookie } from "vinxi/http";
import type { Database } from "./types";

export function createServerSupabaseClient() {
  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // Read all cookies from the request
          // Implementation depends on TanStack Start's cookie API
          return Object.entries(getCookie() || {}).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            setCookie(name, value, options);
          });
        },
      },
    }
  );
}
```

> **Note:** The exact cookie API depends on TanStack Start's server context. Check `@tanstack/react-start` docs at implementation time. The `vinxi/http` utilities (`getCookie`, `setCookie`) are the standard approach since TanStack Start uses Vinxi under the hood. Consult the TanStack Start docs via context7 MCP if the API has changed.

**Step 5: Commit**

```bash
git add frontend/app/lib/supabase/
git commit -m "feat: add Supabase client libraries with typed schema"
```

---

### Task 6: Implement auth flow

**Files:**
- Create: `frontend/app/routes/login.tsx`
- Create: `frontend/app/routes/_authenticated.tsx`
- Create: `frontend/app/components/auth/login-form.tsx`
- Create: `frontend/app/components/auth/signup-form.tsx`

**Step 1: Create login page**

File: `frontend/app/routes/login.tsx`

The login page should:
- Check if user is already authenticated (server-side in `beforeLoad`), redirect to `/dashboard` if so
- Render a card with two tabs: "Sign In" and "Sign Up"
- Sign In: email + password fields, submit calls `supabase.auth.signInWithPassword()`
- Sign Up: email + password + confirm password, submit calls `supabase.auth.signUp()`
- OAuth buttons for Google and GitHub: call `supabase.auth.signInWithOAuth({ provider: 'google' })`
- On success, redirect to `/dashboard`
- Error messages displayed inline

Use shadcn `Card`, `Tabs`, `Input`, `Label`, `Button` components. Use React Hook Form for validation.

**Step 2: Create auth guard layout route**

File: `frontend/app/routes/_authenticated.tsx`

```tsx
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { createServerSupabaseClient } from "../lib/supabase/server";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({ to: "/login" });
    }

    return { user };
  },
  component: () => <Outlet />,
});
```

> **Note:** The exact server-side API for `beforeLoad` in TanStack Start may differ from TanStack Router SPA mode. Consult TanStack Start docs. The key is: call `supabase.auth.getUser()` server-side, redirect if no user, pass user to child routes via route context.

**Step 3: Update index route to redirect**

File: `frontend/app/routes/index.tsx`

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
```

**Step 4: Verify auth flow manually**

1. Navigate to `/dashboard` — should redirect to `/login`
2. Sign up with email/password
3. Should redirect to `/dashboard` (even if dashboard is blank)
4. Refresh page — should stay on `/dashboard` (session persists)

**Step 5: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement auth flow with login, signup, and route guard"
```

---

### Task 7: Build global layout with nav bar and theme toggle

**Files:**
- Create: `frontend/app/components/layout/nav-bar.tsx`
- Create: `frontend/app/components/layout/page-shell.tsx`
- Create: `frontend/app/components/layout/theme-provider.tsx`
- Modify: `frontend/app/routes/__root.tsx`
- Modify: `frontend/app/routes/_authenticated.tsx`

**Step 1: Install theme dependency**

```bash
cd frontend
pnpm add next-themes
```

> **Note:** `next-themes` works with any React framework that supports class-based dark mode (not just Next.js). If it has issues with TanStack Start, a simpler alternative is a custom React context that toggles a `dark` class on `<html>` and persists to localStorage/settings.

**Step 2: Create theme provider**

File: `frontend/app/components/layout/theme-provider.tsx`

Wrap children in `ThemeProvider` from `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`.

**Step 3: Create nav bar**

File: `frontend/app/components/layout/nav-bar.tsx`

- Left: "THRIVE" logo text (link to `/dashboard`)
- Center: Navigation links — Applications, Interviews, Documents, Companies
- Right: Dark/light toggle (sun/moon icon button using `useTheme()` hook), Settings icon (link to `/settings`)
- Active link gets visual indicator (underline or different text color)
- Use shadcn `Button` (ghost variant) for nav links, `Tooltip` for icon buttons

**Step 4: Create page shell**

File: `frontend/app/components/layout/page-shell.tsx`

Simple wrapper: accepts `children`, renders with consistent padding/max-width.

**Step 5: Wire into root layout**

Update `__root.tsx` to include `ThemeProvider` wrapping the entire app.
Update `_authenticated.tsx` to render `NavBar` + `<Outlet />` inside a flex column layout.

**Step 6: Verify visually**

- Nav bar renders on all authenticated pages
- Dark/light toggle switches theme
- Navigation links work
- Settings icon links to `/settings`

**Step 7: Commit**

```bash
git add frontend/app/
git commit -m "feat: add nav bar with dark/light toggle and page shell"
```

---

## Phase 2: Settings & Companies (dependencies for Applications)

### Task 8: Settings page — General tab

**Files:**
- Create: `frontend/app/routes/_authenticated/settings.tsx`
- Create: `frontend/app/components/settings/general-tab.tsx`
- Create: `frontend/app/lib/queries/settings.ts`

**Step 1: Create settings query/mutation**

File: `frontend/app/lib/queries/settings.ts`

- `useSettings()` — fetches `user_settings` row for current user
- `useUpdateSettings()` — mutation to update settings, invalidates query on success

Both use the Supabase client. The server-side loader fetches initial data; TanStack Query hydrates from it.

**Step 2: Create General tab component**

File: `frontend/app/components/settings/general-tab.tsx`

Theme & Display section:
- Theme: Light/Dark toggle buttons (also syncs with the global theme provider)
- Language: `Select` dropdown (English only for v1, but show the UI)
- Calendar Type: `Select` dropdown (Gregorian default)
- Date Format: `Select` dropdown (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Time Format: `Select` dropdown (12h, 24h)
- Compact Mode: `Switch`
- Show Avatars: `Switch`

Notifications section:
- Backup Reminders: `Switch`
- Status Changes: `Switch`
- Deadline Alerts: `Switch`
- Interview Reminders: `Switch`
- Email Notifications: `Switch` (disabled, "Coming Soon" badge)

Each toggle/select calls `useUpdateSettings()` mutation on change (optimistic update).

**Step 3: Create settings route**

File: `frontend/app/routes/_authenticated/settings.tsx`

- Tabs: General | Data | Integrations | About
- Tab state in URL search params (`?tab=general`)
- "Reset to Defaults" button in header
- General tab renders the component from step 2
- Data, Integrations, About tabs: placeholder content for now

**Step 4: Verify settings persist**

1. Change theme to light — page updates, refresh preserves light mode
2. Toggle compact mode — refreshes correctly
3. Check Supabase dashboard: `user_settings` row updated

**Step 5: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement settings page with general tab"
```

---

### Task 9: Companies — CRUD + directory page

**Files:**
- Create: `frontend/app/lib/queries/companies.ts`
- Create: `frontend/app/components/companies/company-form.tsx`
- Create: `frontend/app/components/companies/company-directory.tsx`
- Create: `frontend/app/components/companies/company-card.tsx`
- Create: `frontend/app/routes/_authenticated/companies/index.tsx`
- Create: `frontend/app/routes/_authenticated/companies/$companyId.tsx`

**Step 1: Create companies query layer**

File: `frontend/app/lib/queries/companies.ts`

- `useCompanies(filters)` — list with search, filter by researched status, pagination
- `useCompany(id)` — single company by ID
- `useCreateCompany()` — mutation, accepts `{ name }` at minimum
- `useUpdateCompany()` — mutation for full update
- `useSearchCompanies(term)` — debounced autocomplete query, returns top 10 matching by name `.ilike('name', '%term%')`. This is the query backing the company combobox in the application form.

**Step 2: Create company form**

File: `frontend/app/components/companies/company-form.tsx`

A dialog (shadcn `Dialog`) with React Hook Form. Two modes:
- **Create**: Only `name` field required. Used by the quick-create from combobox.
- **Edit**: All fields visible — name, description, links (website, careers, linkedin, glassdoor, news), industry, size, location, founded, culture, benefits, pros, cons, tech_stack, ratings (overall, work_life, compensation, growth, management, culture as 1-5 selects), tags, researched checkbox.

The edit form is used in Workflow 2 (recruiter screen response) when the user wants to fill in company details during research/prep.

**Step 3: Create company directory page**

File: `frontend/app/routes/_authenticated/companies/index.tsx`

- Header: Search input, Filters button, Table/Cards/List view toggle, "+ New Company" button
- Stats row (4 cards): Total Companies, Researched %, With Applications, Avg Rating
- Directory: company list/cards with search + category filter
- Empty state: "No companies yet" + "Research Your First Company" CTA

View toggle state stored in URL search params (`?view=cards`).

Stats can be derived client-side from the companies list query for v1 (small data set per user).

**Step 4: Create company detail page**

File: `frontend/app/routes/_authenticated/companies/$companyId.tsx`

Displays full company info. Edit button opens the company form dialog in edit mode. Shows linked applications count.

**Step 5: Verify CRUD**

1. Create a company from the directory page
2. See it appear in the list
3. Click to view details
4. Edit company, save, verify changes persist
5. Search works

**Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement companies page with CRUD and directory"
```

---

## Phase 3: Applications (core feature)

### Task 10: Applications — query layer + form with company combobox

**Files:**
- Create: `frontend/app/lib/queries/applications.ts`
- Create: `frontend/app/components/applications/application-form.tsx`
- Create: `frontend/app/components/applications/company-combobox.tsx`

**Step 1: Create applications query layer**

File: `frontend/app/lib/queries/applications.ts`

- `useApplications(filters)` — paginated list with:
  - `page`, `pageSize` (default 25)
  - `sort` (column + direction)
  - `search` (text across position, location; join company name)
  - `status`, `interest`, `workType`, `employmentType` filters
  - Returns `{ data, count }` for pagination
- `useApplication(id)` — single application with joined company
- `useCreateApplication()` — mutation: creates application with company_id, position, url. Status defaults to `bookmarked`.
- `useUpdateApplication()` — mutation for edits
- `useArchiveApplication()` — mutation: sets `archived_at`, `archived_reason`, `status = 'archived'`

**Step 2: Create company combobox**

File: `frontend/app/components/applications/company-combobox.tsx`

This is the critical UX component. Uses shadcn `Popover` + `Command`:

- User types in the input
- Debounced query (300ms) calls `useSearchCompanies(term)` from companies query layer
- Dropdown shows matching companies: `[icon] Company Name — Industry, Location`
- If no exact match, last item shows: `+ Create "typed text"`
- Selecting an existing company sets `company_id` on the form
- Selecting "Create" calls `useCreateCompany({ name: typedText })`, then sets the returned `company_id`
- Keyboard navigable (arrow keys, enter to select, escape to close)

**Step 3: Create application form dialog**

File: `frontend/app/components/applications/application-form.tsx`

Two modes:
- **Create** ("New Application" dialog): Company combobox, Position (text input), URL (text input). Submit creates application with defaults.
- **Edit**: All fields — company (read-only or combobox), position, status (select), work_type (select), employment_type (select), location, salary (min/max/currency/period inputs), url, job_description (textarea), interest (select), source, tags (tag input). Used in Workflow 2 when editing application details.

Supports URL param pre-fill: reads `company`, `position`, `url` from search params to seed create form (for future chrome extension).

**Step 4: Write test for company combobox**

File: `frontend/app/components/applications/__tests__/company-combobox.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CompanyCombobox } from "../company-combobox";

describe("CompanyCombobox", () => {
  it("shows matching companies when typing", async () => {
    const user = userEvent.setup();
    const mockSearch = vi.fn().mockResolvedValue([
      { id: "1", name: "Stripe" },
      { id: "2", name: "Strava" },
    ]);

    render(<CompanyCombobox onSelect={vi.fn()} searchFn={mockSearch} />);

    await user.type(screen.getByRole("combobox"), "Str");
    // After debounce, should show results
    expect(await screen.findByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Strava")).toBeInTheDocument();
  });

  it("shows create option when no exact match", async () => {
    const user = userEvent.setup();
    const mockSearch = vi.fn().mockResolvedValue([]);

    render(<CompanyCombobox onSelect={vi.fn()} searchFn={mockSearch} />);

    await user.type(screen.getByRole("combobox"), "NewCorp");
    expect(await screen.findByText(/Create "NewCorp"/)).toBeInTheDocument();
  });
});
```

**Step 5: Run tests**

```bash
cd frontend && pnpm vitest run app/components/applications/__tests__/company-combobox.test.tsx
```

Expected: Tests pass.

**Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement application form with company combobox autocomplete"
```

---

### Task 11: Applications — data table + list page

**Files:**
- Create: `frontend/app/components/applications/application-table.tsx`
- Create: `frontend/app/components/applications/application-filters.tsx`
- Create: `frontend/app/components/applications/archive-dialog.tsx`
- Create: `frontend/app/routes/_authenticated/applications/index.tsx`

**Step 1: Install TanStack Table**

```bash
cd frontend
pnpm add @tanstack/react-table
```

**Step 2: Create application table**

File: `frontend/app/components/applications/application-table.tsx`

Uses `@tanstack/react-table` with:
- Columns: Checkbox (select), Position, Company (from joined data), Status (badge), Interest (badge), Location, Salary (formatted from JSONB), Applied (date), Updated (relative time), Documents (count), **Archive button** (inline, icon button)
- Server-side sorting: clicking column header updates URL search param `sort=column.asc`
- Server-side pagination: controlled by URL params `page` and `pageSize`
- Row click navigates to `$applicationId` detail view
- Empty state: "No results found"
- Column visibility: controlled by Columns dropdown (state in localStorage)

Archive button on each row: small icon button (archive/folder icon). Clicking opens the archive dialog.

**Step 3: Create archive dialog**

File: `frontend/app/components/applications/archive-dialog.tsx`

Small `Popover` or `Dialog` triggered by the archive button:
- Title: "Why are you archiving this?"
- Three options as buttons/radio:
  - Received rejection
  - No response
  - No longer interested
- Selecting a reason immediately calls `useArchiveApplication()` mutation
- No cancel button needed — clicking outside dismisses

**Step 4: Create filter bar**

File: `frontend/app/components/applications/application-filters.tsx`

- Search input with debounce (updates URL param `search`)
- Filters button: opens `Dialog` with select dropdowns for status, interest, work type, employment type
- Applying filters updates URL search params
- Clear filters button resets all
- Column visibility dropdown (checkboxes for each column)

**Step 5: Create applications list route**

File: `frontend/app/routes/_authenticated/applications/index.tsx`

- Header: Table/Grid view toggle, "+ New Application" button (opens form dialog from Task 10)
- Filter bar component
- Data table component
- Pagination bar: "X of Y row(s) selected", page controls, rows-per-page selector

Server-side loader fetches initial data based on URL search params. TanStack Query hydrates from loader data.

**Step 6: Verify table functionality**

1. Create a few applications using the form
2. Table shows them with correct columns
3. Sorting works (click column header)
4. Search filters in real-time (debounced)
5. Pagination works (change page size, navigate pages)
6. Archive works: click archive icon, select reason, application disappears from active list

**Step 7: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement applications list with data table, filters, and archival"
```

---

### Task 12: Applications — detail view with edit + company edit + event timeline

**Files:**
- Create: `frontend/app/routes/_authenticated/applications/$applicationId.tsx`
- Create: `frontend/app/components/applications/application-detail.tsx`
- Create: `frontend/app/components/applications/event-timeline.tsx`
- Create: `frontend/app/components/applications/add-event-dialog.tsx`
- Create: `frontend/app/lib/queries/events.ts`

**Step 1: Create events query layer**

File: `frontend/app/lib/queries/events.ts`

- `useEvents(applicationId)` — list events for an application, ordered by `created_at DESC`
- `useCreateEvent()` — mutation: creates event, **auto-transitions application status** (see step below)
- `useUpdateEvent()` — mutation
- `useDeleteEvent()` — mutation

Auto-transition logic in `useCreateEvent()`:
```ts
// After inserting event, check if status transition needed
const interviewTypes = [
  "screening_interview", "technical_interview", "behavioral_interview",
  "online_test", "take_home", "onsite"
];

if (interviewTypes.includes(eventType)) {
  // Fetch current application
  const { data: app } = await supabase
    .from("applications")
    .select("status")
    .eq("id", applicationId)
    .single();

  if (app?.status === "applied") {
    await supabase
      .from("applications")
      .update({ status: "interviewing" })
      .eq("id", applicationId);
  }
}

if (eventType === "offer" && app?.status === "interviewing") {
  await supabase
    .from("applications")
    .update({ status: "offer" })
    .eq("id", applicationId);
}
```

Invalidate both events and applications queries after mutation.

**Step 2: Create add event dialog**

File: `frontend/app/components/applications/add-event-dialog.tsx`

Form fields:
- Type: Select (screening_interview, technical_interview, behavioral_interview, online_test, take_home, onsite, offer, rejection)
- Status: Select (availability_requested, availability_submitted, scheduled, completed, cancelled, rescheduled, no_show)
- Title: Text input (optional)
- Date: Date picker (optional — leave blank for TBD, stores as null)
- Time: Time input (optional, combined with date into `scheduled_at`)
- Duration: Number input (minutes, optional)
- URL: Text input (meeting link, optional)
- Description: Textarea (optional)

**Step 3: Create event timeline**

File: `frontend/app/components/applications/event-timeline.tsx`

Renders events in chronological order (newest first):
- Each event shows: type icon, type label, status badge, date (or "TBD"), title
- Expandable: click to show description, URL, duration
- Hover reveals edit/delete icon buttons
- Edit opens the add-event dialog pre-populated
- Delete confirms then removes

**Step 4: Create application detail page**

File: `frontend/app/routes/_authenticated/applications/$applicationId.tsx`

Layout:
- Header: Company name, Position title, Status badge
- Action buttons:
  - **Edit Application** — opens application form dialog (edit mode, from Task 10)
  - **Edit Company** — opens company form dialog (edit mode, from Task 9) pre-populated with the linked company
  - **Archive** — opens archive dialog (from Task 11)
- Info section: Work type, employment type, location, salary, interest, source, tags, URL, job description
- **Add Event** button
- Event timeline

This page supports the full Workflow 2 (recruiter screen response):
1. User arrives here from applications list search
2. Clicks "Edit Company" to fill in research during prep
3. Clicks "Add Event" to create screening_interview event
4. Clicks "Edit Application" to update details (work_type, salary, etc.)

**Step 5: Verify Workflow 2 end-to-end**

1. Create an application (status: bookmarked)
2. Open detail view
3. Edit company — fill in industry, size, etc.
4. Add event: screening_interview, status: scheduled, with a date
5. Verify application status auto-transitions to "interviewing"
6. Edit application — update salary, work_type
7. All changes persist on refresh

**Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement application detail with event timeline and status transitions"
```

---

## Phase 4: Documents & Interviews

### Task 13: Documents page — sidebar + editor + upload

**Files:**
- Create: `frontend/app/lib/queries/documents.ts`
- Create: `frontend/app/components/documents/document-sidebar.tsx`
- Create: `frontend/app/components/documents/document-editor.tsx`
- Create: `frontend/app/components/documents/upload-dialog.tsx`
- Create: `frontend/app/routes/_authenticated/documents.tsx`

**Step 1: Create documents query layer**

File: `frontend/app/lib/queries/documents.ts`

- `useDocuments(type?)` — list documents, optionally filter by type (resume, cover_letter)
- `useDocument(id)` — single document
- `useCreateDocument()` — create new (text-based) document
- `useUpdateDocument()` — update content, name, tags
- `useUploadDocument()` — upload file to Supabase Storage, create document record with `uri` pointing to storage path
- `useSnapshotDocument(applicationId, documentId)` — reads document, copies fields into `application_documents` table

Upload flow:
```ts
async function uploadDocument(file: File, userId: string) {
  const docId = crypto.randomUUID();
  const path = `${userId}/${docId}/${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file);

  if (uploadError) throw uploadError;

  const { data } = await supabase
    .from("documents")
    .insert({
      id: docId,
      user_id: userId,
      name: file.name,
      type: "other", // user can reclassify
      uri: path,
      mime_type: file.type,
    })
    .select()
    .single();

  return data;
}
```

**Step 2: Create document sidebar**

File: `frontend/app/components/documents/document-sidebar.tsx`

- Search input at top
- Upload button + New button
- Collapsible "Resumes" section with badge count
- Collapsible "Cover Letters" section with badge count
- Document items: name, type icon, last modified date
- Click to select (sets URL param `?doc=<id>`)
- Selected item gets highlight

**Step 3: Create document editor**

File: `frontend/app/components/documents/document-editor.tsx`

- When no document selected: empty state with "Create New" / "Upload File" CTAs
- When selected:
  - Header: document name (editable), type badge, revision label
  - Tags editor
  - Content area: `textarea` for text-based documents, or a file preview (link to download) for uploaded files
  - Auto-save on blur or explicit save button

**Step 4: Create documents route**

File: `frontend/app/routes/_authenticated/documents.tsx`

Two-panel layout:
- Left (~30%): Document sidebar
- Right (~70%): Document editor
- URL param `?doc=<id>` controls which document is selected

**Step 5: Verify document CRUD + upload**

1. Create a text-based resume — appears in sidebar under Resumes
2. Edit content, save, refresh — content persists
3. Upload a PDF file — appears in sidebar, detail shows file info with download link
4. Search filters sidebar list

**Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement documents page with sidebar, editor, and file upload"
```

---

### Task 14: Interviews page

**Files:**
- Create: `frontend/app/components/interviews/interview-list.tsx`
- Create: `frontend/app/components/interviews/schedule-dialog.tsx`
- Create: `frontend/app/routes/_authenticated/interviews.tsx`

**Step 1: Create interview-specific queries**

Add to `frontend/app/lib/queries/events.ts`:

- `useUpcomingInterviews()` — events where type is interview-related AND `scheduled_at > now()` (or `scheduled_at IS NULL` for TBD), ordered by `scheduled_at ASC NULLS LAST`
- `usePassedInterviews()` — events where type is interview-related AND `scheduled_at <= now()` AND `scheduled_at IS NOT NULL`, ordered by `scheduled_at DESC`

Both join with applications and companies to show company name and position.

**Step 2: Create interview list**

File: `frontend/app/components/interviews/interview-list.tsx`

Each item shows:
- Company name + position (from joined application)
- Interview type (badge)
- Date/time or "TBD"
- Status badge
- Duration
- Meeting link button (if URL present)
- Edit/delete action buttons

**Step 3: Create schedule dialog**

File: `frontend/app/components/interviews/schedule-dialog.tsx`

- Application selector: Combobox searching existing applications (by position + company name)
- Then the same event fields as add-event-dialog from Task 12 (type, status, date, etc.)
- This is for scheduling an interview from the interviews page (without being in an application detail view)

**Step 4: Create interviews route**

File: `frontend/app/routes/_authenticated/interviews.tsx`

- Header: Search input, Filters button, List/Calendar toggle (calendar disabled for v1), "+ Schedule Interview" button
- Tabs: "Upcoming (N)" | "Past (N)"
- Tab content: Interview list component filtered by upcoming/past
- Empty state: "No interviews scheduled yet." + "Schedule Your First Interview" CTA

**Step 5: Verify**

1. Create an application, add a screening interview event with a future date
2. Navigate to Interviews page — event appears under Upcoming
3. Change event date to past — appears under Past
4. Schedule interview from Interviews page using the dialog
5. Search and filter work

**Step 6: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement interviews page with upcoming/past tabs"
```

---

## Phase 5: Dashboard

### Task 15: Dashboard — stats, quick actions, activity feed

**Files:**
- Create: `frontend/app/lib/queries/dashboard.ts`
- Create: `frontend/app/components/dashboard/stats-cards.tsx`
- Create: `frontend/app/components/dashboard/quick-actions.tsx`
- Create: `frontend/app/components/dashboard/recent-activity.tsx`
- Create: `frontend/app/components/dashboard/chart-placeholders.tsx`
- Create: `frontend/app/routes/_authenticated/dashboard.tsx`

**Step 1: Create dashboard query**

File: `frontend/app/lib/queries/dashboard.ts`

- `useDashboardStats()` — calls `supabase.rpc('get_dashboard_stats')`, returns typed stats object
- `useRecentActivity()` — fetches last 15 events across all applications, joined with applications and companies for display names, ordered by `created_at DESC`

**Step 2: Create stats cards**

File: `frontend/app/components/dashboard/stats-cards.tsx`

Responsive grid (4 cols desktop, 2 mobile). Each card:
- Icon (top-right)
- Title (e.g. "Total Applications")
- Value (large number or percentage)
- Subtitle (e.g. "X this week")

Cards: Total Applications, Interviews (upcoming), Active Applications, Response Rate, Offers, Rejections, Contacts, Companies.

**Step 3: Create quick actions**

File: `frontend/app/components/dashboard/quick-actions.tsx`

Card with title "Quick Actions" and subtitle "Jump to common tasks". Four action buttons:
- Add New Application — opens the application form dialog (reuse from Task 10)
- Schedule Interview — opens schedule dialog (reuse from Task 14)
- View All Applications — links to `/applications`
- (View Analytics — hidden for v1)

**Step 4: Create recent activity feed**

File: `frontend/app/components/dashboard/recent-activity.tsx`

Card with title "Recent Activity" and subtitle "Your latest updates". Lists events:
- Each item: icon for event type, description text (e.g. "Applied to Senior Engineer at Stripe"), relative time ("2 hours ago")
- Empty state: "No activity yet. Start by adding your first application!"

**Step 5: Create chart placeholders**

File: `frontend/app/components/dashboard/chart-placeholders.tsx`

Four cards matching THRIVE's dashboard: Application Funnel, Application Trends, Distribution, Success Metrics. Each renders:
- Title + subtitle
- Empty state message: "No application data yet. Start adding applications to see your [funnel/trends/distribution/metrics]!"

**Step 6: Create dashboard route**

File: `frontend/app/routes/_authenticated/dashboard.tsx`

Layout:
- Stats cards row (full width)
- Two-column grid below:
  - Left column: Chart placeholders (Application Funnel, Application Trends)
  - Right column: Chart placeholders (Distribution, Success Metrics)
- Two-column grid:
  - Left: Quick Actions
  - Right: Recent Activity

**Step 7: Verify**

1. Dashboard loads with all zeros (fresh account)
2. Create some applications and events
3. Stats update correctly
4. Recent activity shows latest events
5. Quick actions open correct dialogs/navigate correctly
6. Responsive layout works on mobile

**Step 8: Commit**

```bash
git add frontend/app/
git commit -m "feat: implement MVP dashboard with stats, quick actions, and activity feed"
```

---

## Phase 6: Testing & Polish

### Task 16: Set up Vitest + Testing Library

**Files:**
- Modify: `frontend/package.json` (test deps)
- Create: `frontend/vitest.config.ts`
- Create: `frontend/app/test/setup.ts`

**Step 1: Install test dependencies**

```bash
cd frontend
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

**Step 2: Create vitest config**

File: `frontend/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./app/test/setup.ts"],
    globals: true,
  },
});
```

**Step 3: Create test setup**

File: `frontend/app/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

**Step 4: Add test script to package.json**

Add to `frontend/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Run tests**

```bash
cd frontend && pnpm test
```

Expected: Passes (including the combobox test from Task 10).

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: set up Vitest and Testing Library"
```

---

### Task 17: Write tests for core workflows

**Files:**
- Create: `frontend/app/lib/queries/__tests__/applications.test.ts`
- Create: `frontend/app/components/applications/__tests__/archive-dialog.test.tsx`
- Create: `frontend/app/components/applications/__tests__/application-form.test.tsx`

**Step 1: Test application creation with company auto-create**

```ts
// Test the flow: type company name -> no match -> select "Create" -> application created
describe("useCreateApplication", () => {
  it("creates a company inline when company does not exist", async () => {
    // Mock supabase calls
    // 1. Company search returns empty
    // 2. Company insert returns { id, name }
    // 3. Application insert returns new application
    // Assert: company created with name only, application linked to new company
  });

  it("uses existing company when match selected", async () => {
    // Mock: company search returns [{ id: "existing", name: "Stripe" }]
    // Assert: no company insert, application created with existing company_id
  });
});
```

**Step 2: Test archive flow**

```tsx
describe("ArchiveDialog", () => {
  it("archives application with selected reason", async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();

    render(<ArchiveDialog applicationId="123" onArchive={onArchive} />);

    await user.click(screen.getByText("Received rejection"));
    expect(onArchive).toHaveBeenCalledWith("123", "received_rejection");
  });
});
```

**Step 3: Test status auto-transition**

```ts
describe("useCreateEvent", () => {
  it("transitions application from applied to interviewing when interview event created", async () => {
    // Mock: application.status = "applied"
    // Action: create event with type = "screening_interview"
    // Assert: application.update called with { status: "interviewing" }
  });

  it("does not transition if application already interviewing", async () => {
    // Mock: application.status = "interviewing"
    // Action: create event with type = "technical_interview"
    // Assert: application.update NOT called
  });
});
```

**Step 4: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: All pass.

**Step 5: Commit**

```bash
git add frontend/app/
git commit -m "test: add tests for core workflows (create, archive, status transitions)"
```

---

### Task 18: Seed data + Makefile

**Files:**
- Create: `supabase/seed.sql`
- Modify: `Makefile`

**Step 1: Create seed data**

File: `supabase/seed.sql`

Create a few realistic entries for development:
- 3-5 companies (Stripe, Vercel, Supabase, Figma, Linear)
- 5-8 applications across those companies in various statuses
- A few events (interviews, applied events)
- 2-3 documents (sample resume, cover letter)

Use hardcoded UUIDs so the seed is idempotent. Note: seed data needs a user_id, which gets set when `supabase db reset` runs with a test user. Add a comment noting the tester should create a user first, or use Supabase's seeding approach with a known test user.

**Step 2: Update Makefile**

File: `Makefile`

```makefile
.PHONY: dev db-start db-stop db-reset db-seed db-types test

# Start everything for local development
dev: db-start
	cd frontend && pnpm dev

# Database
db-start:
	supabase start

db-stop:
	supabase stop

db-reset:
	supabase db reset

db-seed:
	supabase db reset --seed

# Generate TypeScript types from database schema
db-types:
	supabase gen types typescript --local > frontend/app/lib/supabase/types.ts

# Tests
test:
	cd frontend && pnpm test

# Frontend
install:
	cd frontend && pnpm install
```

**Step 3: Verify**

```bash
make db-reset
make db-types
make dev
```

Expected: Fresh database, regenerated types, dev server running.

**Step 4: Commit**

```bash
git add supabase/seed.sql Makefile
git commit -m "feat: add seed data and Makefile dev commands"
```

---

### Task 19: Responsive design pass + dark mode polish

**Files:**
- Modify: Various component files

**Step 1: Mobile breakpoint audit**

Check each page at 400px width (mobile target from design doc):
- Nav bar: Should collapse to hamburger menu or simplified layout on mobile
- Dashboard: Stats cards should be 2 columns, widgets stack vertically
- Applications table: Horizontal scroll or switch to card view on mobile
- Documents: Sidebar collapses or becomes a drawer
- Settings: Full width tabs

Fix any layout issues found.

**Step 2: Dark mode color audit**

Verify all components look correct in both light and dark mode:
- Card backgrounds, borders, shadows
- Text contrast ratios
- Input focus states
- Badge/status colors readable in both modes
- Ensure the theme toggle in nav bar updates all components

**Step 3: Commit**

```bash
git add frontend/app/
git commit -m "fix: responsive layout and dark mode polish"
```

---

### Task 20: Vercel deployment configuration

**Files:**
- Create: `frontend/vercel.json` (if needed)
- Create: `frontend/.env.example`

**Step 1: Create env example**

File: `frontend/.env.example`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Step 2: Configure Vercel**

TanStack Start with Vinxi should work on Vercel out of the box. If not, create `frontend/vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".output",
  "framework": null
}
```

> **Note:** Check TanStack Start deployment docs for Vercel at implementation time. The Vinxi build output may need specific Vercel adapter configuration.

**Step 3: Create Supabase production project**

1. Go to supabase.com, create a new project
2. Run migrations: `supabase db push --linked`
3. Set up Auth providers (Google, GitHub) in Supabase dashboard
4. Create `documents` storage bucket in Supabase dashboard
5. Add environment variables to Vercel project settings

**Step 4: Deploy and verify**

```bash
cd frontend && vercel deploy
```

Verify: Auth flow, CRUD operations, storage uploads all work in production.

**Step 5: Commit**

```bash
git add frontend/.env.example frontend/vercel.json
git commit -m "feat: add Vercel deployment configuration"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-7 | Scaffolding, Supabase, DB schema, auth, nav, theme |
| 2: Settings & Companies | 8-9 | Settings page, companies CRUD + directory |
| 3: Applications | 10-12 | Application CRUD, table, detail, events, status transitions |
| 4: Documents & Interviews | 13-14 | Documents page with upload, interviews list |
| 5: Dashboard | 15 | Stats cards, quick actions, activity feed |
| 6: Testing & Polish | 16-20 | Test setup, core workflow tests, seed data, responsive, deploy |
