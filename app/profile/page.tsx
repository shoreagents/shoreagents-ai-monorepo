"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload } from "lucide-react"
import { toast } from "sonner"

interface StaffUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  coverPhoto?: string
  companyId?: string
  createdAt: string
}

export default function StaffProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/staff")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      
      if (res.ok) {
        setUser(data.user)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/staff/profile/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Avatar updated successfully!")
        fetchProfile() // Refresh profile
      } else {
        toast.error(data.error || "Failed to upload avatar")
      }
    } catch (error) {
      toast.error("Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/staff/profile/cover", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Cover photo updated successfully!")
        fetchProfile() // Refresh profile
      } else {
        toast.error(data.error || "Failed to upload cover photo")
      }
    } catch (error) {
      toast.error("Failed to upload cover photo")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">User not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
      </div>

      {/* Cover Photo & Avatar Section */}
      <Card className="overflow-hidden bg-slate-800/50 border-slate-700">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-purple-600 to-indigo-600">
          {user.coverPhoto && (
            <img
              src={user.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-4 right-4">
            <label htmlFor="cover-upload">
              <Button
                variant="secondary"
                size="sm"
                disabled={uploading}
                className="cursor-pointer"
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Change Cover"}
                </span>
              </Button>
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Avatar */}
        <div className="relative px-6 -mt-16 pb-6">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-700 overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br from-purple-600 to-indigo-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full cursor-pointer transition-colors"
            >
              <Camera className="w-5 h-5" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 space-y-4">
          <div>
            <Label className="text-slate-300">Full Name</Label>
            <Input
              value={user.name}
              readOnly
              className="mt-2 bg-slate-900/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Email Address</Label>
            <Input
              value={user.email}
              readOnly
              className="mt-2 bg-slate-900/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Role</Label>
            <Input
              value={user.role}
              readOnly
              className="mt-2 bg-slate-900/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Company</Label>
            <Input
              value={user.companyId || "Not assigned yet"}
              readOnly
              className="mt-2 bg-slate-900/50 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-300">Member Since</Label>
            <Input
              value={new Date(user.createdAt).toLocaleDateString()}
              readOnly
              className="mt-2 bg-slate-900/50 border-slate-600 text-white"
            />
          </div>
        </div>
      </Card>

      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> Your profile information is managed by your administrator. 
          To update your name, email, or company assignment, please contact your manager.
        </p>
      </div>
    </div>
  )
}
