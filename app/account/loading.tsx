// Instant skeleton for the account page while the server render is in flight.
export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6 px-6 py-8">
      <div className="h-10 w-44 rounded bg-gray-200" />
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-28 rounded-2xl bg-gray-200" />
      <div className="h-40 rounded-2xl bg-gray-200" />
    </div>
  );
}
