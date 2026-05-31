"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/app/actions/campaigns";

export function NewCampaignButton() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const c = await createCampaign(name.trim());
      router.push(`/campaigns/${c.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New campaign name"
        className="rounded border border-gray-700 bg-transparent px-3 py-2 text-sm"
      />
      <button
        onClick={handleCreate}
        disabled={busy}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create campaign"}
      </button>
    </div>
  );
}
