"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Don't show sidebar on login pages, admin pages, or client pages
  const isLoginPage = pathname?.startsWith("/login")
  const isAdminPage = pathname?.startsWith("/admin")
  const isClientPage = pathname?.startsWith("/client")
  
  // Staff pages = everything else (root level pages)
  const isStaffPage = !isLoginPage && !isAdminPage && !isClientPage
  
  if (isStaffPage) {
    return (
      <>
        <Sidebar />
        <main className="lg:pl-64">
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4 lg:p-8">
            {children}
          </div>
        </main>
        <Toaster />
      </>
    )
  }
  
  // For login, admin, and client pages - no sidebar
  return <>{children}</>
}
