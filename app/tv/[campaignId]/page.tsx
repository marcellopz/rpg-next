import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

// TV campaign view: focusable list of notes + a link to the live combat log.
export default async function TvCampaign({
  params,
}: {
  params: { campaignId: string };
}) {
  const supabase = createServerClient();
  const [{ data: campaign }, { data: pages }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("name")
      .eq("id", params.campaignId)
      .single(),
    supabase
      .from("pages")
      .select("id, title")
      .eq("campaign_id", params.campaignId)
      .eq("visibility", "public")
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="tv-row">
      <h1>{campaign?.name ?? "Campaign"}</h1>
      <nav className="tv-nav">
        <Link href={`/tv/${params.campaignId}/combat`} className="tv-link">
          ► Live combat log
        </Link>
        {(pages ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/tv/notes/${p.id}`}
            className="tv-link"
          >
            {p.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
