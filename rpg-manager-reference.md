# RPG Campaign Manager — Rebuild Reference

A single document to build against for a tabletop RPG campaign manager: a OneNote-style campaign wiki with categories and rich-text pages, character sheets, inventories, a live combat log, member invites, and file uploads. It covers the stack, the full data model, and the key code patterns for the features that touch the backend: **campaigns & invites**, **realtime combat log**, **wiki/sheet/inventory CRUD**, and **hardened page saving with content recovery**. (**Deferred:** personal library and read-only TV display surface.)

The design goal is to keep the backend approachable for a frontend developer: one vendor (Supabase) for the database, auth, realtime, and file storage, plus a thin layer of Next.js server-side logic only where a request involves real decisions about who's allowed to do what. Page content is edited with Tiptap and stored as structured JSON, and the save path is hardened so a user's extensive work can't be lost to a mistaken save, deletion, or app error.

---

## The stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js (App Router) + TypeScript** | Frontend + server actions in one place. |
| Styling | **Tailwind CSS v3** | Utility-first styling. Pinned to **v3** (not v4): v3 emits CSS that works on both modern browsers and the old webOS TV engine, so one version covers the whole app with no split to maintain. See the TV section. |
| Database | **Supabase Postgres** | Real SQL, but managed. |
| Auth | **Supabase Auth** (Google + email) | Same client as DB & storage. |
| Realtime | **Supabase Realtime** | Subscribe to a table from the client; rows stream in. Powers the combat log. |
| Files | **Supabase Storage** | Same auth/permissions model as the DB. |
| Editor | **Tiptap** (rich text) | WYSIWYG editing for wiki pages. Stores a structured document as JSON, not a raw Markdown string. Clean React lifecycle (create/destroy) avoids the memory growth common in older textarea/CodeMirror-based Markdown editors. |

**The one mental rule that organizes everything:**

- *"Just moving a row/file around?"* → call Supabase directly from the **client**.
- *"A decision about who's allowed, or multiple coordinated steps?"* → write a **Next.js server action** (runs on the server with a trusted key).

Campaign creation, invites, role changes, and DM-controlled uploads are the second bucket. Everything else is mostly the first.

---

## Data model

Tables below as SQL. You can paste these into the Supabase SQL editor. IDs use `uuid`; `auth.users` is Supabase's built-in auth table.

### Membership & campaigns

```sql
-- A campaign owns everything else.
create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

-- Who belongs to a campaign and in what role.
create table memberships (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  role          text not null default 'player', -- 'dm' | 'player'
  created_at    timestamptz not null default now(),
  unique (campaign_id, user_id)
);

-- Pending invites. Token-based so you can share a link or email it.
create table invites (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  email         text,                       -- optional: target a specific person
  token         text not null unique,       -- random string in the invite link
  role          text not null default 'player',
  invited_by    uuid not null references auth.users(id),
  expires_at    timestamptz not null,
  accepted_at   timestamptz,                -- null until used
  created_at    timestamptz not null default now()
);
```

### Wiki content (the OneNote-style structure)

```sql
-- Categories / subcategories. Self-referencing for nesting.
create table categories (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  parent_id     uuid references categories(id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0
);

-- A page = a rich-text document (Tiptap JSON) inside a category.
create table pages (
  id                    uuid primary key default gen_random_uuid(),
  campaign_id           uuid not null references campaigns(id) on delete cascade,
  category_id           uuid references categories(id) on delete set null,
  title                 text not null,
  content_json          jsonb,                 -- SOURCE OF TRUTH: Tiptap document
  content_text          text,                  -- DERIVED: plain text, for search + wipe-guard
  previous_content_json jsonb,                 -- last-known-good copy (recovery Layer 1)
  visibility            text not null default 'public', -- 'public' | 'private'
  owner_id              uuid not null references auth.users(id),
  deleted_at            timestamptz,           -- soft delete (recovery Layer 1)
  updated_at            timestamptz not null default now()
);

-- Full-text search over the derived text (optional but cheap)
create index pages_content_text_idx on pages using gin (to_tsvector('simple', coalesce(content_text, '')));
```

> **Why `jsonb` for page content:** Tiptap's document is a structured tree, not a string. Storing it as `jsonb` keeps the full editing fidelity (tables, task lists, mentions) and is the same document that a future collaborative-editing layer would sync. `content_text` is a *derived* plain-text copy the server recomputes on every save — it powers search and the wipe-guard, and is never the source of truth.

