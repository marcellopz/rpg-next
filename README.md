# RPG Campaign Manager

A OneNote-style tabletop RPG campaign manager: campaign wiki with rich-text pages, character sheets and inventories, a live combat log, and member invites. File uploads, personal library, and TV display are deferred.

## Stack

- **Next.js (App Router) + TypeScript** — frontend + server actions in one place
- **Tailwind CSS v3** — utility-first styling
- **Supabase** — Postgres, Auth, Realtime, and Storage from one vendor
- **Tiptap** — rich-text editor; pages stored as structured JSON

The organizing rule: *just moving a row/file around* → call Supabase from the **client**; *a decision about who's allowed, or multiple coordinated steps* → write a **server action** (`app/actions/*`).

## Setup

1. `cp .env.example .env.local` and fill in your Supabase URL, anon key, and service-role key.
2. In the Supabase SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
3. In the dashboard, create two Storage buckets: `public-assets` (public) and `private-files` (private).
4. Realtime for `combat_log_entries` is enabled by the migration (`alter publication supabase_realtime add table ...`). Confirm it under Database → Replication.
5. `npm install` then `npm run dev`.

## Layout

```
app/
  actions/            server actions: campaigns, invites, pages, inventory
  campaigns/          campaign list, detail, wiki page editor
  join/[token]/       accept-invite flow
components/            CampaignWorkspace, NotesEditor, InventoryTool
lib/
  supabase/           browser + server (+ admin) clients
  editor/extensions   the SINGLE shared Tiptap extension set
middleware.ts         session refresh + auth redirects
supabase/migrations/  schema + RLS
```

## Deliberate non-goals

No collaborative same-field editing (no Y.js/CRDT), no separate WebSocket server. The database is the single source of truth; Supabase Realtime broadcasts row changes. tRPC/Prisma are optional and not used.
