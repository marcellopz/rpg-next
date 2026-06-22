# RPG Campaign Manager — Claude Context

A tabletop RPG campaign manager: OneNote-style wiki with categories and rich-text pages, character sheets, inventories, a live combat log, member invites, and file uploads. Also includes a cross-campaign personal library and a read-only TV display surface for broadcasting on a living-room webOS TV.

Full design spec and code patterns: `rpg-manager-reference.md`.

---

## Stack

| Layer | Choice | Constraint |
|-------|--------|-----------|
| Framework | Next.js 14 App Router + TypeScript | Server actions for trusted logic |
| Styling | **Tailwind CSS v3** | **Pinned to v3, never upgrade to v4** — v3 CSS runs on webOS TV (Chromium 38+); v4 does not |
| Database + Auth + Realtime + Storage | Supabase | One vendor for everything |
| Editor | Tiptap 2 | Stores structured JSON (`content_json`), not Markdown |

---

## The one architectural rule

- **Just moving a row/file?** → call Supabase directly from the **client** (`lib/supabase/client.ts`)
- **Decision about who's allowed, or multiple coordinated steps?** → write a **Next.js server action** (`app/actions/`) using the trusted server client (`lib/supabase/server.ts`)

Campaign creation, invites, role changes, page save hardening, and DM-controlled uploads are server actions. Everything else is mostly client calls.

---

## Schema change rule — STOP before touching migrations

**Never create, modify, or delete a migration file without explicit approval.**

Migrations are destructive by nature: they alter a live database and cannot be automatically undone. Before doing any of the following, **stop and present the proposed change to the user for review**:

- Adding, renaming, or dropping a table or column
- Changing a column type, constraint, or default
- Adding or modifying an RLS policy or helper function
- Creating or deleting a migration file under `supabase/migrations/`

The proposal must include: the exact SQL, which migration file it belongs to (new or existing), and what data (if any) would be lost or altered on the remote database.

---

## Key directories

```
app/actions/          # Server actions: campaigns.ts, invites.ts, pages.ts, files.ts, library-transfer.ts
app/campaigns/        # Campaign list + detail + page editor
app/join/[token]/     # Invite acceptance flow
app/library/          # Personal library (cross-campaign, user-owned)
app/tv/               # Read-only TV display surface (webOS-safe)
components/           # CombatLog.tsx (realtime), TvCombatLog.tsx (read-only)
lib/supabase/         # client.ts (browser, anon key) | server.ts (server, service-role key)
lib/editor/extensions.ts  # SHARED Tiptap extensions — used by editor, generateText, generateHTML
supabase/migrations/  # 0001_init.sql (schema) | 0002_rls.sql (RLS policies + is_member helper)
middleware.ts         # Routes webOS user-agents to /tv automatically
```

---

## Patterns to reuse

**Supabase clients**
- `createClient()` from `lib/supabase/client.ts` — browser, RLS-enforced
- `createServerClient()` from `lib/supabase/server.ts` — server actions, trusted

**Tiptap utilities (always use the shared extensions)**
```typescript
import { editorExtensions } from '@/lib/editor/extensions'
import { generateText } from '@tiptap/core'   // for server: wipe-guard, search
import { generateHTML } from '@tiptap/html'   // for server: TV note render
```

**RLS helper (in SQL)**
```sql
is_member(campaign_id)  -- true if auth.uid() is in memberships for that campaign
```
Every table with a `campaign_id` uses this. Personal library tables use `owner_id = auth.uid()`.

**Page save hardening** (`app/actions/pages.ts → savePage`)
- Layer 1: `previous_content_json` (last-known-good) + `deleted_at` soft delete
- Layer 2: Server-side wipe guard — blocks save if new text < 10% of old; asks user to confirm
- Layer 3: Capped rolling snapshots in `page_recovery_snapshots` (newest 10 per page)
- `content_text` is always derived on the server from JSON via `generateText` — never trusted from the client

**Personal library** (`app/actions/library-transfer.ts`)
- Envelope + typed body pattern: `library_items` (common fields) + per-kind body tables
- Transfer actions copy data, never link — each space stays self-contained

---

## TV / webOS constraints (scoped to `/tv` routes only)

The main app is unrestricted. Only `/tv` must follow these rules:
- **Layout:** flexbox only (no CSS Grid — absent in Chromium 38)
- **Color:** plain `hex`/`rgb` only (no `oklch`, `lab`, etc.)
- **Avoid:** `:has()`, container queries, cascade layers
- **Navigation:** focusable links with strong `:focus` styles (TV remote = arrow keys + enter)
- **No editor code** ships to `/tv` — notes are rendered server-side via `generateHTML`
- Scoped styles live in `app/tv/tv.css`

`browserslist` in `package.json` is set to `chrome >= 38` — the bundler transpiles JS to this floor.

---

## Dev setup

1. Copy `.env.example` → `.env.local` and fill in Supabase project URL + keys
2. Run migrations: `pnpm supabase login` → `pnpm supabase link --project-ref <ref>` → `pnpm db:push`
3. Create two Storage buckets in Supabase dashboard: `public-assets` (public) and `private-files` (private)
4. Enable Realtime for the `combat_log_entries` table (Database → Replication)
5. `pnpm install && pnpm dev`

## Commands

```bash
pnpm dev           # Start dev server (localhost:3000)
pnpm typecheck     # tsc --noEmit
pnpm lint          # next lint
pnpm build         # Production build
pnpm db:push       # Apply pending migrations to remote DB
pnpm db:migrations # List applied/pending migrations
pnpm db:new <name> # Scaffold a new migration file
```
