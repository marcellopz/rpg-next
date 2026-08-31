"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { Button, TextField, Typography } from "@/components/ui";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const redirectTo = new URL(
      "/auth/callback",
      window.location.origin
    );
    redirectTo.searchParams.set("next", "/auth/update-password");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: redirectTo.toString() }
    );

    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    // Always show success — do not reveal whether the email exists.
    setSent(true);
  }

  return (
    <div
      id="forgot-password-page"
      className="mx-auto max-w-sm space-y-6 px-6 py-12"
    >
      <div className="space-y-1">
        <Typography variant="h2">{t("auth.forgotTitle")}</Typography>
        <Typography variant="muted">{t("auth.forgotDescription")}</Typography>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {sent ? (
        <div className="space-y-4">
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t("auth.forgotSuccess")}
          </p>
          <p className="text-center text-sm text-gray-500">
            <Link
              href="/login"
              className="text-accent-600 hover:text-accent-500"
            >
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-3">
            <TextField
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={busy}
            >
              {busy ? t("auth.forgotSending") : t("auth.forgotSubmit")}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500">
            <Link
              href="/login"
              className="text-accent-600 hover:text-accent-500"
            >
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
