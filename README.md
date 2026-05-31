# RPG Campaign Manager

A OneNote-style tabletop RPG campaign manager: campaign wiki with rich-text pages, character sheets and inventories, a live combat log, member invites, file uploads, a cross-campaign personal library, and a read-only TV display surface for old webOS TVs.

## Stack

- **Next.js (App Router) + TypeScript** — frontend + server actions in one place
- **Tailwind CSS v3** — pinned to v3 (not v4) so one CSS version runs on both modern browsers and the old webOS TV engine
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
  actions/            server actions: campaigns, invites, pages, files, library-transfer
  campaigns/          campaign list, detail, wiki page editor
  join/[token]/       accept-invite flow
  library/            personal library
  tv/                 read-only display surface (webOS-compatible CSS, focusable nav)
components/            CombatLog (interactive) + TvCombatLog (read-only)
lib/
  supabase/           browser + server (+ admin) clients
  editor/extensions   the SINGLE shared Tiptap extension set
middleware.ts         routes legacy webOS user-agents to /tv
supabase/migrations/  schema + RLS
```

## TV / webOS notes

`/tv` is read-only and self-contained. Notes are server-rendered from Tiptap JSON via `generateHTML` (no editor ships to the TV); the combat log reuses the Supabase realtime subscription. Styling is scoped to `/tv` and follows webOS discipline: flexbox not Grid, hex/rgb colors, no `:has()`/container queries. The conservative `browserslist` (`chrome >= 38`) makes the bundler transpile JS down to an old-engine-safe level — raise the floor to `chrome >= 53` if targeting only 2018 models.

## Deliberate non-goals

No collaborative same-field editing (no Y.js/CRDT), no separate WebSocket server. The database is the single source of truth; Supabase Realtime broadcasts row changes. tRPC/Prisma are optional and not used.
