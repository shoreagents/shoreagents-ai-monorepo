import { ClientSidebar } from "@/components/client-sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // Double-check authorization on server side
  if (!session || session.user?.role !== "CLIENT") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ClientSidebar />
      <main className="flex-1 ml-64">
        <ScrollArea className="h-screen">
          {children}
        </ScrollArea>
      </main>
    </div>
  )
}

