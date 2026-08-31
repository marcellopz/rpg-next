# RPG Campaign Manager — Project Status

> Last updated: 2026-07-18

The app has the **authentication flow, campaign CRUD, in-app campaign invites, wiki notes backend, inventory with realtime sync, and full internationalization support** (English + Portuguese). All user-facing text is translatable with a client-side i18n context + server-side utilities. Remaining feature routes are still placeholders. Other feature logic (combat log) will be rebuilt on top of this foundation. **Deferred features:** personal library and TV display surface. The database schema (`supabase/migrations/`) and the design spec (`rpg-manager-reference.md`) are kept for reference.

---

## What's implemented

### Authentication
- **Login page** (`app/login/page.tsx`): Google OAuth + email/password (sign in and create account modes); “Forgot password?” link to `/auth/forgot-password`
- **Forgot / update password** (`app/auth/forgot-password`, `app/auth/update-password`): Supabase `resetPasswordForEmail` → recovery email → `/auth/callback?next=/auth/update-password` → `updateUser({ password })`
- **Auth callback** (`app/auth/callback/route.ts`): exchanges the OAuth `code` for a session and verifies the email-confirmation OTP (`token_hash` + `type`)
- **Session middleware** (`lib/supabase/middleware.ts` + `middleware.ts`):
  - Refreshes the Supabase session cookie on every request
  - Redirects unauthenticated users to `/login` (public paths: `/`, `/login`, `/auth`, `/join`, `/campaigns`)
  - Redirects signed-in users away from `/login`
  - Still routes legacy webOS TV user-agents to `/tv`
- **Navbar auth state** (`components/Navbar.tsx`): left-aligned links; right-aligned "Sign in" button when logged out, or profile (avatar/name/email) + pending invite badge + "Sign out" when logged in. On mobile the nav links collapse behind a hamburger toggle (lucide `Menu`/`X` icons); the drawer auto-closes on route change.
- **Sign-out** (`components/SignOutButton.tsx`)

### Campaigns (CRUD)
- **Server actions** (`app/actions/campaigns.ts`): `createCampaign`, `updateCampaign`, `deleteCampaign`. Writes use the service-role admin client after verifying the caller is signed in and (for edit/delete) is the campaign owner or DM. Create also adds the creator's `dm` membership and rolls back the campaign if that fails.
- **List** (`app/campaigns/page.tsx`): signed-in users see their real campaigns (with member counts + role) and a "New campaign" modal (`components/campaigns/NewCampaignButton.tsx`); logged-out visitors see the demo card + a sign-in CTA. The single demo campaign ("Shadows of Eldermoor", `data/demo-campaign/`) is also shown to signed-in users with a "Demo" chip, and is fully explorable — clicking it opens a real, read-only `CampaignWorkspace` at the reserved `/campaigns/demo` route, served entirely from static data (no DB row) via a special case in `app/campaigns/[campaignCode]/page.tsx`. A `readOnly` flag threads down through every tool to hide/disable all write affordances.
- **Workspace** (`app/campaigns/[campaignCode]/page.tsx` → `components/campaigns/CampaignWorkspace.tsx`): campaign hero header (role chip, actions, tools strip) + the notes sidebar and editor pane wired to real wiki data (see "Wiki notes" below). Campaigns are addressed by a short `public_code` in the URL, not the UUID.
- **Settings** (`app/campaigns/[campaignCode]/settings/page.tsx`): owner/DM-only route with `components/campaigns/CampaignSettings.tsx` (edit name/description, manage members/invites, delete with confirm).
- **Card** (`components/campaigns/CampaignCard.tsx`): member avatars with display-name tooltips, Demo/DM chips.

