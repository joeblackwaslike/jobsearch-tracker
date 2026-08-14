# AI Company Research — Phase 1 Implementation Plan

**Date:** 2026-08-12
**PRD:** `docs/prds/prd-ai-integration.md`
**Branch:** `feat/ai-company-research`
**Scope:** Phase 1 MVP of AI integration, focused on company research as the first task type

---

## Goal

Build the data model, query layer, UI shell, and real AI integration for company research. This is a subset of the full Phase 1 PRD scope — it implements the complete company research flow end-to-end while deferring contact research, email drafts, thank-you notes, and Gmail integration to later branches.

## Deliverables

### Commit 1: Core data model + server functions + settings UI + document approval ✅

- [x] DB migration: `tasks` table, `user_consents` table, `document_source`/`document_status` enums, AI flag columns on `user_settings`
- [x] Supabase types updated with tasks, enums
- [x] Server function: `generateCompanyResearch` (Anthropic API call, creates task + document)
- [x] Server functions: `approveTask`, `terminateTask`, `refineDocument` (task lifecycle actions)
- [x] Query layer: `useTasksForApplication`, `usePendingTaskCount`, `useGenerateResearch`, `useApproveTask`, `useTerminateTask`, `useRefineDocument`
- [x] Settings → AI tab: master toggle with consent dialog, company research toggle, API key input with test connection
- [x] Application detail: "Generate Research" button, task status badges
- [x] Document editor: AI approval bar (approve / request changes / terminate)
- [x] Nav bar: pending task count badge
- [x] New shadcn components: `alert-dialog`, `textarea`

### Commit 2: Inbox view + AI Activity section ✅

- [x] Inbox route (`/inbox`) with `InboxList` component
- [x] Three-section layout: Needs Your Attention, In Progress, Recently Completed
- [x] Task cards with type icon, status badge, company/position, relative time, action buttons
- [x] `useInboxTasks` query (tasks with application + company joins)
- [x] Nav link: "Inbox" added to navigation with pending count badge inline
- [x] Application detail: AI Activity card showing task history with status badges and document links
- [x] Route tree updated for `/inbox`
- [x] Tests: `inbox-list.test.tsx` (7 tests)

### Commit 3: DB migrations — integrations, OAuth, rename, triggers, banner column ✅

- [x] `user_integrations` table with RLS and provider UNIQUE constraint
- [x] `user_oauth_tokens` table with RLS (for future Google OAuth)
- [x] `application_documents` → `application_events_documents` rename + `event_id` FK
- [x] Initial event triggers: auto-create `bookmarked`/`applied` events on application INSERT/UPDATE
- [x] `ai_setup_banner_dismissed` column on `user_settings`

### Commit 4: Frontend application_documents rename ✅

- [x] Query key and `.from()` updates in `application-documents.ts` and `documents.ts`

### Commit 5: Integrations query hooks + Settings tab (TDD) ✅

- [x] `integrations.ts` query hooks (CRUD for `user_integrations`)
- [x] `integrations-tab.tsx` with 4 provider cards (Anthropic active, 3 coming soon)
- [x] Settings route wired to use `<IntegrationsTab />`
- [x] Tests: `integrations-tab.test.tsx` (5 tests, TDD red-green)

### Commit 6: Dashboard AI discovery banner (TDD) ✅

- [x] `ai-discovery-banner.tsx` — shows when AI disabled + not dismissed
- [x] Dashboard route wired with `<AiDiscoveryBanner />` between header and StatsCards
- [x] Tests: `ai-discovery-banner.test.tsx` (6 tests, TDD red-green)

### Commit 7: Seed data ✅

- [x] Renamed `application_documents` inserts to `application_events_documents`
- [x] Disabled/re-enabled event triggers during seeding
- [x] Added `user_integrations` rows (4 providers, unconfigured)
- [x] Added `tasks` rows (3: completed, awaiting_approval, running)
- [x] Added AI-generated research documents (2)

### Commit 8: Plan doc update ✅

- [x] Updated this file

## Deferred to later branches

- Contact research (Apollo integration)
- Email drafts (Anthropic + Gmail)
- Thank-you notes
- Gmail OAuth flow + send
- Pending task digest emails
- Migrating AI tab's Anthropic key to use `user_integrations` (dual storage is intentional for Phase 1)

## Architecture Notes

- Company research runs synchronously via `createServerFn` — no background job queue yet. Inngest is planned for Phase 2.
- Anthropic API key stored in `user_settings.anthropic_api_key` (plain text with RLS). `user_integrations` table exists but AI tab and Integrations tab operate independently for now.
- Document refinement creates a new document with `parent_id` pointing to the previous version.
- Event triggers fire on application INSERT/UPDATE to auto-create bookmarked/applied events. Triggers are disabled during seeding to avoid duplicates.
