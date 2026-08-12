# Realtime Sync Design

## Overview

Add real-time database change propagation to the frontend so that any write — from another browser tab, the Chrome extension, or a future mobile client — is reflected in the UI automatically without a manual refresh.

## Primary Use Cases

1. **Chrome extension → main app**: User scrapes a job listing, extension inserts a row into `applications`. The Applications list in the open browser tab updates without a refresh.
2. **Multi-tab sync**: User has two tabs open. An edit in tab A is immediately reflected in tab B.
3. **Future-proofing**: Sets up the infrastructure for collaborative use or mobile clients later.

## How Supabase Realtime Works

Supabase Realtime uses PostgreSQL's logical replication to stream row-level changes (INSERT / UPDATE / DELETE) over a persistent WebSocket connection via `supabase-js`.

```
PostgreSQL WAL → Supabase Realtime server → WebSocket → supabase-js client
```

Subscriptions use the channel API:

```ts
supabase
  .channel('db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, handler)
  .subscribe()
```

The `event` can be `'INSERT'`, `'UPDATE'`, `'DELETE'`, or `'*'` (all).

The payload includes:
- `eventType`: `'INSERT' | 'UPDATE' | 'DELETE'`
- `new`: the new row (INSERT / UPDATE)
- `old`: the old row (UPDATE / DELETE, primary key only unless full replica identity is set)

## Integration with TanStack Query

The integration point is **direct cache updates** from the realtime payload, with targeted single-item fetches where joins are needed. This avoids re-fetching the entire list and allows animations to fire immediately.

```
DB change detected → update cache directly → animation fires instantly → UI reflects change
```

### Strategy by event type

| Event | Action |
|---|---|
| INSERT | Fetch the single new row with joins, prepend to all matching list caches |
| UPDATE | Fetch the single updated row with joins, replace matching entry in list caches |
| DELETE | Remove entry by `old.id` from all matching list caches — no fetch needed |
| Aggregates | Always invalidate (dashboard stats, counts — not list items) |

**Why not pure invalidation**: invalidation delays the animation by a full network round-trip (~100–300ms) before anything moves. With direct cache updates, the animation fires as soon as the realtime event arrives.

**Why targeted fetch instead of using payload directly**: List items include joined data (e.g. `application.company.name`, `event.application.position`). The raw payload only contains the table's own columns. A single-item fetch is one small request rather than re-fetching the whole list, and it returns the correct joined shape.

## Architecture

### Single channel, centralized hook

One Supabase channel subscribes to all relevant tables. This is cheaper than one channel per table (each channel is a separate WebSocket subscription).

```
useRealtimeSync()
  └── supabase.channel('db-changes')
        ├── postgres_changes: applications → invalidate ['applications']
        ├── postgres_changes: events       → invalidate ['events']
        ├── postgres_changes: companies    → invalidate ['companies']
        └── postgres_changes: contacts     → invalidate ['contacts']
```

### Where it lives

`useRealtimeSync()` is called once, in the authenticated layout route (`_authenticated.tsx`). This ensures:
- It only runs when the user is logged in
- It runs for all authenticated pages simultaneously
- It tears down the channel when the user logs out

### Query key convention

Current query keys follow a consistent pattern in `src/lib/queries/`:
- `['applications', filters]`
- `['events', applicationId]`
- `['companies', ...]`
- `['contacts', ...]`
- `['dashboard']`

Invalidating by the first segment (e.g. `{ queryKey: ['applications'] }`) will catch all variations with different filters.

## Implementation Sketch

### `src/lib/realtime/use-realtime-sync.ts`

```ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const TABLE_QUERY_KEYS: Record<string, string[][]> = {
  applications: [['applications'], ['dashboard'], ['application-stats']],
  events:       [['events']],
  companies:    [['companies']],
  contacts:     [['contacts']],
  documents:    [['documents']],
}

export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel('db-changes')

    for (const [table, keys] of Object.entries(TABLE_QUERY_KEYS)) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of keys) {
            queryClient.invalidateQueries({ queryKey: key })
          }
        }
      )
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

### Usage in `_authenticated.tsx`

```tsx
export function AuthenticatedLayout() {
  useRealtimeSync()
  return <Outlet />
}
```

## Supabase Setup Required

### 1. Enable Realtime on each table

In the Supabase dashboard: **Database → Replication → Tables** — enable Realtime for:
- `applications`
- `events`
- `companies`
- `contacts`
- `documents`

Or via SQL migration:

```sql
alter publication supabase_realtime add table applications;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table companies;
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table documents;
```

### 2. RLS compatibility

Supabase Realtime `postgres_changes` subscriptions respect RLS as of late 2023. Since all tables already have RLS enabled with `auth.uid()` policies, authenticated users will only receive change events for rows they own. No additional policy changes are needed.

### 3. Replica identity (optional)

By default, UPDATE and DELETE payloads only include the primary key in `old`. To get the full `old` row on UPDATE/DELETE (useful for optimistic updates):

```sql
alter table applications replica identity full;
```

Not required for the invalidation approach but useful if we ever switch to direct cache updates.

## UX Behavior

- **Silent refresh**: Most updates happen silently — TanStack Query refetches in the background and swaps the data. No spinner, no flash.
- **Insert animation**: When a new row appears in a list after an INSERT event, it animates in smoothly (e.g. fade + slide down). All inserts are treated the same regardless of source.
- **Atomic bulk changes**: Invalidations from multiple rapid events (e.g. bulk archive) are debounced and batched, so the UI updates as one smooth unit rather than flickering through intermediate states.
- **Loading indicator**: While refetching, `isFetching` is `true` on the query. We can optionally show a subtle indicator (e.g. a pulse on the navbar) during background refetches.

## What We Are Not Doing (Scope)

- **Presence / cursors**: Not needed for a single-user tracker.
- **Broadcast channel**: For app-level events (e.g. "show notification"), not needed yet.
- **Direct cache updates**: Too complex for the initial implementation. Invalidation is sufficient.
- **Offline / conflict resolution**: Out of scope.

## Debounce Strategy

**Leading + trailing debounce** (200ms window):
- First event in a burst fires **immediately** → single changes feel instant
- Subsequent events within 200ms are collapsed → bulk operations update as one unit

This keeps single-item changes snappy while preventing the UI from flickering through intermediate states during bulk operations.

## Animation

**Library**: `@formkit/auto-animate` (~1.5KB). Drop-in hook on list containers — handles enter, exit, and reorder automatically with no per-item configuration.

**Applied to**:
- Applications table body
- Events list
- Companies table body
- Event timeline

**Not applied to**:
- Dashboard stat numbers (not a list)
- Side panel detail views (single record)

**Principles**:
- Duration: 150ms max — fast enough to not feel sluggish
- Easing: `ease-out` — snaps in, settles smoothly
- Never block interaction during animation
- GPU-accelerated transforms only

## Open Questions

1. ~~Extension event detection~~ — No distinction. All inserts animate in the same way.
2. ~~Debouncing~~ — Yes: 300ms debounce, changes move as one atomic unit.
3. **Replica identity**: Default (primary key only in `old`) is sufficient for direct cache updates and animations — the `new` payload always contains the full row, and `old.id` is enough to locate and remove/replace the cached entry. `REPLICA IDENTITY FULL` would only be needed for undo functionality or "what changed" diff displays (e.g. "status changed from Applied → Interviewing"). Not needed for current scope.
4. **Realtime plan limits**: Supabase Free plan allows up to 200 concurrent realtime connections and 2M messages/month — more than sufficient for personal use.