### Campaign invites
- **Data model** (`supabase/migrations/0007_campaign_invites.sql`): `campaign_invites` addressed to `invitee_email`, with `accepted_at`, `revoked_at`, `accepted_by`, and a unique pending invite per campaign/email. No outbound email is sent.
- **Read queries** (`lib/queries/invites.ts`): pending invites for `/account`, pending invite count for the navbar badge, and campaign member/invite status for settings.
- **Server actions** (`app/actions/invites.ts`): `createCampaignInvite`, `revokeCampaignInvite`, `acceptCampaignInvite`, `declineCampaignInvite`. Invites are player-only for now; create/revoke are campaign-admin actions, accept/decline require the signed-in user's email to match the invite email.
- **Account UI** (`components/account/AccountInvites.tsx`): pending campaign invites appear on `/account` with Accept/Decline actions.
- **Settings UI** (`components/campaigns/CampaignMembersSettings.tsx`): admins can invite by email, see current members, see invite status (`pending`, `accepted`, `revoked`), and revoke pending invites.

### Inventory tool (`?tool=inventory`)
- **Data model** (`supabase/migrations/0008_inventory.sql`): `characters` (STR + platinum/gold/silver/copper + sort order), `inventory_items` (name, type normal/magic/consumable, per-unit weight, quantity, sort order), and `inventory_log_entries` (append-only change history with actor, typed change, human description, item snapshot).
- **Read queries** (`lib/queries/inventory.ts`): `getInventoryForCampaign` (characters with items), `getInventoryLog` (newest first).
- **Server actions** (`app/actions/inventory.ts`): character create/rename/delete/stat updates, item add/edit/delete, cross-character `transferItem` (single `transfer` log entry), and unlogged reorders. Every other mutation writes a log entry.
- **UI** (`components/inventory/`): party sidebar with drag reorder + add/rename/delete, character panel with click-to-edit stats and encumbrance bands (STR×5/10/15/30, coins at 0.02 lb), items table with inline edits, drag reorder, "Send to" transfers, and a "View log" history modal. Selected character via `?character={id}`.
- **Realtime** (`0009_inventory_realtime.sql` + `useInventoryRealtime`): the three inventory tables are in the `supabase_realtime` publication; open clients subscribe (RLS-filtered per member) and live-refresh when anyone edits.

### Wiki notes (categories + pages, persisted)
- **Data model** (`supabase/migrations/0005_wiki.sql`): `categories`, `pages`, `page_recovery_snapshots`. `categories.owner_id` null = shared "Campaign notes" tree; set = that user's private "My notes" tree. `pages.visibility` (`public`/`private`), nullable `category_id` (root-level pages), soft delete via `deleted_at`. RLS allows member reads only; all writes go through server actions.
- **Read queries** (`lib/queries/notes.ts`): `getNoteTreesForCampaign` (both sidebar trees, no content) + `getPageForCurrentUser` (single page with `content_json` for the editor).
- **Server actions**:
  - `app/actions/categories.ts`: `createCategory` / `renameCategory` / `deleteCategory` (deleting a category drops its pages back to the root — FK `on delete set null`)
  - `app/actions/pages.ts`: `createPage` / `renamePage` / `movePage` / `deletePage` (soft) / `restorePreviousContent`, and the hardened `savePage`:
    - Layer 1: `previous_content_json` last-known-good copy on every save
    - Layer 2: server-side wipe guard — old text > 200 chars and new < 10% returns `needs_confirmation`; the client confirms and retries with `confirmWipe: true`
    - Layer 3: rolling snapshots in `page_recovery_snapshots`, pruned to the newest 10 per page
    - `content_text` is always derived server-side via `generateText` + shared `editorExtensions`
  - Authorization: shared campaign notes/categories are collaborative (any campaign member can create/edit/delete); private "My notes" pages/categories remain owner-only.
