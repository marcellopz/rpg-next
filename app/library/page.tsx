import { createServerClient } from "@/lib/supabase/server";

export default async function LibraryPage() {
  const supabase = createServerClient();
  // RLS: owner-only.
  const { data: items } = await supabase
    .from("library_items")
    .select("id, kind, title, tags")
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Personal library</h1>
      <p className="text-sm text-gray-400">
        Cross-campaign, user-owned content. Items can be copied into a campaign
        or imported from one — each space keeps its own copy.
      </p>
      <ul className="space-y-2">
        {(items ?? []).map((it) => (
          <li
            key={it.id}
            className="rounded border border-gray-800 px-4 py-3 text-sm"
          >
            <span className="mr-2 text-xs uppercase opacity-60">{it.kind}</span>
            {it.title}
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="text-sm text-gray-500">Your library is empty.</li>
        )}
      </ul>
    </div>
  );
}