```sql
-- Capped rolling history for recovery (Layer 3). Newest ~10 per page.
create table page_recovery_snapshots (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references pages(id) on delete cascade,
  content_json  jsonb not null,            -- full snapshot of the page at save time
  content_text  text,                      -- derived text for that snapshot
  saved_by      uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index on page_recovery_snapshots (page_id, created_at desc);
```

### Character sheets & inventory

```sql
create table characters (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  owner_id      uuid not null references auth.users(id),
  name          text not null,
  sheet         jsonb not null default '{}', -- flexible stat block
  created_at    timestamptz not null default now()
);

create table inventory_items (
  id            uuid primary key default gen_random_uuid(),
  character_id  uuid not null references characters(id) on delete cascade,
  name          text not null,
  quantity      int not null default 1,
  notes         text
);
```

> **Why `jsonb` for the sheet:** stat blocks vary wildly by system and house rules. A JSON blob lets you evolve the sheet shape from the frontend without DB migrations. If one game system locks in, you can always promote fields to columns later.

### Combat log (the realtime table)

```sql
create table combat_log_entries (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  author_id     uuid not null references auth.users(id),
  message       text not null,
  kind          text not null default 'note', -- 'attack' | 'roll' | 'note' | 'system'
  created_at    timestamptz not null default now()
);
```

Append-only by design: nobody edits old entries, so there are no conflicts to resolve. This is what makes the live log the *easy* kind of realtime.

### Files

```sql
create table files (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references campaigns(id) on delete cascade,
  uploader_id   uuid not null references auth.users(id),
  bucket        text not null,              -- 'public-assets' | 'private-files'
  path          text not null,              -- object path within the bucket
  filename      text not null,
  content_type  text,
  size_bytes    bigint,
  visibility    text not null default 'public',
  created_at    timestamptz not null default now()
);
```

The bytes live in Supabase Storage; this table is the metadata + the link between a file and its campaign.

---

## Row-Level Security (the one new concept worth learning)

RLS is just *"who can read/write this row."* You enable it per table, then write policies. The pattern repeats: **a user can touch a row if they're a member of that campaign.** A helper keeps policies readable.

```sql
-- Helper: is the current user a member of this campaign?
create or replace function is_member(c_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from memberships
    where campaign_id = c_id and user_id = auth.uid()
  );
$$;

-- Turn RLS on (do this for every table).
alter table pages enable row level security;

-- Members can read public pages; owners can always read their private ones.
-- Soft-deleted pages are hidden from normal reads (recovery happens via server action).
create policy "read pages" on pages for select
  using (
    is_member(campaign_id)
    and deleted_at is null
    and (visibility = 'public' or owner_id = auth.uid())
  );

-- Members can insert pages they own.
create policy "insert pages" on pages for insert
  with check (is_member(campaign_id) and owner_id = auth.uid());

-- Owners can update/delete their own pages.
create policy "modify pages" on pages for update
  using (owner_id = auth.uid());
```

The same shape works for `characters`, `inventory_items`, `combat_log_entries`, and `files` — swap in the right ownership/visibility check. `memberships` and `invites` are the exception: those are managed by server actions with a trusted key, so you can keep their policies locked down (deny client writes entirely).

---

## Code pattern 1 — Server action: create a campaign

This is logic (create the campaign **and** make the creator the DM, atomically), so it's a server action, not a client call.

```typescript
// app/actions/campaigns.ts
'use server'

import { createServerClient } from '@/lib/supabase/server' // trusted server client

export async function createCampaign(name: string) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // 1. Create the campaign
  const { data: campaign, error: cErr } = await supabase
    .from('campaigns')
    .insert({ name, owner_id: user.id })
    .select()
    .single()
  if (cErr) throw cErr

  // 2. Make the creator the DM
  const { error: mErr } = await supabase
    .from('memberships')
    .insert({ campaign_id: campaign.id, user_id: user.id, role: 'dm' })
  if (mErr) throw mErr

  return campaign
}
```

Called from a component like any async function:

```typescript
'use client'
import { createCampaign } from '@/app/actions/campaigns'

function NewCampaignButton() {
  return (
    <button onClick={async () => {
      const c = await createCampaign('Curse of Strahd')
      // route to /campaigns/[c.id]
    }}>
      Create campaign
    </button>
  )
}
```

