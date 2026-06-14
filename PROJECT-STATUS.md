# RPG Campaign Manager — Project Status

> Last updated: 2026-06-13

The app has been **stripped down to the authentication flow plus placeholder routes**. All feature logic (server actions, combat log, wiki editor, personal library, TV rendering) was intentionally removed and will be rebuilt later on top of the auth foundation. The database schema (`supabase/migrations/`) and the design spec (`rpg-manager-reference.md`) are kept for reference.

---

## What's implemented

### Authentication (the only working feature)
- **Login page** (`app/login/page.tsx`): Google OAuth + email/password (sign in and create account modes)
- **Auth callback** (`app/auth/callback/route.ts`): exchanges the OAuth `code` for a session and verifies the email-confirmation OTP (`token_hash` + `type`)
- **Session middleware** (`lib/supabase/middleware.ts` + `middleware.ts`):
  - Refreshes the Supabase session cookie on every request
  - Redirects unauthenticated users to `/login` (public paths: `/`, `/login`, `/auth`, `/tv`, `/join`)
  - Redirects signed-in users away from `/login`
  - Still routes legacy webOS TV user-agents to `/tv`
- **Navbar auth state** (`app/layout.tsx`): left-aligned links; right-aligned "Sign in" button when logged out, or profile (avatar/name/email) + "Sign out" when logged in
- **Sign-out** (`components/SignOutButton.tsx`)

### Supabase clients (`lib/supabase/`)
- `client.ts` — browser client (anon key, RLS)
- `server.ts` — `createServerClient()` (user-scoped) + `createAdminClient()` (service role)
- `middleware.ts` — session-refresh helper for Next.js middleware

### Kept for later (not wired into the app)
- `supabase/migrations/0001_init.sql` (schema) and `0002_rls.sql` (RLS + `is_member()` helper)
- `rpg-manager-reference.md` (full design spec and code patterns)

---

## Placeholder routes (no logic yet)

These render a simple "Coming soon" and exist only to preserve the route structure:

- `app/campaigns/page.tsx` — campaign list
- `app/campaigns/[campaignId]/page.tsx` — campaign detail
- `app/campaigns/[campaignId]/pages/[pageId]/page.tsx` — wiki page editor
- `app/join/[token]/page.tsx` — invite acceptance
- `app/library/page.tsx` — personal library
- `app/tv/page.tsx`, `app/tv/[campaignId]/page.tsx`, `app/tv/[campaignId]/combat/page.tsx`, `app/tv/notes/[pageId]/page.tsx` — read-only TV surface (`app/tv/layout.tsx` + `tv.css` retained)

---

## Removed (to be rebuilt)

- **Server actions** (`app/actions/`): `campaigns.ts`, `invites.ts`, `pages.ts`, `files.ts`, `library-transfer.ts`
- **Components**: `CombatLog.tsx`, `TvCombatLog.tsx`
- **Feature components**: `NewCampaignButton.tsx`, `PageEditor.tsx`, `AcceptInvite.tsx`
- **Editor extensions**: `lib/editor/extensions.ts`

> Note: Tiptap dependencies remain in `package.json` but are currently unused; they'll be needed again when the wiki editor and TV note rendering are rebuilt.

---

## Next recommended steps

1. **Campaigns + memberships** — rebuild `createCampaign` server action + the campaign list/detail UI
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
- [ ] `0001_init.sql` and `0002_rls.sql` run in the Supabase SQL editor
- [ ] **Auth → Providers → Google** enabled (Client ID + secret) with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] **Auth → URL Configuration**: add `http://localhost:3000/auth/callback` to the redirect allowlist
- [ ] **Auth → Providers → Email**: confirm whether email confirmation is required (affects the sign-up flow)
