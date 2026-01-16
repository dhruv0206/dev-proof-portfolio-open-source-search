import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Better Auth middleware - simple session cookie check
// For more advanced protection, use auth.api.getSession in RSC/server actions
export function middleware(request: NextRequest) {
  // Currently allowing all requests through
  // Add protected route logic here if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
