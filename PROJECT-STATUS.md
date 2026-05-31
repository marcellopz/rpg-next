# RPG Campaign Manager — Project Status

> Last updated: 2026-05-31

The app is scaffolded and structurally complete. All backend logic, database schema, RLS, and server actions are in place. The remaining work is primarily **UI wiring** for features whose data layer is already solid. The project needs a live Supabase project (env vars + migrations) before it will run.

---

## Build order status

From the reference doc's suggested build order:

| # | Feature | Backend | UI | Status |
|---|---------|---------|-----|--------|
| 1 | Auth + campaigns + memberships | ✅ | ✅ | **Done** |
| 2 | Invites (invite + accept) | ✅ | ⚠️ | **Backend done; no invite button in campaign UI yet** |
| 3 | Wiki: categories + pages | ✅ | ⚠️ | **Pages + editor done; category management UI missing** |
| 4 | Page save hardening (3 layers) | ✅ | ✅ | **Done** |
| 5 | Characters + inventory | ✅ | ⚠️ | **Schema done; no sheet/inventory editor UI yet** |
| 6 | Combat log (realtime) | ✅ | ✅ | **Done** |
| 7 | File uploads | ✅ | ❌ | **Server action done; no upload UI in app routes** |
| 8 | Personal library | ✅ | ⚠️ | **Schema + transfer actions done; library UI minimal (list only)** |
| 9 | TV / read-only display | ✅ | ✅ | **Done** (webOS middleware, `/tv` routes, server-rendered notes) |

---

## What's fully implemented

### Auth & Campaigns
- Supabase Auth (Google + email)
- `createCampaign` server action: creates campaign row + auto-assigns creator as DM (atomic)
- `/campaigns` page: server-rendered list of user's campaigns (RLS-filtered)
- `/campaigns/[campaignId]` page: campaign detail with page list, character list, combat log

### Wiki
- `categories` + `pages` schema with full RLS
- Tiptap rich-text editor (`PageEditor.tsx`) at `/campaigns/[campaignId]/pages/[pageId]`
- Page content stored as structured JSON (`content_json`); derived `content_text` computed server-side

### Page Save Hardening (`app/actions/pages.ts`)
- `savePage`: wipe guard (blocks save if content drops >90%; asks confirmation) + rolling snapshots
- `deletePage`: soft delete via `deleted_at` (row preserved)
- `restorePreviousContent`: one-step undo from `previous_content_json`
- `page_recovery_snapshots`: capped to 10 newest per page

### Realtime Combat Log
- `CombatLog.tsx`: loads existing entries + subscribes to `INSERT` events via Supabase Realtime
- `addLogEntry` client function for inserting new entries
- `kind` values: `attack`, `roll`, `note`, `system`

### Invite System (`app/actions/invites.ts`)
- `inviteMember`: DM-only permission check + token generation (7-day expiry)
- `acceptInvite`: validates token, creates membership, marks invite used
- Accept flow page at `/join/[token]` with `AcceptInvite.tsx` component

### Personal Library (`app/actions/library-transfer.ts`)
- Full envelope + typed-body schema: `library_items`, `library_folders`, `library_character_bodies`, `library_note_bodies`, `library_spell_bodies`, `library_image_bodies`
- RLS: owner-only access
- `copyItemToCampaign`: personal library → campaign (characters + notes wired; images/spells stubbed)
- `importPageToLibrary`: campaign page → personal library note

### TV / Read-Only Surface
- `middleware.ts`: auto-redirects webOS user-agents to `/tv`
- `/tv` route group: campaign list, campaign detail, server-rendered note view, realtime combat log
- Notes rendered via `generateHTML(json, extensions)` — editor never loads on TV
- `tv.css`: webOS-safe styles (flexbox, hex colors, strong focus styles for remote navigation)
- `browserslist` in `package.json`: `chrome >= 38` floor

### Database
- `supabase/migrations/0001_init.sql`: all tables
- `supabase/migrations/0002_rls.sql`: all RLS policies + `is_member()` helper

---

## What's partially done (UI missing)

### Invite button in campaign UI
- Server actions exist (`inviteMember`, `acceptInvite`)
- No invite trigger/button in `/campaigns/[campaignId]` yet
- Invite acceptance page exists at `/join/[token]`

### Category management
- `categories` table + RLS fully modeled
- No UI to create, rename, or organize categories in the wiki sidebar

### Character sheet editor
- `characters` table with flexible `sheet` (jsonb) fully modeled
- Characters appear in campaign detail as a list
- No UI to edit the sheet fields or add/remove characters

### Inventory
- `inventory_items` table fully modeled
- No UI to add, edit, or remove items

### File upload UI
- `getPrivateFileUrl` server action exists (signed URL for private files)
- Client upload pattern documented in `rpg-manager-reference.md`
- No upload button or file browser in any app route

### Personal library UI
- `/library` page shows envelope list
- No UI to create library items, edit them, manage folders/tags, or trigger transfers

---

## What's not built (deliberate non-goals)

- **Collaborative same-field editing** (no Y.js/Liveblocks/CRDT) — combat log is append-only; pages are single-editor. Path stays open: Tiptap is built on ProseMirror/Y.js lineage; adding collaboration later means binding a Y.js document to the existing editor without schema changes.
- **Separate WebSocket server** — Supabase Realtime handles broadcast; no debounce-to-DB bridge needed.
- **tRPC + Prisma** — Next.js server actions cover all logic-heavy mutations with less ceremony.

---

## Next recommended steps

1. **Wire invite UI** — add invite button + token copy to `/campaigns/[campaignId]`; the server action is ready
2. **Category sidebar** — create/rename/reorder categories; page-to-category assignment
3. **Character sheet editor** — form over the `sheet` jsonb blob; add/remove characters
4. **Inventory editor** — simple add/remove/quantity UI per character
5. **File upload UI** — drag-drop or picker that calls the existing client upload pattern
6. **Library item creation UI** — forms per kind; folder/tag management; transfer buttons on pages/characters

---

## Environment checklist (before first run)

- [ ] `.env.local` filled in (Supabase URL, anon key, service role key, `APP_URL`)
- [ ] `0001_init.sql` run in Supabase SQL editor
- [ ] `0002_rls.sql` run in Supabase SQL editor
- [ ] Storage buckets created: `public-assets` (public) and `private-files` (private)
- [ ] Realtime enabled for `combat_log_entries` table (Database → Replication in dashboard)
