# RPG Campaign Manager — Project Status

> Last updated: 2026-07-03

The app has the **authentication flow, campaign CRUD, and a working (client-only) rich-text editor** in the campaign workspace. Remaining feature routes are still placeholders. Other feature logic (combat log, personal library, TV rendering, editor persistence) will be rebuilt on top of this foundation. The database schema (`supabase/migrations/`) and the design spec (`rpg-manager-reference.md`) are kept for reference.

---

## What's implemented

### Authentication (the only working feature)
- **Login page** (`app/login/page.tsx`): Google OAuth + email/password (sign in and create account modes)
- **Auth callback** (`app/auth/callback/route.ts`): exchanges the OAuth `code` for a session and verifies the email-confirmation OTP (`token_hash` + `type`)
- **Session middleware** (`lib/supabase/middleware.ts` + `middleware.ts`):
  - Refreshes the Supabase session cookie on every request
  - Redirects unauthenticated users to `/login` (public paths: `/`, `/login`, `/auth`, `/tv`, `/join`, `/campaigns`, `/library`)
  - Redirects signed-in users away from `/login`
  - Still routes legacy webOS TV user-agents to `/tv`
- **Navbar auth state** (`components/Navbar.tsx`): left-aligned links; right-aligned "Sign in" button when logged out, or profile (avatar/name/email) + "Sign out" when logged in. On mobile the nav links collapse behind a hamburger toggle (lucide `Menu`/`X` icons); the drawer auto-closes on route change.
- **Sign-out** (`components/SignOutButton.tsx`)

### Campaigns (CRUD)
- **Server actions** (`app/actions/campaigns.ts`): `createCampaign`, `updateCampaign`, `deleteCampaign`. Writes use the service-role admin client after verifying the caller is signed in and (for edit/delete) is the campaign owner or DM. Create also adds the creator's `dm` membership and rolls back the campaign if that fails.
- **List** (`app/campaigns/page.tsx`): signed-in users see their real campaigns (with member counts + role) and a "New campaign" modal (`components/campaigns/NewCampaignButton.tsx`); logged-out visitors see demo cards + a sign-in CTA. Demo campaigns (`data/demo-campaigns/`) are also shown to signed-in users with a "Demo" chip.
- **Workspace** (`app/campaigns/[campaignCode]/page.tsx` → `components/campaigns/CampaignWorkspace.tsx`): campaign hero header (role chip, actions, tools strip) + notes navigator sidebar + the live editor pane. Campaigns are addressed by a short `public_code` in the URL, not the UUID.
- **Settings** (`app/campaigns/[campaignCode]/settings/page.tsx`): owner/DM-only route with `components/campaigns/CampaignSettings.tsx` (edit name/description + delete with confirm).
- **Card** (`components/campaigns/CampaignCard.tsx`): member avatars with display-name tooltips, Demo/DM chips.

### Text editor (client-only, no persistence yet)
- **Shared extensions** (`lib/editor/extensions.ts`): `editorExtensions` (StarterKit, headings 1–3) — the single schema source that `generateText` (search/wipe-guard) and `generateHTML` (TV notes) must reuse when the backend lands. Editor-only plugins (e.g. Placeholder) stay out of this list.
- **Editor component** (`components/editor/PageEditor.tsx`): Tiptap 2 with a formatting toolbar (undo/redo, H1–H3, bold/italic/strike/inline code, bullet/numbered lists, blockquote, horizontal rule), active-state highlighting, and an `onChange` callback that emits the document JSON for future saves. `immediatelyRender: false` for SSR safety.
- **Document styles** (`app/globals.css`): scoped typography under `.page-editor-content` + empty-doc placeholder styling.
- **Integration**: mounted in the campaign workspace editor pane, seeded with a demo document. Save/History buttons are disabled placeholders — **nothing is persisted**; that arrives with the wiki backend (`0004_wiki.sql` + `savePage` hardening).

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
- All other tables (invites, wiki, characters, combat log, files, library) are deferred; each will get its own numbered migration when the feature is built
- `rpg-manager-reference.md` (full design spec and code patterns) kept for reference

---

## Placeholder routes (no logic yet)

These render a simple "Coming soon" and exist only to preserve the route structure:

- `app/campaigns/[campaignCode]/pages/[pageId]/page.tsx` — wiki page editor
- `app/join/[token]/page.tsx` — invite acceptance
- `app/library/page.tsx` — personal library
- `app/tv/page.tsx`, `app/tv/[campaignId]/page.tsx`, `app/tv/[campaignId]/combat/page.tsx`, `app/tv/notes/[pageId]/page.tsx` — read-only TV surface (`app/tv/layout.tsx` + `tv.css` retained)

---

## Removed (to be rebuilt)

- **Server actions** (`app/actions/`): `invites.ts`, `pages.ts`, `files.ts`, `library-transfer.ts` (`campaigns.ts` is rebuilt)
- **Components**: `CombatLog.tsx`, `TvCombatLog.tsx`
- **Feature components**: `AcceptInvite.tsx` (`NewCampaignButton.tsx`, `PageEditor.tsx`, and `lib/editor/extensions.ts` are rebuilt)

---

## Next recommended steps

1. ~~**Campaigns + memberships**~~ — done (`createCampaign`/`updateCampaign`/`deleteCampaign` + list/detail UI). Next: member management within a campaign.
2. **Invites** — rebuild `inviteMember` / `acceptInvite` + the `/join/[token]` flow
3. **Wiki backend** — editor UI is done; next is `0004_wiki.sql` (categories, pages, snapshots), `savePage` hardening, and wiring the sidebar navigator to real data
4. **Characters + inventory**
5. **Combat log (realtime)** — rebuild `CombatLog` / `TvCombatLog`
6. **File uploads**
7. **Personal library**
8. **TV / read-only display** — rebuild server-rendered notes + TV combat log

---

## Planned migrations (one per feature, added when built)

| File | Feature |
|---|---|
| `0003_invites.sql` | Invites table (join flow) |
| `0004_wiki.sql` | Categories, pages, page_recovery_snapshots |
| `0005_characters.sql` | Characters, inventory_items |
| `0006_combat_log.sql` | Combat log entries + realtime publication |
| `0007_files.sql` | Files metadata |
| `0008_library.sql` | Personal library tables |

---

## Environment checklist

- [ ] `.env.local` filled in (Supabase URL, anon key, service role key, `APP_URL`)
- [ ] `pnpm supabase login` + `pnpm supabase link --project-ref <ref>` to link the CLI
- [ ] `pnpm db:push` to apply `0001_init.sql` and `0002_rls.sql`
- [ ] **Auth → Providers → Google** enabled (Client ID + secret) with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] **Auth → URL Configuration**: add `http://localhost:3000/auth/callback` to the redirect allowlist
- [ ] **Auth → Providers → Email**: confirm whether email confirmation is required (affects the sign-up flow)
