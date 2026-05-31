import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

// TV home: a focusable list of campaigns. Plain links — a remote moves focus.
export default async function TvHome() {
  const supabase = createServerClient();
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .order("created_at", { ascending: false });

  return (
    <div className="tv-row">
      <h1>Campaigns</h1>
      <nav className="tv-nav">
        {(campaigns ?? []).map((c) => (
          <Link key={c.id} href={`/tv/${c.id}`} className="tv-link">
            {c.name}
          </Link>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <p>No campaigns available.</p>
        )}
      </nav>
    </div>
  );
}
