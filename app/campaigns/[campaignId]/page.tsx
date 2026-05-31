import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { CombatLog } from "@/components/CombatLog";

export default async function CampaignPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const { campaignId } = params;
  const supabase = createServerClient();

  const [{ data: campaign }, { data: pages }, { data: characters }] =
    await Promise.all([
      supabase.from("campaigns").select("name").eq("id", campaignId).single(),
      supabase
        .from("pages")
        .select("id, title")
        .eq("campaign_id", campaignId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("characters")
        .select("id, name")
        .eq("campaign_id", campaignId),
    ]);

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-3">
        <h1 className="text-xl font-bold">{campaign?.name ?? "Campaign"}</h1>
        <p className="text-sm text-gray-500">
          <Link href={`/tv`} className="underline">
            Open TV display
          </Link>
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Wiki</h2>
        <ul className="space-y-1 text-sm">
          {(pages ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/campaigns/${campaignId}/pages/${p.id}`}
                className="hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
          {(!pages || pages.length === 0) && (
            <li className="text-gray-500">No pages yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-gray-400">
          Characters
        </h2>
        <ul className="space-y-1 text-sm">
          {(characters ?? []).map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
          {(!characters || characters.length === 0) && (
            <li className="text-gray-500">No characters yet.</li>
          )}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-gray-400">
          Combat log
        </h2>
        <CombatLog campaignId={campaignId} />
      </section>
    </div>
  );
}
