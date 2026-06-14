"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    return (
      new URLSearchParams(window.location.search).get("next") ?? "/campaigns"
    );
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
    <div className="mx-auto max-w-sm space-y-6 pt-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {mode === "signup" ? "Create account" : "Sign in"}
        </h1>
        <p className="text-sm text-gray-400">
          {mode === "signup"
            ? "Set up access to your RPG campaigns."
            : "Continue to your RPG campaigns."}
        </p>
      </div>

      {error && (
        <p className="rounded border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <>
          <button
            onClick={signInWithGoogle}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded border border-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {busy === "google" ? "Redirecting…" : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-gray-800" />
            <span>or</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                maxLength={60}
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            )}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            {mode === "signup" && (
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            )}
            <button
              type="submit"
              disabled={busy !== null}
              className="w-full rounded bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy === "email"
                ? mode === "signup"
                  ? "Creating account…"
                  : "Signing in…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="text-indigo-400 hover:text-indigo-300"
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