---

## Code pattern 2 — Server action: invite & accept

A common source of friction in client-only backends: inviting someone is multi-step authorization logic, not just writing a row. Here it's plain TypeScript: check permission, create a token, record it. Accepting checks validity, then creates the membership.

```typescript
// app/actions/invites.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function inviteMember(campaignId: string, email?: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Only the DM can invite
  const { data: me } = await supabase
    .from('memberships')
    .select('role')
    .eq('campaign_id', campaignId)
    .eq('user_id', user.id)
    .single()
  if (me?.role !== 'dm') throw new Error('Only the DM can invite')

  const token = randomBytes(24).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

  await supabase.from('invites').insert({
    campaign_id: campaignId,
    email,
    token,
    invited_by: user.id,
    expires_at: expires.toISOString(),
  })

  // Invites are in-app (shown on /account when invitee_email matches the signed-in user).
  return { ok: true }
}

export async function acceptInvite(token: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in first')

  const { data: invite } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) throw new Error('Invalid invite')
  if (invite.accepted_at) throw new Error('Invite already used')
  if (new Date(invite.expires_at) < new Date()) throw new Error('Invite expired')

  // Create membership (unique constraint blocks duplicates)
  await supabase.from('memberships').insert({
    campaign_id: invite.campaign_id,
    user_id: user.id,
    role: invite.role,
  })

  await supabase.from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return invite.campaign_id
}
```

Every authorization check is an `if` statement you can read top to bottom, rather than a declarative database rule you have to reason about indirectly.

---

## Code pattern 3 — Realtime combat log subscription

This is the "just data" path, straight from the client. Two parts: load existing entries, then subscribe to new ones.

```typescript
// components/CombatLog.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client' // browser client

type Entry = {
  id: string; message: string; kind: string;
  author_id: string; created_at: string;
}

export function CombatLog({ campaignId }: { campaignId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 1. Load existing entries
    supabase
      .from('combat_log_entries')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setEntries(data ?? []))

    // 2. Subscribe to new ones — this is the realtime magic
    const channel = supabase
      .channel(`combat-log-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'combat_log_entries',
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          setEntries((prev) => [...prev, payload.new as Entry])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) } // cleanup on unmount
  }, [campaignId])

  return (
    <div>
      {entries.map((e) => (
        <div key={e.id}>
          <span className="text-xs opacity-60">{e.kind}</span> {e.message}
        </div>
      ))}
    </div>
  )
}
```

Adding an entry is just an insert — every subscribed client gets the `INSERT` event automatically:

```typescript
async function addLogEntry(campaignId: string, message: string, kind = 'note') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('combat_log_entries').insert({
    campaign_id: campaignId,
    author_id: user!.id,
    message,
    kind,
  })
}
```

> **One setup step:** enable Realtime for the `combat_log_entries` table in the Supabase dashboard (Database → Replication), or it won't broadcast.

---

## Code pattern 4 — Saving a page (the three recovery layers)

Page content is the user's extensive work, so the save path is hardened against the one failure that matters: content getting wiped (by a bad save, a deletion, or an app bug) and that wipe destroying the only good copy. Three layers stack so that *no single destructive write is ever the only thing standing between the user and their work*:

- **Layer 1 — last-known-good + soft delete.** Before overwriting `content_json`, the prior value is copied into `previous_content_json`. Deletes set `deleted_at` instead of removing the row. Any single bad save or deletion is one step from recovery.
- **Layer 2 — wipe guard.** The server extracts the plain text from the incoming Tiptap JSON and compares its length to the stored `content_text`. If it's empty or drops below a threshold fraction, the save is **blocked and the user is asked to confirm** — it does not write until they explicitly say so.
- **Layer 3 — capped rolling snapshots.** Each *meaningful* save also drops a full snapshot into `page_recovery_snapshots`, pruned to the newest ~10 per page. Bounded storage, multi-step walk-back.

Two design points that make this trustworthy:

1. **The derived `content_text` is computed on the server, never trusted from the client.** Tiptap ships `generateText(json, extensions)` (from `@tiptap/core`) which turns a document into plain text without rendering an editor. The server runs this on every save, so search and the wipe-guard always reflect the real content.
2. **A confirmed wipe is still safe.** Because Layers 1 and 3 run regardless of confirmation, even when the user confirms a destructive save the previous content is preserved in `previous_content_json` and the snapshot buffer. Confirming never actually destroys the prior state.

```typescript
// app/actions/pages.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { generateText, type JSONContent } from '@tiptap/core'
import { editorExtensions } from '@/lib/editor/extensions' // the SAME extensions the editor uses

