import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClientSidebar } from "@/components/client-sidebar"
import { Toaster } from "@/components/ui/toaster"
import FloatingCallButton from "@/components/client/floating-call-button"
import { WebSocketProvider } from "@/lib/websocket-provider"

async function fetchClientUser(email: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.client_users.findUnique({
        where: { email },
        include: { company: true }
      })
    } catch (error) {
      console.error(`[ClientLayout] Attempt ${i + 1}/${retries} failed:`, error)
      if (i === retries - 1) throw error
      // Exponential backoff: 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)))
    }
  }
}

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

  // Verify user exists in ClientUser table with retry logic
  let clientUser
  try {
    clientUser = await fetchClientUser(session.user.email)
  } catch (error) {
    console.error('[ClientLayout] Failed to fetch client user after retries:', error)
    // Redirect to login on persistent connection failure
    redirect("/login/client?error=connection")
  }

  if (!clientUser) {
    // Not a valid client user - redirect to staff login
    redirect("/login/staff")
  }

  return (
    <WebSocketProvider userId={clientUser.id} userName={clientUser.name}>
      <div className="flex min-h-screen bg-gray-50">
        <ClientSidebar user={clientUser} />
        <main className="flex-1 ml-64">
          {children}
        </main>
        <Toaster />
        <FloatingCallButton />
      </div>
    </WebSocketProvider>
  )
}

