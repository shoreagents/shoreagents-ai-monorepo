"use client"

import { useState, useEffect } from "react"
import { useRealtimeMonitoring } from "@/hooks/useRealtimeMonitoring"
import {
  Activity, MousePointer, Keyboard, Clock, Monitor, User,
  Download, Upload, Wifi, Copy, FileText, Globe, Eye,
  TrendingUp, AlertCircle, BarChart3, Calendar, Filter,
  RefreshCw, Download as DownloadIcon, Settings, Users,
  Target, Zap, Award, CheckCircle, XCircle, AlertTriangle
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
  latest: {
    date: string
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
    applicationsUsed?: string[]
    visitedUrls?: string[]
    screenshotUrls?: string[]
  } | null
  totals: {
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
    applicationsUsed?: string[]
    visitedUrls?: string[]
    screenshotUrls?: string[]
  }
  history: any[]
  recordCount: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  avatar: string | null
  position: string
  department: string
  employmentStatus: string
  startDate: string | null
  salary: number | null
  location: string | null
  metrics: StaffMetrics | null
  productivityScore: number
  isActive: boolean
  lastActivity: string | null
}

interface MonitoringData {
  staff: StaffMember[]
  summary: {
    totalStaff: number
    activeStaff: number
    averageProductivity: number
    dateRange: {
      start: string
      end: string
      days: number
    }
    overallTotals: {
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
    }
  }
}

