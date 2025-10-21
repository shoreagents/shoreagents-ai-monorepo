import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { prisma } from "@/lib/prisma"
import { Toaster } from "@/components/ui/toaster"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Must be logged in
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }

  // Must have ADMIN or MANAGER role
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    // Redirect based on their actual role
    if (session.user.role === "CLIENT") {
      redirect("/client")
    } else {
      // STAFF, TEAM_LEAD go to staff portal
      redirect("/")
    }
  }

  // Fetch full management user profile
  const managementUser = await prisma.managementUser.findUnique({
    where: { authUserId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      coverPhoto: true,
      role: true,
      department: true,
    }
  })

  if (!managementUser) {
    redirect("/login/admin")
  }

  return (
    <div className="dark">
      <AdminSidebar user={managementUser}>{children}</AdminSidebar>
      <Toaster />
    </div>
  )
}

