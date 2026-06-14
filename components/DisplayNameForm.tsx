"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DisplayNameForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus("idle");

    const supabase = createClient();
    // Users may always update their own auth metadata, so this is a direct
    // client call rather than a server action.
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    setStatus("saved");
    setBusy(false);
    // Refresh so the server-rendered navbar picks up the new name.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="displayName" className="block text-sm text-gray-700">
        Display name
      </label>
      <input
        id="displayName"
        type="text"
        maxLength={60}
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          setStatus("idle");
        }}
        placeholder="How others see you"
        className="w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-500 focus:outline-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {status === "saved" && (
        <p className="text-sm text-green-600">Display name saved.</p>
      )}

      <button
        type="submit"
        disabled={busy || displayName.trim() === initialDisplayName.trim()}
        className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