export default function ClientMonitoringPage() {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedDays, setSelectedDays] = useState(1) // Default to Today
  const [viewMode, setViewMode] = useState<'latest' | 'totals'>('latest')
  const [sortBy, setSortBy] = useState<'name' | 'productivity' | 'activity' | 'lastActivity'>('productivity')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'no-data'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Use real-time monitoring hook
  const { data, loading, error, lastUpdate, refresh, isConnected, isUpdating, nextRefreshIn } = useRealtimeMonitoring(selectedDays)

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getEmploymentStatusColor = (status: string) => {
    switch (status) {
      case 'REGULAR': return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case 'PROBATION': return "bg-amber-100 text-amber-800 border-amber-200"
      case 'CONTRACT': return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
    if (score >= 60) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
    if (score >= 40) return { level: 'Average', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
    if (score >= 20) return { level: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  }

  const getActivityStatus = (staff: StaffMember) => {
    if (!staff.metrics) return { status: 'No Data', color: 'text-gray-500', bg: 'bg-gray-100', icon: XCircle }
    if (staff.isActive) return { status: 'Active Now', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle }
    if (staff.lastActivity) {
      const lastActivity = new Date(staff.lastActivity)
      const now = new Date()
      const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      if (hoursDiff < 24) return { status: 'Recent', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock }
      if (hoursDiff < 168) return { status: 'This Week', color: 'text-amber-600', bg: 'bg-amber-100', icon: AlertTriangle }
    }
    return { status: 'Inactive', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle }
  }

  const filteredAndSortedStaff = () => {
    if (!data) return []
    
    let filtered = data.staff
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(staff => {
        switch (filterStatus) {
          case 'active': return staff.isActive
          case 'inactive': return !staff.isActive && staff.metrics
          case 'no-data': return !staff.metrics
          default: return true
        }
      })
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'productivity': return b.productivityScore - a.productivityScore
        case 'activity': return (b.metrics?.recordCount || 0) - (a.metrics?.recordCount || 0)
        case 'lastActivity': 
          if (!a.lastActivity && !b.lastActivity) return 0
          if (!a.lastActivity) return 1
          if (!b.lastActivity) return -1
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        default: return 0
      }
    })
    
    return filtered
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
    <>
      <style jsx global>{`
        .dialog-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .dialog-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        .dialog-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        .dialog-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dialog-scrollbar::-webkit-scrollbar-thumb:active {
          background: #6b7280;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Professional Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Monitor className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Staff Performance Dashboard</h1>
                  <p className="text-blue-100 mt-1">
                    Comprehensive monitoring and analytics for your team
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={refresh}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                  disabled={isUpdating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                  {isUpdating ? 'Updating...' : 'Refresh Data'}
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">Date Range:</label>
                  <select
                    key={selectedDays}
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  >
                    <option value={1}>Today</option>
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <label className="text-sm font-medium text-gray-700">View Mode:</label>
                  <div className="flex rounded-lg bg-white border border-gray-300 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setViewMode('latest')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'latest' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Latest Day
                    </button>
                    <button
                      onClick={() => setViewMode('totals')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'totals' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Total Period
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                {lastUpdate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last Updated:</span> 
                    <span>{lastUpdate.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="all">All Staff</option>
                      <option value="active">Active Now</option>
                      <option value="inactive">Inactive</option>
                      <option value="no-data">No Data</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                      <option value="productivity">Productivity Score</option>
                      <option value="name">Name</option>
                      <option value="activity">Activity Level</option>
                      <option value="lastActivity">Last Activity</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Summary Stats */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Staff */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-900">{data.summary.totalStaff}</div>
                    <div className="text-sm font-medium text-blue-700">Total Staff</div>
                    <div className="text-xs text-blue-600 mt-1">All team members</div>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-lg">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </div>

              {/* Active Staff */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-emerald-900">{data.summary.activeStaff}</div>
                    <div className="text-sm font-medium text-emerald-700">Currently Active</div>
                    <div className="text-xs text-emerald-600 mt-1">
                      {data.summary.totalStaff > 0 ? Math.round((data.summary.activeStaff / data.summary.totalStaff) * 100) : 0}% of team
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-200 rounded-lg">
                    <Activity className="h-6 w-6 text-emerald-700 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Average Productivity */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-amber-900">{data.summary.averageProductivity}%</div>
                    <div className="text-sm font-medium text-amber-700">Avg. Productivity</div>
                    <div className="text-xs text-amber-600 mt-1">
                      {getPerformanceLevel(data.summary.averageProductivity).level}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-200 rounded-lg">
                    <Target className="h-6 w-6 text-amber-700" />
                  </div>
                </div>
              </div>

              {/* Data Coverage */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-900">
                      {data.staff.filter(s => s.metrics).length}
                    </div>
                    <div className="text-sm font-medium text-purple-700">With Data</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {data.summary.totalStaff > 0 ? Math.round((data.staff.filter(s => s.metrics).length / data.summary.totalStaff) * 100) : 0}% coverage
                    </div>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            {data.summary.overallTotals && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Overall Team Activity (Last {data.summary.dateRange.days} days)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {data.summary.overallTotals.mouseClicks.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Mouse Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {data.summary.overallTotals.keystrokes.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Keystrokes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatTime(data.summary.overallTotals.activeTime)}
                    </div>
                    <div className="text-sm text-gray-600">Active Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {data.summary.overallTotals.urlsVisited}
                    </div>
                    <div className="text-sm text-gray-600">URLs Visited</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedStaff().map((staff) => {
            const performanceLevel = getPerformanceLevel(staff.productivityScore)
            const activityStatus = getActivityStatus(staff)
            const StatusIcon = activityStatus.icon
            
            return (
            <Card
              key={staff.id}
              className="group relative overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedStaff(staff)}
            >
              {/* Status Indicator */}
              <div className={`absolute top-0 right-0 w-3 h-3 rounded-full ${activityStatus.bg} border-2 border-white`} />
              
              {/* Staff Header */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-3 border-gray-200 shadow-sm">
                      <AvatarImage src={staff.avatar || undefined} alt={staff.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                        {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${activityStatus.bg} border-2 border-white flex items-center justify-center`}>
                      <StatusIcon className={`h-3 w-3 ${activityStatus.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                      {staff.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate font-medium">{staff.position}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="text-xs font-medium">
                        {staff.department}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium ${getEmploymentStatusColor(staff.employmentStatus)}`}
                      >
                        {staff.employmentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {staff.location && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {staff.location}
                        </span>
                      )}
                      {staff.salary && (
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          ${staff.salary.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Productivity Score */}
                <div className={`rounded-xl p-4 mb-4 border-2 ${performanceLevel.bg} ${performanceLevel.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">{staff.productivityScore}%</div>
                      <div className="text-sm font-medium text-gray-700">Productivity Score</div>
                      <div className={`text-xs font-medium ${performanceLevel.color} mt-1`}>
                        {performanceLevel.level}
                      </div>
                    </div>
                    <div className="text-right">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                      <div className="text-xs text-gray-500 mt-1">Performance</div>
                    </div>
                  </div>
                  <Progress value={staff.productivityScore} className="h-2 mt-3" />
                </div>

                {/* Activity Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${activityStatus.bg} ${activityStatus.color} border-0`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {activityStatus.status}
                    </Badge>
                    {staff.isActive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">Live</span>
                      </div>
                    )}
                  </div>
                  {staff.lastActivity && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last activity: {formatDate(staff.lastActivity)}
                    </div>
                  )}
                </div>

                {/* Quick Metrics */}
                {staff.metrics ? (
                  <div className="space-y-4">
                    {/* Data Summary */}
                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {staff.metrics.recordCount} records
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {viewMode === 'latest' ? 'Latest day' : 'Total period'}
                      </span>
                    </div>
                    
                    {/* Primary Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                        <MousePointer className="h-4 w-4 mx-auto text-blue-600 mb-2" />
                        <div className="text-lg font-bold text-blue-900">
                          {viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.mouseClicks.toLocaleString()
                            : staff.metrics.totals.mouseClicks.toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-700 font-medium">Mouse Clicks</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                        <Keyboard className="h-4 w-4 mx-auto text-purple-600 mb-2" />
                        <div className="text-lg font-bold text-purple-900">
                          {viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.keystrokes.toLocaleString()
                            : staff.metrics.totals.keystrokes.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-700 font-medium">Keystrokes</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
                        <Clock className="h-4 w-4 mx-auto text-emerald-600 mb-2" />
                        <div className="text-lg font-bold text-emerald-900">
                          {formatTime(viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.activeTime
                            : staff.metrics.totals.activeTime)}
                        </div>
                        <div className="text-xs text-emerald-700 font-medium">Active Time</div>
                      </div>
                    </div>
                    
                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Monitor className="h-3 w-3 mx-auto text-gray-600 mb-1" />
                        <div className="text-sm font-bold text-gray-900">
                          {formatTime(viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.screenTime
                            : staff.metrics.totals.screenTime)}
                        </div>
                        <div className="text-xs text-gray-600">Screen</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Globe className="h-3 w-3 mx-auto text-gray-600 mb-1" />
                        <div className="text-sm font-bold text-gray-900">
                          {viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.urlsVisited
                            : staff.metrics.totals.urlsVisited}
                        </div>
                        <div className="text-xs text-gray-600">Web Pages</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <Copy className="h-3 w-3 mx-auto text-gray-600 mb-1" />
                        <div className="text-sm font-bold text-gray-900">
                          {viewMode === 'latest' && staff.metrics.latest
                            ? staff.metrics.latest.clipboardActions
                            : staff.metrics.totals.clipboardActions}
                        </div>
                        <div className="text-xs text-gray-600">Clipboard</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No Performance Data</p>
                    <p className="text-xs text-gray-400 mt-1">No activity recorded</p>
                  </div>
                )}
              </div>
            </Card>
            )
          })}
        </div>

        {/* Professional Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Showing:</span> {filteredAndSortedStaff().length} of {data?.summary.totalStaff || 0} staff members
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Data Period:</span> Last {data?.summary.dateRange.days || 7} days
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Export Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

      {/* Detailed Performance Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
         <DialogContent 
           className="max-h-[80vh] overflow-y-auto bg-white dialog-scrollbar"
           style={{ 
             width: '50vw', 
             maxWidth: 'none',
             scrollbarWidth: 'thin',
             scrollbarColor: '#d1d5db #f3f4f6'
           }}
         >
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
            <div className="space-y-8 py-6">
              {/* Performance Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.mouseClicks + selectedStaff.metrics.latest.keystrokes
                        : selectedStaff.metrics.totals.mouseClicks + selectedStaff.metrics.totals.keystrokes}
                    </div>
                    <div className="text-sm text-blue-700">Total Interactions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.urlsVisited
                        : selectedStaff.metrics.totals.urlsVisited}
                    </div>
                    <div className="text-sm text-purple-700">Web Pages Visited</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-900">
                      {formatTime(viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.activeTime
                        : selectedStaff.metrics.totals.activeTime)}
                    </div>
                    <div className="text-sm text-emerald-700">Active Time</div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">View Mode:</span>
                <div className="flex rounded-lg bg-gray-100 border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setViewMode('latest')}
                    className={`px-4 py-2 text-sm transition-colors ${
                      viewMode === 'latest' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Latest Day
                  </button>
                  <button
                    onClick={() => setViewMode('totals')}
                    className={`px-4 py-2 text-sm transition-colors ${
                      viewMode === 'totals' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Total Period ({selectedStaff.metrics.recordCount} days)
                  </button>
                </div>
              </div>

              {/* Productivity Overview */}
              <div className={`rounded-xl p-8 border-2 ${getProductivityColor(selectedStaff.productivityScore)}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    {viewMode === 'latest' ? 'Latest Day Productivity' : 'Overall Productivity'}
                  </h3>
                  <div className="text-5xl font-bold">{selectedStaff.productivityScore}%</div>
                </div>
                <Progress value={selectedStaff.productivityScore} className="h-4" />
                {viewMode === 'latest' && selectedStaff.metrics.latest && (
                  <p className="text-sm mt-2 text-gray-600">
                    Based on activity from {formatDate(selectedStaff.metrics.latest.date)}
                  </p>
                )}
              </div>

              {/* Input Activity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Input Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <MousePointer className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.mouseMovements.toLocaleString()
                        : selectedStaff.metrics.totals.mouseMovements.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">Mouse Movements</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <MousePointer className="h-6 w-6 text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.mouseClicks.toLocaleString()
                        : selectedStaff.metrics.totals.mouseClicks.toLocaleString()}
                    </div>
                    <div className="text-sm text-purple-700">Mouse Clicks</div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <Keyboard className="h-6 w-6 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.keystrokes.toLocaleString()
                        : selectedStaff.metrics.totals.keystrokes.toLocaleString()}
                    </div>
                    <div className="text-sm text-emerald-700">Keystrokes</div>
                  </Card>
                </div>
              </div>

              {/* Time Tracking */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Time Tracking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <Clock className="h-6 w-6 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-emerald-900">
                      {formatTime(viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.activeTime
                        : selectedStaff.metrics.totals.activeTime)}
                    </div>
                    <div className="text-sm text-emerald-700">Active Time</div>
                    <div className="text-xs text-emerald-600 mt-1">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.activeTime === 0 ? 'No activity' : 'Latest day'
                        : 'Total period'}
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <Clock className="h-6 w-6 text-amber-600 mb-2" />
                    <div className="text-2xl font-bold text-amber-900">
                      {formatTime(viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.idleTime
                        : selectedStaff.metrics.totals.idleTime)}
                    </div>
                    <div className="text-sm text-amber-700">Idle Time</div>
                    <div className="text-xs text-amber-600 mt-1">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.idleTime === 0 ? 'No idle time' : 'Latest day'
                        : 'Total period'}
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <Monitor className="h-6 w-6 text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-900">
                      {formatTime(viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.screenTime
                        : selectedStaff.metrics.totals.screenTime)}
                    </div>
                    <div className="text-sm text-blue-700">Screen Time</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.screenTime === 0 ? 'No screen time' : 'Latest day'
                        : 'Total period'}
                    </div>
                  </Card>
                </div>
              </div>


              {/* Digital Activity */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-600" />
                  Digital Activity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
                    <Copy className="h-5 w-5 text-pink-600 mb-2" />
                    <div className="text-xl font-bold text-pink-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.clipboardActions
                        : selectedStaff.metrics.totals.clipboardActions}
                    </div>
                    <div className="text-xs text-pink-700 font-medium">Clipboard Actions</div>
                    <div className="text-xs text-pink-600 mt-1">
                      {viewMode === 'latest' ? 'Latest day' : 'Total period'}
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                    <Globe className="h-5 w-5 text-cyan-600 mb-2" />
                    <div className="text-xl font-bold text-cyan-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.urlsVisited
                        : selectedStaff.metrics.totals.urlsVisited}
                    </div>
                    <div className="text-xs text-cyan-700 font-medium">URLs Visited</div>
                    <div className="text-xs text-cyan-600 mt-1">
                      {viewMode === 'latest' ? 'Latest day' : 'Total period'}
                    </div>
                  </Card>
                  <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                    <Eye className="h-5 w-5 text-indigo-600 mb-2" />
                    <div className="text-xl font-bold text-indigo-900">
                      {viewMode === 'latest' && selectedStaff.metrics.latest
                        ? selectedStaff.metrics.latest.tabsSwitched
                        : selectedStaff.metrics.totals.tabsSwitched}
                    </div>
                    <div className="text-xs text-indigo-700 font-medium">Tabs Switched</div>
                    <div className="text-xs text-indigo-600 mt-1">
                      {viewMode === 'latest' ? 'Latest day' : 'Total period'}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Applications & URLs */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  Applications & URLs Used
                </h3>
                
                {/* Applications Used */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    Applications Used
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {selectedStaff.metrics.latest?.applicationsUsed && selectedStaff.metrics.latest.applicationsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedStaff.metrics.latest.applicationsUsed.map((app: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No applications recorded</p>
                    )}
                  </div>
                </div>

                {/* URLs Visited */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-500" />
                    Web Pages Visited
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto">
                    {selectedStaff.metrics.latest?.visitedUrls && selectedStaff.metrics.latest.visitedUrls.length > 0 ? (
                      <div className="space-y-2">
                        {selectedStaff.metrics.latest.visitedUrls.map((url: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="text-sm text-gray-700 break-all">
                              {url.startsWith('http') ? (
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {url}
                                </a>
                              ) : (
                                <span className="text-gray-600">{url}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No URLs recorded</p>
                    )}
                  </div>
                </div>

                {/* Screenshots */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-500" />
                    Screenshots Captured
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-48 overflow-y-auto">
                    {selectedStaff.metrics.latest?.screenshotUrls && selectedStaff.metrics.latest.screenshotUrls.length > 0 ? (
                      <div className="space-y-2">
                        {selectedStaff.metrics.latest.screenshotUrls.map((url: string, index: number) => {
                          // Extract filename from URL for better display
                          const urlParts = url.split('/')
                          const filename = urlParts[urlParts.length - 1]
                          const displayName = filename.replace(/\.(jpg|jpeg|png)$/i, '')
                          
                          // Convert timestamp to readable format
                          const formatTimestamp = (timestampStr: string) => {
                            try {
                              // Handle different timestamp formats
                              let timestamp: number
                              if (timestampStr.includes('_')) {
                                // Format: 1760675352583_1760675350769 (take the first one)
                                timestamp = parseInt(timestampStr.split('_')[0])
                              } else {
                                // Single timestamp
                                timestamp = parseInt(timestampStr)
                              }
                              
                              // Convert to milliseconds if it's in seconds
                              if (timestamp < 1000000000000) {
                                timestamp = timestamp * 1000
                              }
                              
                              const date = new Date(timestamp)
                              return date.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })
                            } catch (error) {
                              return displayName // Fallback to original if parsing fails
                            }
                          }
                          
                          return (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="text-sm text-gray-700 flex-1 min-w-0">
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-800 hover:underline block truncate"
                                  title={url}
                                >
                                  Screenshot {index + 1} - {formatTimestamp(displayName)}
                                </a>
                                <div className="text-xs text-gray-500 mt-1 truncate" title={url}>
                                  {url.length > 60 ? `${url.substring(0, 60)}...` : url}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No screenshots captured</p>
                    )}
                  </div>
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
    </div>
    </>
  )
}

