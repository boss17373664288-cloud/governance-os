import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry/i.test(userAgent);
  const { pathname } = request.nextUrl;

  // Skip API, static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Mobile user: redirect to mobile pages
  if (isMobile) {
    // Already on mobile page - allow
    if (pathname.startsWith("/mobile")) return NextResponse.next();
    
    // Login page -> mobile login
    if (pathname === "/login" || pathname === "/") {
      return NextResponse.redirect(new URL("/mobile/login", request.url));
    }
    
    // Other pages -> mobile equivalent
    return NextResponse.redirect(new URL("/mobile" + pathname, request.url));
  }

  // Desktop user on mobile page -> redirect to desktop
  if (!isMobile && pathname.startsWith("/mobile")) {
    const desktopPath = pathname.replace("/mobile", "") || "/";
    return NextResponse.redirect(new URL(desktopPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};