// Read-side data access for wiki notes (categories + pages). User-scoped
// client everywhere: RLS hides other users' private trees and soft-deleted
// pages, so no additional filtering is needed for authorization.
import { createServerClient, getCurrentUser } from "@/lib/supabase/server";
import type { JSONContent } from "@tiptap/core";

export type NotePageSummary = {
  id: string;
  title: string;
  categoryId: string | null;
};

export type NoteCategory = {
  id: string;
  name: string;
  pages: NotePageSummary[];
};

// One tab of the sidebar: categories (with their pages) plus root-level pages.
export type NoteTree = {
  categories: NoteCategory[];
  rootPages: NotePageSummary[];
};

export type NoteTrees = {
  campaign: NoteTree;
  personal: NoteTree;
};

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
    // A page whose category lives in the other tree (e.g. a private page moved
    // out of a shared category) falls back to the root of its own tree.
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

// Both sidebar trees for a campaign: the shared "Campaign notes" tree and the
// caller's private "My notes" tree. Page content is intentionally excluded.
export async function getNoteTreesForCampaign(
  campaignId: string
): Promise<NoteTrees> {
  const supabase = createServerClient();
  // The user lookup and both table reads run in parallel — none depend on
  // each other; the user id is only needed to split the personal tree.
  const [user, { data: categoryRows }, { data: pageRows }] = await Promise.all([
    getCurrentUser(),
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
  ]);

  const categories = categoryRows ?? [];
  const pages = pageRows ?? [];

  const campaignCategories = categories.filter((c) => c.owner_id === null);
  const personalCategories = categories.filter(
    (c) => c.owner_id !== null && c.owner_id === user?.id
  );
  const campaignPages = pages.filter((p) => p.visibility === "public");
  const personalPages = pages.filter((p) => p.visibility === "private");

  return {
    campaign: buildTree(campaignCategories, campaignPages),
    personal: buildTree(personalCategories, personalPages),
  };
}

export type NotePage = {
  id: string;
  campaignId: string;
  categoryId: string | null;
  title: string;
  contentJson: JSONContent | null;
  visibility: "public" | "private";
  ownerId: string;
};

// A single page with its content, for the editor. Returns null when the page
// doesn't exist or the caller can't see it (RLS yields no row).
export async function getPageForCurrentUser(
  pageId: string
): Promise<NotePage | null> {
  const supabase = createServerClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id, campaign_id, category_id, title, content_json, visibility, owner_id")
    .eq("id", pageId)
    .maybeSingle();
  if (!page) return null;

  return {
    id: page.id,
    campaignId: page.campaign_id,
    categoryId: page.category_id,
    title: page.title,
    contentJson: (page.content_json as JSONContent | null) ?? null,
    visibility: page.visibility as "public" | "private",
    ownerId: page.owner_id,
  };
}
