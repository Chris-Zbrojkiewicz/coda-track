import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isAppRoute =
    pathname === "/dashboard" ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/settings");

  if (isAppRoute && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
