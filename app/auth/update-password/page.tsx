"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Button, TextField, Typography } from "@/components/ui";

export default function UpdatePasswordPage() {
  const { t } = useI18n();
  const supabase = createClient();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      if (cancelled) return;
      setHasSession(Boolean(user));
      setReady(true);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/campaigns");
    router.refresh();
  }

  if (!ready) {
    return (
      <div
        id="update-password-page"
        className="mx-auto max-w-sm space-y-6 px-6 py-12"
      >
        <Typography variant="muted">{t("buttons.loading")}</Typography>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div
        id="update-password-page"
        className="mx-auto max-w-sm space-y-6 px-6 py-12"
      >
        <div className="space-y-1">
          <Typography variant="h2">{t("auth.updateTitle")}</Typography>
        </div>
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {t("auth.noSession")}
        </p>
        <p className="text-center text-sm text-gray-500">
          <Link
            href="/auth/forgot-password"
            className="text-accent-600 hover:text-accent-500"
          >
            {t("auth.requestNewLink")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div
      id="update-password-page"
      className="mx-auto max-w-sm space-y-6 px-6 py-12"
    >
      <div className="space-y-1">
        <Typography variant="h2">{t("auth.updateTitle")}</Typography>
        <Typography variant="muted">{t("auth.updateDescription")}</Typography>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <TextField
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.newPassword")}
        />
        <TextField
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("auth.confirmPassword")}
        />
        <Button type="submit" variant="primary" fullWidth disabled={busy}>
          {busy ? t("auth.updateSaving") : t("auth.updateSubmit")}
        </Button>
      </form>
    </div>
  );
}
