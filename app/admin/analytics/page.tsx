"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics"
import {
  TrendingUp, TrendingDown, Users, Building2, Activity, 
  MousePointer, Keyboard, Clock, Monitor, Globe, 
  Download, Upload, Copy, FileText, RefreshCw,
  Award, Target, Zap, BarChart3, Calendar
} from "lucide-react"

export default function AnalyticsPage() {
  const [selectedDays, setSelectedDays] = useState(30)
  const { data, loading, error, lastUpdate, refresh, formatTime, formatNumber } = useAdminAnalytics(selectedDays)

  if (loading) {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Loading analytics data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-zinc-950 border-white/20 p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
            <p className="text-sm text-red-400 mt-1">Error: {error}</p>
          </div>
          <Button onClick={refresh} className="bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, trends, departments, topPerformers, companies } = data
  
  // Debug: Log department data
  console.log('[Admin Analytics] Department data:', departments)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Performance Analytics</h1>
          </div>
          <p className="text-gray-400 ml-12">
            Comprehensive performance metrics across all staff and companies
          </p>
          {lastUpdate && (
            <div className="flex items-center gap-2 ml-12 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <Button 
            onClick={refresh} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          </div>
        </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="group bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{summary.totalStaff}</div>
                <div className="text-sm text-blue-300">Total Staff</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Active Today</span>
                <span className="text-sm font-semibold text-green-400">{summary.activeStaff}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${(summary.activeStaff / summary.totalStaff) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          </Card>

        <Card className="group bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{summary.averageProductivity}%</div>
                <div className="text-sm text-emerald-300">Avg Performance</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Across all staff</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {summary.averageProductivity >= 80 ? 'Excellent' : 
                   summary.averageProductivity >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${summary.averageProductivity}%` }}
                ></div>
              </div>
            </div>
          </div>
          </Card>

        <Card className="group bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{summary.totalCompanies}</div>
                <div className="text-sm text-purple-300">Companies</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">With Active Staff</span>
                <span className="text-sm font-semibold text-purple-400">
                  {departments.filter(d => d.activeStaff > 0).length}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-500 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${(departments.filter(d => d.activeStaff > 0).length / summary.totalCompanies) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          </Card>

        <Card className="group bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-orange-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  {formatNumber(summary.overallTotals.mouseClicks + summary.overallTotals.keystrokes)}
                </div>
                <div className="text-sm text-orange-300">Total Activity</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Clicks + Keystrokes</span>
                <span className="text-sm font-semibold text-orange-400">
                  {formatNumber(summary.overallTotals.urlsVisited)} URLs
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-1 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </div>
          </Card>
        </div>

      {/* Performance Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-950 border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Performance Trends
          </h3>
          <div className="max-h-80 overflow-y-auto space-y-4 pr-2 performance-trends-scroll">
            {trends.daily.slice(-7).map((day, index) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{day.productivity}%</div>
                      <div className="text-xs text-gray-400">{day.activeStaff} staff</div>
                    </div>
                    <div className="w-20">
                      <Progress value={day.productivity} className="h-2" />
                    </div>
                  </div>
                </div>
                
                {/* Company breakdown for this day */}
                {day.companies && day.companies.length > 0 && (
                  <div className="ml-5 space-y-1">
                    {day.companies.map((company: {
                      companyName: string
                      staffCount: number
                      averageProductivity: number
                      totalActivity: number
                    }, companyIndex: number) => (
                      <div key={companyIndex} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-400">{company.companyName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-300">{company.staffCount} staff</span>
                          <span className="text-white font-medium">{company.averageProductivity}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            </div>
          </Card>

          <Card className="bg-zinc-950 border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Top Performers
          </h3>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 top-performers-scroll">
            {topPerformers.slice(0, 10).map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-black">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{performer.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {performer.company}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{performer.productivityScore}%</div>
                  <div className="text-xs text-gray-400">
                    {performer.lastActivity ? 
                      new Date(performer.lastActivity).toLocaleDateString() : 
                      'No activity'
                    }
                  </div>
                </div>
              </div>
            ))}
            </div>
          </Card>
      </div>

      {/* Company Performance */}
          <Card className="bg-zinc-950 border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-purple-400" />
          Company Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, index) => (
            <div key={index} className="bg-zinc-900 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{dept.companyName}</h4>
                <Badge variant={dept.averageProductivity >= 80 ? "default" : "secondary"}>
                  {dept.averageProductivity}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Staff</span>
                  <span className="text-white">{dept.staffCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active</span>
                  <span className="text-white">{dept.activeStaff}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Activity</span>
                  <span className="text-white">{formatNumber(dept.totalActivity)}</span>
                </div>
              </div>
            </div>
          ))}
            </div>
          </Card>

      {/* Company-Specific Activity Breakdown */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              Company Performance Analytics
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Detailed performance metrics broken down by company
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {departments.map((company, index) => (
            <Card key={index} className="group bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/20 overflow-hidden">
              {/* Company Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                        {company.companyName}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {company.activeStaff} of {company.staffCount} staff active
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {company.averageProductivity}%
                    </div>
                    <div className="text-xs text-gray-400">Performance</div>
                  </div>
                </div>
                
                {/* Performance Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${company.averageProductivity}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Activity Metrics */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MousePointer className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Clicks</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatNumber(company.totals.mouseClicks)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Keyboard className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">Keystrokes</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatNumber(company.totals.keystrokes)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <span className="text-sm text-gray-300">URLs</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatNumber(company.totals.urlsVisited)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Time</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-gray-300">Screen</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatTime(company.totals.screenTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-gray-300">Active</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatTime(company.totals.activeTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Idle</span>
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {formatTime(company.totals.idleTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Copy className="h-3 w-3 text-orange-400" />
                      <span className="text-xs text-gray-400">Clipboard</span>
                    </div>
                    <span className="text-xs font-medium text-white">
                      {formatNumber(company.totals.clipboardActions)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-red-400" />
                      <span className="text-xs text-gray-400">Files</span>
                    </div>
                    <span className="text-xs font-medium text-white">
                      {formatNumber(company.totals.filesAccessed)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Download className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-gray-400">Downloads</span>
                    </div>
                    <span className="text-xs font-medium text-white">
                      {formatNumber(company.totals.downloads)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-zinc-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Upload className="h-3 w-3 text-orange-400" />
                      <span className="text-xs text-gray-400">Uploads</span>
                    </div>
                    <span className="text-xs font-medium text-white">
                      {formatNumber(company.totals.uploads)}
                    </span>
            </div>
        </div>
      </div>
    
              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-400">Active</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Last updated: {lastUpdate?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
