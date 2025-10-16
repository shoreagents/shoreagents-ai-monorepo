import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Get current StaffUser from session
 */
export async function getStaffUser() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }

  const staffUser = await prisma.staffUser.findUnique({
    where: { authUserId: session.user.id },
    include: { profile: true, company: true }
  })

  return staffUser
}

/**
 * Get current AdminUser from session
 */
export async function getAdminUser() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }

  const adminUser = await prisma.managementUser.findUnique({
    where: { email: session.user.email }
  })

  return adminUser
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
    include: { company: true }
  })

  return clientUser
}

