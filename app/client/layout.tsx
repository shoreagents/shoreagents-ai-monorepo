import { ClientSidebar } from "@/components/client-sidebar"

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
    </div>
  )
}

