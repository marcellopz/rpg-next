"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_RETURN_COOKIE,
  AUTH_RETURN_MAX_AGE,
  safeReturnPath,
} from "@/lib/auth/login-url";
import { Button, TextField, Typography } from "@/components/ui";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Surface any error handed back by the /auth/callback redirect.
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) setError(err);
  }, []);

  // Where to send the user after a successful sign-in.
  function nextPath() {
    return safeReturnPath(
      new URLSearchParams(window.location.search).get("next")
    );
  }

  function rememberReturnPath() {
    document.cookie = `${AUTH_RETURN_COOKIE}=${encodeURIComponent(nextPath())}; path=/; max-age=${AUTH_RETURN_MAX_AGE}; SameSite=Lax`;
  }

  // Build the callback URL, forwarding any `next` param so OAuth / email
  // confirmation links land the user where they were headed.
  function callbackUrl() {
    const url = new URL("/auth/callback", window.location.origin);
    const next = new URLSearchParams(window.location.search).get("next");
    if (next) url.searchParams.set("next", next);
    return url.toString();
  }

  // Reset transient UI state and drop any stale `?error=` from the URL so it
  // can't reappear on the next render.
  function resetTransientState() {
    setError(null);
    setPassword("");
    setConfirmPassword("");

    const params = new URLSearchParams(window.location.search);
    if (params.has("error")) {
      params.delete("error");
      const qs = params.toString();
      router.replace(`/login${qs ? `?${qs}` : ""}`);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetTransientState();
  }

  async function signInWithGoogle() {
    setBusy("google");
    setError(null);
    rememberReturnPath();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setBusy(null);
    }
    // On success the browser is redirected to Google, so no further work here.
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setBusy(null);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
      // Email confirmation is disabled, so sign-up returns an active session
      // and we sign the user straight in. If confirmation is ever re-enabled
      // there'll be no session yet — surface that instead of failing silently.
      if (!data.session) {
        setError(
          "Account created. Check your email to confirm it, then sign in."
        );
        setBusy(null);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setBusy(null);
        return;
      }
    }

    router.push(nextPath());
    router.refresh();
  }

  return (
    <div id="login-page" className="mx-auto max-w-sm space-y-6 px-6 py-12">
      <div className="space-y-1">
        <Typography variant="h2">
          {mode === "signup" ? "Create account" : "Sign in"}
        </Typography>
        <Typography variant="muted">
          {mode === "signup"
            ? "Set up access to your RPG campaigns."
            : "Continue to your RPG campaigns."}
        </Typography>
      </div>

      {error && (
        <p id="login-error" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <>
          <Button
            variant="secondary"
            fullWidth
            onClick={signInWithGoogle}
            disabled={busy !== null}
          >
            {busy === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            <span>or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form id="login-form" onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "signup" && (
              <TextField
                type="text"
                required
                maxLength={60}
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
              />
            )}
            <TextField
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <TextField
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            {mode === "signup" && (
              <TextField
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            )}
            <Button type="submit" variant="primary" fullWidth disabled={busy !== null}>
              {busy === "email"
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-accent-600 hover:text-accent-500"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-accent-600 hover:text-accent-500"
                >
                  Create one
                </button>
              </>
            )}
          </p>
      </>
    </div>
  );
}
