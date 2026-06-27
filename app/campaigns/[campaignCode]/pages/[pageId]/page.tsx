// Placeholder route. The rich-text wiki page editor will be rebuilt later.
export default function WikiPage({
  params,
}: {
  params: { campaignCode: string; pageId: string };
}) {
  return (
    <div className="max-w-3xl space-y-3 px-6 py-8">
      <h1 className="text-xl font-bold">Wiki page</h1>
      <p className="text-sm text-gray-500">
        Coming soon (page {params.pageId}).
      </p>
    </div>
  );
}
