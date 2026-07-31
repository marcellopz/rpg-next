import { createClient } from "@/lib/supabase/client";
import type { NoteScope } from "@/app/actions/categories";
import type { NotePageSummary, NoteTree } from "@/lib/queries/notes";

// Browser-side re-read of one sidebar tree, mirroring getNoteTreesForCampaign
// in lib/queries/notes.ts. Used to reconcile after an optimistic mutation —
// one targeted query set instead of router.refresh(), which would re-render the
// whole workspace including the open editor.

type CategoryRow = {
  id: string;
  name: string;
  owner_id: string | null;
  sort_order: number;
  created_at: string;
};

type PageRow = {
  id: string;
  title: string;
  category_id: string | null;
  visibility: "public" | "private";
  created_at: string;
};

function buildTree(categories: CategoryRow[], pages: PageRow[]): NoteTree {
  const categoryIds = new Set(categories.map((c) => c.id));
  const byCategory = new Map<string, NotePageSummary[]>();
  const rootPages: NotePageSummary[] = [];

  for (const p of pages) {
    const summary: NotePageSummary = {
      id: p.id,
      title: p.title,
      categoryId: p.category_id,
    };
    // A page whose category lives in the other tree falls back to its own root.
    if (p.category_id && categoryIds.has(p.category_id)) {
      const list = byCategory.get(p.category_id) ?? [];
      list.push(summary);
      byCategory.set(p.category_id, list);
    } else {
      rootPages.push(summary);
    }
  }

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      pages: byCategory.get(c.id) ?? [],
    })),
    rootPages,
  };
}

/** The tree for one scope. RLS already limits rows to what the caller can see. */
export async function fetchNoteTreeClient(
  campaignId: string,
  scope: NoteScope
): Promise<NoteTree> {
  const supabase = createClient();

  const [claims, { data: categoryRows }, { data: pageRows }] = await Promise.all(
    [
      supabase.auth.getClaims(),
      supabase
        .from("categories")
        .select("id, name, owner_id, sort_order, created_at")
        .eq("campaign_id", campaignId)
        .order("sort_order")
        .order("created_at")
        .returns<CategoryRow[]>(),
      supabase
        .from("pages")
        .select("id, title, category_id, visibility, created_at")
        .eq("campaign_id", campaignId)
        .order("sort_order")
        .order("created_at")
        .returns<PageRow[]>(),
    ]
  );

  const userId = claims.data?.claims?.sub ?? null;
  const categories = categoryRows ?? [];
  const pages = pageRows ?? [];

  if (scope === "personal") {
    return buildTree(
      categories.filter((c) => c.owner_id !== null && c.owner_id === userId),
      pages.filter((p) => p.visibility === "private")
    );
  }

  return buildTree(
    categories.filter((c) => c.owner_id === null),
    pages.filter((p) => p.visibility === "public")
  );
}
