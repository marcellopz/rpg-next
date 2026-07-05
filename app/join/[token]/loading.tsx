// Instant skeleton for the invite acceptance flow while the server render is in flight.
export default function JoinLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-6 py-16">
      <div className="mx-auto h-10 w-72 rounded bg-gray-200" />
      <div className="mx-auto mt-4 h-5 w-96 max-w-full rounded bg-gray-100" />
      <div className="mx-auto mt-8 h-12 w-48 rounded-lg bg-gray-200" />
    </div>
  );
}
