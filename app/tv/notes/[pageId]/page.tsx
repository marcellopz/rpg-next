import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor/extensions";
import { createServerClient } from "@/lib/supabase/server";

// Server component, read-only. JSON -> HTML on the SERVER, so no editor ships
// to the TV (which keeps the heavy modern-only editor code off the old engine).
export default async function TvNote({
  params,
}: {
  params: { pageId: string };
}) {
  const supabase = createServerClient();
  const { data: page } = await supabase
    .from("pages")
    .select("title, content_json")
    .eq("id", params.pageId)
    .single();

  const html = page?.content_json
    ? generateHTML(page.content_json as JSONContent, editorExtensions)
    : "";

  return (
    <article className="tv-note">
      <h1>{page?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
