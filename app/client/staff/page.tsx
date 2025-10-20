"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Calendar, TrendingUp, Clock, Loader2, DollarSign, Star, CheckCircle2, Users, Grid3x3, List } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type ViewMode = 'grid' | 'list'

interface StaffMember {
  id: string
  name: string
  email: string
  avatar: string | null
  assignmentRole: string | null
  rate: number | null
  startDate: string
  managedBy: string
  client: string
  phone: string | null
  location: string | null
  employmentStatus: string
  daysEmployed: number
  currentRole: string
  salary: number
  totalLeave: number
  usedLeave: number
  hmo: boolean
  shift: string
  activeTasks: number
  avgProductivity: number
  reviewScore: number
  totalHoursThisMonth: number
  isClockedIn: boolean
  level: number
  points: number
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/client/staff")
      if (!response.ok) throw new Error("Failed to fetch staff")
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      console.error("Error fetching staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGULAR":
        return "bg-green-100 text-green-800 border-green-200"
      case "PROBATION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Your Team
              </h1>
              <p className="text-base text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                {staff.length} dedicated {staff.length === 1 ? "team member" : "team members"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1.5 shadow-inner">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' 
                    ? 'bg-white shadow-md hover:bg-white rounded-lg' 
                    : 'hover:bg-gray-200 rounded-lg'
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' 
                    ? 'bg-white shadow-md hover:bg-white rounded-lg' 
                    : 'hover:bg-gray-200 rounded-lg'
                  }
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all">
                <Users className="h-4 w-4 mr-2" />
                Request New Staff
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {staff.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No staff assigned yet</h3>
            <p className="text-gray-600 mb-6">Get started by requesting your first team member</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Request Staff</Button>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid grid-cols-1 gap-6'}>
            {staff.map((member) => viewMode === 'grid' ? (
              // GRID VIEW - Compact Card
              <Link key={member.id} href={`/client/staff/${member.id}`}>
                <Card className="relative p-6 bg-white border-gray-200 hover:shadow-2xl transition-all hover:border-blue-400 hover:-translate-y-1 cursor-pointer group h-full overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/30 transition-all pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-4">
                      {member.avatar ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-100 group-hover:ring-blue-300 group-hover:scale-105 transition-all mb-3 shadow-lg">
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-blue-100 group-hover:ring-blue-300 group-hover:scale-105 transition-all mb-3 shadow-lg">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        {member.isClockedIn && (
                          <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 font-medium">{member.assignmentRole || member.currentRole}</p>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <Badge className={getStatusColor(member.employmentStatus) + " font-semibold"}>
                          {member.employmentStatus}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-semibold border-2">
                          Level {member.level}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{member.avgProductivity}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg">
                          <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium">{member.phone}</span>
                        </div>
                      )}
                      {member.rate && (
                        <div className="flex items-center gap-2 text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="font-bold text-green-700">${member.rate.toLocaleString()}/mo</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                      <div className="text-center bg-blue-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-600">{member.totalHoursThisMonth}h</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">This Month</p>
                      </div>
                      <div className="text-center bg-purple-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-purple-600">{member.activeTasks}</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Active</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              // LIST VIEW - Full Detail Card
              <Link key={member.id} href={`/client/staff/${member.id}`}>
                <Card className="relative p-6 bg-white border-gray-200 hover:shadow-2xl transition-all hover:border-blue-400 cursor-pointer group overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/40 group-hover:to-purple-50/20 transition-all pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-5">
                        {member.avatar ? (
                          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-blue-100 group-hover:ring-blue-300 transition-all shadow-lg">
                            <Image
                              src={member.avatar}
                              alt={member.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white flex items-center justify-center text-3xl font-bold ring-4 ring-blue-100 group-hover:ring-blue-300 transition-all shadow-lg">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {member.name}
                            </h3>
                            {member.isClockedIn && (
                              <Badge className="bg-green-100 text-green-700 border-green-300 font-semibold">
                                <div className="relative mr-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                </div>
                                Online Now
                              </Badge>
                            )}
                          </div>
                          <p className="text-base font-semibold text-gray-600 mb-3">{member.assignmentRole || member.currentRole}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(member.employmentStatus) + " font-semibold"}>
                              {member.employmentStatus}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-semibold border-2">
                              Level {member.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-semibold border-2">
                              {member.points} pts
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                          <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{member.avgProductivity}</p>
                        </div>
                        <p className="text-xs text-gray-600 font-semibold">Performance</p>
                        {member.reviewScore > 0 && (
                          <p className="text-xs text-gray-500 mt-1 font-medium">Review: {member.reviewScore}/5.0</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">{member.phone}</span>
                          </div>
                        )}
                        {member.location && (
                          <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">{member.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Started {formatDate(member.startDate)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Shift: {member.shift}</span>
                        </div>
                        {member.rate && (
                          <div className="flex items-center gap-3 text-sm text-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-bold text-green-700">${member.rate.toLocaleString()}/month</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Managed by {member.managedBy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-5 border-t-2 border-gray-200">
                      <div className="text-center bg-blue-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-blue-600">{member.totalHoursThisMonth}h</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">This Month</p>
                      </div>
                      <div className="text-center bg-purple-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-purple-600">{member.activeTasks}</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Active Tasks</p>
                      </div>
                      <div className="text-center bg-green-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-green-600">{member.totalLeave - member.usedLeave}</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Leave Days</p>
                      </div>
                      <div className="text-center bg-orange-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-orange-600">{member.daysEmployed}</p>
                        <p className="text-xs text-gray-600 font-semibold mt-1">Days Employed</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}









