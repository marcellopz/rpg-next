import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Paths that never require authentication. Everything else redirects to
// /login when there's no signed-in user.
const PUBLIC_PATHS = ["/login", "/auth", "/tv", "/join", "/campaigns", "/library"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function middleware(req: NextRequest) {
  // 1. Route old engines (the living-room webOS TV) to the read-only /tv
  //    surface. The webOS UA is distinctive and includes the Chromium version
  //    (e.g. "Web0S ... Chrome/53...").
  const ua = req.headers.get("user-agent") ?? "";
  const isLegacyTv =
    /Web0S|webOS/i.test(ua) || /Chrome\/(3\d|4\d|5[0-3])\./.test(ua);
  if (isLegacyTv && !req.nextUrl.pathname.startsWith("/tv")) {
    return NextResponse.redirect(new URL("/tv", req.url));
  }

  // 2. Refresh the Supabase session cookie on every request.
  const { user, response } = await updateSession(req);

  const { pathname } = req.nextUrl;

  // 3. Signed-in users shouldn't see the login page — honor `next` when present.
  if (user && pathname === "/login") {
    const next = req.nextUrl.searchParams.get("next");
    const destination =
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/campaigns";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // 4. Unauthenticated users hitting a protected route go to /login, with a
  //    `next` param so we can send them back after they sign in.
  if (!user && !isPublic(pathname)) {
    const returnPath = pathname + req.nextUrl.search;
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", returnPath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals, the API, and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
