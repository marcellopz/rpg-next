// Instant skeleton for campaign settings while the server render is in flight.
export default function CampaignSettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-6 py-10">
      <div className="h-4 w-36 rounded bg-gray-200" />
      <div className="mt-6 h-10 w-64 rounded bg-gray-200" />
      <div className="mt-8 space-y-6">
        <div className="h-52 rounded-2xl bg-gray-200" />
        <div className="h-72 rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}
