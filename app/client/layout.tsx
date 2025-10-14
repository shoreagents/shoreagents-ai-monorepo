import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientSidebar } from "@/components/client-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // Must be logged in
  if (!session?.user?.email) {
    redirect("/login/client?callbackUrl=/client")
  }

  // Verify user exists in ClientUser table
  const clientUser = await prisma.clientUser.findUnique({
    where: { email: session.user.email },
    include: { company: true }
  })

  if (!clientUser) {
    // Not a valid client user - redirect to staff login
    redirect("/login/staff")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar user={clientUser} />
      <main className="flex-1 ml-64">
        {children}
      </main>
      <Toaster />
    </div>
  )
}

