"use client"

import { use, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import VideoCallRoom from "@/components/client/video-call-room"
import { Loader2 } from "lucide-react"

export default function CallRoomPage({
  params
}: {
  params: Promise<{ roomId: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resolvedParams = use(params)
  
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string>("Staff Member")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get room URL and staff name from query params
    const url = searchParams.get("url")
    const staff = searchParams.get("staff")

    if (!url) {
      console.error("No room URL provided")
      router.push("/client")
      return
    }

    setRoomUrl(decodeURIComponent(url))
    if (staff) {
      setStaffName(decodeURIComponent(staff))
    }
    setLoading(false)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Preparing call...</p>
        </div>
      </div>
    )
  }

  if (!roomUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">❌ Invalid call link</p>
          <button
            onClick={() => router.push("/client")}
            className="px-6 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <VideoCallRoom roomUrl={roomUrl} staffName={staffName} />
}

