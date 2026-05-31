import { NextResponse, type NextRequest } from "next/server";

// Route old engines (the living-room webOS TV) to the read-only /tv surface.
// The webOS UA is distinctive and includes the Chromium version
// (e.g. "Web0S ... Chrome/53...").
export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  const isLegacyTv =
    /Web0S|webOS/i.test(ua) || /Chrome\/(3\d|4\d|5[0-3])\./.test(ua);
  if (isLegacyTv && !req.nextUrl.pathname.startsWith("/tv")) {
    return NextResponse.redirect(new URL("/tv", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|tv).*)"] };
