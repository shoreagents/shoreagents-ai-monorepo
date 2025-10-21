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
      setStaff(data.staff || [])
    } catch (error) {
      console.error("Error fetching staff:", error)
      setStaff([])
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Staff</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your dedicated team • {staff.length} {staff.length === 1 ? "member" : "members"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Users className="h-4 w-4 mr-2" />
                Request Staff
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
                <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-all hover:border-blue-300 cursor-pointer group h-full">
                  <div className="flex flex-col items-center text-center mb-4">
                    {member.avatar ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all mb-3">
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-2xl font-semibold ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all mb-3">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {member.name}
                      </h3>
                      {member.isClockedIn && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{member.assignmentRole || member.currentRole}</p>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <Badge className={getStatusColor(member.employmentStatus)}>
                        {member.employmentStatus}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Level {member.level}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 mb-4 pb-4 border-b border-gray-200">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">{member.avgProductivity}</span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                    {member.rate && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <span>${member.rate}/month</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{member.totalHoursThisMonth}h</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{member.activeTasks}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Tasks</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : (
              // LIST VIEW - Full Detail Card
              <Link key={member.id} href={`/client/staff/${member.id}`}>
                <Card className="p-6 bg-white border-gray-200 hover:shadow-lg transition-all hover:border-blue-300 cursor-pointer group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      {member.avatar ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-2xl font-semibold ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </h3>
                          {member.isClockedIn && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                              Online
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-2">{member.assignmentRole || member.currentRole}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(member.employmentStatus)}>
                            {member.employmentStatus}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Level {member.level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-2xl font-bold text-gray-900">{member.avgProductivity}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">Performance Score</p>
                      {member.reviewScore > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Review: {member.reviewScore}/5.0</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{member.phone}</span>
                        </div>
                      )}
                      {member.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{member.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Started {formatDate(member.startDate)}</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Shift: {member.shift}</span>
                      </div>
                      {member.rate && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">${member.rate}/month</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Managed by {member.managedBy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{member.totalHoursThisMonth}h</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">This Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{member.activeTasks}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Active Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{member.totalLeave - member.usedLeave}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Leave Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{member.daysEmployed}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">Days</p>
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