const WIPE_MIN_LENGTH = 200      // only guard documents with real content
const WIPE_SHRINK_RATIO = 0.1    // new text < 10% of old text = suspicious

type SaveResult =
  | { status: 'saved'; pageId: string }
  | { status: 'needs_confirmation'; reason: 'looks_like_wipe'; oldLength: number; newLength: number }

export async function savePage(
  pageId: string,
  newContentJson: JSONContent,
  confirmWipe = false,         // second call passes true after the user confirms
): Promise<SaveResult> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Load current state
  const { data: page } = await supabase
    .from('pages')
    .select('content_json, content_text, owner_id')
    .eq('id', pageId)
    .single()
  if (!page) throw new Error('Page not found')
  if (page.owner_id !== user.id) throw new Error('Not allowed')

  // Derive plain text on the SERVER from the incoming JSON (never trust the client)
  const newText = generateText(newContentJson, editorExtensions)
  const oldText = page.content_text ?? ''

  // Layer 2: wipe guard — block & ask for confirmation
  const looksLikeWipe =
    oldText.length > WIPE_MIN_LENGTH &&
    newText.trim().length < oldText.length * WIPE_SHRINK_RATIO
  if (looksLikeWipe && !confirmWipe) {
    return {
      status: 'needs_confirmation',
      reason: 'looks_like_wipe',
      oldLength: oldText.length,
      newLength: newText.trim().length,
    }
  }

  // Layer 3 (smart history): only snapshot if content meaningfully changed
  const changed = newText !== oldText
  if (changed) {
    await supabase.from('page_recovery_snapshots').insert({
      page_id: pageId,
      content_json: page.content_json,   // snapshot the OLD state before we overwrite
      content_text: oldText,
      saved_by: user.id,
    })
    // Prune to newest 10
    const { data: keep } = await supabase
      .from('page_recovery_snapshots')
      .select('id')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .range(0, 9)
    if (keep) {
      const keepIds = keep.map((r) => r.id)
      await supabase
        .from('page_recovery_snapshots')
        .delete()
        .eq('page_id', pageId)
        .not('id', 'in', `(${keepIds.join(',')})`)
    }
  }

  // Layer 1 + the actual write: keep the prior good copy alongside the new content
  await supabase
    .from('pages')
    .update({
      content_json: newContentJson,
      content_text: newText,
      previous_content_json: page.content_json,  // last-known-good
      updated_at: new Date().toISOString(),
    })
    .eq('id', pageId)

  return { status: 'saved', pageId }
}

