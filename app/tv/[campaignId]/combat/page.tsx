import { TvCombatLog } from "@/components/TvCombatLog";

export default function TvCombatPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <div className="tv-row">
      <h1>Live combat log</h1>
      <TvCombatLog campaignId={params.campaignId} />
    </div>
  );
}
