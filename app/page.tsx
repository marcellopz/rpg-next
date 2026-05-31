import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">RPG Campaign Manager</h1>
      <p className="text-gray-300">
        A OneNote-style campaign wiki with rich-text pages, character sheets and
        inventories, a live combat log, member invites, file uploads, a
        cross-campaign personal library, and a read-only TV display surface.
      </p>
      <div className="flex gap-3 pt-2">
        <Link
          href="/campaigns"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Go to campaigns
        </Link>
        <Link
          href="/library"
          className="rounded border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800"
        >
          Personal library
        </Link>
      </div>
    </div>
  );
}
