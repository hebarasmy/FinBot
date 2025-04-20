import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = path === "/login" || path === "/signup" || path === "/forgot-password" || path === "/verify"
  const hasSession = request.cookies.has("user-session")
  const isVerified = request.cookies.get("email_verified")?.value === "true"
  const pendingVerification = request.cookies.get("pending_verification")?.value === "true"

  // handling for verification page
  if (path === "/verify") {
    if (!pendingVerification) {
      return NextResponse.redirect(new URL("/signup", request.url))
    }
    return NextResponse.next()
  }

  // redirecting
  if (isPublicPath && hasSession && isVerified) {
    return NextResponse.redirect(new URL("/finalyear", request.url))
  }

  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!isPublicPath && hasSession && !isVerified && !pendingVerification) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/finalyear/:path*", "/login", "/signup", "/forgot-password", "/verify", "/profile", "/profile/:path*"],
}

