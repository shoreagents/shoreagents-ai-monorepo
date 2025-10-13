import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

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

  // Must have ADMIN role
  if (session.user.role !== "ADMIN") {
    // Redirect based on their actual role
    if (session.user.role === "CLIENT") {
      redirect("/client")
    } else {
      // STAFF, TEAM_LEAD, MANAGER go to staff portal
      redirect("/")
    }
  }

  return <AdminSidebar>{children}</AdminSidebar>
}

