# RPG Campaign Manager — Project Status

> Last updated: 2026-06-21

The app has the **authentication flow plus campaign CRUD**, with the remaining feature routes still as placeholders. Other feature logic (combat log, wiki editor, personal library, TV rendering) will be rebuilt on top of this foundation. The database schema (`supabase/migrations/`) and the design spec (`rpg-manager-reference.md`) are kept for reference.

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
- **Navbar auth state** (`app/layout.tsx`): left-aligned links; right-aligned "Sign in" button when logged out, or profile (avatar/name/email) + "Sign out" when logged in
- **Sign-out** (`components/SignOutButton.tsx`)

### Campaigns (CRUD)
- **Server actions** (`app/actions/campaigns.ts`): `createCampaign`, `updateCampaign`, `deleteCampaign`. Writes use the service-role admin client after verifying the caller is signed in and (for edit/delete) is the campaign owner or DM. Create also adds the creator's `dm` membership and rolls back the campaign if that fails.
- **List** (`app/campaigns/page.tsx`): signed-in users see their real campaigns (with member counts + role) and a "New campaign" modal (`components/NewCampaignButton.tsx`); logged-out visitors see demo cards + a sign-in CTA.
- **Detail** (`app/campaigns/[campaignId]/page.tsx`): name/description header + role badge; owner/DM also gets `components/CampaignSettings.tsx` (edit name/description + delete with confirm).
- **Card** (`components/CampaignCard.tsx`): real shape `{ id, name, description, memberCount?, role? }`.

### Supabase clients (`lib/supabase/`)
- `client.ts` — browser client (anon key, RLS)
- `server.ts` — `createServerClient()` (user-scoped) + `createAdminClient()` (service role)
- `middleware.ts` — session-refresh helper for Next.js middleware

### Database (`supabase/migrations/`)
- `0001_init.sql` (schema) and `0002_rls.sql` (RLS + `is_member()` helper)
- `0003_campaign_description.sql` — adds a `description` column to `campaigns` (run this in the Supabase SQL editor)
- `rpg-manager-reference.md` (full design spec and code patterns) kept for reference

---

## Placeholder routes (no logic yet)

These render a simple "Coming soon" and exist only to preserve the route structure:

- `app/campaigns/[campaignId]/pages/[pageId]/page.tsx` — wiki page editor
- `app/join/[token]/page.tsx` — invite acceptance
- `app/library/page.tsx` — personal library
- `app/tv/page.tsx`, `app/tv/[campaignId]/page.tsx`, `app/tv/[campaignId]/combat/page.tsx`, `app/tv/notes/[pageId]/page.tsx` — read-only TV surface (`app/tv/layout.tsx` + `tv.css` retained)

---

## Removed (to be rebuilt)

- **Server actions** (`app/actions/`): `invites.ts`, `pages.ts`, `files.ts`, `library-transfer.ts` (`campaigns.ts` is rebuilt)
- **Components**: `CombatLog.tsx`, `TvCombatLog.tsx`
- **Feature components**: `PageEditor.tsx`, `AcceptInvite.tsx` (`NewCampaignButton.tsx` is rebuilt)
- **Editor extensions**: `lib/editor/extensions.ts`

> Note: Tiptap dependencies remain in `package.json` but are currently unused; they'll be needed again when the wiki editor and TV note rendering are rebuilt.

---

## Next recommended steps

1. ~~**Campaigns + memberships**~~ — done (`createCampaign`/`updateCampaign`/`deleteCampaign` + list/detail UI). Next: member management within a campaign.
2. **Invites** — rebuild `inviteMember` / `acceptInvite` + the `/join/[token]` flow
3. **Wiki** — rebuild the Tiptap editor (`PageEditor`), `savePage` hardening, and shared `lib/editor/extensions.ts`
4. **Characters + inventory**
5. **Combat log (realtime)** — rebuild `CombatLog` / `TvCombatLog`
6. **File uploads**
7. **Personal library**
8. **TV / read-only display** — rebuild server-rendered notes + TV combat log

---

## Environment checklist

- [ ] `.env.local` filled in (Supabase URL, anon key, service role key, `APP_URL`)
- [ ] `0001_init.sql`, `0002_rls.sql`, and `0003_campaign_description.sql` run in the Supabase SQL editor
- [ ] **Auth → Providers → Google** enabled (Client ID + secret) with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] **Auth → URL Configuration**: add `http://localhost:3000/auth/callback` to the redirect allowlist
- [ ] **Auth → Providers → Email**: confirm whether email confirmation is required (affects the sign-up flow)
