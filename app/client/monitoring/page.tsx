"use client"

import { useState, useEffect } from "react"
import {
  Activity, MousePointer, Keyboard, Clock, Monitor, User,
  Download, Upload, Wifi, Copy, FileText, Globe, Eye,
  TrendingUp, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface StaffMetrics {
  mouseMovements: number
  mouseClicks: number
  keystrokes: number
  activeTime: number
  idleTime: number
  screenTime: number
  downloads: number
  uploads: number
  bandwidth: number
  clipboardActions: number
  filesAccessed: number
  urlsVisited: number
  tabsSwitched: number
  productivityScore: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  avatar: string | null
  position: string
  department: string
  metrics: StaffMetrics | null
  productivityScore: number
  isActive: boolean
}

interface MonitoringData {
  staff: StaffMember[]
  summary: {
    totalStaff: number
    activeStaff: number
    averageProductivity: number
  }
}

export default function ClientMonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    fetchMonitoringData()
  }, [])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/client/monitoring")
      if (!response.ok) throw new Error("Failed to fetch monitoring data")
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getProductivityColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getProductivityBadgeColor = (score: number) => {
    if (score >= 80) return "bg-emerald-600"
    if (score >= 50) return "bg-amber-600"
    return "bg-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-40 rounded-xl bg-white/50 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-white/50 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="mx-auto max-w-5xl">
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h2 className="text-xl font-bold text-red-900">Error Loading Data</h2>
                <p className="mt-1 text-red-700">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!data || data.staff.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="mx-auto max-w-5xl">
          <Card className="p-12 text-center">
            <Monitor className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Staff Members Found</h2>
            <p className="text-gray-600">No staff members are currently assigned to monitor.</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header with Summary */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
                <Monitor className="h-8 w-8" />
                Staff Monitoring
              </h1>
              <p className="mt-2 text-blue-100">
                Real-time performance tracking for your team
              </p>
            </div>
            <Button
              onClick={fetchMonitoringData}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{data.summary.totalStaff}</div>
                  <div className="text-sm text-blue-100">Total Staff</div>
                </div>
                <User className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{data.summary.activeStaff}</div>
                  <div className="text-sm text-blue-100">Currently Active</div>
                </div>
                <Activity className="h-8 w-8 text-emerald-300 animate-pulse" />
              </div>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-white">{data.summary.averageProductivity}%</div>
                  <div className="text-sm text-blue-100">Avg. Productivity</div>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.staff.map((staff) => (
            <Card
              key={staff.id}
              className="p-6 cursor-pointer hover:shadow-xl transition-all duration-200 hover:-translate-y-1 bg-white"
              onClick={() => setSelectedStaff(staff)}
            >
              {/* Staff Header */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-14 w-14 border-2 border-blue-200">
                  <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                    {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">{staff.name}</h3>
                  <p className="text-sm text-gray-600 truncate">{staff.position}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {staff.department}
                  </Badge>
                </div>
              </div>

              {/* Productivity Score */}
              <div className={`rounded-xl p-4 mb-4 border-2 ${getProductivityColor(staff.productivityScore)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{staff.productivityScore}%</div>
                    <div className="text-sm font-medium">Productivity Score</div>
                  </div>
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                {staff.isActive ? (
                  <Badge className="bg-emerald-600">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Active Now
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>

              {/* Quick Metrics */}
              {staff.metrics ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <MousePointer className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <div className="text-sm font-bold text-blue-900">
                      {staff.metrics.mouseClicks.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600">Clicks</div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3">
                    <Keyboard className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                    <div className="text-sm font-bold text-purple-900">
                      {staff.metrics.keystrokes.toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-600">Keys</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <Clock className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                    <div className="text-sm font-bold text-emerald-900">
                      {formatTime(staff.metrics.activeTime)}
                    </div>
                    <div className="text-xs text-emerald-600">Active</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity today</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Performance Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage src={selectedStaff?.avatar || undefined} alt={selectedStaff?.name} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                  {selectedStaff?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-2xl font-bold text-gray-900">{selectedStaff?.name}</div>
                <div className="text-sm text-gray-600 font-normal">{selectedStaff?.position} • {selectedStaff?.department}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStaff?.metrics ? (
            <div className="space-y-6 py-4">
              {/* Productivity Overview */}
              <div className={`rounded-xl p-6 border-2 ${getProductivityColor(selectedStaff.productivityScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Overall Productivity</h3>
                  <div className="text-4xl font-bold">{selectedStaff.productivityScore}%</div>
                </div>
                <Progress value={selectedStaff.productivityScore} className="h-3" />
              </div>

              {/* Input Activity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Input Activity
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <MousePointer className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedStaff.metrics.mouseMovements.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">Mouse Movements</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <MousePointer className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-900">
                      {selectedStaff.metrics.mouseClicks.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">Mouse Clicks</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <Keyboard className="h-6 w-6 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">
                      {selectedStaff.metrics.keystrokes.toLocaleString()}
                    </div>
                    <div className="text-sm text-emerald-700">Keystrokes</div>
                  </Card>
                </div>
              </div>

              {/* Time Tracking */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Time Tracking
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <Clock className="h-6 w-6 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">
                      {formatTime(selectedStaff.metrics.activeTime)}
                    </div>
                    <div className="text-sm text-emerald-700">Active Time</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <Clock className="h-6 w-6 text-amber-600 mb-2" />
                    <div className="text-2xl font-bold text-amber-900">
                      {formatTime(selectedStaff.metrics.idleTime)}
                    </div>
                    <div className="text-sm text-amber-700">Idle Time</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <Monitor className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {formatTime(selectedStaff.metrics.screenTime)}
                    </div>
                    <div className="text-sm text-blue-700">Screen Time</div>
                  </Card>
                </div>
              </div>

              {/* Network & File Activity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-indigo-600" />
                  Network & File Activity
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gray-50">
                    <Download className="h-5 w-5 text-green-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.downloads}</div>
                    <div className="text-xs text-gray-600">Downloads</div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <Upload className="h-5 w-5 text-blue-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.uploads}</div>
                    <div className="text-xs text-gray-600">Uploads</div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <Wifi className="h-5 w-5 text-purple-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.bandwidth} MB</div>
                    <div className="text-xs text-gray-600">Bandwidth</div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <FileText className="h-5 w-5 text-amber-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.filesAccessed}</div>
                    <div className="text-xs text-gray-600">Files Accessed</div>
                  </Card>
                </div>
              </div>

              {/* Digital Activity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-600" />
                  Digital Activity
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 bg-gray-50">
                    <Copy className="h-5 w-5 text-pink-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.clipboardActions}</div>
                    <div className="text-xs text-gray-600">Clipboard Actions</div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <Globe className="h-5 w-5 text-cyan-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.urlsVisited}</div>
                    <div className="text-xs text-gray-600">URLs Visited</div>
                  </Card>
                  <Card className="p-4 bg-gray-50">
                    <Eye className="h-5 w-5 text-indigo-600 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{selectedStaff.metrics.tabsSwitched}</div>
                    <div className="text-xs text-gray-600">Tabs Switched</div>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Activity className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Activity Data</h3>
              <p className="text-gray-600">This staff member has no recorded activity for today.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

