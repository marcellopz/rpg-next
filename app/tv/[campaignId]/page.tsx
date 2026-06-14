// Placeholder route. The read-only TV campaign view will be rebuilt later.
export default function TvCampaign({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <div className="tv-row">
      <h1>Campaign</h1>
      <p>Coming soon ({params.campaignId}).</p>
    </div>
  );
}
