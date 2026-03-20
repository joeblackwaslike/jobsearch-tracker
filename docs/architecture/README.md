# Architecture Docs

Design and architecture reference for the Job Search Tracker. These docs reflect the current implementation unless noted otherwise.

---

| Document | What it covers |
|---|---|
| [constitution.md](./constitution.md) | Stable product principles and constraints. Overrides any one-off spec when they conflict. Start here if you're new to the project. |
| [project.md](./project.md) | High-level system overview — mission, problem statement, component map, and product goals. |
| [data-model.md](./data-model.md) | Database schema, entity relationships, RLS patterns, and the DB diagram. |
| [api-layer.md](./api-layer.md) | The two API layers: Supabase PostgREST (web frontend) and the Extension API (Bearer token, TanStack Start routes). |
| [edge-functions.md](./edge-functions.md) | Supabase Edge Functions — what they're for, the function inventory, and deployment notes. |
| [ui.md](./ui.md) | Frontend architecture — routing, component conventions, state management, and styling patterns. |

---

Also see [`docs/plans/`](../plans/) for implementation plans.
