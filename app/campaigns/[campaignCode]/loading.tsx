// Instant skeleton while the workspace's server render is in flight, so
// navigating between campaigns/tools doesn't feel frozen.
export default function CampaignLoading() {
  return (
    <div className="app-container animate-pulse py-6">
      <div className="h-44 rounded-3xl bg-gray-200" />
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-12 border-b border-gray-200 bg-gray-50" />
        <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="space-y-3 border-b border-gray-200 bg-gray-50 p-4 lg:border-b-0 lg:border-r">
            <div className="h-8 rounded bg-gray-200" />
            <div className="h-5 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-2/3 rounded bg-gray-200" />
            <div className="h-5 w-3/4 rounded bg-gray-200" />
          </div>
          <div className="min-h-[42rem] space-y-4 p-8">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-5 w-full rounded bg-gray-100" />
            <div className="h-5 w-5/6 rounded bg-gray-100" />
            <div className="h-5 w-2/3 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
