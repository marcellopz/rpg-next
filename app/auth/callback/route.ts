// Completes both auth flows and lands the user in the app:
//  - OAuth (Google): the provider redirects back with a `code` we exchange
//    for a session.
//  - Magic link (email OTP): the email link comes back with `token_hash` +
//    `type` we verify.
// Either way the SSR client writes the session cookie before we redirect.
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  AUTH_RETURN_COOKIE,
  safeReturnPath,
} from "@/lib/auth/login-url";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const cookieNext = request.cookies.get(AUTH_RETURN_COOKIE)?.value;
  const decodedCookie = cookieNext
    ? decodeURIComponent(cookieNext)
    : null;
  const next = safeReturnPath(searchParams.get("next") ?? decodedCookie);

  const supabase = createServerClient();

  let authError: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) authError = error.message;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) authError = error.message;
  } else {
    authError = "Missing authentication parameters.";
  }

  if (authError) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", authError);
    if (next !== "/campaigns") loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.delete(AUTH_RETURN_COOKIE);
  return response;
}