- **Notes navigator** (`components/notes-navigator/`): `NotesSidebar.tsx` (Campaign notes / My notes tabs, collapsible category groups with folder/file icons, root pages, active highlight, native HTML5 drag-and-drop ordering), `NewItemForm.tsx` (inline create forms). Item action dropdowns (add page / rename / move / delete) use the shared `Menu` ui component. Selection is URL-driven: `?tab=my` + `?page=<id>` — server-rendered and linkable.
- **Ordering** (`reorderCategories` / `reorderPages` actions): drag a category onto another to reorder; drag a page between rows, onto a category header (drops in at the end), or onto the "Move to top level" zone. `reorderPages` writes both `category_id` and `sort_order`, so a cross-category drop is one call. Structural moves on shared pages are allowed for any member; private pages stay owner-only.
- **Editor save flow** (`components/notes-editor/PageEditorPanel.tsx`): tracks document JSON + dirty state, Save button enabled when dirty ("Saving…" while pending), wipe-guard confirm branch. Pages the viewer can't edit render read-only (History still available). History opens `PageHistoryPanel` — lists up to 10 `page_recovery_snapshots` (who/when/preview) and restores via `restorePageSnapshot` when the viewer can edit.

### Text editor
- **Shared extensions** (`lib/editor/extensions.ts`): `editorExtensions` (StarterKit, headings 1–3) — the single schema source reused by the editor, `generateText` (search/wipe-guard), and `generateHTML` (TV notes). Editor-only plugins (e.g. Placeholder) stay out of this list.
- **Editor component** (`components/notes-editor/PageEditor.tsx`): Tiptap 2 with a formatting toolbar (undo/redo, H1–H3, bold/italic/strike/inline code, bullet/numbered lists, blockquote, horizontal rule), active-state highlighting, `editable` prop for read-only rendering, and an `onChange` callback emitting the document JSON. `immediatelyRender: false` for SSR safety.
- **Document styles** (`components/notes-editor/editor.css`): scoped typography under `.page-editor-content` + empty-doc placeholder styling.

### Internationalization (i18n)
- **Client-side context** (`lib/i18n/context.tsx`): React Context provider with `useI18n()` hook available in all client components
  - Tracks current locale (`en` | `pt`) in state, persists to localStorage
  - `setLocale(locale)` to switch languages dynamically; triggers immediate UI re-render
  - Detects browser language on first visit; falls back to English
  - `t(key, params?)` function supports variable interpolation and ICU plural syntax
- **Server-side utility** (`lib/i18n/server.ts`): `getServerTranslations(locale)` for server actions to return localized error/validation messages
- **Translation files** (`messages/en.json`, `messages/pt.json`): 400+ hierarchically-organized keys covering:
  - Pages and layouts (home, campaigns, account)
  - Campaign workspace (settings, members, invites)
  - Wiki notes (campaign notes, my notes, editor, history)
  - Inventory (party, characters, items, encumbrance)
  - Combat, resources, handouts
  - Buttons, validation, errors, common UI text
- **Language switcher** (`components/LanguageSwitcher.tsx`): globe icon in navbar with English/Português dropdown
- **Component updates** (30+ files): all pages, modals, forms, buttons, labels, placeholders, error messages use `t()` for translation
- **Pattern**: client components import `useI18n` and call `const { t } = useI18n()`; add `"use client"` directive for client-only components that need i18n

### UI component library (`components/ui/`)
- Shared primitives: `Button` (+ `buttonVariants` for links), `IconButton`, `Menu`, `TextField`/`TextArea`, `Typography`, `Chip`, `Tooltip` — all exported from `components/ui/index.ts`
- **Convention: never hand-style raw HTML for buttons, form fields, text, badges, or menus — use these primitives.** Missing primitives get added to `components/ui/`, not styled inline. (See CLAUDE.md for the full table.)

### Element IDs
- **Systematic ID convention**: kebab-case with scope prefixes (`site-*`, `campaign-*`, `{page}-*`)
- **Global landmarks**: navbar, main content, footer have consistent IDs
- **Campaign workspace**: comprehensive ID structure for the OneNote-style interface
- **Form consistency**: standardized field and wrapper IDs across all forms
- **Modal pattern**: established naming for dialog overlays and error states

