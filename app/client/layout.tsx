import { ClientSidebar } from "@/components/client-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <main className="flex-1 ml-64">
        {children}
      </main>
      <Toaster />
    </div>
  )
}

