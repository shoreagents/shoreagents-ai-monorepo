"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, TrendingUp, Search, Calendar, Download, RefreshCw } from "lucide-react"

interface TimeEntry {
  id: string
  userId: string
  clockIn: string
  clockOut: string | null
  totalHours: number | null
  user: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
  }
}

interface Summary {
  totalHours: number
  activeStaff: number
  totalEntries: number
}

interface StaffMember {
  id: string
  name: string
  avatar: string | null
  role: string
}

export default function ClientTimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [summary, setSummary] = useState<Summary>({ totalHours: 0, activeStaff: 0, totalEntries: 0 })
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("today")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchTimeEntries()
  }, [selectedStaff, dateRange, startDate, endDate])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on selection
      let start = ""
      let end = ""
      const now = new Date()

      if (dateRange === "today") {
        start = now.toISOString().split('T')[0]
        end = start
      } else if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        start = weekAgo.toISOString().split('T')[0]
        end = now.toISOString().split('T')[0]
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        start = monthAgo.toISOString().split('T')[0]
        end = now.toISOString().split('T')[0]
      } else if (dateRange === "custom") {
        start = startDate
        end = endDate
      }

      // Build query params
      const params = new URLSearchParams()
      if (start) params.append('startDate', start)
      if (end) params.append('endDate', end)
      if (selectedStaff !== "all") params.append('staffId', selectedStaff)

      const response = await fetch(`/api/client/time-tracking?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch time entries')
      
      const data = await response.json()
      setTimeEntries(data.timeEntries || [])
      setSummary(data.summary || { totalHours: 0, activeStaff: 0, totalEntries: 0 })
      setStaffList(data.staffList || [])
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter entries by search term
  const filteredEntries = timeEntries.filter(entry =>
    entry.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-sm bg-white/80">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Staff Time Tracking
              </h1>
              <p className="text-sm text-gray-600 mt-1">Monitor your team's clock in/out history</p>
            </div>

            <Button 
              onClick={fetchTimeEntries}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-blue-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Total Hours
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summary.totalHours.toFixed(2)}h
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.totalEntries} entries
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Active Staff
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.activeStaff}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Currently clocked in
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Average Hours
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalEntries > 0 ? (summary.totalHours / summary.totalEntries).toFixed(2) : '0.00'}h
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Per entry
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-gray-200 bg-white">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Staff Filter */}
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Inputs */}
              {dateRange === "custom" && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="md:col-span-2"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="md:col-span-2"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Time Entries List */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Time Entry History</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="font-medium">No time entries found</p>
                <p className="text-sm mt-1">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    {/* Staff Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12 ring-2 ring-blue-100">
                        <AvatarImage src={entry.user.avatar || ''} alt={entry.user.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                          {entry.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{entry.user.name}</div>
                        <div className="text-sm text-gray-500">{entry.user.role}</div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-center px-4">
                      <div className="font-medium text-gray-900">
                        {formatDate(entry.clockIn)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(entry.clockIn).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </div>

                    {/* Clock In Time */}
                    <div className="text-center px-4">
                      <div className="text-sm text-gray-500 mb-1">Clock In</div>
                      <div className="font-medium text-green-600">
                        {formatTime(entry.clockIn)}
                      </div>
                    </div>

                    {/* Clock Out Time */}
                    <div className="text-center px-4">
                      <div className="text-sm text-gray-500 mb-1">Clock Out</div>
                      {entry.clockOut ? (
                        <div className="font-medium text-red-600">
                          {formatTime(entry.clockOut)}
                        </div>
                      ) : (
                        <Badge className="bg-green-500 text-white">
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {/* Total Hours */}
                    <div className="text-right px-4">
                      {entry.totalHours !== null ? (
                        <>
                          <div className="text-xl font-bold text-blue-600">
                            {Number(entry.totalHours).toFixed(2)}h
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round(Number(entry.totalHours) * 60)} min
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium">In Progress</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

