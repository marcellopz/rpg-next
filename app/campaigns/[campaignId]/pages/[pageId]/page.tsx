import { createServerClient } from "@/lib/supabase/server";
import type { JSONContent } from "@tiptap/core";
import { PageEditor } from "./PageEditor";

export default async function WikiPage({
  params,
}: {
  params: { campaignId: string; pageId: string };
}) {
  const supabase = createServerClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, content_json")
    .eq("id", params.pageId)
    .single();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">{page?.title ?? "Untitled"}</h1>
      <PageEditor
        pageId={params.pageId}
        initialContent={(page?.content_json as JSONContent) ?? null}
      />
    </div>
  );
}