### Supabase clients (`lib/supabase/`)
- `client.ts` — browser client (anon key, RLS)
- `server.ts` — `createServerClient()` (user-scoped) + `createAdminClient()` (service role)
- `middleware.ts` — session-refresh helper for Next.js middleware

### Database (`supabase/migrations/`)

> **Schema changes require explicit approval before any migration file is created or modified.** Present the proposed SQL, the target file, and any data impact to the user first.

- `0001_init.sql` — `campaigns` + `memberships` tables (with `description` column)
- `0002_rls.sql` — `is_member()` helper + RLS policies for campaigns and memberships
- `0003_grants.sql` — table grants for `service_role` (writes) and `authenticated` (reads)
- `0004_campaign_public_code.sql` — short `public_code` used in campaign URLs
- `0005_wiki.sql` — `categories`, `pages`, `page_recovery_snapshots` + read-only RLS + grants
- `0006_page_sort_order.sql` — `pages.sort_order` for manual drag ordering (backfilled from `created_at`)
- `0007_campaign_invites.sql` — in-app campaign invites by email + invitee read RLS + grants
- `0008_inventory.sql` — `characters`, `inventory_items`, `inventory_log_entries` + member read RLS + grants
- `0009_inventory_realtime.sql` — inventory tables added to the `supabase_realtime` publication for live updates
- All other tables (combat log, files, library) are deferred; each will get its own numbered migration when the feature is built
- `rpg-manager-reference.md` (full design spec and code patterns) kept for reference

---

## Placeholder routes (no logic yet)

These render a simple "Coming soon" and exist only to preserve the route structure:

- `app/campaigns/[campaignCode]/pages/[pageId]/page.tsx` — wiki page editor
- `app/join/[token]/page.tsx` — invite acceptance

---

## Removed (to be rebuilt)

- **Server actions** (`app/actions/`): `files.ts`, `library-transfer.ts` (`campaigns.ts`, `categories.ts`, `pages.ts`, and `invites.ts` are rebuilt)
- **Components**: `CombatLog.tsx`, `TvCombatLog.tsx`
- **Feature components**: `AcceptInvite.tsx` (`NewCampaignButton.tsx`, `PageEditor.tsx`, and `lib/editor/extensions.ts` are rebuilt)

---

## Next recommended steps

1. ~~**Campaigns + memberships**~~ — done (`createCampaign`/`updateCampaign`/`deleteCampaign` + list/detail UI).
2. ~~**Wiki backend**~~ — done (`0005_wiki.sql`, category/page CRUD, hardened `savePage`, sidebar + editor wiring, History snapshot browse/restore).
3. ~~**Campaign invites**~~ — done (in-app email-addressed invites, `/account` accept/decline, navbar badge, settings member/invite status).
4. ~~**Characters + inventory**~~ — done (`0008_inventory.sql`, party characters with stats/coins, item CRUD with inline edits, transfers, change log, realtime sync).
5. ~~**Internationalization**~~ — done (client i18n context + server utility, 400+ translation keys, English + Portuguese, language switcher, all UI translated).
6. **Combat log (realtime)** — rebuild `CombatLog`
7. **File uploads**

---

## Planned migrations (one per feature, added when built)

| File | Feature |
|---|---|
| `0010_combat_log.sql` | Combat log entries + realtime publication |
| `0011_files.sql` | Files metadata |

---

## Environment checklist

- [ ] `.env.local` filled in (Supabase URL, anon key, service role key)
- [ ] `pnpm supabase login` + `pnpm supabase link --project-ref <ref>` to link the CLI
- [ ] `pnpm db:push` to apply all migrations (`0001`–`0008`)
- [ ] **Auth → Providers → Google** enabled (Client ID + secret) with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] **Auth → URL Configuration**: add `http://localhost:3000/auth/callback` (and production `https://<host>/auth/callback`) to the redirect allowlist — required for Google OAuth and password-recovery emails
- [ ] **Auth → Providers → Email**: confirm whether email confirmation is required (affects the sign-up flow)
