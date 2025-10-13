import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If trying to access login while authenticated, redirect to home
  if (isAuthenticated && pathname === "/login") {
    return Response.redirect(new URL("/", req.url))
  }

  // If trying to access protected route while not authenticated, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  // Role-based route protection
  if (isAuthenticated) {
    // Client routes - only accessible by CLIENT role
    if (pathname.startsWith("/client") && userRole !== "CLIENT") {
      return Response.redirect(new URL("/", req.url))
    }

    // Staff/Admin routes - prevent clients from accessing
    const staffRoutes = [
      "/tasks",
      "/team",
      "/leaderboard",
      "/performance",
      "/activity",
      "/breaks",
      "/time-tracking",
      "/tickets",
      "/reviews",
      "/ai-assistant"
    ]
    
    if (userRole === "CLIENT" && staffRoutes.some((route) => pathname.startsWith(route))) {
      return Response.redirect(new URL("/client", req.url))
    }
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

