import { NextResponse, type NextRequest } from "next/server";
import { safeAppPath } from "@/lib/paths";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("cc_session")?.value;

  if (pathname.startsWith("/app") && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login" && session) {
    const next = safeAppPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next, request.url));
  }

  if (
    (pathname.startsWith("/invite/") ||
      pathname === "/forgot-password" ||
      pathname.startsWith("/reset-password/")) &&
    session
  ) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/invite/:path*",
    "/forgot-password",
    "/reset-password/:path*",
  ],
};
