"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/actions/invites";

export function AcceptInvite({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleAccept() {
    setBusy(true);
    setError(null);
    try {
      const campaignId = await acceptInvite(token);
      router.push(`/campaigns/${campaignId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept invite");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleAccept}
        disabled={busy}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Joining…" : "Accept invite"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
