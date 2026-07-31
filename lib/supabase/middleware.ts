// Session-refresh helper for use inside Next.js middleware.
//
// Middleware runs before every matched request. Supabase access tokens are
// short-lived, so each request we create a request/response-bound client,
// verify the token (refreshing it if needed), and let the SSR client write any
// rotated cookies back onto the response. We return both the user (for
// route-protection decisions) and the response (so cookies propagate).
//
// getClaims() rather than getUser(): this project uses an asymmetric JWT signing
// key, so verification happens locally against a cached JWKS instead of a
// network round trip to the auth server on every single request. getClaims()
// still refreshes the session when the access token is near expiry, so cookie
// rotation keeps working.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getClaims();
  const user = error || !data?.claims?.sub ? null : { id: data.claims.sub };

  return { user, response };
}
