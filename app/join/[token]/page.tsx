// Placeholder route. Invite acceptance will be rebuilt on top of the auth
// flow later.
export default function JoinPage({ params }: { params: { token: string } }) {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-xl font-bold">You&apos;ve been invited</h1>
      <p className="text-sm text-gray-500">
        Coming soon (invite {params.token}).
      </p>
    </div>
  );
}
