import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = ["/", "/upload"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || (pathname.startsWith(route) && route !== "/")
  );

  // Define auth routes (redirect to home if already logged in)
  const authRoutes = ["/login", "/register", "/resend-verification"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
