// CLERK AUTH TEMPORARILY DISABLED - Uncomment when needed
// import { clerkMiddleware } from '@clerk/nextjs/server'

// // Clerk middleware - handles auth context
// // All routes are public by default, we handle limiting in the client
// export default clerkMiddleware()

// Placeholder middleware - does nothing
export function middleware() {
  // No-op middleware
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
