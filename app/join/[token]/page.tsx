import { AcceptInvite } from "./AcceptInvite";

export default function JoinPage({ params }: { params: { token: string } }) {
  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-bold">You&apos;ve been invited</h1>
      <p className="text-sm text-gray-300">
        Accept this invite to join the campaign. You&apos;ll need to be signed
        in.
      </p>
      <AcceptInvite token={params.token} />
    </div>
  );
}
