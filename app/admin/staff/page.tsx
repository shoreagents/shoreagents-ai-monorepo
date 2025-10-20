"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminStaffPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the onboarding page which is the actual staff management
    router.replace("/admin/staff/onboarding")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to Staff Management...</p>
      </div>
    </div>
  )
}