// Soft delete instead of removing the row
export async function deletePage(pageId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  await supabase
    .from('pages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('owner_id', user.id)
}

// One-step undo: restore the last-known-good copy
export async function restorePreviousContent(pageId: string) {
  const supabase = createServerClient()
  const { data: page } = await supabase
    .from('pages')
    .select('previous_content_json')
    .eq('id', pageId)
    .single()
  if (!page?.previous_content_json) throw new Error('Nothing to restore')
  const text = generateText(page.previous_content_json as JSONContent, editorExtensions)
  await supabase
    .from('pages')
    .update({ content_json: page.previous_content_json, content_text: text })
    .eq('id', pageId)
}
```

On the client, the two-step confirmation is a short branch:

```typescript
'use client'
import { savePage } from '@/app/actions/pages'

async function handleSave(pageId: string, json: object) {
  const res = await savePage(pageId, json)            // first attempt
  if (res.status === 'needs_confirmation') {
    const ok = window.confirm(
      `This will remove most of the page (from ${res.oldLength} to ${res.newLength} characters). Save anyway?`
    )
    if (!ok) return
    await savePage(pageId, json, true)                 // confirmed: bypasses guard, still keeps backups
  }
}
```

> **Tune the thresholds.** `WIPE_MIN_LENGTH` and `WIPE_SHRINK_RATIO` decide what counts as a wipe. The defaults (guard only docs over ~200 chars, trip when new text falls under 10% of old) are a starting point — loosen if heavy legitimate edits trip it, tighten if real wipes slip through. Layer 1 keeps the prior copy regardless, so an over-cautious threshold is never dangerous, just occasionally annoying.

---

## Code pattern 5 — File upload

Two paths, matching the rule. Simple uploads go straight from the client; logic-gated ones go through a server action.

### Simple: client uploads its own file (e.g. a character portrait)

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

async function uploadPortrait(campaignId: string, characterId: string, file: File) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const path = `${campaignId}/${characterId}/${file.name}`

  // Upload bytes to the public-assets bucket
  const { error } = await supabase.storage
    .from('public-assets')
    .upload(path, file, { upsert: true })
  if (error) throw error

  // Record metadata so the file is linked to the campaign
  await supabase.from('files').insert({
    campaign_id: campaignId,
    uploader_id: user!.id,
    bucket: 'public-assets',
    path,
    filename: file.name,
    content_type: file.type,
    size_bytes: file.size,
    visibility: 'public',
  })

  // Public URL you can drop straight into an <img>
  const { data } = supabase.storage.from('public-assets').getPublicUrl(path)
  return data.publicUrl
}
```

### Gated: DM-only upload, or private files

Validate on the server, then either upload there or hand back a signed upload URL. And for **viewing** private files, generate a short-lived signed URL rather than a public link:

```typescript
// app/actions/files.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function getPrivateFileUrl(fileId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data: file } = await supabase
    .from('files').select('*').eq('id', fileId).single()
  if (!file) throw new Error('Not found')

  // Confirm membership before handing out a link
  const { data: me } = await supabase
    .from('memberships')
    .select('id')
    .eq('campaign_id', file.campaign_id)
    .eq('user_id', user.id)
    .single()
  if (!me) throw new Error('Not allowed')

  // Signed URL valid for 60 seconds
  const { data } = await supabase.storage
    .from('private-files')
    .createSignedUrl(file.path, 60)
  return data?.signedUrl
}
```

**Bucket setup:** create two buckets in the dashboard — `public-assets` (public, for portraits/maps the whole table sees) and `private-files` (private, served only via signed URLs). Decide per upload which bucket a file belongs in based on its `visibility`.

**Preview vs. download:** images and PDFs preview in-browser; other types (`.docx`, `.zip`) you store and offer as downloads. Have the upload UI reflect that so it doesn't promise a preview it can't show.

---

## Build order (suggested)

1. **Auth + campaigns + memberships** — get sign-in and `createCampaign` working. Everything hangs off a campaign.
2. **Invites** — `inviteMember` / `acceptInvite`. Multi-step authorization logic, so worth getting right early.
3. **Wiki: categories + pages** — the OneNote structure with public/private visibility and RLS. Wire up the **Tiptap** editor here, storing `content_json`.
4. **Page save hardening** — the `savePage` action with the three recovery layers (last-known-good, wipe guard, capped snapshots) and `deletePage` soft delete. Do this with the editor, not later — it's the safety net for the user's main work.
5. **Characters + inventory** — the `jsonb` sheet and item list.
6. **Combat log** — the realtime subscription. Satisfying to build because it visibly "just works" live.
7. **File uploads** — buckets, simple client upload, then the gated/private path.

**Deferred:**
- **Personal library** — the envelope + typed body tables, folders/tags, and the two transfer actions. Build it after campaigns exist, since transfer copies to/from them.
- **TV / read-only display surface** — the `/tv` routes (server-rendered note HTML, live combat reuse, remote-focus navigation), the conservative `browserslist`, and the UA-detection middleware. Build after the data and combat log exist, since it just renders them.

Each completed step is independently shippable, and none of it requires a WebSocket server or CRDT/conflict-resolution layer.

---

## The Personal Library (cross-campaign, user-owned) — DEFERRED

A space owned by the **user**, not any campaign, holding mixed content — characters, images, text notes, spell/rule references, and loose ideas — that can be **copied into a campaign** or **imported from a campaign**, in either direction, while each space keeps its own copy.

### Three decisions that shape this

1. **Copy, not link — but remember the origin.** Moving an item between the personal library and a campaign creates a new copy owned by the destination. Spaces stay self-contained: a personal note copied into a shared campaign doesn't expose your private library, and importing campaign content gives you a copy you keep even if you later leave the campaign. Each copy records a `source_*_id` pointer for provenance ("imported from Campaign Avernus"), which is metadata only — nothing reads it to stay in sync, but it's the seam a future "push edits back to the original" feature could use.
2. **Envelope + typed body (supertype/subtype).** Everything *common* across content types — owner, kind, title, folder, tags, provenance, timestamps — lives once on a thin `library_items` envelope. Everything *type-specific* lives in a per-kind body table with real typed columns (so "all level-3 spells" is a normal indexed query, not JSON digging). This is the deliberate middle between one blob table (bad at typed queries) and fully separate tables (which would force the transfer/provenance/folder/tag logic to be rewritten per type).
3. **Folders + tags.** Folders give one hierarchical home per item (`folder_id` on the envelope); tags give many cross-cutting labels (`text[]` on the envelope). Both live on the envelope, so they work identically across every content type and never need per-type wiring.

### Schema

```sql
-- Folders: optional hierarchy for the personal library.
create table library_folders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id),
  parent_id   uuid references library_folders(id) on delete cascade,
  name        text not null,
  sort_order  int not null default 0
);

-- ENVELOPE: everything common across content types lives here, once.
create table library_items (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id),
  kind          text not null,             -- 'character' | 'image' | 'note' | 'spell' | 'idea'
  title         text not null,
  folder_id     uuid references library_folders(id) on delete set null,
  tags          text[] not null default '{}',
  source_kind   text,                      -- provenance: where this copy came from
  source_id     uuid,                      -- e.g. the campaign page / character / library item id
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index library_items_owner_idx on library_items (owner_id, kind);
create index library_items_folder_idx on library_items (folder_id);
create index library_items_tags_idx on library_items using gin (tags);

-- TYPED BODIES: one table per kind, each pointing back to its envelope.
-- Characters reuse the same sheet shape as campaign characters.
create table library_character_bodies (
  item_id   uuid primary key references library_items(id) on delete cascade,
  name      text not null,
  sheet     jsonb not null default '{}'
);

-- Notes & ideas store Tiptap JSON, same as campaign pages (+ derived text for search).
create table library_note_bodies (
  item_id        uuid primary key references library_items(id) on delete cascade,
  content_json   jsonb,
  content_text   text
);

-- Spells get real typed columns so "all level-3 evocation spells" is a normal query.
create table library_spell_bodies (
  item_id     uuid primary key references library_items(id) on delete cascade,
  level       int,                         -- 0..9
  school      text,                        -- 'evocation' | 'abjuration' | ...
  casting_time text,
  range       text,
  components  text,
  duration    text,
  description text
);
create index library_spell_level_idx on library_spell_bodies (level, school);

-- Images point at a Storage object (reusing the files model from the upload feature).
create table library_image_bodies (
  item_id   uuid primary key references library_items(id) on delete cascade,
  file_id   uuid references files(id) on delete set null,
  bucket    text,
  path      text,
  caption   text
);
```

> **Adding a content type later** means one new `*_bodies` table and nothing else — transfer, provenance, folders, and tags already operate entirely on the envelope. That is the whole reason for splitting envelope from body.

### RLS

The library is single-user, so the rule is simply *the owner owns it.* Every body table checks ownership through its envelope.

```sql
alter table library_items enable row level security;
create policy "own items" on library_items for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table library_spell_bodies enable row level security;
create policy "own spell bodies" on library_spell_bodies for all
  using (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()))
  with check (exists (select 1 from library_items i where i.id = item_id and i.owner_id = auth.uid()));
-- repeat the same shape for the other *_bodies tables
```

### Transfer actions

Both directions follow one rule: **read the source, write a new owned copy in the destination, record provenance, never mutate the source.** Both run server-side because they cross an ownership boundary and need a permission check (you can only copy into a campaign you belong to; you can only import from a campaign you can see).

```typescript
// app/actions/library-transfer.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'

// PERSONAL  ->  CAMPAIGN : copy a library item into a campaign as campaign content.
export async function copyItemToCampaign(itemId: string, campaignId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Must own the item AND be a member of the destination campaign
  const { data: item } = await supabase
    .from('library_items').select('*').eq('id', itemId).eq('owner_id', user.id).single()
  if (!item) throw new Error('Item not found')

  const { data: member } = await supabase
    .from('memberships').select('id').eq('campaign_id', campaignId).eq('user_id', user.id).single()
  if (!member) throw new Error('Not a member of that campaign')

  // Dispatch by kind: read the body, write the matching campaign row, stamp provenance.
  if (item.kind === 'character') {
    const { data: body } = await supabase
      .from('library_character_bodies').select('*').eq('item_id', itemId).single()
    await supabase.from('characters').insert({
      campaign_id: campaignId,
      owner_id: user.id,
      name: body!.name,
      sheet: body!.sheet,
      // (record provenance on the campaign row if you add source columns there)
    })
  } else if (item.kind === 'note' || item.kind === 'idea') {
    const { data: body } = await supabase
      .from('library_note_bodies').select('*').eq('item_id', itemId).single()
    await supabase.from('pages').insert({
      campaign_id: campaignId,
      title: item.title,
      content_json: body!.content_json,
      content_text: body!.content_text,
      owner_id: user.id,
      visibility: 'private',
    })
  }
  // ...other kinds (image -> copy storage object into the campaign bucket, spell -> a page, etc.)
}

// CAMPAIGN  ->  PERSONAL : import campaign content as a library item the user owns.
export async function importPageToLibrary(pageId: string, folderId?: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  // Must be able to see the source page (RLS on pages enforces membership + visibility)
  const { data: page } = await supabase
    .from('pages').select('*').eq('id', pageId).single()
  if (!page) throw new Error('Page not found or not visible')

  // 1. Create the envelope, stamping provenance
  const { data: env } = await supabase.from('library_items').insert({
    owner_id: user.id,
    kind: 'note',
    title: page.title,
    folder_id: folderId ?? null,
    source_kind: 'campaign_page',
    source_id: page.id,
  }).select().single()

  // 2. Create the typed body
  await supabase.from('library_note_bodies').insert({
    item_id: env!.id,
    content_json: page.content_json,
    content_text: page.content_text,
  })

  return env!.id
}
```

> **Why a two-row write (envelope + body) is worth it:** the copy/import logic, folder moves, tag edits, and library search all touch only the envelope. The body insert is the *only* part that varies by kind. Without the split, every one of those cross-cutting operations would be written once per content type.

### How this connects to what's already here

- **Characters** reuse the campaign `characters.sheet` shape — a library character body *is* a sheet, so transfer is a field copy.
- **Notes & ideas** reuse the Tiptap `content_json` + derived `content_text` model from page saving, so library search works the same way and the same editor renders them.
- **Images** reuse the `files` + Storage model from the upload feature; copying an image into a campaign copies the storage object so access boundaries stay clean.
- **AI tools (future, possibly paid):** because every library body is a structured, user-owned thing, an AI generator ("make an NPC", "draft a session recap", "expand this idea into a page") naturally writes *into* these same tables. The library is the home the AI features would target, not a separate subsystem.

---

## The TV / legacy-browser display surface — DEFERRED

The GM broadcasts the combat log and notes on a living-room **LG webOS TV (2015–2018)**. Those run old engines — webOS 3.x (2016–17) is Chromium 38, webOS 4.x (2018) is Chromium 53 — which can't parse modern CSS (e.g. `oklch`, cascade layers, `:has()`) or run modern JS syntax untranspiled. The goal is **display and navigation only** on the TV; all editing happens on the GM's and players' real computers.

### Approach: one app, one read-only surface

There is **one app on one styling system** (Tailwind v3). The main app stays fully featured and runs on modern computers. Alongside it is a small, read-only **`/tv` route group** that renders the same data from the same database — live combat log, character sheets, notes — with **no editor, no uploads, no mutations**. It is a thin view layer over shared auth, data, and realtime, not a second app.

The reason this stays low-maintenance: the TV surface is read-only and self-contained, so nothing in the main app's interactive code can break it, and there's no second Tailwind version to reconcile.

### How each piece works on the TV

- **Notes** are shown by server-rendering their stored Tiptap JSON to plain HTML with Tiptap's `generateHTML(json, extensions)` (the display sibling of the `generateText` used for search). The TV receives finished markup and **never loads the editor** — which is what keeps the heavy, modern-only editor code off the old engine entirely.
- **Live combat log** reuses the existing Supabase realtime subscription. WebSockets work on Chromium 38+, so the live view needs no special handling beyond compatible CSS. (If a specific TV ever fails on WebSockets, the view can fall back to polling.)
- **Navigation** between notes/categories uses plain focusable links with a strong `:focus` style, since a TV remote moves *focus* (arrow keys + enter) rather than a cursor. No forms, no mutations.

```typescript
// app/tv/notes/[pageId]/page.tsx  — server component, read-only
import { generateHTML } from '@tiptap/html'
import { editorExtensions } from '@/lib/editor/extensions'
import { createServerClient } from '@/lib/supabase/server'

export default async function TvNote({ params }: { params: { pageId: string } }) {
  const supabase = createServerClient()
  const { data: page } = await supabase
    .from('pages').select('title, content_json').eq('id', params.pageId).single()

  // JSON -> HTML on the SERVER. No editor ships to the TV.
  const html = page?.content_json
    ? generateHTML(page.content_json, editorExtensions)
    : ''

  return (
    <article className="tv-note">
      <h1>{page?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
```

### Compatibility rules (scoped to `/tv` only)

Because the whole app is already on Tailwind v3, TV compatibility is a small **styling discipline** in the `/tv` routes, not a tooling split:

- **Layout:** flexbox, not CSS Grid (Grid is absent in Chromium 38; available in 53 — flexbox is the safe baseline for both).
- **Color:** plain hex/rgb, never `oklch`/`lab`.
- **Avoid:** `:has()`, container queries, cascade layers.
- **JavaScript:** a conservative `browserslist` so the bundler transpiles JS down to an old-engine-safe level (and Autoprefixer adds the old vendor prefixes). This matters more than any CSS rule — modern syntax throws on these engines if not transpiled.

```jsonc
// package.json — conservative target so the bundle runs on the TV engine
"browserslist": [
  "chrome >= 38",        // webOS 3.x floor; raise to 53 if the TV is a 2018 model
  "last 2 versions"      // modern browsers for everyone else
]
```

### Getting the TV there

Lightweight Next.js **middleware** reads the user-agent — the webOS string is distinctive and includes the Chromium version (e.g. `Web0S ... Chrome/53...`) — and routes old engines to `/tv`. For borderline devices (a slightly old but capable laptop) prefer a gentle "open the display view?" prompt over a hard redirect; for the living-room TV, an automatic redirect on the webOS UA is the right default.

```typescript
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? ''
  const isLegacyTv = /Web0S|webOS/i.test(ua) || /Chrome\/(3\d|4\d|5[0-3])\./.test(ua)
  if (isLegacyTv && !req.nextUrl.pathname.startsWith('/tv')) {
    return NextResponse.redirect(new URL('/tv', req.url))
  }
  return NextResponse.next()
}
export const config = { matcher: ['/((?!_next|api|tv).*)'] }
```

> **Bonus:** because `/tv` is read-only and server-rendered, it's also the natural foundation for a future "share a read-only link" feature (a player checking notes on a phone, a spectator view) — the same routes serve it. Not built now, but it falls out of this work.

---

## Design notes & deliberate non-goals

A few choices are worth stating explicitly so the scope stays clear:

- **No collaborative same-field editing yet (no Y.js / Liveblocks / CRDT).** Real-time conflict resolution for multiple people typing in the *same text field at the same instant* is a large, expensive subsystem. This app doesn't need it now: page and sheet edits are effectively single-editor, and the combat log is append-only (entries are added, never co-edited). The path stays open, though — Tiptap is built on the ProseMirror/Y.js lineage, and because page content is already stored as structured JSON, adding collaboration later means binding a Y.js document to the existing editor on specific pages and flushing its JSON back into `content_json` (the same column `savePage` writes). No schema rework, and the recovery layers keep operating on that same column.
- **No separate WebSocket server, debounce-to-DB bridge, or room-lifecycle webhooks.** Those exist to support a live-collaboration engine; without one, the database is the single source of truth and Supabase Realtime broadcasts row changes directly to clients.
- **tRPC + Prisma are optional.** Next.js server actions cover the logic-heavy mutations (campaigns, invites, gated uploads) with less ceremony and a gentle learning curve for a frontend developer. A formal typed API layer can be added later if the project grows to want it; it isn't required to ship any feature here.

The result is one vendor (Supabase), one permissions model (RLS plus server actions for trusted logic), and one client library — while still fully meeting the live combat-log requirement.
