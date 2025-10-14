"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"

type ClientUserWithCompany = {
  id: string
  name: string
  email: string
  avatar: string | null
  coverPhoto: string | null
  role: string
  company: {
    id: string
    companyName: string
    organizationId: string
  }
}

export function ClientProfileHeader({ user }: { user: ClientUserWithCompany }) {
  const router = useRouter()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/client/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      alert('Avatar uploaded successfully!')
      router.refresh()
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/client/profile/cover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      alert('Cover photo uploaded successfully!')
      router.refresh()
    } catch (error) {
      console.error('Cover upload error:', error)
      alert('Failed to upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600">
        {user.coverPhoto && (
          <img
            src={user.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Upload Cover Button */}
        <label className="absolute top-4 right-4 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
            disabled={uploadingCover}
          />
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            disabled={uploadingCover}
            asChild
          >
            <span>
              {uploadingCover ? (
                <>Uploading...</>
              ) : (
                <>
                  <Camera className="size-4" />
                  Change Cover
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4 inline-block">
          <Avatar className="size-32 border-4 border-background">
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-4xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Upload Avatar Button */}
          <label className="absolute bottom-0 right-0 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
            <Button
              size="icon"
              className="size-8 rounded-full"
              disabled={uploadingAvatar}
              asChild
            >
              <span>
                <Camera className="size-4" />
              </span>
            </Button>
          </label>
        </div>

        {/* User Info */}
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground text-lg">
            {user.role} - {user.company.companyName}
          </p>
        </div>
      </div>
    </Card>
  )
}
