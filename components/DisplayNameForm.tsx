"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, TextField } from "@/components/ui";

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
    <form id="account-settings-form" onSubmit={handleSubmit} className="space-y-3">
      <TextField
        id="account-display-name"
        label="Display name"
        type="text"
        maxLength={60}
        value={displayName}
        onChange={(e) => {
          setDisplayName(e.target.value);
          setStatus("idle");
        }}
        placeholder="How others see you"
        error={error}
      />

      {status === "saved" && (
        <p className="text-sm text-green-600">Display name saved.</p>
      )}

      <Button
        type="submit"
        disabled={busy || displayName.trim() === initialDisplayName.trim()}
      >
        {busy ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
