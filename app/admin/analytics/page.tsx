"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Detailed performance metrics and insights</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700">Export Report</Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Avg Performance Score</p>
            <p className="text-2xl font-bold text-white mt-1">87.4%</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 3.2% from last month</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Task Completion Rate</p>
            <p className="text-2xl font-bold text-white mt-1">94.2%</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 1.8% from last month</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Client Satisfaction</p>
            <p className="text-2xl font-bold text-white mt-1">4.6/5.0</p>
            <p className="text-xs text-gray-400 mt-1">Based on 234 reviews</p>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-4">
            <p className="text-sm text-gray-400">Response Time</p>
            <p className="text-2xl font-bold text-white mt-1">2.3h</p>
            <p className="text-xs text-emerald-400 mt-1">↓ 0.5h improvement</p>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-950 border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
            <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart: Performance over time</p>
            </div>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Task Distribution</h3>
            <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart: Tasks by category</p>
            </div>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Client Satisfaction Trend</h3>
            <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart: Satisfaction scores</p>
            </div>
          </Card>
          <Card className="bg-zinc-950 border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Department Performance</h3>
            <div className="h-64 bg-black/30 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Chart: Performance by department</p>
            </div>
          </Card>
        </div>
      </div>
    
  )
}
