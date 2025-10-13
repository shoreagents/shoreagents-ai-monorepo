import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

/**
 * Verify that the user is authenticated and has the CLIENT role
 * Returns the authenticated session or null if unauthorized
 */
export async function verifyClientAuth() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (session.user.role !== "CLIENT") {
    return { session: null, error: NextResponse.json({ error: "Forbidden - Client access only" }, { status: 403 }) }
  }

  return { session, error: null }
}

/**
 * Verify that the user is authenticated and has STAFF or ADMIN role
 * Returns the authenticated session or null if unauthorized
 */
export async function verifyStaffAuth() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  if (session.user.role !== "STAFF" && session.user.role !== "ADMIN") {
    return { session: null, error: NextResponse.json({ error: "Forbidden - Staff access only" }, { status: 403 }) }
  }

  return { session, error: null }
}

/**
 * Verify that the user is authenticated (any role)
 * Returns the authenticated session or null if unauthorized
 */
export async function verifyAuth() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  return { session, error: null }
}

