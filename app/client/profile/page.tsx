"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Briefcase, Phone, Clock, Edit2, Save, X, Building2, Bell, Camera } from "lucide-react"
import { uploadClientFile, deleteClientFile } from "@/lib/supabase-upload"

type ClientProfile = {
  id: string
  position: string | null
  department: string | null
  directPhone: string | null
  mobilePhone: string | null
  timezone: string | null
  bio: string | null
  notifyTaskCreate: boolean
  notifyTaskComplete: boolean
  notifyReviews: boolean
  notifyWeeklyReports: boolean
  tasksCreated: number
  reviewsSubmitted: number
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type Company = {
  id: string
  companyName: string
  logo: string | null
  location: string | null
}

type ClientUser = {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  coverPhoto: string | null
  company: Company
}

type ProfileData = {
  clientUser: ClientUser
  profile: ClientProfile | null
}

export default function ClientProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/client/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const profileData = await response.json()
      setData(profileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    setEditedProfile({
      position: data?.profile?.position || '',
      department: data?.profile?.department || '',
      directPhone: data?.profile?.directPhone || '',
      mobilePhone: data?.profile?.mobilePhone || '',
      timezone: data?.profile?.timezone || '',
      bio: data?.profile?.bio || '',
      notifyTaskCreate: data?.profile?.notifyTaskCreate ?? true,
      notifyTaskComplete: data?.profile?.notifyTaskComplete ?? true,
      notifyReviews: data?.profile?.notifyReviews ?? true,
      notifyWeeklyReports: data?.profile?.notifyWeeklyReports ?? true
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditedProfile({})
  }

  const saveProfile = async () => {
    try {
      const response = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile),
      })
      if (!response.ok) throw new Error('Failed to update profile')
      await fetchProfile()
      setEditing(false)
      setEditedProfile({})
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return

    setUploadingAvatar(true)
    try {
      // Delete old avatar if exists
      if (data.clientUser.avatar) {
        await deleteClientFile(data.clientUser.avatar)
      }

      // Upload new avatar
      const avatarUrl = await uploadClientFile(file, data.clientUser.id, 'avatar')

      // Update client user in database
      const response = await fetch('/api/client/profile/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarUrl }),
      })

      if (!response.ok) throw new Error('Failed to update avatar')
      
      await fetchProfile()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !data) return

    setUploadingCover(true)
    try {
      // Delete old cover if exists
      if (data.clientUser.coverPhoto) {
        await deleteClientFile(data.clientUser.coverPhoto)
      }

      // Upload new cover photo
      const coverUrl = await uploadClientFile(file, data.clientUser.id, 'cover')

      // Update client user in database
      const response = await fetch('/api/client/profile/cover', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverPhoto: coverUrl }),
      })

      if (!response.ok) throw new Error('Failed to update cover photo')
      
      await fetchProfile()
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      alert('Failed to upload cover photo')
    } finally {
      setUploadingCover(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    )
  }

  const { clientUser, profile } = data
  const initials = clientUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
        </div>
        {!editing ? (
          <Button onClick={startEditing} className="bg-blue-600 hover:bg-blue-700">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={saveProfile} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={cancelEditing} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Profile Header Card with Cover Photo and Avatar */}
      <Card className="overflow-hidden border-blue-200">
        {/* Cover Photo Banner */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-cyan-500 group">
          {clientUser.coverPhoto ? (
            <img src={clientUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500" />
          )}
          {/* Cover Upload Overlay */}
          <label 
            htmlFor="cover-upload" 
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {uploadingCover ? (
              <div className="text-white text-sm">Uploading cover photo...</div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-8 w-8 text-white" />
                <span className="text-white text-sm font-medium">Change Cover Photo</span>
              </div>
            )}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
            disabled={uploadingCover}
          />
        </div>

        {/* Profile Content */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="flex items-start gap-6">
            {/* Avatar with Upload */}
            <div className="flex-shrink-0 -mt-16">
              <div className="relative w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden group">
                {clientUser.avatar ? (
                  <img src={clientUser.avatar} alt={clientUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-semibold">
                    {initials}
                  </div>
                )}
                {/* Upload Button Overlay */}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <div className="text-white text-xs">Uploading...</div>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-4">
              <h2 className="text-3xl font-bold text-gray-900">{clientUser.name}</h2>
              <p className="text-gray-600 mt-1 text-lg">{profile?.position || clientUser.role}</p>
              {profile?.department && (
                <p className="text-sm text-gray-600">{profile.department}</p>
              )}
              {profile?.bio && (
                <p className="text-gray-700 mt-3">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {clientUser.company.companyName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-blue-600" />
                  {clientUser.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h3>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Position / Job Title</Label>
                <Input
                  value={editedProfile.position || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, position: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="e.g., CEO, Operations Manager"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Department</Label>
                <Input
                  value={editedProfile.department || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, department: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="e.g., Operations, Marketing"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Timezone</Label>
                <Input
                  value={editedProfile.timezone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, timezone: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="e.g., America/New_York, Asia/Manila"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Bio</Label>
                <Textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {profile?.position && (
                <div>
                  <p className="text-sm text-gray-600">Position</p>
                  <p className="text-gray-900 font-medium">{profile.position}</p>
                </div>
              )}
              {profile?.department && (
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="text-gray-900 font-medium">{profile.department}</p>
                </div>
              )}
              {profile?.timezone && (
                <div>
                  <p className="text-sm text-gray-600">Timezone</p>
                  <p className="text-gray-900 font-medium">{profile.timezone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-gray-900 font-medium">{clientUser.role}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Direct Phone</Label>
                <Input
                  value={editedProfile.directPhone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, directPhone: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="+1 234 567 8900"
                />
              </div>
              
              <div>
                <Label className="text-gray-900 font-medium mb-2 block">Mobile Phone</Label>
                <Input
                  value={editedProfile.mobilePhone || ''}
                  onChange={(e) => setEditedProfile({...editedProfile, mobilePhone: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{clientUser.email}</p>
                </div>
              </div>
              {profile?.directPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Direct Phone</p>
                    <p className="text-gray-900 font-medium">{profile.directPhone}</p>
                  </div>
                </div>
              )}
              {profile?.mobilePhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Mobile Phone</p>
                    <p className="text-gray-900 font-medium">{profile.mobilePhone}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Activity Statistics */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Activity Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{profile?.tasksCreated || 0}</p>
            <p className="text-sm text-gray-600">Tasks Created</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{profile?.reviewsSubmitted || 0}</p>
            <p className="text-sm text-gray-600">Reviews Submitted</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-900 font-medium">
              {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never'}
            </p>
            <p className="text-sm text-gray-600">Last Login</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-900 font-medium">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Member Since</p>
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Notification Preferences
        </h3>
        
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-900">Task Created</Label>
              <Switch
                checked={editedProfile.notifyTaskCreate ?? true}
                onCheckedChange={(checked) => setEditedProfile({...editedProfile, notifyTaskCreate: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-900">Task Completed</Label>
              <Switch
                checked={editedProfile.notifyTaskComplete ?? true}
                onCheckedChange={(checked) => setEditedProfile({...editedProfile, notifyTaskComplete: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-900">Reviews</Label>
              <Switch
                checked={editedProfile.notifyReviews ?? true}
                onCheckedChange={(checked) => setEditedProfile({...editedProfile, notifyReviews: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-900">Weekly Reports</Label>
              <Switch
                checked={editedProfile.notifyWeeklyReports ?? true}
                onCheckedChange={(checked) => setEditedProfile({...editedProfile, notifyWeeklyReports: checked})}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Task Created</span>
              <span className={`px-3 py-1 rounded-full text-sm ${profile?.notifyTaskCreate ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {profile?.notifyTaskCreate ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Task Completed</span>
              <span className={`px-3 py-1 rounded-full text-sm ${profile?.notifyTaskComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {profile?.notifyTaskComplete ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Reviews</span>
              <span className={`px-3 py-1 rounded-full text-sm ${profile?.notifyReviews ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {profile?.notifyReviews ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Weekly Reports</span>
              <span className={`px-3 py-1 rounded-full text-sm ${profile?.notifyWeeklyReports ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {profile?.notifyWeeklyReports ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
