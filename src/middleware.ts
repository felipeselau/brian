import { middlewareAuth } from "@/lib/auth-middleware";
import { NextResponse } from "next/server";

// Disable Edge Runtime - uses Node.js APIs
export const runtime = "nodejs";

export default middlewareAuth((req: any) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const hasInviteToken = req.nextUrl.searchParams.has("token");

  // Public routes
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Auth routes - redirect to dashboard if already logged in
  // EXCEPTION: Allow logged-in users to access /register with invite token
  if (isPublicRoute && isLoggedIn) {
    if (pathname.startsWith("/register") && hasInviteToken) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protected routes - redirect to login if not logged in
  if (!isPublicRoute && !isLoggedIn && pathname !== "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
