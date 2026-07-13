// Client-side note search. RLS on `pages`/`categories` (member + visibility)
// already filters results to what the caller may see, so this is a plain
// browser read rather than a server action — no trust decision to make.
import { createClient } from "@/lib/supabase/client";

export type NoteSearchSnippet = {
  before: string;
  match: string;
  after: string;
  truncatedStart: boolean;
  truncatedEnd: boolean;
};

export type NoteSearchResult = {
  pageId: string;
  title: string;
  categoryName: string | null;
  scope: "campaign" | "personal";
  snippet: NoteSearchSnippet | null;
};

const MAX_RESULTS = 30;
const SNIPPET_RADIUS = 50;

type PageMatchRow = {
  id: string;
  title: string;
  content_text: string | null;
  category_id: string | null;
  visibility: "public" | "private";
};

// Escape ILIKE wildcards so the user's literal text is matched, not a pattern.
function toIlikePattern(term: string): string {
  return `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
}

function buildSnippet(text: string, term: string): NoteSearchSnippet | null {
  const index = text.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return null;
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + term.length + SNIPPET_RADIUS);
  return {
    before: text.slice(start, index),
    match: text.slice(index, index + term.length),
    after: text.slice(index + term.length, end),
    truncatedStart: start > 0,
    truncatedEnd: end < text.length,
  };
}

// Searches page content text for `term`, scoped to a campaign. Title is NOT
// matched: a page whose title happens to share a word with the query but
// whose body doesn't contain it is not a real search hit, and showing it
// (often with empty/unrelated content) reads as a false positive.
export async function searchNotesClient(
  campaignId: string,
  term: string
): Promise<NoteSearchResult[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const supabase = createClient();
  const pattern = toIlikePattern(trimmed);

  const { data, error } = await supabase
    .from("pages")
    .select("id, title, content_text, category_id, visibility")
    .eq("campaign_id", campaignId)
    .ilike("content_text", pattern)
    .order("updated_at", { ascending: false })
    .limit(MAX_RESULTS)
    .returns<PageMatchRow[]>();

  if (error) throw new Error(error.message);
  const limited = data ?? [];

  const categoryIds = Array.from(
    new Set(limited.map((r) => r.category_id).filter((id): id is string => !!id))
  );
  const categoryNames = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    if (error) throw new Error(error.message);
    for (const c of categories ?? []) categoryNames.set(c.id, c.name);
  }

  return limited
    .map((row) => ({
      pageId: row.id,
      title: row.title,
      categoryName: row.category_id
        ? categoryNames.get(row.category_id) ?? null
        : null,
      scope: (row.visibility === "private" ? "personal" : "campaign") as
        | "personal"
        | "campaign",
      snippet: buildSnippet(row.content_text ?? "", trimmed),
    }))
    // Belt-and-suspenders: only keep rows where the term is actually
    // findable in the content (Postgres ILIKE and JS indexOf should always
    // agree for plain text, but never show a "match" with no visible proof).
    .filter((r) => r.snippet !== null);
}
