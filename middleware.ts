import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "./utils/rateLimit";

export function middleware(request: NextRequest) {
  const ip = (request as any).ip || request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { success } = rateLimit(ip);

  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

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
