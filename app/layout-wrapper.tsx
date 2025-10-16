"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"

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
          <div className="min-h-screen bg-slate-950">
            {children}
          </div>
        </main>
      </>
    )
  }
  
  // For login, admin, and client pages - no sidebar
  return <>{children}</>
}
