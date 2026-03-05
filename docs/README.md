# Docs

Design and implementation reference for the Job Search Tracker.

---

## Architecture

Stable reference documents describing the current system. Start here before working in any major area.

| Document | What it covers |
|---|---|
| [constitution.md](./architecture/constitution.md) | Stable product principles and constraints. Overrides any one-off spec when they conflict. |
| [project.md](./architecture/project.md) | High-level system overview — mission, problem statement, component map, and product goals. |
| [data_model.md](./architecture/data_model.md) | Database schema, entity relationships, RLS patterns, and the DB diagram. |
| [api_layer.md](./architecture/api_layer.md) | The two API layers: Supabase PostgREST (web frontend) and the Extension API (Bearer token, OpenAPI, Zod). |
| [edge-functions.md](./architecture/edge-functions.md) | Supabase Edge Functions — what they're for, the function inventory, and deployment notes. |
| [ui.md](./architecture/ui.md) | Frontend architecture — routing, component conventions, state management, and styling patterns. |
| [demo_seed_data.md](./architecture/demo_seed_data.md) | Demo seed data conventions and schema for development and testing. |

---

## PRDs

Product requirements documents for major features.

| Document | Feature |
|---|---|
| [prd-ai-integration.md](./prds/prd-ai-integration.md) | AI integration — smart suggestions, resume matching, and application insights. |

---

## Plans

Implementation plans paired with design documents. Most recent first.

| Date | Feature | Design | Plan |
|---|---|---|---|
| 2026-03-04 | OpenAPI + Scalar UI | [design](./plans/2026-03-04-openapi-scalar-design.md) | [plan](./plans/2026-03-04-openapi-scalar.md) |
| 2026-03-04 | Chrome Extension | [design](./plans/2026-03-04-chrome-extension-design.md) | [plan](./plans/2026-03-04-chrome-extension.md) |
| 2026-03-03 | Google OAuth Sign-In | [design](./plans/2026-03-03-google-oauth-design.md) | [plan](./plans/2026-03-03-google-oauth.md) |
| 2026-03-03 | Extension Backend API | [design](./plans/2026-03-03-extension-backend-design.md) | [plan](./plans/2026-03-03-extension-backend.md) |
| 2026-02-28 | Iteration 2 — Combobox fixes, URL import, multi-location | [design](./plans/2026-02-28-iteration-2-design.md) | [plan](./plans/2026-02-28-iteration-2-implementation.md) |
| 2026-02-28 | Dropdown Scroll Bugfix + Auto-Resume Pre-selection | [design](./plans/2026-02-28-dropdown-scroll-and-auto-resume-design.md) | [plan](./plans/2026-02-28-dropdown-scroll-and-auto-resume.md) |
| 2026-02-27 | UI Fixes | [design](./plans/2026-02-27-ui-fixes-design.md) | [plan](./plans/2026-02-27-ui-fixes.md) |
| 2026-02-27 | Iteration | [design](./plans/2026-02-27-iteration-design.md) | [plan](./plans/2026-02-27-iteration-plan.md) |
| 2026-02-26 | Frontend Iteration | [design](./plans/2026-02-26-frontend-iteration-design.md) | [plan](./plans/2026-02-26-frontend-iteration.md) |
| 2026-02-26 | Companies + Events UI Fixes | [design](./plans/2026-02-26-companies-events-ui-fixes-design.md) | [plan](./plans/2026-02-26-companies-events-ui-fixes.md) |
| 2026-02-25 | Seed Data Generator | [design](./plans/2026-02-25-seed-data-generator-design.md) | [plan](./plans/2026-02-25-seed-data-generator.md) |
| 2026-02-25 | Frontend Iteration | [design](./plans/2026-02-25-frontend-iteration-design.md) | [plan](./plans/2026-02-25-frontend-iteration.md) |
| 2026-02-23 | Unified Table Component with Side Panel | [design](./plans/2026-02-23-unified-table-design.md) | [plan](./plans/2026-02-23-unified-table-implementation.md) |
| 2026-02-22 | UI Polish & Bug Fixes | [design](./plans/2026-02-22-ui-polish-bug-fixes-design.md) | [plan](./plans/2026-02-22-ui-polish-bug-fixes.md) |
| 2026-02-22 | Next Iteration | [design](./plans/2026-02-22-next-iteration-design.md) | [plan](./plans/2026-02-22-next-iteration.md) |
| 2026-02-21 | Next Iteration Bugfixes | [design](./plans/2026-02-21-next-iteration-bugfixes-design.md) | [plan](./plans/2026-02-21-next-iteration-bugfixes.md) |
| 2026-02-21 | Next Iteration 2 | [design](./plans/2026-02-21-next-iteration-2-design.md) | [plan](./plans/2026-02-21-next-iteration-2.md) |
| 2026-02-21 | Modal Overflow & Interview Duration Fixes | [design](./plans/2026-02-21-modal-overflow-and-interview-fixes-design.md) | [plan](./plans/2026-02-21-modal-overflow-and-interview-fixes.md) |
| 2026-02-21 | Frontend Iteration | [design](./plans/2026-02-21-frontend-iteration-design.md) | [plan](./plans/2026-02-21-frontend-iteration.md) |
| 2026-02-20 | Thrive Iteration — Companies, Applications, Interviews | [design](./plans/2026-02-20-thrive-iteration-design.md) | [plan](./plans/2026-02-20-thrive-iteration.md) |
| 2026-02-18 | JobSearch CLI Enhancements | [design](./plans/2026-02-18-jobsearch-cli-enhancements-design.md) | [plan](./plans/2026-02-18-jobsearch-cli-enhancements.md) |
| 2026-02-17 | Durable Test Coverage | — | [plan](./plans/2026-02-17-durable-test-coverage-plan.md) |
| 2026-02-17 | Contacts & Application Documents | [design](./plans/2026-02-17-contacts-and-app-documents-design.md) | [plan](./plans/2026-02-17-contacts-and-app-documents-plan.md) |
| 2026-02-16 | THRIVE Clone | [design](./plans/2026-02-16-thrive-clone-design.md) | [plan](./plans/2026-02-16-thrive-clone-implementation.md) |

---

Also see [`backlog.md`](./backlog.md) for the feature backlog and [`next-iteration.md`](./next-iteration.md) for staged upcoming work.
