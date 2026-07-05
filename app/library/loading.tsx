// Instant skeleton for the personal library while the server render is in flight.
export default function LibraryLoading() {
  return (
    <div className="app-container animate-pulse py-10">
      <div className="mb-8 h-10 w-56 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
