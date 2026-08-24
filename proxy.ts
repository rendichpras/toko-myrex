import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next()
  }

  const signInUrl = new URL("/masuk", request.url)
  const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`

  signInUrl.searchParams.set("next", redirectTo)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: ["/admin/:path*"],
}
