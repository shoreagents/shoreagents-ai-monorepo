"use client"

import { useState, useEffect, useRef } from "react"
import { Building2, Calendar, DollarSign, Mail, MapPin, Phone, User, Briefcase, Clock, TrendingUp, Shield, Umbrella, Heart, Camera, Upload } from "lucide-react"
import Image from "next/image"

interface ProfileData {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar: string | null
    coverPhoto: string | null
  }
  company: {
    name: string
    accountManager: string | null
  } | null
  profile: {
    phone: string | null
    location: string | null
    gender: string | null
    civilStatus: string | null
    dateOfBirth: string | null
    employmentStatus: string
    startDate: string
    daysEmployed: number
    currentRole: string
    salary: number
    lastPayIncrease: string | null
    lastIncreaseAmount: number | null
    totalLeave: number
    usedLeave: number
    vacationUsed: number
    sickUsed: number
    hmo: boolean
  } | null
  workSchedules: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isWorkday: boolean
  }>
}

export default function ProfileView() {
  const [mounted, setMounted] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile data")
      }
      const data = await response.json()
      setProfileData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }

      // Refresh profile data
      await fetchProfileData()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    const formData = new FormData()
    formData.append('cover', file)

    try {
      const response = await fetch('/api/profile/cover', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload cover photo')
      }

      // Refresh profile data
      await fetchProfileData()
    } catch (error) {
      console.error('Error uploading cover:', error)
      alert(`Failed to upload cover: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploadingCover(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-80 rounded-2xl bg-slate-800/50 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
            <div className="h-96 rounded-xl bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !profileData || !profileData.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Profile</h2>
            <p className="mt-2 text-red-300">{error || "No profile data found"}</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, company, profile, workSchedules } = profileData
  const remainingLeave = profile.totalLeave - profile.usedLeave

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Cover Photo & Avatar Section */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 shadow-2xl ring-1 ring-white/10">
          {/* Cover Photo */}
          <div className="group relative h-64 overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            {user.coverPhoto ? (
              <Image
                src={user.coverPhoto}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-white/30">
                  <Camera className="mx-auto mb-2 h-12 w-12" />
                  <p className="text-sm">Add cover photo</p>
                </div>
              </div>
            )}
            
            {/* Cover Upload Button */}
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-black/70 disabled:opacity-50"
            >
              {uploadingCover ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Change Cover
                </>
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-20 mb-4">
              <div className="group relative inline-block">
                <div className="relative h-40 w-40 overflow-hidden rounded-2xl ring-4 ring-slate-900">
                  <Image
                    src={user.avatar || "/placeholder-user.jpg"}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Avatar Upload Button */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name & Info */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white">{user.name}</h1>
                <p className="mt-1 text-xl text-indigo-300">{profile.currentRole}</p>
                <p className="mt-1 flex items-center gap-2 text-slate-400">
                  <Building2 className="h-4 w-4" />
                  {company?.name || "No company assigned"}
                </p>
              </div>
              <div className="flex gap-3">
                <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 px-6 py-3 ring-1 ring-emerald-400/30">
                  <div className="text-xs text-emerald-300">Status</div>
                  <div className="text-lg font-bold text-emerald-400">{profile.employmentStatus}</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 px-6 py-3 ring-1 ring-indigo-400/30">
                  <div className="text-xs text-indigo-300">Days</div>
                  <div className="text-lg font-bold text-indigo-400">{profile.daysEmployed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <div className="space-y-6 rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <User className="h-6 w-6 text-blue-400" />
              Personal Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Email</div>
                  <div className="font-semibold text-white">{user.email}</div>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Phone</div>
                    <div className="font-semibold text-white">{profile.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Join Date</div>
                  <div className="font-semibold text-white">
                    {mounted ? formatDate(profile.startDate) : profile.startDate}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Days Employed</div>
                  <div className="font-semibold text-white">{profile.daysEmployed} days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-6 rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="flex items-center gap-2 text-xl font-bold text-white">
              <Briefcase className="h-6 w-6 text-purple-400" />
              Employment Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Company/Client</div>
                  <div className="font-semibold text-white">{company?.name || "No company assigned"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Account Manager</div>
                  <div className="font-semibold text-white">{company?.accountManager || "Not assigned"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm text-slate-400">Salary</div>
                  <div className="font-semibold text-white">{formatCurrency(profile.salary)}/month</div>
                </div>
              </div>
              {profile.lastPayIncrease && profile.lastIncreaseAmount && (
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Last Pay Increase</div>
                    <div className="font-semibold text-white">
                      {formatCurrency(profile.lastIncreaseAmount)} on {mounted ? formatDate(profile.lastPayIncrease) : profile.lastPayIncrease}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Work Schedule */}
        <div className="rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <Calendar className="h-6 w-6 text-amber-400" />
            Work Schedule
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {workSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`rounded-xl p-4 ring-1 transition-all hover:scale-105 ${
                  schedule.isWorkday
                    ? "bg-emerald-500/10 ring-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-slate-800/50 ring-white/10 hover:bg-slate-800/70"
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-white">{schedule.dayOfWeek}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {schedule.isWorkday ? (
                      <>
                        <div>{schedule.startTime}</div>
                        <div>-</div>
                        <div>{schedule.endTime}</div>
                      </>
                    ) : (
                      <div>Off</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Credits & Benefits */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <Umbrella className="h-6 w-6 text-blue-400" />
              Leave Credits
            </h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 ring-1 ring-blue-400/30">
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-400">{remainingLeave}</div>
                  <div className="mt-2 text-sm text-slate-300">Days Remaining</div>
                  <div className="mt-1 text-xs text-slate-500">Out of {profile.totalLeave} total days</div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Vacation Leave Used</span>
                    <span className="font-semibold text-white">{profile.vacationUsed} days</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${(profile.vacationUsed / profile.totalLeave) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Sick Leave Used</span>
                    <span className="font-semibold text-white">{profile.sickUsed} days</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${(profile.sickUsed / profile.totalLeave) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <Heart className="h-6 w-6 text-pink-400" />
              Benefits
            </h2>
            <div className="space-y-3">
              <div className={`rounded-xl p-4 ring-1 transition-all hover:scale-105 ${profile.hmo ? "bg-emerald-500/10 ring-emerald-500/30" : "bg-slate-800/50 ring-white/10"}`}>
                <div className="flex items-center gap-3">
                  <Shield className={`h-5 w-5 ${profile.hmo ? "text-emerald-400" : "text-slate-400"}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">HMO Benefits</div>
                    <div className="text-sm text-slate-400">{profile.hmo ? "Active" : "Not enrolled"}</div>
                  </div>
                  {profile.hmo && (
                    <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                      ✓ Active
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4 ring-1 ring-blue-400/30 transition-all hover:scale-105">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <div className="flex-1">
                    <div className="font-semibold text-white">Leave Credits</div>
                    <div className="text-sm text-slate-400">{profile.totalLeave} days annual leave</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
