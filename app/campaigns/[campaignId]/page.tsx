// Placeholder route. Campaign detail (wiki, characters, combat log) will be
// rebuilt later.
export default function CampaignPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return (
    <div className="max-w-2xl space-y-3 px-6 py-8">
      <h1 className="text-xl font-bold">Campaign</h1>
      <p className="text-sm text-gray-500">
        Coming soon (campaign {params.campaignId}).
      </p>
    </div>
  );
}
