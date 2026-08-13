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

## Deferred to later branches

- Contact research (Apollo integration)
- Email drafts (Anthropic + Gmail)
- Thank-you notes
- Settings → Integrations section (`user_integrations` table, health checks)
- Gmail OAuth flow + send
- `user_oauth_tokens` table
- `application_documents` → `application_events_documents` rename
- Initial event triggers (auto-create `bookmarked`/`applied` events)
- Seed data with AI tasks
- AI features discovery banner on dashboard
- Pending task digest emails

## Architecture Notes

- Company research runs synchronously via `createServerFn` — no background job queue yet. Inngest is planned for Phase 2.
- Anthropic API key stored in `user_settings.anthropic_api_key` (plain text with RLS). `user_integrations` table with proper health checks is deferred.
- Document refinement creates a new document with `parent_id` pointing to the previous version.
