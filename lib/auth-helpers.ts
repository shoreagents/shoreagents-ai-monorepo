import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Get current user if they are a staff member (STAFF or TEAM_LEAD)
 */
export async function getStaffUser() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true }
  })

  if (!user || (user.role !== "STAFF" && user.role !== "TEAM_LEAD")) {
    return null
  }

  return user
}

/**
 * Get current user if they are admin/management (ADMIN or MANAGER)
 */
export async function getAdminUser() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return null
  }

  return user
}

/**
 * Get current ClientUser from session
 */
export async function getClientUser() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }

  const clientUser = await prisma.clientUser.findUnique({
    where: { email: session.user.email },
    include: { client: true }
  })

  return clientUser
}

/**
 * Get the client that a staff member is assigned to
 * Returns null if not assigned to any client
 */
export async function getAssignedClient(userId: string) {
  const assignment = await prisma.staffAssignment.findFirst({
    where: {
      userId,
      isActive: true
    },
    include: { client: true }
  })

  return assignment?.client || null
}

/**
 * Get all staff IDs assigned to a client
 */
export async function getClientStaffIds(clientId: string) {
  const assignments = await prisma.staffAssignment.findMany({
    where: {
      clientId,
      isActive: true
    },
    select: { userId: true }
  })

  return assignments.map(a => a.userId)
}

