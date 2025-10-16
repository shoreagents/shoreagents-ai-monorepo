"use client"

import { useEffect, useState } from "react"
import { X, Video, Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface StaffUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

interface StaffSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StaffSelectionModal({ isOpen, onClose }: StaffSelectionModalProps) {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffUser[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchStaff()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery) {
      setFilteredStaff(
        staff.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredStaff(staff)
    }
  }, [searchQuery, staff])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/client/staff")
      if (!response.ok) throw new Error("Failed to fetch staff")
      
      const data = await response.json()
      setStaff(data.staff)
      setFilteredStaff(data.staff)
    } catch (error) {
      console.error("Error fetching staff:", error)
      alert("Failed to load staff members")
    } finally {
      setLoading(false)
    }
  }

  const handleCallStaff = async (staffMember: StaffUser) => {
    setCalling(staffMember.id)
    
    try {
      const response = await fetch("/api/daily/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staffMember.id,
          staffName: staffMember.name
        })
      })

      if (!response.ok) throw new Error("Failed to create room")

      const data = await response.json()
      
      // Redirect to call room
      router.push(`/client/call/${data.roomName}?url=${encodeURIComponent(data.roomUrl)}&staff=${encodeURIComponent(data.staffName)}`)
      onClose()
    } catch (error) {
      console.error("Error creating call:", error)
      alert("Failed to start call. Please try again.")
      setCalling(null)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div>
            <h2 className="text-2xl font-bold">Start Video Call</h2>
            <p className="text-sm text-white/80">Select a staff member to call</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Staff List */}
        <div className="overflow-y-auto max-h-[400px] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? "No staff found matching your search" : "No staff members available"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStaff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {staffMember.avatar ? (
                      <img
                        src={staffMember.avatar}
                        alt={staffMember.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                        {getInitials(staffMember.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{staffMember.name}</div>
                      <div className="text-sm text-gray-500">{staffMember.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCallStaff(staffMember)}
                    disabled={calling === staffMember.id}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {calling === staffMember.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calling...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Call
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

