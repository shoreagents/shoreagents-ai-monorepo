"use client"

import { useSession } from "next-auth/react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ReactNode } from "react"

export function MainWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && session

  return (
    <main className={isAuthenticated ? "lg:pl-64" : ""}>
      <ScrollArea className="h-screen">
        {children}
      </ScrollArea>
    </main>
  )
}


