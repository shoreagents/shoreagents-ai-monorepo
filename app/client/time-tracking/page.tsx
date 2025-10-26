"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Clock, 
  Coffee, 
  Users, 
  Calendar,
  Grid3x3,
  List,
  TrendingUp,
  Play,
  Pause,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"

type BreakType = "MORNING" | "LUNCH" | "AFTERNOON" | "AWAY"

type Break = {
  id: string
  type: BreakType
  scheduledStart: string | null
  scheduledEnd: string | null
  actualStart: Date | null
  actualEnd: Date | null
  duration: number | null
  isLate: boolean
  lateBy: number | null
}

type TimeEntry = {
  id: string
  clockIn: Date
  clockOut: Date | null
  totalHours: number
  wasLate: boolean
  lateBy: number | null
  clockOutReason: string | null
  breaks: Break[]
}

type StaffTimeEntry = {
  staff: {
    id: string
    name: string
    email: string
    avatar: string | null
    role: string
    employmentStatus: string
  }
  isClockedIn: boolean
  isOnBreak: boolean
  currentBreakType: BreakType | null
  currentEntry: {
    id: string
    clockIn: Date
    breaks: Break[]
  } | null
  timeEntries: TimeEntry[]
  totalHours: number
  totalEntries: number
}

export default function ClientTimeTrackingPage() {
  const [staffData, setStaffData] = useState<StaffTimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedStaff, setSelectedStaff] = useState<StaffTimeEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  const [summary, setSummary] = useState({
    totalHours: 0,
    activeStaff: 0,
    totalEntries: 0,
    totalStaff: 0
  })

  useEffect(() => {
    fetchTimeEntries()
  }, [selectedDate])

  // Update active staff hours every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update calculated hours for active staff
      setStaffData(prevData => [...prevData])
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  async function fetchTimeEntries() {
    try {
      setLoading(true)
      const res = await fetch(`/api/client/time-tracking?startDate=${selectedDate}&endDate=${selectedDate}`)
      if (res.ok) {
        const data = await res.json()
        setStaffData(data.staffTimeEntries)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date | string | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0m"
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const calculateCurrentHours = (clockIn: Date | string) => {
    const clockInTime = new Date(clockIn)
    const now = new Date()
    const diffInMs = now.getTime() - clockInTime.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    return Math.round(diffInHours * 100) / 100 // Round to 2 decimal places
  }

  const getDisplayHours = (staff: StaffTimeEntry) => {
    if (staff.isClockedIn && staff.currentEntry) {
      // For active staff, calculate hours from clock-in to now
      return calculateCurrentHours(staff.currentEntry.clockIn)
    }
    // For inactive staff, use the total hours from completed entries
    return staff.totalHours
  }

  const getBreakIcon = (type: BreakType) => {
    switch (type) {
      case "MORNING": return <Coffee className="h-4 w-4" />
      case "LUNCH": return <Coffee className="h-4 w-4" />
      case "AFTERNOON": return <Coffee className="h-4 w-4" />
      case "AWAY": return <Pause className="h-4 w-4" />
    }
  }

  const getStatusBadge = (staff: StaffTimeEntry) => {
    if (staff.isClockedIn && staff.isOnBreak) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Pause className="h-3 w-3 mr-1" />
          On Break ({staff.currentBreakType})
        </Badge>
      )
    }
    if (staff.isClockedIn) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <Play className="h-3 w-3 mr-1" />
          Working
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        <LogOut className="h-3 w-3 mr-1" />
        Clocked Out
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4 pt-20 md:p-8 lg:pt-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading time tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Time Tracking</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Monitor your team's attendance and work hours
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Selector */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeStaff}/{summary.totalStaff}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalHours}h</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalEntries}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Hours/Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.totalStaff > 0 ? Math.round((summary.totalHours / summary.totalStaff) * 10) / 10 : 0}h
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Staff Time Entries */}
        {staffData.length === 0 ? (
          <Card className="p-12 text-center bg-white shadow-sm border">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No time entries found</h3>
            <p className="text-gray-600">No staff clocked in on this date</p>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {staffData.map((staffEntry) => {
              const initials = staffEntry.staff.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              if (viewMode === 'grid') {
                // GRID VIEW
                return (
                  <Card
                    key={staffEntry.staff.id}
                    className="p-6 bg-white border shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
                    onClick={() => setSelectedStaff(staffEntry)}
                  >
                    <div className="flex flex-col items-center text-center mb-4">
                      <Avatar className="h-20 w-20 mb-3 ring-4 ring-blue-100">
                        <AvatarImage src={staffEntry.staff.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{staffEntry.staff.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{staffEntry.staff.role}</p>
                      {getStatusBadge(staffEntry)}
                    </div>

                    {staffEntry.currentEntry && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Clock In:</span>
                          <span className="font-semibold text-green-600">{formatTime(staffEntry.currentEntry.clockIn)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Breaks:</span>
                          <span className="font-semibold">{staffEntry.currentEntry.breaks.length}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Hours</span>
                        <span className="text-xl font-bold text-blue-600">{getDisplayHours(staffEntry)}h</span>
                      </div>
                    </div>
                  </Card>
                )
              }

              // LIST VIEW
              return (
                <Card
                  key={staffEntry.staff.id}
                  className="p-6 bg-white border shadow-sm hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => setSelectedStaff(staffEntry)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-4 ring-blue-100">
                        <AvatarImage src={staffEntry.staff.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{staffEntry.staff.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{staffEntry.staff.role}</p>
                        {getStatusBadge(staffEntry)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Hours Today</p>
                      <p className="text-3xl font-bold text-blue-600">{getDisplayHours(staffEntry)}h</p>
                    </div>
                  </div>

                  {staffEntry.currentEntry && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Clock In</p>
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-600">{formatTime(staffEntry.currentEntry.clockIn)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Breaks</p>
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-orange-600" />
                          <p className="font-semibold text-gray-900">
                            {staffEntry.currentEntry.breaks.length} breaks
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        {staffEntry.isOnBreak ? (
                          <p className="font-semibold text-yellow-600">On Break</p>
                        ) : (
                          <p className="font-semibold text-green-600">Working</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!staffEntry.currentEntry && staffEntry.timeEntries.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">
                        Completed {staffEntry.timeEntries.length} {staffEntry.timeEntries.length === 1 ? 'shift' : 'shifts'} today
                      </p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedStaff && (
                  <>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedStaff.staff.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
                        {selectedStaff.staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xl font-bold">{selectedStaff.staff.name}</p>
                      <p className="text-sm text-gray-600 font-normal">{selectedStaff.staff.role}</p>
                    </div>
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedStaff && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-blue-600">{getDisplayHours(selectedStaff)}h</p>
                  </Card>
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Shifts</p>
                    <p className="text-2xl font-bold text-green-600">{selectedStaff.totalEntries}</p>
                  </Card>
                  <Card className="p-4 bg-purple-50 border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedStaff)}</div>
                  </Card>
                </div>

                {/* Time Entries */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Time Entries</h3>
                  <div className="space-y-4">
                    {selectedStaff.timeEntries.map((entry) => (
                      <Card key={entry.id} className="p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Play className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">Clock In: {formatTime(entry.clockIn)}</span>
                              {entry.wasLate && (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Late {entry.lateBy}m
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {entry.clockOut ? (
                                <>
                                  <LogOut className="h-4 w-4 text-gray-600" />
                                  <span className="font-semibold">Clock Out: {formatTime(entry.clockOut)}</span>
                                </>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Currently Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Total Hours</p>
                            <p className="text-2xl font-bold text-blue-600">{entry.totalHours}h</p>
                          </div>
                        </div>

                        {/* Breaks */}
                        {entry.breaks.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Breaks</p>
                            <div className="grid grid-cols-2 gap-3">
                              {entry.breaks.map((brk) => (
                                <div key={brk.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getBreakIcon(brk.type)}
                                    <span className="text-sm font-semibold">{brk.type}</span>
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Start:</span>
                                      <span className="font-medium">{formatTime(brk.actualStart)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">End:</span>
                                      <span className="font-medium">{formatTime(brk.actualEnd)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Duration:</span>
                                      <span className="font-medium">{formatDuration(brk.duration)}</span>
                                    </div>
                                    {brk.isLate && (
                                      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs w-full justify-center mt-1">
                                        Late {brk.lateBy}m
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
