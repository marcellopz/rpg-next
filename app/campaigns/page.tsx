import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { NewCampaignButton } from "./NewCampaignButton";

export default async function CampaignsPage() {
  const supabase = createServerClient();
  // RLS limits this to campaigns the user is a member of.
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Your campaigns</h1>
      </div>

      <NewCampaignButton />

      <ul className="space-y-2">
        {(campaigns ?? []).map((c) => (
          <li key={c.id}>
            <Link
              href={`/campaigns/${c.id}`}
              className="block rounded border border-gray-800 px-4 py-3 hover:bg-gray-800"
            >
              {c.name}
            </Link>
          </li>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <li className="text-sm text-gray-500">
            No campaigns yet. Create one above.
          </li>
        )}
      </ul>
    </div>
  );
}
