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
app/actions/          # Server actions (writes): campaigns.ts, categories.ts, pages.ts
app/campaigns/        # Campaign list + [campaignCode] workspace (?tab= & ?page= select the note)
app/join/[token]/     # Invite acceptance flow
app/library/          # Personal library (cross-campaign, user-owned)
app/tv/               # Read-only TV display surface (webOS-safe)
components/campaigns/ # CampaignCard, CampaignWorkspace, settings, new-campaign modal
components/ui/        # Shared primitives: Button, IconButton, Menu, TextField, Typography, Chip, Tooltip
components/notes-navigator/ # NotesSidebar, NotesTabs, NoteCategoryGroup, NotePageRow, drag/drop hook
components/notes-editor/    # PageEditorPanel, PageEditor (Tiptap), EditorToolbar, editor.css
lib/queries/          # Read-side data access: campaigns.ts, notes.ts (user-scoped client, RLS filters)
lib/supabase/         # client.ts (browser, anon key) | server.ts (server, service-role key)
lib/editor/extensions.ts  # SHARED Tiptap extensions — used by editor, generateText, generateHTML
supabase/migrations/  # 0001 init | 0002 RLS + is_member | 0003 grants | 0004 public_code | 0005 wiki
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

## UI components — never style raw HTML for common elements

Always build interfaces from the primitives in `components/ui/` instead of hand-styling basic HTML:

| Instead of | Use |
|---|---|
| `<button>` | `Button` (variants: primary, secondary, danger, dangerOutline, ghost, white; sizes xs/sm/md/lg) or `IconButton` for icon-only |
| `<input>` / `<textarea>` | `TextField` / `TextArea` (built-in label, hint, and error display) |
| Headings / body / muted text | `Typography` (variants h1–h3, subtitle, body, muted, small) |
| Styled links that look like buttons | `buttonVariants()` on a `<Link>` |
| Badges | `Chip` |
| Hover hints | `Tooltip` |
| Dropdown action menus | `Menu` (icon trigger + entries with optional `danger`) |

If a needed primitive doesn't exist yet, **add it to `components/ui/`** (and export it from `index.ts`) rather than styling raw elements inline. Truly bespoke one-off controls (e.g. the editor's `ToolbarButton`, tree rows) may stay raw — but they should be the exception.

## Component file organization

A component file should export **one main component**. For secondary components (helpers rendered by the main one):

- **One small secondary component** (a few lines, only used here) → may stay in the same file
- **More than one secondary component, or a secondary component that isn't small** → move each to its own file
- **More than 3 related component files** → group them in a folder named after the feature (e.g. `components/campaigns/`, `components/notes-editor/`)

Example: `components/notes-editor/` — `PageEditor.tsx` (main), `EditorToolbar.tsx` and `ToolbarButton.tsx` (extracted secondaries), `editor.css` (scoped styles, imported by the component that needs it).

---

## Element ID Conventions

**Systematic HTML IDs for referencing and testing**

Use kebab-case with scope prefixes: `{scope}-{section}[-{element}]`

| Scope | Examples | Purpose |
|-------|----------|---------|
| `site-*` | `site-header`, `site-main`, `site-footer` | Global landmarks |
| `{page}-*` | `campaigns-list`, `library-grid` | Page sections |
| `campaign-*` | `campaign-workspace`, `campaign-editor` | Campaign workspace |
| `{feature}-modal` | `new-campaign-modal` | Dialog overlays |

**Guidelines:**
- IDs on semantic landmarks and interactive regions, not every styled div
- Keep form field IDs for label association (`htmlFor`)
- Use stable data IDs for list items (`campaign-card-{publicCode}`)
- Reserve `tv-*` namespace for webOS display surface

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
