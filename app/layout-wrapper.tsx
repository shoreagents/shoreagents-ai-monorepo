"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Sidebar from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import ElectronProvider from "@/components/electron-provider"
import { WebSocketProvider } from "@/lib/websocket-provider"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Don't show sidebar on login pages, admin pages, or client pages
  const isLoginPage = pathname?.startsWith("/login")
  const isAdminPage = pathname?.startsWith("/admin")
  const isClientPage = pathname?.startsWith("/client")
  
  // Staff pages = everything else (root level pages)
  const isStaffPage = !isLoginPage && !isAdminPage && !isClientPage
  
  // Extract user info from session for WebSocket
  const userId = session?.user?.id
  const userName = session?.user?.name || session?.user?.email || undefined
  
  const content = isStaffPage ? (
    <>
      <Sidebar />
      <main className="lg:pl-72">
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4 lg:p-4">
          <div className="rounded-2xl overflow-hidden">
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </>
  ) : (
    // For login, admin, and client pages - no sidebar
    <>{children}</>
  )
  
  return (
    <ElectronProvider>
      <WebSocketProvider userId={userId} userName={userName}>
        {content}
      </WebSocketProvider>
    </ElectronProvider>
  )
}
